import { json, error } from '@sveltejs/kit';
import { requireDb, requireUser, validateContainer } from '$lib/server/db.js';

export async function GET({ url, locals }) {
  const db = requireDb(locals);
  const user = requireUser(locals);
  const kind = url.searchParams.get('kind');
  let q;
  if (kind === 'file' || kind === 'box') {
    q = db
      .prepare(
        `SELECT c.*, (SELECT COUNT(*) FROM items i WHERE i.container_id = c.id) AS item_count
         FROM containers c WHERE c.user_id = ? AND c.kind = ? ORDER BY c.label COLLATE NOCASE`
      )
      .bind(user.id, kind);
  } else {
    q = db
      .prepare(
        `SELECT c.*, (SELECT COUNT(*) FROM items i WHERE i.container_id = c.id) AS item_count
         FROM containers c WHERE c.user_id = ? ORDER BY c.kind, c.label COLLATE NOCASE`
      )
      .bind(user.id);
  }
  const { results } = await q.all();
  return json(results);
}

export async function POST({ request, locals }) {
  const db = requireDb(locals);
  const user = requireUser(locals);
  const body = await request.json();
  const kind = body.kind;
  const label = (body.label ?? '').trim();
  const notes = (body.notes ?? '').trim() || null;
  if (!['file', 'box'].includes(kind)) throw error(400, 'kind must be file or box');
  validateContainer(label, notes);
  try {
    const result = await db
      .prepare('INSERT INTO containers (user_id, kind, label, notes) VALUES (?, ?, ?, ?)')
      .bind(user.id, kind, label, notes)
      .run();
    return json({ id: result.meta.last_row_id, kind, label, notes }, { status: 201 });
  } catch (e) {
    if (String(e).includes('UNIQUE')) throw error(409, 'A container with this label already exists');
    throw error(500, 'Something went wrong');
  }
}
