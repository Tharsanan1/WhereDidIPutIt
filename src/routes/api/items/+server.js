import { json, error } from '@sveltejs/kit';
import { requireDb, requireUser, validateItem, checkItemLimit } from '$lib/server/db.js';

export async function POST({ request, locals }) {
  const db = requireDb(locals);
  const user = requireUser(locals);
  const body = await request.json();
  const container_id = Number(body.container_id);
  const name = (body.name ?? '').trim();
  const notes = (body.notes ?? '').trim() || null;
  const tags = (body.tags ?? '').trim() || null;
  if (!container_id) throw error(400, 'container_id required');
  validateItem(name, notes, tags);
  await checkItemLimit(db, user.id);

  const owns = await db
    .prepare('SELECT id FROM containers WHERE id = ? AND user_id = ?')
    .bind(container_id, user.id)
    .first();
  if (!owns) throw error(404, 'Container not found');

  const result = await db
    .prepare(
      'INSERT INTO items (user_id, container_id, name, notes, tags) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(user.id, container_id, name, notes, tags)
    .run();
  return json({ id: result.meta.last_row_id, container_id, name, notes, tags }, { status: 201 });
}
