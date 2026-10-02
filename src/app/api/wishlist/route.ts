import { forwardWishlist } from "@/lib/wishlist-forwarding";
export const dynamic = "force-dynamic";
export const GET = (req: Request) => forwardWishlist(req, "GET");
export const POST = (req: Request) => forwardWishlist(req, "POST");
