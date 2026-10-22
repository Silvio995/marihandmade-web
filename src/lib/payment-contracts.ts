import { z } from "zod";
import { idSchema, summarySchema } from "./checkout-orders-contracts";
export const providerId = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/);
export const emptyPaymentBody = z.object({}).strict();
export const captureBody = z
  .object({ providerOrderId: providerId.optional() })
  .strict();
export const paymentState = z.enum([
  "CREATING",
  "APPROVAL_REQUIRED",
  "APPROVED",
  "PROCESSING",
  "PAID",
  "FAILED",
  "DENIED",
  "REQUIRES_REVIEW",
]);
export const paymentResult = z
  .object({
    orderId: idSchema,
    orderStatus: summarySchema.shape.status,
    isPaid: z.boolean(),
    payment: z
      .object({
        id: idSchema,
        provider: z.literal("paypal"),
        state: paymentState,
        amount: z.string().regex(/^\d+\.\d{2}$/),
        currency: z.literal("EUR").nullable(),
        providerOrderId: providerId.nullable(),
        approvalUrl: z.string().url().nullable(),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type PaymentResult = z.infer<typeof paymentResult>;
export function safeApprovalUrl(value: string) {
  const u = new URL(value);
  if (
    u.protocol !== "https:" ||
    !["www.paypal.com", "www.sandbox.paypal.com"].includes(u.hostname) ||
    u.port ||
    u.username ||
    u.password ||
    u.hash
  )
    throw new Error("Invalid approval URL");
  return u.href;
}
export const paymentErrorCodes = new Set([
  "BAD_REQUEST",
  "UNAUTHENTICATED",
  "ACCOUNT_DISABLED",
  "FORBIDDEN_ORIGIN",
  "NOT_FOUND",
  "GUEST_ORDER_ACCESS_INVALID",
  "CHECKOUT_UNAVAILABLE",
  "RATE_LIMITED",
  "PAYMENT_UNAVAILABLE",
  "INTERNAL_ERROR",
  "ORDER_NOT_PAYABLE",
  "PAYMENT_REQUIRES_REVIEW",
  "PAYMENT_AMOUNT_INVALID",
  "PAYMENT_NOT_CREATED",
  "PAYMENT_ORDER_MISMATCH",
  "PAYMENT_NOT_APPROVED",
  "PAYMENT_AMOUNT_MISMATCH",
  "PAYMENT_CURRENCY_MISMATCH",
  "PAYMENT_VERIFICATION_FAILED",
  "PAYMENT_DECLINED",
  "WEBHOOK_SIGNATURE_INVALID",
]);
