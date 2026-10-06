import { beforeEach, afterEach, it, expect, vi } from "vitest";
import {
  readOperation,
  prepareOperation,
  submitOperation,
  consumeGuestIntent,
  beginNewOperation,
  ORDER_OPERATION_KEY,
} from "@/lib/checkout-operation";
import { orderBody } from "@/lib/checkout-orders-contracts";
import { getLocalCart, writeLocalCart, CART_TRANSFER_KEY } from "@/lib/cart";
import { orderCreated } from "./checkout-orders.fixture";
const input = () =>
  orderBody.parse({
    checkoutLines: [{ productId: "p", quantity: 1 }],
    guest: { email: "G@example.test", firstName: "G", lastName: "C" },
  });
const fetchMock = vi.fn();
beforeEach(() => {
  localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});
it("same normalized intent retains key across duplicate prepare and refresh", () => {
  const first = prepareOperation("GUEST", input());
  expect(prepareOperation("GUEST", input()).key).toBe(first.key);
  expect(readOperation("GUEST")?.key).toBe(first.key);
});
it("changed deliberate intent uses new key before submission", () => {
  const first = prepareOperation("GUEST", input());
  const next = input();
  next.checkoutLines[0].quantity = 2;
  expect(prepareOperation("GUEST", next).key).not.toBe(first.key);
});
it("ambiguous response keeps exact key/body for refresh retry", async () => {
  fetchMock.mockRejectedValueOnce(new Error("lost"));
  const first = prepareOperation("GUEST", input());
  await expect(submitOperation(first)).rejects.toThrow("lost");
  const recovered = readOperation("GUEST")!;
  expect(recovered.sent).toBe(true);
  fetchMock.mockResolvedValueOnce(Response.json(orderCreated));
  await submitOperation(recovered);
  expect(fetchMock.mock.calls[0][1].headers["Idempotency-Key"]).toBe(
    fetchMock.mock.calls[1][1].headers["Idempotency-Key"],
  );
  expect(fetchMock.mock.calls[0][1].body).toBe(fetchMock.mock.calls[1][1].body);
});
it("unresolved changed intent cannot discard ambiguous operation", async () => {
  fetchMock.mockRejectedValue(new Error("lost"));
  const op = prepareOperation("GUEST", input());
  await expect(submitOperation(op)).rejects.toThrow();
  const changed = input();
  changed.checkoutLines[0].quantity = 2;
  expect(() => prepareOperation("GUEST", changed)).toThrow("Recover");
  expect(() => beginNewOperation("GUEST")).toThrow("Recover");
});
it("account/guest switch invalidates incompatible pending identity", () => {
  prepareOperation(
    "USER:a",
    orderBody.parse({ checkoutLines: input().checkoutLines }),
  );
  expect(readOperation("USER:b")).toBeNull();
  expect(localStorage.getItem(ORDER_OPERATION_KEY)).toBeNull();
  prepareOperation("GUEST", input());
  expect(readOperation("USER:a")).toBeNull();
});
it("confirmed new purchase deliberately obtains fresh key", async () => {
  const op = prepareOperation("GUEST", input());
  fetchMock.mockResolvedValue(Response.json(orderCreated));
  await submitOperation(op);
  beginNewOperation("GUEST");
  expect(prepareOperation("GUEST", input()).key).not.toBe(op.key);
});
it("known transaction rejection permits intent correction; unknown outcome remains sent", async () => {
  const op = prepareOperation("GUEST", input());
  fetchMock.mockResolvedValue(
    Response.json({ error: { code: "CART_CHANGED" } }, { status: 409 }),
  );
  await expect(submitOperation(op)).rejects.toThrow();
  expect(readOperation("GUEST")?.sent).toBe(false);
});
it("guest cleanup subtracts purchased counts and retains additions; replay never subtracts twice", () => {
  localStorage.setItem(
    "Cart",
    JSON.stringify({
      items: [
        { productId: "p", count: 3 },
        { productId: "other", count: 2 },
      ],
    }),
  );
  const op = prepareOperation("GUEST", input());
  op.result = orderCreated;
  consumeGuestIntent(op);
  expect(getLocalCart()?.items).toMatchObject([
    { productId: "p", count: 2 },
    { productId: "other", count: 2 },
  ]);
  writeLocalCart({ items: [{ productId: "p", count: 4 }] } as any);
  op.result = orderCreated;
  consumeGuestIntent(op);
  expect(getLocalCart()?.items[0].count).toBe(4);
});
it("unknown response never cleans guest Cart", async () => {
  localStorage.setItem(
    "Cart",
    JSON.stringify({ items: [{ productId: "p", count: 1 }] }),
  );
  const before = localStorage.getItem("Cart");
  fetchMock.mockRejectedValue(new Error("lost"));
  await expect(
    submitOperation(prepareOperation("GUEST", input())),
  ).rejects.toThrow();
  expect(localStorage.getItem("Cart")).toBe(before);
});
it("pending transfer guard preserves snapshot", () => {
  localStorage.setItem(
    "Cart",
    JSON.stringify({ items: [{ productId: "p", count: 1 }] }),
  );
  localStorage.setItem(CART_TRANSFER_KEY, "pending");
  expect(() =>
    consumeGuestIntent({
      ...prepareOperation("GUEST", input()),
      result: orderCreated,
    }),
  ).toThrow("transfer");
});
it("malformed success remains uncertain rather than authorizing cleanup", async () => {
  const op = prepareOperation("GUEST", input());
  fetchMock.mockResolvedValue(Response.json({ id: "order" }));
  await expect(submitOperation(op)).rejects.toThrow();
  expect(readOperation("GUEST")?.result).toBeUndefined();
  expect(readOperation("GUEST")?.sent).toBe(true);
});

it("cleanup of an empty Cart still marks replay and preserves a later new purchase", () => {
  const operation = prepareOperation("GUEST", input());
  operation.result = orderCreated;
  consumeGuestIntent(operation);
  writeLocalCart({ items: [{ productId: "p", count: 1 }] } as any);
  consumeGuestIntent(operation);
  expect(getLocalCart()?.items[0].count).toBe(1);
});
it("cleanup refuses an unconfirmed operation", () => {
  expect(() => consumeGuestIntent(prepareOperation("GUEST", input()))).toThrow(
    "confirmed",
  );
});

it("persists confirmed creation facts without storing the payment bearer token", async () => {
  fetchMock.mockResolvedValue(
    Response.json({
      ...orderCreated,
      guestOrderAccessToken: "private-capability",
    }),
  );
  const result = await submitOperation(prepareOperation("GUEST", input()));
  expect(result.guestOrderAccessToken).toBe("private-capability");
  expect(localStorage.getItem(ORDER_OPERATION_KEY)).not.toContain(
    "private-capability",
  );
  expect(readOperation("GUEST")?.result?.id).toBe(orderCreated.id);
});
