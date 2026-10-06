import { forwardOrders } from "@/lib/orders-forwarding";
export const dynamic = "force-dynamic";
export const GET = (
  req: Request,
  { params }: { params: { orderId: string } },
) => forwardOrders(req, `/api/orders/${encodeURIComponent(params.orderId)}`);
