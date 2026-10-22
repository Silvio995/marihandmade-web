import type { PaymentResult } from "@/lib/payment-contracts";
export const payment: PaymentResult = {
  orderId: "order",
  orderStatus: "Pending",
  isPaid: false,
  payment: {
    id: "payment",
    provider: "paypal",
    state: "APPROVAL_REQUIRED",
    amount: "21.80",
    currency: "EUR",
    providerOrderId: "PROVIDER",
    approvalUrl: "https://www.sandbox.paypal.com/checkoutnow?token=PROVIDER",
  },
};
export const paid: PaymentResult = {
  ...payment,
  orderStatus: "Processing",
  isPaid: true,
  payment: { ...payment.payment!, state: "PAID", approvalUrl: null },
};
