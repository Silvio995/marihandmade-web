import "server-only";
import prisma from "@/lib/prisma";
// Wishlist alone remains transitional until its own Backend cutover.
export async function readAccountAggregates(userId: string) {
  const wishlist = await prisma.product.findMany({
    where: { wishlists: { some: { id: userId } } },
  });
  return { wishlist };
}
