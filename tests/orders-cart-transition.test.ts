// @vitest-environment node
import { beforeEach, afterEach, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { POST, GET } from "@/app/api/orders/route";
import { GET as detail } from "@/app/api/orders/[orderId]/route";
import { POST as preview } from "@/app/api/checkout/route";
import { checkoutPreview, orderCreated } from "./checkout-orders.fixture";
const origin = "http://localhost:7777",
  key = "11111111-1111-4111-8111-111111111111",
  fetchMock = vi.fn();
const request = (
  body: unknown = {
    checkoutLines: [{ productId: "p", variantId: null, quantity: 1 }],
  },
  headers: Record<string, string> = {},
  method = "POST",
  path = "orders",
) =>
  new Request(`${origin}/api/${path}`, {
    method,
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      "Idempotency-Key": key,
      Cookie: "mh_session=opaque",
      ...headers,
    },
    ...(method === "GET" ? {} : { body: JSON.stringify(body) }),
  });
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("MARIHANDMADE_API_URL", "http://backend.test");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("forwards only intent and Cookie/actual Origin/UUID without Web persistence", async () => {
  fetchMock.mockResolvedValue(
    Response.json(orderCreated, {
      headers: { "Idempotency-Replayed": "true" },
    }),
  );
  const r = await POST(request());
  expect(r.status).toBe(200);
  expect(await r.json()).toEqual(orderCreated);
  const [url, init] = fetchMock.mock.calls[0];
  expect(url.href).toBe("http://backend.test/api/orders");
  expect(init.headers.get("Cookie")).toBe("mh_session=opaque");
  expect(init.headers.get("Origin")).toBe(origin);
  expect(init.headers.get("Idempotency-Key")).toBe(key);
  expect(init.redirect).toBe("error");
  expect(init.cache).toBe("no-store");
  expect(r.headers.get("idempotency-replayed")).toBe("true");
});
it("preserves guest scope and compatible capability cookies", async () => {
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    "mh_guest_checkout=signed; HttpOnly; Path=/; SameSite=Lax",
  );
  headers.append(
    "Set-Cookie",
    "guest_order_access=capability; HttpOnly; Path=/",
  );
  fetchMock.mockResolvedValue(Response.json(orderCreated, { headers }));
  const r = await POST(request());
  expect(r.headers.get("set-cookie")).toContain("mh_guest_checkout");
  expect(r.headers.get("set-cookie")).toContain("guest_order_access");
  expect(r.headers.get("vary")).toBe("Cookie");
});
it.each(["userId", "price", "payable", "status", "stock"])(
  "rejects client %s",
  async (field) => {
    expect(
      (
        await POST(
          request({
            checkoutLines: [{ productId: "p", quantity: 1 }],
            [field]: "injected",
          }),
        )
      ).status,
    ).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  },
);
it("rejects stale line money", async () => {
  expect(
    (
      await POST(
        request({
          checkoutLines: [{ productId: "p", quantity: 1, unitPrice: 1 }],
        }),
      )
    ).status,
  ).toBe(400);
});
it.each(["null", "https://evil.test"])(
  "rejects untrusted Origin %s",
  async (Origin) => {
    expect((await POST(request(undefined, { Origin }))).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  },
);
it("rejects missing/invalid key, non JSON and excessive body", async () => {
  expect(
    (await POST(request(undefined, { "Idempotency-Key": "bad" }))).status,
  ).toBe(400);
  expect(
    (await POST(request(undefined, { "Content-Type": "text/plain" }))).status,
  ).toBe(415);
  expect((await POST(request({ padding: "x".repeat(65536) }))).status).toBe(
    413,
  );
});
it.each([401, 404, 409, 429])(
  "maps safe upstream status %s without exposing messages",
  async (status) => {
    const code =
      status === 401
        ? "UNAUTHENTICATED"
        : status === 404
          ? "NOT_FOUND"
          : status === 409
            ? "CART_CHANGED"
            : "RATE_LIMITED";
    fetchMock.mockResolvedValue(
      Response.json(
        { error: { code, message: "secret internal detail" } },
        { status },
      ),
    );
    const r = await POST(request());
    expect(r.status).toBe(status);
    expect(await r.text()).not.toContain("secret internal");
  },
);
it.each(["network", "raw", "malformed", "204", "user"])(
  "unavailable upstream %s is safe 503",
  async (mode) => {
    if (mode === "network") fetchMock.mockRejectedValue(new Error("SECRET"));
    else if (mode === "raw")
      fetchMock.mockResolvedValue(new Response("SECRET", { status: 500 }));
    else if (mode === "204")
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    else
      fetchMock.mockResolvedValue(
        Response.json(
          mode === "user"
            ? { ...orderCreated, user: { passwordHash: "SECRET" } }
            : {},
        ),
      );
    const r = await POST(request());
    expect(r.status).toBe(503);
    expect(await r.text()).not.toContain("SECRET");
  },
);
it("checkout forwards strict preview with no monetary input", async () => {
  fetchMock.mockResolvedValue(Response.json(checkoutPreview));
  expect(
    (await preview(request(undefined, {}, "POST", "checkout"))).status,
  ).toBe(200);
});
it("list forwards bounded pagination; detail ownership 404", async () => {
  fetchMock.mockResolvedValue(Response.json({ items: [], nextCursor: null }));
  expect((await GET(request(undefined, {}, "GET"))).status).toBe(200);
  fetchMock.mockResolvedValue(
    Response.json(
      { error: { code: "NOT_FOUND", message: "missing" } },
      { status: 404 },
    ),
  );
  expect(
    (
      await detail(request(undefined, {}, "GET"), {
        params: { orderId: "other" },
      })
    ).status,
  ).toBe(404);
});
