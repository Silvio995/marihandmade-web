import { z } from "zod";
import { productDto } from "@/lib/api/contracts";
export const wishlistProductId = z
  .string()
  .min(1)
  .max(100)
  .refine((value) => value === value.trim());
export const wishlistAddSchema = z
  .object({ productId: wishlistProductId })
  .strict();
export const wishlistItemSchema = z
  .discriminatedUnion("visibility", [
    z.object({
      productId: wishlistProductId,
      visibility: z.literal("PUBLIC"),
      product: productDto,
    }),
    z.object({
      productId: wishlistProductId,
      visibility: z.literal("UNAVAILABLE"),
      product: z.null(),
    }),
  ])
  .refine(
    (item) =>
      item.visibility !== "PUBLIC" || item.product.id === item.productId,
  );
export const wishlistSchema = z
  .object({ items: wishlistItemSchema.array() })
  .refine(
    (value) =>
      new Set(value.items.map((item) => item.productId)).size ===
      value.items.length,
  );
export const wishlistAddedSchema = z.object({
  productId: wishlistProductId,
  present: z.literal(true),
});
export type WishlistItem = z.infer<typeof wishlistItemSchema>;
export class WishlistError extends Error {
  constructor(public readonly status = 503) {
    super(
      status === 401
        ? "Your session has expired. Please sign in again."
        : status === 404
          ? "This product is no longer available to save."
          : status === 403
            ? "This request is not permitted."
            : status === 400
              ? "Please check the product and try again."
              : "Wishlist is temporarily unavailable. Please try again.",
    );
    this.name = "WishlistError";
  }
}
export function wishlistMessage(error: unknown) {
  return (error instanceof WishlistError ? error : new WishlistError()).message;
}
