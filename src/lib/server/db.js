import { error } from '@sveltejs/kit';

export function requireDb(locals) {
  if (!locals.db) {
    throw error(500, 'D1 database not bound. Run `npm run dev` (which uses wrangler) instead of plain vite dev.');
  }
  return locals.db;
}

export function requireUser(locals) {
  if (!locals.user) throw error(401, 'Unauthorized');
  return locals.user;
}

export const LIMITS = {
  MAX_ITEMS: 5000,
  LABEL_MAX: 30,
  NOTES_MAX: 100,
  ITEM_NAME_MAX: 30,
  TAG_MAX_COUNT: 10,
  TAG_MAX_LENGTH: 10
};

export function validateContainer(label, notes) {
  if (!label) throw error(400, 'Label is required');
  if (label.length > LIMITS.LABEL_MAX) throw error(400, `Label must be ${LIMITS.LABEL_MAX} characters or less`);
  if (notes && notes.length > LIMITS.NOTES_MAX) throw error(400, `Notes must be ${LIMITS.NOTES_MAX} characters or less`);
}

export function validateItem(name, notes, tags) {
  if (!name) throw error(400, 'Name is required');
  if (name.length > LIMITS.ITEM_NAME_MAX) throw error(400, `Name must be ${LIMITS.ITEM_NAME_MAX} characters or less`);
  if (notes && notes.length > LIMITS.NOTES_MAX) throw error(400, `Notes must be ${LIMITS.NOTES_MAX} characters or less`);
  if (tags) {
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tagList.length > LIMITS.TAG_MAX_COUNT) throw error(400, `Maximum ${LIMITS.TAG_MAX_COUNT} tags allowed`);
    for (const t of tagList) {
      if (t.length > LIMITS.TAG_MAX_LENGTH) throw error(400, `Each tag must be ${LIMITS.TAG_MAX_LENGTH} characters or less`);
    }
  }
}

export async function checkItemLimit(db, userId) {
  const row = await db.prepare('SELECT COUNT(*) AS cnt FROM items WHERE user_id = ?').bind(userId).first();
  if (row.cnt >= LIMITS.MAX_ITEMS) throw error(403, `Item limit reached (${LIMITS.MAX_ITEMS}). Delete some items first.`);
}
