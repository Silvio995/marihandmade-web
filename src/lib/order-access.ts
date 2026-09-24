import {
  getCurrentUserId,
  getGuestOrderAccessClaimsFromRequest,
} from "@/lib/auth";

type OrderOwnership = {
  id: string;
  userId: string | null;
  guestEmail: string | null;
};

type OrderAccessResult = {
  authorized: boolean;
  actor: "user" | "guest" | "none";
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export async function resolveOrderPaymentAccess(
  req: Request,
  order: OrderOwnership,
): Promise<OrderAccessResult> {
  // A valid guest capability remains usable independently of customer auth availability.
  const guestClaims = getGuestOrderAccessClaimsFromRequest(req);
  if (
    guestClaims &&
    !order.userId &&
    order.guestEmail &&
    guestClaims.orderId === order.id &&
    guestClaims.guestEmail === normalizeEmail(order.guestEmail)
  ) {
    return { authorized: true, actor: "guest" };
  }

  const userId = await getCurrentUserId();
  if (userId && order.userId === userId) {
    return { authorized: true, actor: "user" };
  }

  return { authorized: false, actor: "none" };
}
