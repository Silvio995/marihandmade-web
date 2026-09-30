import { z } from "zod";
import { getLocalCart, writeLocalCart, CART_TRANSFER_KEY } from "@/lib/cart";
import { cartMutationSchema, CartError } from "@/lib/cart-contracts";
import { postAccountCart } from "@/lib/client-cart";
export class CartTransferError extends Error {}
const transferSchema = z
  .object({
    userId: z.string(),
    operationId: z.string().uuid(),
    snapshot: z.string(),
    payload: cartMutationSchema,
  })
  .strict();
// Preparation, network attempt and acknowledgement share one cross-tab lock.
export async function transferGuestCart(
  userId: string,
  isCurrent: () => boolean,
) {
  if (!navigator.locks) {
    if (getLocalCart()?.items.length || localStorage.getItem(CART_TRANSFER_KEY))
      throw new CartTransferError(
        "Guest cart retained. Automatic transfer is unavailable in this browser.",
      );
    return;
  }
  await navigator.locks.request("mh-guest-cart-merge", async () => {
    if (!isCurrent()) return;
    const saved = localStorage.getItem(CART_TRANSFER_KEY);
    let transfer;
    if (saved) {
      const parsed = transferSchema.safeParse(JSON.parse(saved));
      if (!parsed.success) throw new CartError(409, true);
      transfer = parsed.data;
      if (transfer.userId !== userId)
        throw new CartTransferError(
          "Guest cart transfer belongs to another account. Sign in to that account to recover it.",
        );
    } else {
      const cart = getLocalCart();
      if (!cart?.items.length) return;
      const payload = cartMutationSchema.parse({
        operations: cart.items.map((item) => ({
          action: "adjust",
          productId: item.productId,
          variantId: item.variantId ?? null,
          delta: item.count,
        })),
      });
      transfer = {
        userId,
        operationId: crypto.randomUUID(),
        snapshot: JSON.stringify(cart),
        payload,
      };
      // A failed storage write prevents submitting an operation with no recovery key.
      localStorage.setItem(CART_TRANSFER_KEY, JSON.stringify(transfer));
    }
    if (!isCurrent()) return;
    const result = await postAccountCart(
      transfer.operationId,
      transfer.payload,
    );
    if (result.userId !== userId) throw new CartError(409, true);
    if (JSON.stringify(getLocalCart()) === transfer.snapshot) {
      // Clear the frozen snapshot before deleting its receipt metadata. A crash
      // between these steps is recovered by replaying the original operation ID.
      writeLocalCart(null, true);
    }
    localStorage.removeItem(CART_TRANSFER_KEY);
  });
}
