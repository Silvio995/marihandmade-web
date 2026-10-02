import "server-only";
import { boundedBody, trustedOrigin } from "@/lib/auth-forwarding";
import { getSetCookies } from "@/lib/api/auth";
import { privateFailure } from "@/lib/profile-addresses-forwarding";
import { requestBackendWishlist } from "@/lib/api/wishlist";
import {
  wishlistAddSchema,
  wishlistAddedSchema,
  wishlistProductId,
  wishlistSchema,
} from "@/lib/wishlist-contracts";
export async function forwardWishlist(
  req: Request,
  method: "GET" | "POST" | "DELETE",
  productId?: string,
) {
  try {
    if (new URL(req.url).searchParams.size)
      return privateFailure(400, "BAD_REQUEST");
    const origin = req.headers.get("origin");
    if (method !== "GET" && !trustedOrigin(req, origin))
      return privateFailure(403, "FORBIDDEN_ORIGIN");
    let body: string | undefined;
    if (method === "POST") {
      if (
        req.headers
          .get("content-type")
          ?.split(";", 1)[0]
          .trim()
          .toLowerCase() !== "application/json"
      )
        return privateFailure(415, "BAD_REQUEST");
      const raw = await boundedBody(req, 4096);
      if (raw === null) return privateFailure(413, "BAD_REQUEST");
      try {
        const input = wishlistAddSchema.parse(JSON.parse(raw));
        productId = input.productId;
        body = JSON.stringify(input);
      } catch {
        return privateFailure(400, "BAD_REQUEST");
      }
    }
    if (method === "DELETE") {
      if (!wishlistProductId.safeParse(productId).success || req.body)
        return privateFailure(400, "BAD_REQUEST");
    }
    const response = await requestBackendWishlist({
      method,
      productId,
      body,
      cookie: req.headers.get("cookie"),
      origin,
      contentType: method === "POST" ? req.headers.get("content-type") : null,
    });
    const headers = new Headers({
      "Cache-Control": "no-store",
      Vary: "Cookie",
    });
    for (const cookie of getSetCookies(response.headers))
      headers.append("Set-Cookie", cookie);
    if (!response.ok) {
      const type = response.headers.get("content-type");
      if (type) headers.set("Content-Type", type);
      return new Response(await response.arrayBuffer(), {
        status: response.status,
        headers,
      });
    }
    if (method === "DELETE") {
      if (response.status !== 204) throw new Error();
      return new Response(null, { status: 204, headers });
    }
    if (response.status !== 200) throw new Error();
    const value =
      method === "GET"
        ? wishlistSchema.parse(await response.json())
        : wishlistAddedSchema.parse(await response.json());
    if (
      method === "POST" &&
      "productId" in value &&
      value.productId !== productId
    )
      throw new Error();
    return Response.json(value, { status: response.status, headers });
  } catch {
    return privateFailure();
  }
}
