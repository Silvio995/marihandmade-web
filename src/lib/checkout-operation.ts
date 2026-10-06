import {
  createdSchema,
  fingerprintData,
  normalizeLines,
  orderBody,
  type Intent,
} from "@/lib/checkout-orders-contracts";
import { z } from "zod";
import { CART_TRANSFER_KEY, getLocalCart, writeLocalCart } from "@/lib/cart";
export const ORDER_OPERATION_KEY = "mh-order-operation-v1";
const stored = z
  .object({
    owner: z.string(),
    key: z.string().uuid(),
    intent: orderBody,
    fingerprint: z.string(),
    sent: z.boolean(),
    result: createdSchema.optional(),
  })
  .strict();
export type OrderOperation = z.infer<typeof stored>;
export function readOperation(owner: string) {
  const raw = localStorage.getItem(ORDER_OPERATION_KEY);
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(
      "Saved checkout is unavailable. Please review before retrying.",
    );
  }
  const parsed = stored.safeParse(value);
  if (!parsed.success)
    throw new Error(
      "Saved checkout is unavailable. Please review before retrying.",
    );
  if (parsed.data.owner !== owner) {
    localStorage.removeItem(ORDER_OPERATION_KEY);
    return null;
  }
  return parsed.data;
}
export function saveOperation(operation: OrderOperation) {
  // Payment capability stays in memory/HttpOnly cookie; replay can renew it.
  const result = operation.result;
  const safeResult = result
    ? (({ guestOrderAccessToken: _capability, ...facts }) => facts)(result)
    : undefined;
  localStorage.setItem(
    ORDER_OPERATION_KEY,
    JSON.stringify({ ...operation, result: safeResult }),
  );
}
export function prepareOperation(owner: string, input: Intent): OrderOperation {
  const intent = orderBody.parse(input);
  intent.checkoutLines = normalizeLines(intent.checkoutLines);
  const fingerprint = fingerprintData(
    owner === "GUEST" ? "GUEST" : "USER",
    intent,
  );
  const prior = readOperation(owner);
  if (prior?.fingerprint === fingerprint) return prior;
  if (prior?.sent && !prior.result)
    throw new Error(
      "Recover your previous checkout before creating another order.",
    );
  const operation = {
    owner,
    key: crypto.randomUUID(),
    intent,
    fingerprint,
    sent: false,
  };
  saveOperation(operation);
  return operation;
}
export async function submitOperation(operation: OrderOperation) {
  operation.sent = true;
  saveOperation(operation);
  const response = await fetch("/api/orders", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": operation.key,
    },
    body: JSON.stringify(operation.intent),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const code = data?.error?.code;
    if (
      [
        "CART_CHANGED",
        "CART_LINE_UNAVAILABLE",
        "CART_QUANTITY_UNAVAILABLE",
        "ADDRESS_UNAVAILABLE",
        "DISCOUNT_UNAVAILABLE",
        "PRICE_UNAVAILABLE",
        "BAD_REQUEST",
      ].includes(code)
    ) {
      operation.sent = false;
      saveOperation(operation);
    }
    throw new Error(
      code === "IDEMPOTENCY_CONFLICT"
        ? "Checkout identity conflicts. Please review your order."
        : code === "GUEST_SCOPE_INVALID"
          ? "Guest checkout identity expired. Keep this request for recovery."
          : "Checkout could not be confirmed. Retry the same request.",
    );
  }
  const result = createdSchema.parse(await response.json());
  operation.result = result;
  saveOperation(operation);
  return result;
}
// Cleanup and its replay marker are persisted together in the Cart JSON value.
// Subsequent guest edits retain markers via writeLocalCart, preventing replay
// cleanup from subtracting quantities a second time (including after a crash).
export function consumeGuestIntent(operation: OrderOperation) {
  if (operation.owner !== "GUEST" || !operation.result)
    throw new Error("Order must be confirmed before guest cleanup");
  if (localStorage.getItem(CART_TRANSFER_KEY))
    throw new Error("Guest Cart transfer must finish before cleanup");
  const cart = getLocalCart() ?? { items: [] };
  const raw = JSON.parse(localStorage.getItem("Cart") ?? "null");
  const completed: string[] = Array.isArray(raw?.checkoutOperations)
    ? raw.checkoutOperations
    : [];
  if (completed.includes(operation.key)) return;
  const remaining = new Map(
    operation.intent.checkoutLines.map((l) => [
      JSON.stringify([l.productId, l.variantId]),
      l.quantity,
    ]),
  );
  const items = cart.items.flatMap((item) => {
    const key = JSON.stringify([item.productId, item.variantId ?? null]),
      requested = remaining.get(key) ?? 0;
    const taken = Math.min(item.count ?? 0, requested);
    remaining.set(key, requested - taken);
    const count = (item.count ?? 0) - taken;
    return count > 0 ? [{ ...item, count }] : [];
  });
  writeLocalCart({
    ...cart,
    items,
    checkoutOperations: [...completed, operation.key],
  } as typeof cart);
}

export function beginNewOperation(owner: string) {
  const prior = readOperation(owner);
  if (prior?.sent && !prior.result)
    throw new Error("Recover the previous checkout first");
  localStorage.removeItem(ORDER_OPERATION_KEY);
}
