import "server-only";
import { WishlistError, wishlistProductId } from "@/lib/wishlist-contracts";
export async function requestBackendWishlist(
  input: {
    method?: "GET" | "POST" | "DELETE";
    productId?: string;
    cookie?: string | null;
    origin?: string | null;
    contentType?: string | null;
    body?: string;
  } = {},
) {
  try {
    const base = process.env.MARIHANDMADE_API_URL;
    if (!base) throw new Error();
    const suffix =
      input.method === "DELETE"
        ? `/${encodeURIComponent(wishlistProductId.parse(input.productId))}`
        : "";
    const url = new URL(`${base.replace(/\/$/, "")}/api/wishlist${suffix}`);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error();
    const headers = new Headers({ Accept: "application/json" });
    if (input.cookie) headers.set("Cookie", input.cookie);
    if (input.origin) headers.set("Origin", input.origin);
    if (input.contentType) headers.set("Content-Type", input.contentType);
    return await fetch(url, {
      method: input.method ?? "GET",
      headers,
      body: input.body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new WishlistError();
  }
}
