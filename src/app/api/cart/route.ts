import { requestBackendCart } from "@/lib/api/cart";
import { getSetCookies } from "@/lib/api/auth";
import { boundedBody, trustedOrigin } from "@/lib/auth-forwarding";
import { privateFailure } from "@/lib/profile-addresses-forwarding";
export const dynamic = "force-dynamic";
async function forward(req: Request, method: "GET" | "POST") {
  try {
    if (new URL(req.url).searchParams.size)
      return privateFailure(400, "BAD_REQUEST");
    const origin = req.headers.get("origin");
    if (method === "POST" && !trustedOrigin(req, origin))
      return privateFailure(403, "FORBIDDEN_ORIGIN");
    const body = method === "POST" ? await boundedBody(req, 65536) : undefined;
    if (body === null) return privateFailure(413, "BAD_REQUEST");
    const response = await requestBackendCart({
      method,
      origin,
      body,
      cookie: req.headers.get("cookie"),
      contentType: req.headers.get("content-type"),
      operationId: req.headers.get("idempotency-key"),
    });
    const headers = new Headers({
      "Cache-Control": "no-store",
      Vary: "Cookie",
    });
    const type = response.headers.get("content-type");
    if (type) headers.set("Content-Type", type);
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
export const GET = (req: Request) => forward(req, "GET");
export const POST = (req: Request) => forward(req, "POST");
