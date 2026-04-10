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
