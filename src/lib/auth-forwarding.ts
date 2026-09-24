import "server-only";
import { requestBackendAuth } from "@/lib/api/auth";
import type { AuthOperation } from "@/lib/auth-contracts";

function failure(status: number, code: string, message: string) {
  return Response.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
function trustedOrigin(req: Request, origin: string | null) {
  if (!origin || origin === "null") return false;
  try {
    const production = process.env.NODE_ENV === "production";
    // Local request URLs include the actual listening port. Public link settings
    // must not override them (e.g. a copied production placeholder in .env.local).
    // Behind a production proxy, req.url may be internal: use the explicitly
    // configured public origin, never client-supplied Host/forwarded headers.
    const expected = new URL(
      production ? process.env.NEXT_PUBLIC_APP_URL || "" : req.url,
    );
    if (
      expected.username ||
      expected.password ||
      (production
        ? expected.protocol !== "https:"
        : !["http:", "https:"].includes(expected.protocol))
    )
      return false;
    return origin === expected.origin;
  } catch {
    return false;
  }
}
async function boundedBody(req: Request) {
  const reader = req.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 4096) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
function retireLegacyCookies(headers: Headers, cookie: string | null) {
  const names = new Set([
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
    "next-auth.csrf-token",
    "__Host-next-auth.csrf-token",
  ]);
  for (const part of (cookie || "").split(";")) {
    const name = part.trim().split("=")[0];
    if (/^(?:__Secure-)?next-auth\.session-token(?:\.\d+)?$/.test(name))
      names.add(name);
  }
  for (const name of names)
    headers.append(
      "Set-Cookie",
      `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${name.startsWith("__") ? "; Secure" : ""}`,
    );
}
export async function forwardAuth(req: Request, operation: AuthOperation) {
  try {
    const origin = req.headers.get("origin");
    if (operation !== "me" && !trustedOrigin(req, origin))
      return failure(403, "FORBIDDEN_ORIGIN", "Untrusted request origin");
    const body = operation === "me" ? undefined : await boundedBody(req);
    if (body === null)
      return failure(413, "BAD_REQUEST", "Request body too large");
    const result = await requestBackendAuth(operation, {
      cookie: req.headers.get("cookie"),
      origin,
      contentType: operation === "me" ? null : req.headers.get("content-type"),
      body,
    });
    const headers = new Headers({
      "Cache-Control": "no-store",
      Vary: "Cookie",
    });
    if (result.retryAfter) headers.set("Retry-After", result.retryAfter);
    for (const cookie of result.cookies) headers.append("Set-Cookie", cookie);
    retireLegacyCookies(headers, req.headers.get("cookie"));
    return result.body === null
      ? new Response(null, { status: result.status, headers })
      : Response.json(result.body, { status: result.status, headers });
  } catch {
    return failure(
      503,
      "AUTH_UNAVAILABLE",
      "Authentication is temporarily unavailable",
    );
  }
}
