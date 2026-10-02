import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: () => ({ toString: () => "mh_session=opaque" }),
}));
const { backend, privateBackend, db } = vi.hoisted(() => ({
  backend: vi.fn(),
  privateBackend: vi.fn(),
  db: {
    user: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
    address: { findUnique: vi.fn(), create: vi.fn() },
    cart: { findUniqueOrThrow: vi.fn() },
    order: { findUniqueOrThrow: vi.fn() },
  },
}));
vi.mock("@/lib/api/auth", () => ({
  requestBackendAuth: backend,
  getSetCookies: () => [],
  AuthUnavailableError: class extends Error {},
}));
vi.mock("@/lib/api/profile-addresses", () => ({
  requestBackendPrivate: privateBackend,
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
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": "user-b",
      Origin: "http://store.test",
      Cookie: "mh_session=opaque",
    },
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
  privateBackend.mockImplementation(async () =>
    Response.json({ name: "A", phone: null, email: null, birthday: null }),
  );
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
  it("profile read/update forward session cookie and leave ownership to backend", async () => {
    expect((await profile(req())).status).toBe(200);
    expect((await profileUpdate(req())).status).toBe(200);
    expect(privateBackend.mock.calls[0]).toEqual([
      "/api/profile",
      expect.objectContaining({ cookie: "mh_session=opaque", method: "GET" }),
    ]);
    expect(privateBackend.mock.calls[1]).toEqual([
      "/api/profile",
      expect.objectContaining({ cookie: "mh_session=opaque", method: "PATCH" }),
    ]);
    expect(db.user.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(db.user.update).not.toHaveBeenCalled();
  });
  it("address creation defers identity validation to backend without a Web write", async () => {
    privateBackend.mockResolvedValue(
      Response.json(authFailure("BAD_REQUEST"), { status: 400 }),
    );
    expect((await addressCreate(req())).status).toBe(400);
    expect(privateBackend).toHaveBeenCalledWith(
      "/api/addresses",
      expect.objectContaining({ cookie: "mh_session=opaque" }),
    );
    expect(db.address.create).not.toHaveBeenCalled();
  });
  it("wishlist rejects client ownership without Web Prisma access", async () => {
    expect((await wishlist(req())).status).toBe(400);
    expect(db.user.update).not.toHaveBeenCalled();
  });
  it("cart rejects query ownership injection without Web Prisma access", async () => {
    expect((await cart(req())).status).toBe(400);
    expect(db.cart.findUniqueOrThrow).not.toHaveBeenCalled();
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
    privateBackend.mockResolvedValue(
      Response.json(authFailure("NOT_FOUND"), { status: 404 }),
    );
    await expect(
      AddressPage({ params: { addressId: "address-b" } }),
    ).rejects.toThrow("not-found");
    expect(privateBackend).toHaveBeenCalledWith("/api/addresses/address-b", {
      cookie: "mh_session=opaque",
    });
    expect(db.address.findUnique).not.toHaveBeenCalled();
  });
  it("own address renders, new address remains usable", async () => {
    privateBackend.mockResolvedValue(
      Response.json({
        id: "address-a",
        country: "IRI",
        address: "Street",
        city: "City",
        phone: "012",
        postalCode: "001",
        createdAt: "2026-09-29T00:00:00.000Z",
      }),
    );
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
    privateBackend.mockRejectedValue(new Error("offline"));
    expect((await profile(req())).status).toBe(503);
    expect(db.user.findUniqueOrThrow).not.toHaveBeenCalled();
    await expect(
      AddressPage({ params: { addressId: "address-a" } }),
    ).rejects.toThrow("offline");
  });
});
