import {
  CartError,
  cartDtoSchema,
  cartMutationSchema,
  type CartMutation,
} from "@/lib/cart-contracts";
async function read(response: Response) {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new CartError(
      response.status,
      response.status >= 500 ||
        response.status === 401 ||
        response.status === 403 ||
        body?.error?.code === "CART_CHANGED",
      body?.error?.code,
    );
  }
  try {
    return cartDtoSchema.parse(await response.json());
  } catch {
    throw new CartError();
  }
}
export async function getAccountCart() {
  try {
    return await read(
      await fetch("/api/cart", {
        cache: "no-store",
        credentials: "include",
        signal: AbortSignal.timeout(12000),
      }),
    );
  } catch (error) {
    throw error instanceof CartError ? error : new CartError();
  }
}
export async function postAccountCart(
  operationId: string,
  payload: CartMutation,
) {
  try {
    return await read(
      await fetch("/api/cart", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": operationId,
        },
        body: JSON.stringify(cartMutationSchema.parse(payload)),
      }),
    );
  } catch (error) {
    throw error instanceof CartError ? error : new CartError();
  }
}
