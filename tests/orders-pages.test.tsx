import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: () => ({ toString: () => "mh_session=opaque" }),
}));
vi.mock("@/lib/auth", () => ({
  getServerAuthSession: async () => ({ user: { id: "u1" } }),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
  notFound: () => {
    throw new Error("not-found");
  },
}));
import OrdersPage from "@/app/(store)/(routes)/profile/orders/page";
import DetailPage from "@/app/(store)/(routes)/profile/orders/[orderId]/page";
import { readOrder, readOrders } from "@/lib/server-orders";
const summary = {
  id: "o",
  number: 42,
  status: "Pending",
  isPaid: false,
  shippingStatus: "PENDING",
  payable: "19.62",
  createdAt: "2026-10-03T00:00:00.000Z",
};
const detail = {
  ...summary,
  total: "20.00",
  discount: "2.00",
  tax: "1.62",
  shipping: "0.00",
  carrier: null,
  trackingCode: null,
  shippedAt: null,
  contact: { email: null, name: null, phone: null, source: "COMMITTED" },
  items: [
    {
      id: "i",
      productId: "p",
      variantId: null,
      title: "Historical title",
      variantTitle: null,
      sku: "SKU",
      imageUrl: null,
      quantity: 1,
      unitPrice: "20.00",
      unitDiscount: "2.00",
      snapshotSource: "COMMITTED",
    },
  ],
  shippingAddress: {
    country: "IT",
    city: "City",
    address: "Old street",
    postalCode: "001",
    phone: "123",
  },
  addressSource: "COMMITTED",
};
const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("MARIHANDMADE_API_URL", "http://backend.test");
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("history renders HTTP summaries and next page", async () => {
  fetchMock.mockResolvedValue(
    Response.json({ items: [summary], nextCursor: "next" }),
  );
  render(await OrdersPage({ searchParams: {} }));
  expect(screen.getByText("Ordine 42")).toBeVisible();
  expect(screen.getByText("Totale: 19.62")).toBeVisible();
  expect(screen.getByText("Altri ordini")).toHaveAttribute(
    "href",
    "/profile/orders?cursor=next",
  );
  expect(fetchMock.mock.calls[0][1].headers.get("Cookie")).toBe(
    "mh_session=opaque",
  );
  expect(fetchMock.mock.calls[0][1].cache).toBe("no-store");
});
it("detail renders historical snapshot DTOs without live product objects", async () => {
  fetchMock.mockResolvedValue(Response.json(detail));
  render(await DetailPage({ params: { orderId: "o" } }));
  expect(screen.getByText("Historical title")).toBeVisible();
  expect(screen.getByText("Old street")).toBeVisible();
  expect(screen.getByText("SKU: SKU")).toBeVisible();
});
it.each([401, 404])(
  "read ownership status %s preserves navigation semantics",
  async (status) => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          error: {
            code: status === 401 ? "UNAUTHENTICATED" : "NOT_FOUND",
            message: "safe",
          },
        },
        { status },
      ),
    );
    await expect(readOrder("o")).rejects.toThrow(
      status === 401 ? "redirect:/login" : "not-found",
    );
  },
);
it("Backend outage never becomes empty order history", async () => {
  fetchMock.mockRejectedValue(new Error("SECRET"));
  await expect(readOrders()).rejects.toThrow("Unable to complete");
});
it("raw User DTO cannot render", async () => {
  fetchMock.mockResolvedValue(
    Response.json({ ...detail, user: { passwordHash: "SECRET" } }),
  );
  await expect(readOrder("o")).rejects.toThrow("Unable to complete");
});
