import { json, error } from '@sveltejs/kit';
import { requireDb, requireUser, validateContainer } from '$lib/server/db.js';

export async function GET({ params, locals }) {
  const db = requireDb(locals);
  const user = requireUser(locals);
  const container = await db
    .prepare('SELECT * FROM containers WHERE id = ? AND user_id = ?')
    .bind(params.id, user.id)
    .first();
  if (!container) throw error(404, 'Not found');
  const { results: items } = await db
    .prepare('SELECT * FROM items WHERE container_id = ? AND user_id = ? ORDER BY name COLLATE NOCASE')
    .bind(params.id, user.id)
    .all();
  return json({ container, items });
}

export async function PATCH({ params, request, locals }) {
  const db = requireDb(locals);
  const user = requireUser(locals);
  const body = await request.json();
  const label = (body.label ?? '').trim();
  const notes = (body.notes ?? '').trim() || null;
  validateContainer(label, notes);
  try {
    const result = await db
      .prepare('UPDATE containers SET label = ?, notes = ? WHERE id = ? AND user_id = ?')
      .bind(label, notes, params.id, user.id)
      .run();
    if (!result.meta.changes) throw error(404, 'Not found');
    return json({ ok: true });
  } catch (e) {
    if (String(e).includes('UNIQUE')) throw error(409, 'A container with this label already exists');
    throw error(500, 'Something went wrong');
  }
}

export async function DELETE({ params, locals }) {
  const db = requireDb(locals);
  const user = requireUser(locals);
  // Explicitly delete items first so FTS triggers fire (CASCADE may not trigger them)
  await db
    .prepare('DELETE FROM items WHERE container_id = ? AND user_id = ?')
    .bind(params.id, user.id)
    .run();
  const result = await db
    .prepare('DELETE FROM containers WHERE id = ? AND user_id = ?')
    .bind(params.id, user.id)
    .run();
  if (!result.meta.changes) throw error(404, 'Not found');
  return json({ ok: true });
}
