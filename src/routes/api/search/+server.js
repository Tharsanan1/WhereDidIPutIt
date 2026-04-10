import { json } from '@sveltejs/kit';
import { requireDb, requireUser } from '$lib/server/db.js';

// FTS5 trigram query: substring/prefix matches.
function buildFtsQuery(raw) {
  const cleaned = raw.toLowerCase().replace(/["'()*]/g, ' ').trim();
  if (!cleaned) return null;
  const tokens = cleaned.split(/\s+/).filter((t) => t.length >= 2).map((t) => `"${t}"*`);
  return tokens.length ? tokens.join(' OR ') : null;
}

// Levenshtein distance (iterative, O(n*m) with two rows).
function lev(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

// Best fuzzy score for a query token vs any word in haystack.
// Returns lowest normalized distance found, or 1 if nothing close.
function fuzzyScore(query, haystack) {
  if (!haystack) return 1;
  const hay = haystack.toLowerCase();
  if (hay.includes(query)) return 0;
  let best = 1;
  for (const word of hay.split(/[\s,.\-_/]+/).filter(Boolean)) {
    const d = lev(query, word);
    const norm = d / Math.max(query.length, word.length);
    if (norm < best) best = norm;
  }
  return best;
}

export async function GET({ url, locals }) {
  const db = requireDb(locals);
  const user = requireUser(locals);
  const q = (url.searchParams.get('q') ?? '').trim();
  if (!q) return json([]);

  // Step 1: FTS5 trigram (substring + prefix matches)
  const ftsQuery = buildFtsQuery(q);
  let ftsRows = [];
  if (ftsQuery) {
    try {
      const { results } = await db
        .prepare(
          `SELECT i.id, i.name, i.notes, i.tags, i.container_id,
                  c.kind, c.label AS container_label,
                  bm25(items_fts) AS rank
           FROM items_fts
           JOIN items i ON i.id = items_fts.rowid
           JOIN containers c ON c.id = i.container_id
           WHERE items_fts MATCH ? AND i.user_id = ?
           ORDER BY rank LIMIT 30`
        )
        .bind(ftsQuery, user.id)
        .all();
      ftsRows = results;
    } catch {
      ftsRows = [];
    }
  }

  // Step 2: Levenshtein fallback over all user items (handles missing-letter typos).
  // For personal datasets (typically < a few thousand items) this is plenty fast.
  const { results: all } = await db
    .prepare(
      `SELECT i.id, i.name, i.notes, i.tags, i.container_id,
              c.kind, c.label AS container_label
       FROM items i JOIN containers c ON c.id = i.container_id
       WHERE i.user_id = ?`
    )
    .bind(user.id)
    .all();

  const tokens = q.toLowerCase().split(/\s+/).filter((t) => t.length >= 2);
  const fuzzyMatches = [];
  for (const row of all) {
    const haystack = `${row.name} ${row.tags ?? ''} ${row.notes ?? ''}`;
    let best = 1;
    for (const t of tokens) {
      const s = fuzzyScore(t, haystack);
      if (s < best) best = s;
    }
    // Accept if any token is within ~30% edit distance of a word in the row.
    if (best <= 0.34) fuzzyMatches.push({ ...row, _score: best });
  }
  fuzzyMatches.sort((a, b) => a._score - b._score);

  // Merge: FTS results first (already ranked), then any fuzzy not already in.
  const seen = new Set(ftsRows.map((r) => r.id));
  const merged = [...ftsRows];
  for (const r of fuzzyMatches) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      const { _score, ...rest } = r;
      merged.push(rest);
    }
    if (merged.length >= 30) break;
  }
  return json(merged);
}
