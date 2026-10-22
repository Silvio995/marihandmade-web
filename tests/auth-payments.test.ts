// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  POST as create,
  GET as status,
} from "@/app/api/orders/[orderId]/pay/paypal/route";
import { POST as capture } from "@/app/api/orders/[orderId]/pay/paypal/capture/route";
import { POST as sync } from "@/app/api/orders/[orderId]/pay/paypal/sync/route";
import { POST as webhook } from "@/app/api/paypal/webhook/route";
import { payment } from "./payment.fixture";
const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  vi.stubEnv("MARIHANDMADE_API_URL", "http://backend.test");
  fetchMock.mockImplementation(async () => Response.json(payment));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function req(
  body: unknown = {},
  extra: Record<string, string> = {},
  method = "POST",
  query = "",
) {
  return new Request("http://shop.test/api/orders/order/pay/paypal" + query, {
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: "http://shop.test",
      Cookie: "mh_session=opaque; guest_order_access=signed",
      "x-user-id": "spoof",
      ...extra,
    },
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
  });
}
const params = { params: { orderId: "order" } };
it.each([create, capture, sync, status])(
  "forwards only credentials and real origin to Backend",
  async (handler) => {
    const response = await handler(
      req(
        {},
        { "x-guest-order-access": "transient-capability" },
        handler === status ? "GET" : "POST",
      ),
      params,
    );
    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(
      /^http:\/\/backend.test\/api\/orders\/order\/pay\/paypal/,
    );
    expect(init.headers.get("cookie")).toContain("mh_session=opaque");
    expect(init.headers.get("x-guest-order-access")).toBe(
      "transient-capability",
    );
    expect(init.headers.get("x-user-id")).toBeNull();
    expect(init.headers.get("origin")).toBe("http://shop.test");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("vary")).toContain("x-guest-order-access");
  },
);
it("correlation token travels in strict capture body; rejects browser amounts/query authority", async () => {
  expect(
    (await capture(req({ providerOrderId: "PROVIDER" }), params)).status,
  ).toBe(200);
  expect(fetchMock.mock.calls[0][1].body).toBe(
    '{"providerOrderId":"PROVIDER"}',
  );
  expect((await create(req({ amount: "1.00" }), params)).status).toBe(400);
  expect(
    (await capture(req({}, {}, "POST", "?token=PROVIDER"), params)).status,
  ).toBe(400);
  expect(
    (await create(req({}, { Origin: "http://evil.test" }), params)).status,
  ).toBe(403);
});
it.each([202, 401, 409, 422, 503])(
  "preserves safe Backend status %s",
  async (code) => {
    fetchMock.mockResolvedValue(
      Response.json(
        code === 202
          ? payment
          : {
              error: {
                code:
                  code === 401
                    ? "GUEST_ORDER_ACCESS_INVALID"
                    : code === 422
                      ? "PAYMENT_DECLINED"
                      : "PAYMENT_UNAVAILABLE",
                message: "PRIVATE",
              },
            },
        { status: code },
      ),
    );
    const r = await create(req(), params);
    expect(r.status).toBe(code);
    expect(await r.text()).not.toContain("PRIVATE");
    if (code === 202) expect(r.headers.get("retry-after")).toBe("5");
  },
);
it.each(["malformed", "redirect", "oversize", "private-error"])(
  "fails safely for %s upstream",
  async (mode) => {
    fetchMock.mockResolvedValue(
      mode === "malformed"
        ? Response.json({ isPaid: true })
        : mode === "redirect"
          ? Response.json({
              ...payment,
              payment: {
                ...payment.payment,
                approvalUrl: "https://evil.test/",
              },
            })
          : mode === "oversize"
            ? new Response("x".repeat(65537), {
                headers: { "Content-Type": "application/json" },
              })
            : new Response("PRIVATE", { status: 500 }),
    );
    const r = await create(req(), params);
    expect(r.status).toBe(503);
    expect(await r.text()).not.toContain("PRIVATE");
  },
);
it("temporary webhook relay preserves raw body/signatures without customer credentials", async () => {
  fetchMock.mockResolvedValue(Response.json({ acknowledged: true }));
  const body = '{ "event_type": "PAYMENT.CAPTURE.COMPLETED" }';
  const headers = {
    "Content-Type": "application/json",
    "paypal-transmission-id": "id",
    "paypal-transmission-time": "time",
    "paypal-transmission-sig": "sig",
    "paypal-cert-url": "https://provider.test/cert",
    "paypal-auth-algo": "algo",
    Cookie: "mh_session=private",
  };
  const r = await webhook(
    new Request("http://shop.test/api/paypal/webhook", {
      method: "POST",
      headers,
      body,
    }),
  );
  expect(r.status).toBe(200);
  expect(fetchMock.mock.calls[0][1].body).toBe(body);
  expect(fetchMock.mock.calls[0][1].headers.get("cookie")).toBeNull();
});
