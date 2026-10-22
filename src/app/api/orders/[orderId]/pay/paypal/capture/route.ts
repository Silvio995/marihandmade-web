import { forwardPayment } from "@/lib/payments-forwarding";
export function POST(
  req: Request,
  { params }: { params: { orderId: string } },
) {
  return forwardPayment(req, params.orderId, "capture");
}
