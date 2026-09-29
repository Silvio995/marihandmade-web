import "server-only";
import prisma from "@/lib/prisma";
// Cart and wishlist stay in Web until their own cutover. No User/profile or Address read.
export async function readAccountAggregates(userId: string) {
  const [cart, wishlist] = await Promise.all([
    prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    }),
    prisma.product.findMany({ where: { wishlists: { some: { id: userId } } } }),
  ]);
  return { cart, wishlist };
}
