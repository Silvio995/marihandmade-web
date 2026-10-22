"use client";
import { useEffect, useState } from "react";
import { requestPayment, startPayPalPayment } from "@/lib/client-payments";
import type { PaymentResult } from "@/lib/payment-contracts";
import { Button } from "@/components/ui/button";
export function PaymentStatus({
  orderId,
  cancelled,
}: {
  orderId?: string;
  cancelled: boolean;
}) {
  const [data, setData] = useState<PaymentResult | null>(null),
    [error, setError] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    setData(null);
    setError(null);
    if (orderId)
      void requestPayment(orderId, "status")
        .then((result) => {
          if (active) setData(result);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    return () => {
      active = false;
    };
  }, [orderId]);
  const act = async (resume: boolean) => {
    if (!orderId || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (resume) await startPayPalPayment(orderId);
      else setData(await requestPayment(orderId, "sync"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to check payment");
    } finally {
      setBusy(false);
    }
  };
  const review = data?.payment?.state === "REQUIRES_REVIEW";
  const message = !orderId
    ? "Select an order to check its payment status."
    : review
      ? "Payment requires review. Please contact support."
      : data?.isPaid
        ? "Payment confirmed. Thank you for your order."
        : data
          ? cancelled
            ? "PayPal approval was cancelled. Your order remains unpaid; you can resume payment."
            : "Your order is saved. Payment has not yet been confirmed."
          : "Checking payment status...";
  return (
    <>
      <p className="text-lg text-neutral-700">{message}</p>
      {error && <p role="alert">{error}</p>}
      {orderId && !data?.isPaid && (
        <div className="mt-6 flex gap-4">
          <Button disabled={busy} onClick={() => void act(false)}>
            Check payment status
          </Button>
          {!review && (
            <Button
              disabled={busy}
              variant="outline"
              onClick={() => void act(true)}
            >
              Resume PayPal payment
            </Button>
          )}
        </div>
      )}
    </>
  );
}
