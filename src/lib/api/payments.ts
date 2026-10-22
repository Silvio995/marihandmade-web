import "server-only";
import { z } from "zod";
import {
  paymentResult,
  paymentErrorCodes,
  safeApprovalUrl,
} from "@/lib/payment-contracts";
export async function requestBackendPayment(
  path: string,
  input: { method: string; headers: Headers; body?: string },
) {
  try {
    const base = process.env.MARIHANDMADE_API_URL;
    if (
      !base ||
      !/^\/api\/(?:orders\/[^/]+\/pay\/paypal(?:\/(?:capture|sync))?|paypal\/webhook)$/.test(
        path,
      )
    )
      throw new Error();
    const url = new URL(base.replace(/\/$/, "") + path);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error();
    const response = await fetch(url, {
      ...input,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    if (
      response.headers.get("content-type")?.split(";", 1)[0].trim() !==
      "application/json"
    )
      throw new Error();
    const reader = response.body?.getReader();
    if (!reader) throw new Error();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const r = await reader.read();
      if (r.done) break;
      size += r.value.length;
      if (size > 65536) {
        await reader.cancel();
        throw new Error();
      }
      chunks.push(r.value);
    }
    const raw = JSON.parse(Buffer.concat(chunks).toString());
    let body: unknown;
    if ([200, 202].includes(response.status)) {
      body =
        path === "/api/paypal/webhook"
          ? z
              .object({
                acknowledged: z.literal(true),
                ignored: z.boolean().optional(),
              })
              .strict()
              .parse(raw)
          : paymentResult.parse(raw);
      if (path !== "/api/paypal/webhook") {
        const p = paymentResult.parse(body);
        if (p.payment?.approvalUrl) safeApprovalUrl(p.payment.approvalUrl);
      }
    } else {
      const error = z
        .object({
          error: z.object({ code: z.string(), message: z.string() }).strict(),
        })
        .strict()
        .parse(raw);
      if (
        ![400, 401, 403, 404, 409, 413, 415, 422, 429, 500, 503].includes(
          response.status,
        ) ||
        !paymentErrorCodes.has(error.error.code)
      )
        throw new Error();
      body = {
        error: {
          code: error.error.code,
          message:
            "Payment could not be completed. Check its status before retrying.",
        },
      };
    }
    return {
      body,
      status: response.status,
      retryAfter: response.status === 202 ? "5" : null,
    };
  } catch {
    throw new Error("Backend payment unavailable");
  }
}
