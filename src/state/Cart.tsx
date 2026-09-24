"use client";
import { getLocalCart, writeLocalCart } from "@/lib/cart";
import type { CartSummary } from "@/types/prisma";
import { useUserContext } from "@/state/User";
import { useAuth } from "@/state/Auth";
import { createContext, useContext, useEffect, useRef, useState } from "react";

type CartContextType = {
  cart: CartSummary | null;
  loading: boolean;
  refreshCart: () => Promise<void>;
  dispatchCart: (cart: CartSummary | null) => Promise<void>;
};
const CartContext = createContext<CartContextType>({
  cart: null,
  loading: true,
  refreshCart: async () => {},
  dispatchCart: async () => {},
});
export const useCartContext = () => useContext(CartContext);
// Serialize guest merges in this tab; Web Locks also serialize across tabs when available.
let mergeQueue: Promise<unknown> = Promise.resolve();
export function CartContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: profileLoading } = useUserContext();
  const { status, session } = useAuth();
  const identity = status === "authenticated" ? session!.user.id : status;
  const latest = useRef(identity);
  latest.current = identity;
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const [stored, setStored] = useState<{
    identity: string;
    cart: CartSummary | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const dispatchCart = async (cart: CartSummary | null) => {
    if (
      !alive.current ||
      latest.current !== identity ||
      !["authenticated", "unauthenticated"].includes(status)
    )
      return;
    setStored({ identity, cart });
    if (status === "unauthenticated") writeLocalCart(cart);
  };
  const refreshCart = async () => {
    if (status === "unauthenticated")
      setStored({ identity, cart: getLocalCart() ?? { items: [] } });
    else if (status === "authenticated" && user)
      setStored({ identity, cart: user.cart ?? { items: [] } });
  };
  useEffect(() => {
    let cancelled = false;
    const save = (cart: CartSummary | null) => {
      if (!cancelled) {
        setStored({ identity, cart });
        setLoading(false);
      }
    };
    if (status === "unauthenticated") {
      save(getLocalCart() ?? { items: [] });
      return;
    }
    if (status !== "authenticated" || !user || profileLoading) {
      setLoading(status === "loading" || profileLoading);
      return;
    }
    setLoading(true);
    const sync = async () => {
      if (cancelled) return;
      const local = getLocalCart();
      const items =
        local?.items
          ?.filter((item) => item.productId && item.count > 0)
          .map((item) => ({
            productId: item.productId,
            variantId: item.variantId ?? null,
            count: item.count,
            merge: true,
          })) ?? [];
      if (!items.length) {
        save(user.cart ?? { items: [] });
        return;
      }
      try {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
        if (!response.ok) throw new Error("Cart unavailable");
        const cart: CartSummary = await response.json();
        // Only remove the exact guest snapshot that was merged. Never persist an account cart locally.
        if (JSON.stringify(getLocalCart()) === JSON.stringify(local))
          writeLocalCart(null);
        save(cart);
      } catch {
        save(user.cart ?? { items: [] });
      }
    };
    const run = async () => {
      if (navigator.locks)
        await navigator.locks.request("mh-guest-cart-merge", sync);
      else await sync();
    };
    mergeQueue = mergeQueue.then(run, run);
    return () => {
      cancelled = true;
    };
  }, [identity, status, user, profileLoading]);
  const cart =
    stored?.identity === identity &&
    (status === "authenticated" || status === "unauthenticated")
      ? stored.cart
      : null;
  return (
    <CartContext.Provider value={{ cart, loading, refreshCart, dispatchCart }}>
      {children}
    </CartContext.Provider>
  );
}
