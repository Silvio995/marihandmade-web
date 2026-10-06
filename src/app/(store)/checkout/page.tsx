"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthenticated } from "@/hooks/useAuthentication";
import { useCartContext } from "@/state/Cart";
import type { Address } from "@/lib/profile-addresses-contracts";
import { profileAddressesMessage } from "@/lib/profile-addresses-contracts";
import { profileAddresses } from "@/lib/client-profile-addresses";
import { useAuth } from "@/state/Auth";

import { previewSchema, orderBody } from "@/lib/checkout-orders-contracts";
import {
  readOperation,
  prepareOperation,
  submitOperation,
  consumeGuestIntent,
  beginNewOperation,
  type OrderOperation,
} from "@/lib/checkout-operation";
type CheckoutLineInput = {
  productId: string;
  variantId: string | null;
  quantity: number;
};

export default function CheckoutPage() {
  const router = useRouter();
  const {
    authenticated,
    loading: authLoading,
    error: authError,
  } = useAuthenticated();
  const {
    cart,
    loading: cartLoading,
    error: cartError,
    refreshCart,
  } = useCartContext();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const { session } = useAuth();
  const accountId = session?.user.id;
  const owner = authenticated ? `USER:${accountId}` : "GUEST";
  const currentOwner = useRef(owner);
  currentOwner.current = owner;
  const submitting = useRef(false);
  const [recovery, setRecovery] = useState<OrderOperation | null>(null);
  useEffect(() => {
    if (authLoading || authError) return;
    setCreatedOrderId(null);
    setGuestOrderAccessToken(undefined);
    setPaypalError(null);
    try {
      setRecovery(readOperation(owner));
    } catch {
      setRecovery(null);
    }
  }, [owner, authLoading, authError]);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressRetry, setAddressRetry] = useState(0);
  const [addressId, setAddressId] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [guestOrderAccessToken, setGuestOrderAccessToken] = useState<
    string | undefined
  >();
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const requestLines = useMemo<CheckoutLineInput[]>(
    () =>
      (cart?.items ?? [])
        .filter((item) => item?.productId && (item?.count ?? 0) > 0)
        .map((item) => ({
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.count ?? 0,
        })),
    [cart],
  );

  useEffect(() => {
    let cancelled = false;
    setAddresses([]);
    setAddressId("");
    setAddressError(null);
    if (!authenticated) {
      setAddressesLoading(false);
      return;
    }
    setAddressesLoading(true);
    void profileAddresses
      .addresses()
      .then((data) => {
        if (cancelled) return;
        setAddresses(data);
        setAddressId(data[0]?.id ?? "");
      })
      .catch((error) => {
        if (!cancelled) setAddressError(profileAddressesMessage(error));
      })
      .finally(() => {
        if (!cancelled) setAddressesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authenticated, accountId, addressRetry]);

  async function startPayPalPayment(
    orderId: string,
    guestOrderAccessToken?: string,
  ) {
    const payRes = await fetch(`/api/orders/${orderId}/pay/paypal`, {
      method: "POST",
      credentials: "include",
      headers: guestOrderAccessToken
        ? {
            "x-guest-order-access": guestOrderAccessToken,
          }
        : undefined,
    });

    if (!payRes.ok) {
      const text = await payRes.text().catch(() => "");
      throw new Error(text || "Impossibile avviare PayPal");
    }

    const payData: { providerApproveUrl?: string | null } = await payRes.json();
    if (!payData.providerApproveUrl) {
      throw new Error("PayPal approval URL mancante");
    }

    window.location.href = payData.providerApproveUrl;
  }

  async function handleCheckout() {
    if (
      submitting.current ||
      authLoading ||
      authError ||
      cartLoading ||
      (!recovery?.sent &&
        (cartError || (authenticated && (addressesLoading || addressError))))
    )
      return;
    submitting.current = true;
    setLoading(true);
    setPaypalError(null);
    const submittedOwner = owner;
    try {
      let operation = readOperation(owner);
      if (!operation?.sent) {
        const input = orderBody.parse({
          checkoutLines: requestLines,
          addressId: authenticated ? addressId : null,
          guest: authenticated
            ? undefined
            : {
                email: guestEmail,
                firstName: guestFirstName,
                lastName: guestLastName,
                phone: guestPhone,
              },
        });
        operation = prepareOperation(owner, input);
        const response = await fetch("/api/checkout", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkoutLines: operation.intent.checkoutLines,
          }),
        });
        if (!response.ok) throw new Error("Checkout prep failed");
        const preview = previewSchema.parse(await response.json());
        if (!preview.isCheckoutReady)
          throw new Error("Cart needs review before checkout");
      }
      if (currentOwner.current !== submittedOwner) return;
      const order = await submitOperation(operation);
      if (currentOwner.current !== submittedOwner) return;
      setRecovery(operation);
      setCreatedOrderId(order.id);
      setGuestOrderAccessToken(order.guestOrderAccessToken);
      try {
        if (!authenticated) consumeGuestIntent(operation);
        await refreshCart();
      } catch {
        /* Order remains confirmed. Cleanup can be retried with this key. */
      }
      if (currentOwner.current !== submittedOwner) return;
      try {
        await startPayPalPayment(order.id, order.guestOrderAccessToken);
      } catch {
        setPaypalError(
          "Non siamo riusciti ad avviare PayPal. Puoi riprovare o vedere la conferma ordine.",
        );
      }
    } catch (error) {
      if (currentOwner.current === submittedOwner) {
        try {
          setRecovery(readOperation(owner));
        } catch {
          /* keep saved intent */
        }
        alert(
          error instanceof Error
            ? error.message
            : "Checkout could not be confirmed. Try again.",
        );
      }
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <p className="text-sm text-neutral-600">
        Checkout ospite attivo: completa l&apos;ordine senza creare un account.
      </p>

      {authenticated ? (
        <div className="space-y-2">
          <label
            htmlFor="addressId"
            className="text-sm font-medium text-neutral-700"
          >
            Indirizzo di spedizione (opzionale)
          </label>
          {addressError ? (
            <p role="alert">
              {addressError}{" "}
              <button onClick={() => setAddressRetry((value) => value + 1)}>
                Try again
              </button>
            </p>
          ) : addressesLoading ? (
            <p>Loading addresses...</p>
          ) : addresses.length > 0 ? (
            <select
              id="addressId"
              value={addressId}
              onChange={(e) => setAddressId(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              {addresses.map((addr) => (
                <option key={addr.id} value={addr.id}>
                  {addr.address}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-neutral-500">
              Nessun indirizzo salvato: l&apos;ordine verrà creato comunque.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="guestFirstName"
              className="text-sm font-medium text-neutral-700"
            >
              Nome
            </label>
            <input
              id="guestFirstName"
              value={guestFirstName}
              onChange={(event) => setGuestFirstName(event.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="guestLastName"
              className="text-sm font-medium text-neutral-700"
            >
              Cognome
            </label>
            <input
              id="guestLastName"
              value={guestLastName}
              onChange={(event) => setGuestLastName(event.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="guestEmail"
              className="text-sm font-medium text-neutral-700"
            >
              Email
            </label>
            <input
              id="guestEmail"
              type="email"
              value={guestEmail}
              onChange={(event) => setGuestEmail(event.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="guestPhone"
              className="text-sm font-medium text-neutral-700"
            >
              Telefono (opzionale)
            </label>
            <input
              id="guestPhone"
              value={guestPhone}
              onChange={(event) => setGuestPhone(event.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      <Button
        onClick={handleCheckout}
        disabled={
          loading ||
          authLoading ||
          authError ||
          cartLoading ||
          (!recovery?.sent &&
            authenticated &&
            (addressesLoading || !!addressError)) ||
          (!recovery?.sent && (requestLines.length === 0 || !!cartError))
        }
      >
        {loading || authLoading || cartLoading
          ? "Elaborazione..."
          : recovery?.sent
            ? "Riprendi ordine"
            : authenticated
              ? "Completa ordine"
              : "Completa ordine come ospite"}
      </Button>

      {recovery?.result && requestLines.length > 0 && (
        <Button
          variant="outline"
          onClick={() => {
            beginNewOperation(owner);
            setRecovery(null);
            setCreatedOrderId(null);
            setGuestOrderAccessToken(undefined);
            setPaypalError(null);
          }}
        >
          Nuovo ordine
        </Button>
      )}
      {paypalError && createdOrderId && (
        <div className="rounded-md border border-neutral-200 bg-white p-4 text-sm">
          <p className="text-neutral-800">{paypalError}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="default"
              onClick={() =>
                startPayPalPayment(createdOrderId, guestOrderAccessToken).catch(
                  () => setPaypalError("PayPal non disponibile. Riprova."),
                )
              }
              disabled={loading}
            >
              Riprova PayPal
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/order-confirmation?orderId=${createdOrderId}`)
              }
              disabled={loading}
            >
              Vedi conferma ordine
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
