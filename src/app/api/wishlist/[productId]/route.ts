import { forwardWishlist } from "@/lib/wishlist-forwarding";
export const dynamic = "force-dynamic";
export const DELETE = (
  req: Request,
  { params }: { params: { productId: string } },
) => forwardWishlist(req, "DELETE", params.productId);
