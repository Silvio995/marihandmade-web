import "server-only";
import { CartError } from "@/lib/cart-contracts";
export async function requestBackendCart(
  input: {
    method?: "GET" | "POST";
    cookie?: string | null;
    origin?: string | null;
    contentType?: string | null;
    operationId?: string | null;
    body?: string;
  } = {},
) {
  try {
    const base = process.env.MARIHANDMADE_API_URL;
    if (!base) throw new Error();
    const url = new URL(`${base.replace(/\/$/, "")}/api/cart`);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Error();
    const headers = new Headers({ Accept: "application/json" });
    if (input.cookie) headers.set("Cookie", input.cookie);
    if (input.origin) headers.set("Origin", input.origin);
    if (input.contentType) headers.set("Content-Type", input.contentType);
    if (input.operationId) headers.set("Idempotency-Key", input.operationId);
    return await fetch(url, {
      method: input.method ?? "GET",
      headers,
      body: input.body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new CartError();
  }
}
