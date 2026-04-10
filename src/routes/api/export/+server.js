import { json } from '@sveltejs/kit';
import { requireDb, requireUser } from '$lib/server/db.js';

export async function GET({ locals }) {
  const db = requireDb(locals);
  const user = requireUser(locals);

  const { results: containers } = await db
    .prepare('SELECT id, kind, label, notes, created_at FROM containers WHERE user_id = ? ORDER BY kind, label')
    .bind(user.id)
    .all();

  const { results: items } = await db
    .prepare('SELECT id, container_id, name, notes, tags, created_at, updated_at FROM items WHERE user_id = ? ORDER BY name')
    .bind(user.id)
    .all();

  const data = {
    version: 1,
    exported_at: new Date().toISOString(),
    containers,
    items
  };

  return json(data, {
    headers: {
      'content-disposition': `attachment; filename="wheredidiputit-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    }
  });
}
