// Stateless cookie auth — no database, so the "session" is just a signed
// expiry timestamp. Anyone holding a valid signature + unexpired timestamp
// is authed; there's no per-user session to revoke individually, which is
// fine for a single-owner private site.
const COOKIE_NAME = "idealab_auth";
const SESSION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const ALLOWED_EMAIL = "ab@cucinalabs.com";

async function hmac(data, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function makeToken(secret) {
  const expiry = Date.now() + SESSION_MS;
  const sig = await hmac(String(expiry), secret);
  return `${expiry}.${sig}`;
}

export async function verifyToken(token, secret) {
  if (!token) return false;
  const [expiryStr, sig] = token.split(".");
  if (!expiryStr || !sig) return false;
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  const expected = await hmac(expiryStr, secret);
  return expected === sig;
}

export { COOKIE_NAME, SESSION_MS, ALLOWED_EMAIL };
