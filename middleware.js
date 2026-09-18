import { verifyToken, COOKIE_NAME } from "./lib/auth.js";

// No config.matcher — runs on every request; exclusions are handled here in
// plain code instead of a path-to-regexp pattern, which is easier to get
// right for a framework-less project than the Next.js-style matcher syntax.
const PUBLIC_PATHS = new Set(["/login.html", "/api/login", "/api/logout", "/manifest.json", "/icon.svg", "/icon-512.png"]);

export default async function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (PUBLIC_PATHS.has(path) || path.startsWith("/assets/")) return;

  const secret = process.env.SITE_AUTH_SECRET;
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)idealab_auth=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;
  const valid = secret ? await verifyToken(token, secret) : false;
  if (valid) return;

  url.pathname = "/login.html";
  url.searchParams.set("next", path);
  return Response.redirect(url, 302);
}
