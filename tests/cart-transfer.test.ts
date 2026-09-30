import { beforeEach, afterEach, expect, it, vi } from "vitest";
const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@/lib/client-cart", () => ({ postAccountCart: post }));
import { transferGuestCart } from "@/lib/cart-transfer";
import { CART_TRANSFER_KEY, getLocalCart, writeLocalCart } from "@/lib/cart";
import { wireCart, webLocks } from "./cart.fixture";
const guest = { items: [{ productId: "p", variantId: "v", count: 2 }] };
beforeEach(() => {
  localStorage.clear();
  post.mockReset();
  post.mockResolvedValue(wireCart());
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: webLocks(),
  });
  writeLocalCart(guest);
});
afterEach(() => {
  localStorage.clear();
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: undefined,
  });
});
it("freezes one transfer and imports once across concurrent tabs", async () => {
  await Promise.all([
    transferGuestCart("user-a", () => true),
    transferGuestCart("user-a", () => true),
  ]);
  expect(post).toHaveBeenCalledTimes(1);
  expect(post.mock.calls[0][0]).toMatch(/^[0-9a-f-]{36}$/);
  expect(post.mock.calls[0][1]).toEqual({
    operations: [
      { action: "adjust", productId: "p", variantId: "v", delta: 2 },
    ],
  });
  expect(getLocalCart()).toBeNull();
  expect(localStorage.getItem(CART_TRANSFER_KEY)).toBeNull();
});
it("retains snapshot and exact key/payload through uncertain response and reload recovery", async () => {
  post.mockRejectedValueOnce(new Error("lost response"));
  await expect(transferGuestCart("user-a", () => true)).rejects.toThrow();
  const stored = localStorage.getItem(CART_TRANSFER_KEY);
  expect(getLocalCart()).toEqual(guest);
  expect(stored).not.toBeNull();
  await transferGuestCart("user-a", () => true);
  expect(post.mock.calls[1]).toEqual(post.mock.calls[0]);
  expect(getLocalCart()).toBeNull();
});
it("fails closed without Web Locks", async () => {
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: undefined,
  });
  await expect(transferGuestCart("user-a", () => true)).rejects.toThrow(
    "unavailable in this browser",
  );
  expect(post).not.toHaveBeenCalled();
  expect(getLocalCart()).toEqual(guest);
});
it("retains the guest snapshot on a definitive inventory rejection", async () => {
  post.mockRejectedValue(new Error("unavailable"));
  await expect(transferGuestCart("user-a", () => true)).rejects.toThrow();
  expect(getLocalCart()).toEqual(guest);
  expect(localStorage.getItem(CART_TRANSFER_KEY)).not.toBeNull();
});
it("prevents another account from claiming a pending transfer", async () => {
  post.mockRejectedValueOnce(new Error("uncertain"));
  await expect(transferGuestCart("user-a", () => true)).rejects.toThrow();
  await expect(transferGuestCart("user-b", () => true)).rejects.toThrow(
    "another account",
  );
  expect(post).toHaveBeenCalledTimes(1);
});
it("prevents edits of the immutable pending snapshot", async () => {
  post.mockRejectedValueOnce(new Error("uncertain"));
  await expect(transferGuestCart("user-a", () => true)).rejects.toThrow();
  expect(() => writeLocalCart({ items: [] })).toThrow("awaiting transfer");
  expect(getLocalCart()).toEqual(guest);
});
it("clears only the exact transferred snapshot and new activity gets a new key", async () => {
  post.mockImplementationOnce(async () => {
    localStorage.setItem(
      "Cart",
      JSON.stringify({ items: [{ productId: "new", count: 1 }] }),
    );
    return wireCart();
  });
  await transferGuestCart("user-a", () => true);
  expect(getLocalCart()?.items[0].productId).toBe("new");
  await transferGuestCart("user-a", () => true);
  expect(post.mock.calls[0][0]).not.toBe(post.mock.calls[1][0]);
});
it("recovers acknowledgement interrupted after snapshot clearing", async () => {
  post.mockRejectedValueOnce(new Error("uncertain"));
  await expect(transferGuestCart("user-a", () => true)).rejects.toThrow();
  writeLocalCart(null, true);
  await transferGuestCart("user-a", () => true);
  expect(post.mock.calls[1]).toEqual(post.mock.calls[0]);
  expect(localStorage.getItem(CART_TRANSFER_KEY)).toBeNull();
});
it("does not submit after account switch while waiting for the lock", async () => {
  await transferGuestCart("user-a", () => false);
  expect(post).not.toHaveBeenCalled();
  expect(getLocalCart()).toEqual(guest);
});
it("does not acknowledge a response belonging to a different account", async () => {
  post.mockResolvedValue(wireCart("user-b"));
  await expect(transferGuestCart("user-a", () => true)).rejects.toThrow();
  expect(getLocalCart()).toEqual(guest);
  expect(localStorage.getItem(CART_TRANSFER_KEY)).not.toBeNull();
});
