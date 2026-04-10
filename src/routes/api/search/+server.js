import { json } from '@sveltejs/kit';
import { requireDb, requireUser } from '$lib/server/db.js';

// Strip everything except alphanumeric, spaces, hyphens. Prevents FTS5 operator injection.
function sanitize(raw) {
  return raw.toLowerCase().replace(/[^a-z0-9\s\-]/g, '').trim();
}

// FTS5 trigram query: substring/prefix matches.
function buildFtsQuery(raw) {
  const cleaned = sanitize(raw);
  if (!cleaned) return null;
  const tokens = cleaned.split(/\s+/).filter((t) => t.length >= 2).slice(0, 5).map((t) => `"${t}"`);
  return tokens.length ? tokens.join(' OR ') : null;
}

// Levenshtein distance (iterative, O(n*m)).
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
  const raw = (url.searchParams.get('q') ?? '').trim();
  // Cap input length to prevent abuse
  const q = raw.slice(0, 100);
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

  // Step 2: Levenshtein fallback — only when FTS found few results.
  // Limits: max 5 tokens, max 500 items scanned, truncated query tokens.
  if (ftsRows.length < 5) {
    const { results: all } = await db
      .prepare(
        `SELECT i.id, i.name, i.notes, i.tags, i.container_id,
                c.kind, c.label AS container_label
         FROM items i JOIN containers c ON c.id = i.container_id
         WHERE i.user_id = ? LIMIT 500`
      )
      .bind(user.id)
      .all();

    const tokens = sanitize(q).split(/\s+/).filter((t) => t.length >= 2).slice(0, 5).map((t) => t.slice(0, 20));
    const fuzzyMatches = [];
    const seen = new Set(ftsRows.map((r) => r.id));

    for (const row of all) {
      if (seen.has(row.id)) continue;
      const haystack = `${row.name} ${row.tags ?? ''} ${row.notes ?? ''}`;
      let best = 1;
      for (const t of tokens) {
        const s = fuzzyScore(t, haystack);
        if (s < best) best = s;
      }
      if (best <= 0.34) fuzzyMatches.push({ ...row, _score: best });
    }
    fuzzyMatches.sort((a, b) => a._score - b._score);

    const merged = [...ftsRows];
    for (const r of fuzzyMatches) {
      const { _score, ...rest } = r;
      merged.push(rest);
      if (merged.length >= 30) break;
    }
    return json(merged);
  }

  return json(ftsRows);
}
