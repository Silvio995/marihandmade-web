import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: () => ({ toString: () => "mh_session=opaque" }),
}));
const { backend, db } = vi.hoisted(() => ({
  backend: vi.fn(),
  db: {
    user: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
    address: { findUnique: vi.fn(), create: vi.fn() },
    cart: { findUniqueOrThrow: vi.fn() },
    order: { findUniqueOrThrow: vi.fn() },
  },
}));
vi.mock("@/lib/api/auth", () => ({
  requestBackendAuth: backend,
  AuthUnavailableError: class extends Error {},
}));
vi.mock("@/lib/prisma", () => ({ default: db }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
  notFound: () => {
    throw new Error("not-found");
  },
}));
vi.mock(
  "@/app/(store)/(routes)/profile/addresses/[addressId]/components/address-form",
  () => ({ AddressForm: () => null }),
);
import AddressPage from "@/app/(store)/(routes)/profile/addresses/[addressId]/page";
import { GET as profile } from "@/app/api/profile/route";
import { POST as profileUpdate } from "@/app/api/profile/update/route";
import { POST as addressCreate } from "@/app/api/addresses/route";
import { POST as wishlist } from "@/app/api/wishlist/route";
import { GET as cart } from "@/app/api/cart/route";
import { GET as order } from "@/app/api/orders/[orderId]/route";
import { POST as email } from "@/app/api/subscription/email/route";
import {
  POST as phone,
  DELETE as unsubscribe,
} from "@/app/api/subscription/phone/route";
import { identity, authFailure } from "./auth.fixture";
const req = () =>
  new Request("http://store.test?userId=user-b", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-User-Id": "user-b" },
    body: JSON.stringify({
      userId: "user-b",
      name: "Updated",
      productId: "product",
      address: "Street",
    }),
  });
beforeEach(() => {
  vi.clearAllMocks();
  backend.mockResolvedValue({ status: 200, body: identity });
  db.user.findUniqueOrThrow.mockResolvedValue({});
  db.user.update.mockResolvedValue({ wishlist: [] });
  db.cart.findUniqueOrThrow.mockResolvedValue({ items: [] });
  db.order.findUniqueOrThrow.mockResolvedValue({});
  db.address.create.mockResolvedValue({});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});
describe("owner-scoped transitional Prisma", () => {
  it("profile read/update ignore attacker identity", async () => {
    expect((await profile(req())).status).toBe(200);
    expect(db.user.findUniqueOrThrow.mock.calls[0][0].where).toEqual({
      id: "user-a",
    });
    expect((await profileUpdate(req())).status).toBe(200);
    expect(db.user.update.mock.calls[0][0].where).toEqual({ id: "user-a" });
  });
  it("address creation assigns backend identity", async () => {
    await addressCreate(req());
    expect(db.address.create.mock.calls[0][0].data.userId).toBe("user-a");
  });
  it("wishlist mutations assign backend identity", async () => {
    await wishlist(req());
    expect(db.user.update.mock.calls[0][0].where).toEqual({ id: "user-a" });
  });
  it("cart reads assign backend identity", async () => {
    await cart(req());
    expect(db.cart.findUniqueOrThrow.mock.calls[0][0].where).toEqual({
      userId: "user-a",
    });
  });
  it("order detail assigns backend identity", async () => {
    await order(req(), { params: { orderId: "order-b" } });
    expect(db.order.findUniqueOrThrow.mock.calls[0][0].where).toEqual({
      id: "order-b",
      userId: "user-a",
    });
  });
  it.each([email, phone, unsubscribe])(
    "subscription mutation uses backend ID",
    async (handler) => {
      await handler(req());
      expect(db.user.update.mock.calls[0][0].where).toEqual({ id: "user-a" });
    },
  );
  it("user A cannot SSR-read user B address", async () => {
    db.address.findUnique.mockImplementation(({ where }) =>
      where.userId === "user-b" ? { id: "address-b", userId: "user-b" } : null,
    );
    await expect(
      AddressPage({ params: { addressId: "address-b" } }),
    ).rejects.toThrow("not-found");
    expect(db.address.findUnique).toHaveBeenCalledWith({
      where: { id: "address-b", userId: "user-a" },
    });
  });
  it("own address renders, new address remains usable", async () => {
    db.address.findUnique.mockResolvedValue({
      id: "address-a",
      userId: "user-a",
    });
    expect(
      await AddressPage({ params: { addressId: "address-a" } }),
    ).toBeTruthy();
    db.address.findUnique.mockResolvedValue(null);
    expect(await AddressPage({ params: { addressId: "new" } })).toBeTruthy();
  });
  it("anonymous address SSR redirects before database access", async () => {
    backend.mockResolvedValue({
      status: 401,
      body: authFailure("UNAUTHENTICATED"),
    });
    await expect(
      AddressPage({ params: { addressId: "address-b" } }),
    ).rejects.toThrow("redirect:/login");
    expect(db.address.findUnique).not.toHaveBeenCalled();
  });
  it("backend outage prevents protected data access rather than becoming anonymous", async () => {
    backend.mockRejectedValue(new Error("offline"));
    expect((await profile(req())).status).toBe(500);
    expect(db.user.findUniqueOrThrow).not.toHaveBeenCalled();
    await expect(
      AddressPage({ params: { addressId: "address-a" } }),
    ).rejects.toThrow("offline");
  });
});
