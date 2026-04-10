# WhereDidIPutIt

Mobile-first PWA to track which **File** or **Box** your stuff is in. Built for Cloudflare Pages + D1.

## Local development

```bash
npm install
npm run db:migrate:local   # creates local D1 SQLite + schema + seed user
npm run dev                # http://localhost:5173
```

In local dev you are auto-logged-in as a seeded user (`id=1`). No Google login required locally.

## Tech
- SvelteKit + `@sveltejs/adapter-cloudflare`
- Cloudflare D1 (SQLite) with FTS5 trigram for typo-tolerant search
- Tailwind CSS
- Cloudflare Access (Google IdP) — used in production only

## Production deploy (later)
1. Create a Cloudflare Pages project pointing at this repo.
2. Create a D1 database `wdpi-db`, put its `database_id` in `wrangler.toml`, bind as `DB` in Pages settings.
3. Run the migration against the production DB:
   `npx wrangler d1 execute wdpi-db --remote --file=./migrations/0001_init.sql`
4. Enable Cloudflare Access on the `*.pages.dev` URL with Google as the identity provider.
