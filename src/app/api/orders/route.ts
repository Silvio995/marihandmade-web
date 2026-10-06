import { forwardOrders } from "@/lib/orders-forwarding";
export const dynamic = "force-dynamic";
export const GET = (req: Request) => forwardOrders(req, "/api/orders");
export const POST = (req: Request) => forwardOrders(req, "/api/orders");
