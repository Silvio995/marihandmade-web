import "server-only";
import { z } from "zod";
import { boundedBody, trustedOrigin } from "@/lib/auth-forwarding";
import { privateFailure } from "@/lib/profile-addresses-forwarding";
import {
  requestBackendOrders,
  OrdersError,
  type OrdersPath,
} from "@/lib/api/orders";
import {
  idSchema,
  listQuery,
  orderBody,
  previewBody,
} from "@/lib/checkout-orders-contracts";
export async function forwardOrders(req: Request, path: OrdersPath) {
  try {
    const method = req.method as "GET" | "POST";
    const query = new URL(req.url).searchParams;
    if (path !== "/api/checkout" && path !== "/api/orders")
      idSchema.parse(decodeURIComponent(path.slice("/api/orders/".length)));
    if (method === "GET" && path === "/api/orders")
      listQuery.parse(Object.fromEntries(query));
    else if (query.size) return privateFailure(400, "BAD_REQUEST");
    const origin = req.headers.get("origin");
    let body: string | undefined;
    let operationId: string | null = null;
    if (method === "POST") {
      if (!trustedOrigin(req, origin))
        return privateFailure(403, "FORBIDDEN_ORIGIN");
      if (
        req.headers
          .get("content-type")
          ?.split(";", 1)[0]
          .trim()
          .toLowerCase() !== "application/json"
      )
        return privateFailure(415, "BAD_REQUEST");
      const raw = await boundedBody(req, 65536);
      if (raw === null) return privateFailure(413, "BAD_REQUEST");
      body = JSON.stringify(
        (path === "/api/checkout" ? previewBody : orderBody).parse(
          JSON.parse(raw),
        ),
      );
      if (path === "/api/orders")
        operationId = z
          .string()
          .uuid()
          .parse(req.headers.get("idempotency-key"))
          .toLowerCase();
    }
    const result = await requestBackendOrders(path, {
      method,
      body,
      operationId,
      cookie: req.headers.get("cookie"),
      origin,
      contentType: method === "POST" ? req.headers.get("content-type") : null,
      query: query.toString(),
    });
    const headers = new Headers({
      "Cache-Control": "private, no-store",
      Vary: "Cookie",
    });
    for (const cookie of result.cookies) headers.append("Set-Cookie", cookie);
    if (result.replayed !== null)
      headers.set("Idempotency-Replayed", result.replayed);
    return Response.json(result.body, { headers });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return privateFailure(400, "BAD_REQUEST");
    if (error instanceof OrdersError)
      return privateFailure(error.status, error.code);
    return privateFailure();
  }
}
