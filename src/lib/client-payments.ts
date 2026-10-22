import {
  paymentResult,
  safeApprovalUrl,
  providerId,
} from "./payment-contracts";
import { idSchema } from "./checkout-orders-contracts";
export async function requestPayment(
  orderId: string,
  action: "status" | "create" | "capture" | "sync",
  token?: string,
  guest?: string,
) {
  idSchema.parse(orderId);
  if (token) providerId.parse(token);
  const response = await fetch(
    `/api/orders/${encodeURIComponent(orderId)}/pay/paypal${action === "capture" || action === "sync" ? `/${action}` : ""}`,
    {
      method: action === "status" ? "GET" : "POST",
      credentials: "include",
      cache: "no-store",
      headers: {
        ...(action === "status" ? {} : { "Content-Type": "application/json" }),
        ...(guest ? { "x-guest-order-access": guest } : {}),
      },
      ...(action === "status"
        ? {}
        : {
            body: JSON.stringify(
              action === "capture" && token ? { providerOrderId: token } : {},
            ),
          }),
    },
  );
  if (![200, 202].includes(response.status))
    throw new Error(
      response.status === 401
        ? "Payment access expired. Sign in or resume your saved checkout."
        : response.status === 422
          ? "Payment was declined. Please contact support before starting another payment."
          : "Unable to confirm payment. Check its status or try again.",
    );
  const data = paymentResult.parse(await response.json());
  if (data.orderId !== orderId) throw new Error("Unexpected payment response");
  if (data.payment?.approvalUrl) safeApprovalUrl(data.payment.approvalUrl);
  return data;
}
export async function startPayPalPayment(orderId: string, guest?: string) {
  let data = await requestPayment(orderId, "create", undefined, guest);
  // This function runs only after an explicit checkout/resume action.
  if (data.payment?.state === "APPROVED")
    data = await requestPayment(
      orderId,
      "capture",
      data.payment.providerOrderId ?? undefined,
      guest,
    );
  if (data.payment?.state === "REQUIRES_REVIEW")
    throw new Error("Payment requires review. Please contact support.");
  if (data.isPaid) {
    window.location.href = `/order-confirmation?orderId=${encodeURIComponent(orderId)}`;
    return;
  }
  if (data.payment?.state === "APPROVAL_REQUIRED" && !data.payment.approvalUrl)
    throw new Error(
      "PayPal approval is unavailable. Please check payment status.",
    );
  if (data.payment?.approvalUrl) {
    window.location.href = safeApprovalUrl(data.payment.approvalUrl);
    return;
  }
  window.location.href = `/order-confirmation?orderId=${encodeURIComponent(orderId)}`;
}
