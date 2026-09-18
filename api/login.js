export const config = { runtime: "edge" };
import { makeToken, COOKIE_NAME, SESSION_MS, ALLOWED_EMAIL } from "../lib/auth.js";

export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const secret = process.env.SITE_AUTH_SECRET;
  const password = process.env.SITE_PASSWORD;
  if (!secret || !password) {
    return new Response(JSON.stringify({ error: "Auth not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Trim + lowercase the email before comparing — mobile keyboards
  // (notably iOS Safari) can autocapitalize the first letter of an email
  // field even with type="email", which would otherwise silently reject a
  // correctly-typed login. Password is trimmed only (case matters there).
  const email = ((body && body.email) || "").trim().toLowerCase();
  const pw = ((body && body.password) || "").trim();
  if (email !== ALLOWED_EMAIL.toLowerCase() || pw !== password) {
    return new Response(JSON.stringify({ error: "Incorrect email or password" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = await makeToken(secret);
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.floor(SESSION_MS / 1000)}`
  );
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
