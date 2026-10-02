import { wireProduct, wireCart } from "./cart.fixture";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { db } = vi.hoisted(() => ({
  db: {
    cart: { findUnique: vi.fn() },
    product: { findMany: vi.fn() },
    user: { findUnique: vi.fn() },
    address: { findMany: vi.fn() },
  },
}));
vi.mock("@/lib/prisma", () => ({ default: db }));
import { GET } from "@/app/api/profile/summary/route";
import { identity, authFailure } from "./auth.fixture";
const fetchMock = vi.fn();
const profile = { name: "A", phone: null, email: null, birthday: null };
const addresses = [
  {
    id: "newest",
    country: "IRI",
    address: "Street",
    city: "City",
    phone: "0",
    postalCode: "001",
    createdAt: "2026-09-29T00:00:00.000Z",
  },
];
const cart = wireCart("user-a", [{ productId: "p", count: 2, product: null }]);
const wishlist = [wireProduct({ id: "w", title: "Wish" })];
const wishlistDto = {
  items: [
    { productId: "w", visibility: "PUBLIC", product: wishlist[0] },
    { productId: "hidden", visibility: "UNAVAILABLE", product: null },
  ],
};
const request = () =>
  new Request("http://store.test/api/profile/summary?userId=attacker", {
    headers: { Cookie: "mh_session=opaque", "X-User-Id": "attacker" },
  });
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("MARIHANDMADE_API_URL", "http://backend.test");
  fetchMock.mockImplementation(async (url: URL) =>
    Response.json(
      url.pathname.endsWith("/me")
        ? identity
        : url.pathname.endsWith("/profile")
          ? profile
          : url.pathname.endsWith("/cart")
            ? cart
            : url.pathname.endsWith("/wishlist")
              ? wishlistDto
              : addresses,
    ),
  );
  db.cart.findUnique.mockResolvedValue(cart);
  db.product.findMany.mockResolvedValue(wishlist);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("preserves cart items, wishlist, address IDs/order and profile using only backend session ownership", async () => {
  const response = await GET(request());
  expect(await response.json()).toEqual({
    ...profile,
    addresses,
    cart,
    wishlist,
  });
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(db.cart.findUnique).not.toHaveBeenCalled();
  expect(
    fetchMock.mock.calls.some(([url]) => url.pathname === "/api/cart"),
  ).toBe(true);
  expect(db.product.findMany).not.toHaveBeenCalled();
  expect(
    fetchMock.mock.calls.some(([url]) => url.pathname === "/api/wishlist"),
  ).toBe(true);
  expect(db.user.findUnique).not.toHaveBeenCalled();
  expect(db.address.findMany).not.toHaveBeenCalled();
  for (const [, init] of fetchMock.mock.calls)
    expect(init.headers.get("cookie")).toBe("mh_session=opaque");
});
it("preserves missing cart as null", async () => {
  const original = fetchMock.getMockImplementation()!;
  fetchMock.mockImplementation((url, init) =>
    url.pathname.endsWith("/cart")
      ? Response.json(wireCart())
      : original(url, init),
  );
  expect((await (await GET(request())).json()).cart).toBeNull();
});
it.each([401, 403, 500])(
  "does not access transitional storage when backend /me returns %s",
  async (status) => {
    fetchMock.mockResolvedValue(
      Response.json(authFailure("FAILURE"), { status }),
    );
    expect((await GET(request())).status).toBe(status);
    expect(db.cart.findUnique).not.toHaveBeenCalled();
  },
);
it.each([401, 404, 503])(
  "preserves backend data error %s without empty aggregates",
  async (status) => {
    fetchMock.mockImplementation(async (url: URL) =>
      Response.json(
        url.pathname.endsWith("/me") ? identity : authFailure("FAILURE"),
        { status: url.pathname.endsWith("/me") ? 200 : status },
      ),
    );
    expect((await GET(request())).status).toBe(status);
    expect(db.cart.findUnique).not.toHaveBeenCalled();
  },
);
it("does not expose invalid Backend Wishlist DTOs", async () => {
  const original = fetchMock.getMockImplementation()!;
  fetchMock.mockImplementation((url, init) =>
    url.pathname.endsWith("/wishlist")
      ? Response.json({
          items: [
            {
              productId: "hidden",
              visibility: "PUBLIC",
              product: { metadata: "private" },
            },
          ],
        })
      : original(url, init),
  );
  const response = await GET(request());
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain("Prisma");
});
