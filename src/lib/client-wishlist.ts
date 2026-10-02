import {
  WishlistError,
  wishlistAddedSchema,
  wishlistProductId,
  wishlistSchema,
} from "@/lib/wishlist-contracts";
async function request(method: "GET" | "POST" | "DELETE", productId?: string) {
  try {
    const id =
      productId === undefined ? undefined : wishlistProductId.parse(productId);
    const response = await fetch(
      `/api/wishlist${method === "DELETE" ? `/${encodeURIComponent(id!)}` : ""}`,
      {
        method,
        credentials: "same-origin",
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(8000),
        ...(method === "POST"
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId: id }),
            }
          : {}),
      },
    );
    if (!response.ok) throw new WishlistError(response.status);
    if (method === "DELETE") {
      if (response.status !== 204) throw new WishlistError();
      return;
    }
    if (response.status !== 200) throw new WishlistError();
    if (method === "GET") return wishlistSchema.parse(await response.json());
    const result = wishlistAddedSchema.parse(await response.json());
    if (result.productId !== id) throw new WishlistError();
  } catch (error) {
    throw error instanceof WishlistError ? error : new WishlistError();
  }
}
export const clientWishlist = {
  async get() {
    return (await request("GET"))!;
  },
  async add(productId: string) {
    await request("POST", productId);
  },
  async remove(productId: string) {
    await request("DELETE", productId);
  },
};
