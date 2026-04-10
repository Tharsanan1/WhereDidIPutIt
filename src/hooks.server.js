// Auth + DB middleware.
// Local dev: bypass with seeded user (id=1).
// Production (Cloudflare Access): read Cf-Access-Authenticated-User-Email header
// (or verify Cf-Access-Jwt-Assertion JWT) and upsert user.

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const platform = event.platform;
  const db = platform?.env?.DB;
  event.locals.db = db;

  if (!db) {
    // No DB binding (e.g. running `vite dev` without wrangler). Show a clear error.
    event.locals.user = null;
    return resolve(event);
  }

  const isProd = !!event.request.headers.get('cf-access-authenticated-user-email');

  if (!isProd) {
    // Local dev — seeded user
    event.locals.user = { id: 1, email: 'you@localhost', name: 'Local Dev' };
  } else {
    const email = event.request.headers.get('cf-access-authenticated-user-email') ?? '';
    const sub = event.request.headers.get('cf-access-authenticated-user-id') ?? email;
    let row = await db.prepare('SELECT id, email, name FROM users WHERE google_sub = ?').bind(sub).first();
    if (!row) {
      const result = await db
        .prepare('INSERT INTO users (google_sub, email, name) VALUES (?, ?, ?)')
        .bind(sub, email, email.split('@')[0])
        .run();
      row = { id: result.meta.last_row_id, email, name: email.split('@')[0] };
    }
    event.locals.user = row;
  }

  return resolve(event);
}
