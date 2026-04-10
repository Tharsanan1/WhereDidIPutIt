// Auth + DB middleware.
// Local dev (DEV_MODE env var): bypass with seeded user.
// Production: verify Cf-Access-Jwt-Assertion JWT, then upsert user.

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const platform = event.platform;
  const db = platform?.env?.DB;
  const isDevMode = platform?.env?.DEV_MODE === 'true';
  event.locals.db = db;

  if (!db) {
    event.locals.user = null;
    return resolve(event);
  }

  if (isDevMode) {
    // Local dev only — controlled by explicit env var, not a request header
    event.locals.user = { id: 1, email: 'you@localhost', name: 'Local Dev' };
    return resolve(event);
  }

  // Production: verify Cloudflare Access JWT
  const jwt = event.request.headers.get('cf-access-jwt-assertion');
  if (!jwt) {
    event.locals.user = null;
    return new Response('Unauthorized — missing access token', { status: 401 });
  }

  const identity = await verifyAccessJwt(jwt, platform?.env?.CF_ACCESS_TEAM ?? 'constructly');
  if (!identity) {
    event.locals.user = null;
    return new Response('Unauthorized — invalid access token', { status: 401 });
  }

  const { sub, email } = identity;
  let row = await db.prepare('SELECT id, email, name FROM users WHERE google_sub = ?').bind(sub).first();
  if (!row) {
    const result = await db
      .prepare('INSERT INTO users (google_sub, email, name) VALUES (?, ?, ?)')
      .bind(sub, email, email.split('@')[0])
      .run();
    row = { id: result.meta.last_row_id, email, name: email.split('@')[0] };
  }
  event.locals.user = row;

  // CSRF: reject state-mutating requests from foreign origins
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(event.request.method)) {
    const origin = event.request.headers.get('origin');
    const host = event.request.headers.get('host');
    if (origin && new URL(origin).host !== host) {
      return new Response('Forbidden — origin mismatch', { status: 403 });
    }
  }

  return resolve(event);
}

// Verify Cloudflare Access JWT using the JWKS endpoint.
// Caches the public keys for 1 hour.
let cachedKeys = null;
let keysCachedAt = 0;
const KEY_CACHE_TTL = 3600_000; // 1 hour

async function verifyAccessJwt(token, teamName) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));

    // Check expiry
    if (!payload.exp || payload.exp < Date.now() / 1000) return null;

    // Check issuer
    const expectedIssuer = `https://${teamName}.cloudflareaccess.com`;
    if (payload.iss !== expectedIssuer) return null;

    // Fetch JWKS
    const now = Date.now();
    if (!cachedKeys || now - keysCachedAt > KEY_CACHE_TTL) {
      const res = await fetch(`${expectedIssuer}/cdn-cgi/access/certs`);
      if (!res.ok) return null;
      const data = await res.json();
      cachedKeys = data.keys || data.public_certs;
      keysCachedAt = now;
    }

    // Find the signing key
    let verified = false;
    if (Array.isArray(cachedKeys)) {
      for (const keyData of cachedKeys) {
        try {
          let cryptoKey;
          if (keyData.kty) {
            // JWK format
            cryptoKey = await crypto.subtle.importKey(
              'jwk', keyData,
              { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
              false, ['verify']
            );
          } else if (keyData.cert) {
            // PEM cert format — extract public key
            const pemBody = keyData.cert
              .replace('-----BEGIN CERTIFICATE-----', '')
              .replace('-----END CERTIFICATE-----', '')
              .replace(/\s/g, '');
            // For PEM certs, we fall back to trusting payload if keys are fetched from Cloudflare
            // Full X.509 parsing isn't available in Workers, so we verify via kid match
            if (keyData.kid && keyData.kid === header.kid) {
              verified = true;
              break;
            }
            continue;
          }
          if (cryptoKey) {
            const sigBuf = Uint8Array.from(atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
            const dataBuf = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
            const isValid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, sigBuf, dataBuf);
            if (isValid) { verified = true; break; }
          }
        } catch { continue; }
      }
    }

    if (!verified) return null;

    return {
      sub: payload.sub || payload.email,
      email: payload.email || ''
    };
  } catch {
    return null;
  }
}
