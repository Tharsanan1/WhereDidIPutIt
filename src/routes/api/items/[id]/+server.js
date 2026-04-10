import { json, error } from '@sveltejs/kit';
import { requireDb, requireUser, validateItem } from '$lib/server/db.js';

export async function PATCH({ params, request, locals }) {
  const db = requireDb(locals);
  const user = requireUser(locals);
  const body = await request.json();
  const name = (body.name ?? '').trim();
  const notes = (body.notes ?? '').trim() || null;
  const tags = (body.tags ?? '').trim() || null;
  const container_id = Number(body.container_id);
  validateItem(name, notes, tags);
  if (!container_id) throw error(400, 'container_id required');

  const owns = await db
    .prepare('SELECT id FROM containers WHERE id = ? AND user_id = ?')
    .bind(container_id, user.id)
    .first();
  if (!owns) throw error(404, 'Container not found');

  const result = await db
    .prepare(
      `UPDATE items SET name = ?, notes = ?, tags = ?, container_id = ?, updated_at = unixepoch()
       WHERE id = ? AND user_id = ?`
    )
    .bind(name, notes, tags, container_id, params.id, user.id)
    .run();
  if (!result.meta.changes) throw error(404, 'Not found');
  return json({ ok: true });
}

export async function DELETE({ params, locals }) {
  const db = requireDb(locals);
  const user = requireUser(locals);
  const result = await db
    .prepare('DELETE FROM items WHERE id = ? AND user_id = ?')
    .bind(params.id, user.id)
    .run();
  if (!result.meta.changes) throw error(404, 'Not found');
  return json({ ok: true });
}
