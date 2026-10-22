"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requestPayment } from "@/lib/client-payments";
export function PayPalReturn() {
  const params = useSearchParams(),
    router = useRouter();
  const id = params.get("orderId"),
    token = params.get("token") ?? params.get("providerOrderId");
  const [message, setMessage] = useState("Confirming PayPal payment..."),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    if (!id || !token) {
      setMessage("Missing PayPal return parameters");
      return;
    }
    setMessage("Confirming PayPal payment...");
    void requestPayment(id, "capture", token)
      .then((data) => {
        if (!active) return;
        if (data.payment?.state === "REQUIRES_REVIEW")
          setMessage("Payment requires review. Please contact support.");
        else if (data.isPaid) {
          setMessage("Payment confirmed");
          router.push(`/order-confirmation?orderId=${encodeURIComponent(id)}`);
        } else
          setMessage(
            "Payment is still processing. Check status before retrying.",
          );
      })
      .catch((error) => {
        if (active)
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to confirm payment",
          );
      });
    return () => {
      active = false;
    };
  }, [id, token, retry, router]);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-xl font-semibold">{message}</div>
      {id && (
        <>
          <Button variant="outline" onClick={() => setRetry((v) => v + 1)}>
            Retry confirmation
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              router.push(
                `/order-confirmation?orderId=${encodeURIComponent(id)}`,
              )
            }
          >
            Vedi stato ordine
          </Button>
        </>
      )}
    </div>
  );
}
export default function PayPalReturnPage() {
  return (
    <Suspense fallback={<p>Confirming PayPal payment...</p>}>
      <PayPalReturn />
    </Suspense>
  );
}
