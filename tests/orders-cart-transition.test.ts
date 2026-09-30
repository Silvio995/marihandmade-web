import { beforeEach, afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { db, tx, getUserId } = vi.hoisted(() => ({
  getUserId: vi.fn(),
  db: {
    cart: { findUnique: vi.fn() },
    product: { findMany: vi.fn() },
    address: { findFirst: vi.fn() },
    owner: { findMany: vi.fn() },
    notification: { createMany: vi.fn() },
    cartItem: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
  tx: {
    inventoryItem: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    product: { updateMany: vi.fn() },
    order: { create: vi.fn() },
    cartItem: { deleteMany: vi.fn() },
  },
}));
vi.mock("@/lib/auth", () => ({
  getCurrentUserId: getUserId,
  createGuestOrderAccessToken: vi.fn(),
  getGuestOrderAccessCookieOptions: vi.fn(),
  GUEST_ORDER_ACCESS_COOKIE: "guest_order_access",
}));
vi.mock("@/lib/prisma", () => ({ default: db }));
vi.mock("@/lib/email", () => ({
  sendOrderEmail: vi.fn(),
  sendOwnerOrderEmail: vi.fn(),
}));
import { POST } from "@/app/api/orders/route";
const variant = {
  id: "v",
  productId: "p",
  price: 25,
  active: true,
  inventory: {
    quantityOnHand: 4,
    quantityReserved: 2,
    trackQuantity: true,
    allowBackorder: false,
  },
};
const product = {
  id: "p",
  price: 999,
  discount: 0,
  stock: 999,
  isAvailable: true,
  variants: [variant],
};
let state: { items: any[]; orders: any[]; receipts: string[] };
const request = (quantity = 2) =>
  new Request("http://store.test/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      checkoutLines: [
        { productId: "p", variantId: "v", quantity, unitPrice: 1 },
      ],
    }),
  });
beforeEach(() => {
  vi.clearAllMocks();
  getUserId.mockResolvedValue("user-a");
  state = {
    items: [{ productId: "p", variantId: "v", count: 2 }],
    orders: [],
    receipts: ["existing-cart-operation"],
  };
  db.cart.findUnique.mockImplementation(async () => ({
    userId: "user-a",
    user: { email: null },
    items: state.items,
  }));
  db.product.findMany.mockResolvedValue([product]);
  db.owner.findMany.mockResolvedValue([]);
  tx.inventoryItem.findUnique.mockResolvedValue({
    ...variant.inventory,
    variantId: "v",
  });
  tx.inventoryItem.updateMany.mockResolvedValue({ count: 1 });
  tx.order.create.mockImplementation(async ({ data }) => {
    const order = { id: "order", number: 1, userId: "user-a", ...data };
    state.orders.push(order);
    return order;
  });
  tx.cartItem.deleteMany.mockImplementation(async () => {
    state.items = [];
    return { count: 1 };
  });
  db.$transaction.mockImplementation(async (run) => {
    const snapshot = structuredClone(state);
    try {
      return await run(tx);
    } catch (error) {
      state = snapshot;
      throw error;
    }
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});
it("keeps the owner-scoped Prisma Cart read and transactional consumption together with order creation", async () => {
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(db.cart.findUnique.mock.calls[0][0].where).toEqual({
    userId: "user-a",
  });
  expect(tx.cartItem.deleteMany).toHaveBeenCalledWith({
    where: { cartId: "user-a" },
  });
  expect(db.cartItem.deleteMany).not.toHaveBeenCalled();
  expect(db.$transaction).toHaveBeenCalledTimes(1);
  expect(state.items).toEqual([]);
  expect(state.orders).toHaveLength(1);
  expect(state.receipts).toEqual(["existing-cart-operation"]);
});
it("reprices selected variants independently of submitted prices and legacy product stock", async () => {
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(
    tx.order.create.mock.calls[0][0].data.orderItems.create[0],
  ).toMatchObject({ count: 2, price: 25, variant: { connect: { id: "v" } } });
  expect(tx.product.updateMany).not.toHaveBeenCalled();
});
it("retains cart when inventory changes before the order transaction", async () => {
  tx.inventoryItem.findUnique.mockResolvedValue({
    ...variant.inventory,
    quantityReserved: 4,
    variantId: "v",
  });
  expect((await POST(request())).status).toBe(400);
  expect(state.items).toHaveLength(1);
  expect(state.orders).toEqual([]);
  expect(tx.cartItem.deleteMany).not.toHaveBeenCalled();
});
it("rolls back order creation if transactional cart consumption fails", async () => {
  tx.cartItem.deleteMany.mockRejectedValueOnce(
    new Error("simulated transaction failure"),
  );
  expect((await POST(request())).status).toBe(500);
  expect(state.items).toHaveLength(1);
  expect(state.orders).toEqual([]);
  expect(state.receipts).toEqual(["existing-cart-operation"]);
});
it("rejects mismatch without consuming the persisted account cart", async () => {
  expect((await POST(request(1))).status).toBe(409);
  expect(db.$transaction).not.toHaveBeenCalled();
  expect(state.items).toHaveLength(1);
});
