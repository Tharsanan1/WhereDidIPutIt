import { json, error } from '@sveltejs/kit';
import { requireDb, requireUser, LIMITS } from '$lib/server/db.js';

const MAX_IMPORT_CONTAINERS = 500;
const MAX_IMPORT_ITEMS = 5000;
const MAX_BODY_LENGTH = 2 * 1024 * 1024; // 2MB

export async function POST({ request, locals }) {
  const db = requireDb(locals);
  const user = requireUser(locals);

  // Reject oversized payloads before parsing
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_LENGTH) {
    throw error(400, 'Import file too large (max 2MB)');
  }

  const data = await request.json();

  if (!data.version || !Array.isArray(data.containers) || !Array.isArray(data.items)) {
    throw error(400, 'Invalid backup file format');
  }

  // Cap array sizes to prevent abuse
  if (data.containers.length > MAX_IMPORT_CONTAINERS) {
    throw error(400, `Too many containers in import (max ${MAX_IMPORT_CONTAINERS})`);
  }
  if (data.items.length > MAX_IMPORT_ITEMS) {
    throw error(400, `Too many items in import (max ${MAX_IMPORT_ITEMS})`);
  }

  // Check total items won't exceed limit
  const existing = await db.prepare('SELECT COUNT(*) AS cnt FROM items WHERE user_id = ?').bind(user.id).first();
  if (existing.cnt + data.items.length > LIMITS.MAX_ITEMS) {
    throw error(400, `Import would exceed item limit (${LIMITS.MAX_ITEMS}). You have ${existing.cnt} items and are trying to import ${data.items.length}.`);
  }

  // Map old container IDs to new ones
  const idMap = {};
  let containersImported = 0;
  let itemsImported = 0;
  let containersSkipped = 0;
  let itemsSkipped = 0;

  for (const c of data.containers) {
    const kind = c.kind;
    const label = (c.label ?? '').trim();
    const notes = (c.notes ?? '').trim() || null;
    if (!['file', 'box'].includes(kind) || !label || label.length > LIMITS.LABEL_MAX || (notes && notes.length > LIMITS.NOTES_MAX)) {
      containersSkipped++;
      continue;
    }

    // Check if container with same kind+label already exists
    const existing = await db
      .prepare('SELECT id FROM containers WHERE user_id = ? AND kind = ? AND label = ?')
      .bind(user.id, kind, label)
      .first();

    if (existing) {
      idMap[c.id] = existing.id;
      containersSkipped++;
    } else {
      const result = await db
        .prepare('INSERT INTO containers (user_id, kind, label, notes) VALUES (?, ?, ?, ?)')
        .bind(user.id, kind, label, notes)
        .run();
      idMap[c.id] = result.meta.last_row_id;
      containersImported++;
    }
  }

  for (const item of data.items) {
    const newContainerId = idMap[item.container_id];
    if (!newContainerId) { itemsSkipped++; continue; }

    const name = (item.name ?? '').trim();
    const notes = (item.notes ?? '').trim() || null;
    const tags = (item.tags ?? '').trim() || null;
    if (!name || name.length > LIMITS.ITEM_NAME_MAX || (notes && notes.length > LIMITS.NOTES_MAX)) { itemsSkipped++; continue; }
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagList.length > LIMITS.TAG_MAX_COUNT || tagList.some(t => t.length > LIMITS.TAG_MAX_LENGTH)) { itemsSkipped++; continue; }
    }

    // Skip duplicate: same name in same container
    const dup = await db
      .prepare('SELECT id FROM items WHERE user_id = ? AND container_id = ? AND name = ?')
      .bind(user.id, newContainerId, name)
      .first();
    if (dup) { itemsSkipped++; continue; }

    await db
      .prepare('INSERT INTO items (user_id, container_id, name, notes, tags) VALUES (?, ?, ?, ?, ?)')
      .bind(user.id, newContainerId, name, notes, tags)
      .run();
    itemsImported++;
  }

  return json({
    containersImported,
    containersSkipped,
    itemsImported,
    itemsSkipped
  });
}
