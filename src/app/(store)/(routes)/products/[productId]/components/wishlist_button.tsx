"use client";
import WishlistAction from "@/components/native/WishlistButton";
import type { ProductWithIncludes } from "@/types/product";
export default function WishlistButton({
  product,
}: {
  product: ProductWithIncludes;
}) {
  return <WishlistAction productId={product.id} />;
}
