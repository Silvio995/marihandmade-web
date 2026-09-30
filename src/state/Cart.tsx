"use client";
import { getLocalCart, writeLocalCart } from "@/lib/cart";
import type { CartSummary } from "@/types/prisma";
import { useAuth } from "@/state/Auth";
import { getAccountCart, postAccountCart } from "@/lib/client-cart";
import {
  CartError,
  cartMessage,
  cartMutationSchema,
  type CartOperation,
} from "@/lib/cart-contracts";
import { transferGuestCart, CartTransferError } from "@/lib/cart-transfer";
import { createContext, useContext, useEffect, useRef, useState } from "react";

type CartContextType = {
  cart: CartSummary;
  loading: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
  dispatchCart: (cart: CartSummary) => Promise<void>;
  mutateCart: (operation: CartOperation) => Promise<void>;
};
const CartContext = createContext<CartContextType>({
  cart: null,
  loading: true,
  error: null,
  refreshCart: async () => {},
  dispatchCart: async () => {},
  mutateCart: async () => {},
});
export const useCartContext = () => useContext(CartContext);
const pendingPrefix = (userId: string) => `mh-cart-operation-v1:${userId}:`;
export function CartContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, session } = useAuth();
  const identity = status === "authenticated" ? session!.user.id : status;
  const latest = useRef(identity);
  const epoch = useRef(0);
  if (latest.current !== identity) epoch.current++;
  latest.current = identity;
  const renderEpoch = epoch.current;
  const alive = useRef(true);
  const version = useRef(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const [stored, setStored] = useState<{
    identity: string;
    cart: CartSummary;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState<{
    identity: string;
    message: string;
  } | null>(null);
  const current = () =>
    alive.current &&
    latest.current === identity &&
    epoch.current === renderEpoch;
  const report = (error: unknown) => {
    if (current())
      setFailure({
        identity,
        message:
          error instanceof CartTransferError
            ? error.message
            : cartMessage(error),
      });
  };
  const save = (cart: CartSummary, ticket: number) => {
    if (current() && ticket === version.current) {
      setStored({ identity, cart });
      setFailure(null);
    }
  };
  const enqueue = (run: () => Promise<void>) => {
    const task = queue.current.then(run, run);
    queue.current = task.catch(() => {});
    return task;
  };
  async function recoverPending() {
    const prefix = pendingPrefix(identity);
    const keys = Object.keys(localStorage)
      .filter((key) => key.startsWith(prefix))
      .sort();
    for (const key of keys) {
      if (!current()) return;
      const payload = cartMutationSchema.parse(
        JSON.parse(localStorage.getItem(key)!),
      );
      try {
        const result = await postAccountCart(key.slice(prefix.length), payload);
        if (result.userId !== identity) throw new CartError(409, true);
        localStorage.removeItem(key);
      } catch (error) {
        if (
          error instanceof CartError &&
          !error.uncertain &&
          error.code !== "IDEMPOTENCY_CONFLICT"
        )
          localStorage.removeItem(key);
        throw error;
      }
    }
  }
  const refreshCart = async () => {
    if (current()) setLoading(true);
    await enqueue(async () => {
      const ticket = ++version.current;
      try {
        if (!current()) return;
        if (status === "unauthenticated")
          save(getLocalCart() ?? { items: [] }, ticket);
        else if (status === "authenticated") {
          // Always recover before reading. An uncertain operation never gets a new ID.
          await recoverPending();
          let transferError: unknown;
          try {
            await transferGuestCart(identity, current);
          } catch (error) {
            transferError = error;
          }
          if (!current()) return;
          const result = await getAccountCart();
          if (result.userId !== identity) throw new CartError(409, true);
          save(result, ticket);
          if (transferError) report(transferError);
        }
      } catch (error) {
        report(error);
      } finally {
        if (current() && ticket === version.current) setLoading(false);
      }
    });
  };
  const dispatchCart = async (cart: CartSummary) => {
    if (!current() || !["authenticated", "unauthenticated"].includes(status))
      return;
    if (status !== "unauthenticated") return;
    ++version.current;
    try {
      writeLocalCart(cart);
      setStored({ identity, cart });
    } catch (error) {
      report(error);
      throw error;
    }
  };
  const mutateCart = async (operation: CartOperation) => {
    if (status !== "authenticated" || !current()) return;
    await enqueue(async () => {
      if (!current()) return;
      const ticket = ++version.current;
      try {
        // Recover old intents before accepting another click with a new ID.
        await recoverPending();
        if (!current()) return;
        const payload = cartMutationSchema.parse({ operations: [operation] });
        const operationId = crypto.randomUUID();
        const key = `${pendingPrefix(identity)}${operationId}`;
        localStorage.setItem(key, JSON.stringify(payload));
        try {
          const result = await postAccountCart(operationId, payload);
          if (result.userId !== identity) throw new CartError(409, true);
          save(result, ticket);
          localStorage.removeItem(key);
        } catch (error) {
          // Definitive rejection rolled back. Keep ambiguous outcomes for same-ID retry.
          if (
            error instanceof CartError &&
            !error.uncertain &&
            error.code !== "IDEMPOTENCY_CONFLICT"
          )
            localStorage.removeItem(key);
          throw error;
        }
      } catch (error) {
        report(error);
        throw error;
      }
    });
  };
  useEffect(() => {
    alive.current = true;
    const requestVersion = version;
    void refreshCart();
    return () => {
      alive.current = false;
      ++requestVersion.current;
    };
    // Auth identity owns the cart lifecycle; profile refresh cannot affect it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity, status]);
  const cart =
    stored?.identity === identity &&
    ["authenticated", "unauthenticated"].includes(status)
      ? stored.cart
      : null;
  const error = failure?.identity === identity ? failure.message : null;
  return (
    <CartContext.Provider
      value={{ cart, loading, error, refreshCart, dispatchCart, mutateCart }}
    >
      {error && (
        <p role="alert">
          {error} <button onClick={() => void refreshCart()}>Retry cart</button>
        </p>
      )}
      {children}
    </CartContext.Provider>
  );
}
