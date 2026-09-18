export const config = { runtime: "edge" };
import { COOKIE_NAME } from "../lib/auth.js";

export default async function handler() {
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
