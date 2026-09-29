import "server-only";
import { boundedBody, trustedOrigin } from "@/lib/auth-forwarding";
import { getSetCookies } from "@/lib/api/auth";
import {
  requestBackendPrivate,
  type PrivatePath,
} from "@/lib/api/profile-addresses";
export function privateFailure(status = 503, code = "UNAVAILABLE") {
  return Response.json(
    { error: { code, message: "Unable to complete this request" } },
    { status, headers: { "Cache-Control": "no-store", Vary: "Cookie" } },
  );
}
export async function forwardProfileAddresses(
  req: Request,
  path: PrivatePath,
  method = req.method,
) {
  try {
    const origin = req.headers.get("origin");
    if (method !== "GET" && !trustedOrigin(req, origin))
      return privateFailure(403, "FORBIDDEN_ORIGIN");
    const body =
      method === "GET" || !req.body
        ? undefined
        : await boundedBody(req, path === "/api/profile" ? 4096 : 16384);
    if (body === null) return privateFailure(413, "BAD_REQUEST");
    const response = await requestBackendPrivate(path, {
      method,
      origin,
      body,
      cookie: req.headers.get("cookie"),
      contentType: req.headers.get("content-type"),
    });
    const headers = new Headers({
      "Cache-Control": "no-store",
      Vary: "Cookie",
    });
    const contentType = response.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    for (const cookie of getSetCookies(response.headers))
      headers.append("Set-Cookie", cookie);
    return new Response(
      response.status === 204 ? null : await response.arrayBuffer(),
      { status: response.status, headers },
    );
  } catch {
    return privateFailure();
  }
}
