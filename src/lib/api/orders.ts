import "server-only";
import { z } from "zod";
import {
  createdSchema,
  detailSchema,
  listSchema,
  previewSchema,
} from "@/lib/checkout-orders-contracts";
import { getSetCookies } from "@/lib/api/auth";
const codes = new Set([
  "BAD_REQUEST",
  "UNAUTHENTICATED",
  "ACCOUNT_DISABLED",
  "FORBIDDEN_ORIGIN",
  "NOT_FOUND",
  "CART_CHANGED",
  "CART_LINE_UNAVAILABLE",
  "CART_QUANTITY_UNAVAILABLE",
  "ADDRESS_UNAVAILABLE",
  "DISCOUNT_UNAVAILABLE",
  "PRICE_UNAVAILABLE",
  "IDEMPOTENCY_CONFLICT",
  "CHECKOUT_BUSY",
  "GUEST_SCOPE_INVALID",
  "CHECKOUT_UNAVAILABLE",
  "RATE_LIMITED",
]);
export class OrdersError extends Error {
  constructor(
    public status = 503,
    public code = "UNAVAILABLE",
  ) {
    super("Unable to complete checkout. Please try again.");
  }
}
export type OrdersPath =
  | "/api/checkout"
  | "/api/orders"
  | `/api/orders/${string}`;
export async function requestBackendOrders(
  path: OrdersPath,
  input: {
    method?: "GET" | "POST";
    cookie?: string | null;
    origin?: string | null;
    contentType?: string | null;
    operationId?: string | null;
    body?: string;
    query?: string;
  } = {},
) {
  try {
    const base = process.env.MARIHANDMADE_API_URL;
    if (!base) throw new Error();
    const url = new URL(`${base.replace(/\/$/, "")}${path}`);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error();
    if (input.query) url.search = input.query;
    const headers = new Headers({ Accept: "application/json" });
    if (input.cookie) headers.set("Cookie", input.cookie);
    if (input.origin) headers.set("Origin", input.origin);
    if (input.contentType) headers.set("Content-Type", input.contentType);
    if (input.operationId) headers.set("Idempotency-Key", input.operationId);
    const response = await fetch(url, {
      method: input.method ?? "GET",
      headers,
      body: input.body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    if (
      response.headers
        .get("content-type")
        ?.split(";", 1)[0]
        .trim()
        .toLowerCase() !== "application/json"
    )
      throw new Error();
    const reader = response.body?.getReader();
    if (!reader) throw new Error();
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      size += result.value.length;
      if (size > 2097152) {
        await reader.cancel();
        throw new Error();
      }
      chunks.push(result.value);
    }
    const bytes = new Uint8Array(size);
    let pos = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, pos);
      pos += chunk.length;
    }
    const raw = JSON.parse(new TextDecoder().decode(bytes));
    if (!response.ok) {
      const error = z
        .object({
          error: z.object({ code: z.string(), message: z.string() }).strict(),
        })
        .strict()
        .parse(raw);
      if (
        ![400, 401, 403, 404, 409, 413, 415, 429, 503].includes(
          response.status,
        ) ||
        !codes.has(error.error.code)
      )
        throw new Error();
      throw new OrdersError(response.status, error.error.code);
    }
    if (response.status !== 200) throw new Error();
    const schema =
      path === "/api/checkout"
        ? previewSchema
        : path === "/api/orders"
          ? input.method === "POST"
            ? createdSchema
            : listSchema
          : detailSchema;
    const body = schema.parse(raw);
    return {
      body,
      cookies: getSetCookies(response.headers).filter((c) =>
        /^(mh_guest_checkout|guest_order_access)=/.test(c),
      ),
      replayed: response.headers.get("idempotency-replayed"),
      retryAfter: response.headers.get("retry-after"),
    };
  } catch (error) {
    if (error instanceof OrdersError) throw error;
    throw new OrdersError();
  }
}
