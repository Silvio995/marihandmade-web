import "server-only";
import { z } from "zod";
import { boundedBody, trustedOrigin } from "@/lib/auth-forwarding";
import { requestBackendPayment } from "@/lib/api/payments";
import { emptyPaymentBody, captureBody } from "@/lib/payment-contracts";
import { idSchema } from "@/lib/checkout-orders-contracts";
const privateHeaders = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie, x-guest-order-access",
};
function failure(status = 503, code = "PAYMENT_UNAVAILABLE") {
  return Response.json(
    {
      error: {
        code,
        message:
          "Unable to complete payment. Check its status before retrying.",
      },
    },
    { status, headers: privateHeaders },
  );
}
export async function forwardPayment(
  req: Request,
  orderId: string,
  action: "" | "capture" | "sync" = "",
) {
  try {
    idSchema.parse(orderId);
    if (new URL(req.url).search) return failure(400, "BAD_REQUEST");
    const headers = new Headers({ Accept: "application/json" });
    for (const key of ["cookie", "origin", "x-guest-order-access"]) {
      const value = req.headers.get(key);
      if (value) headers.set(key, value);
    }
    let body: string | undefined;
    if (req.method === "POST") {
      if (!trustedOrigin(req, req.headers.get("origin")))
        return failure(403, "FORBIDDEN_ORIGIN");
      if (
        req.headers
          .get("content-type")
          ?.split(";", 1)[0]
          .trim()
          .toLowerCase() !== "application/json"
      )
        return failure(415, "BAD_REQUEST");
      const raw = await boundedBody(req, 4096);
      if (raw === null) return failure(413, "BAD_REQUEST");
      body = JSON.stringify(
        (action === "capture" ? captureBody : emptyPaymentBody).parse(
          JSON.parse(raw),
        ),
      );
      headers.set("Content-Type", "application/json");
    }
    const result = await requestBackendPayment(
      `/api/orders/${encodeURIComponent(orderId)}/pay/paypal${action ? `/${action}` : ""}`,
      { method: req.method, headers, body },
    );
    return Response.json(result.body, {
      status: result.status,
      headers: {
        ...privateHeaders,
        ...(result.retryAfter ? { "Retry-After": result.retryAfter } : {}),
      },
    });
  } catch (e) {
    return e instanceof z.ZodError || e instanceof SyntaxError
      ? failure(400, "BAD_REQUEST")
      : failure();
  }
}
// Temporary delivery bridge: exact raw bytes and signature headers, no local verification.
export async function forwardPaymentWebhook(req: Request) {
  try {
    if (new URL(req.url).search) return failure(400, "BAD_REQUEST");
    if (
      req.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !==
      "application/json"
    )
      return failure(415, "BAD_REQUEST");
    const body = await boundedBody(req, 262144);
    if (body === null) return failure(413, "BAD_REQUEST");
    const headers = new Headers({ "Content-Type": "application/json" });
    for (const key of [
      "paypal-transmission-id",
      "paypal-transmission-time",
      "paypal-transmission-sig",
      "paypal-cert-url",
      "paypal-auth-algo",
    ]) {
      const value = req.headers.get(key);
      if (!value || value.length > 2048) return failure(400, "BAD_REQUEST");
      headers.set(key, value);
    }
    const result = await requestBackendPayment("/api/paypal/webhook", {
      method: "POST",
      headers,
      body,
    });
    return Response.json(result.body, {
      status: result.status,
      headers: privateHeaders,
    });
  } catch {
    return failure();
  }
}
