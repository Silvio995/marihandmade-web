import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  default: new Proxy(
    {},
    {
      get() {
        throw new Error("Web Cart Prisma forbidden");
      },
    },
  ),
}));
import { GET, POST } from "@/app/api/cart/route";
import { getAccountCart, postAccountCart } from "@/lib/client-cart";
import { wireCart } from "./cart.fixture";
const fetchMock = vi.fn();
const operationId = "06f284e0-1124-4d54-9012-77c21e2bb138";
const payload = {
  operations: [
    { action: "adjust" as const, productId: "p", variantId: null, delta: 1 },
  ],
};
const request = (
  body = JSON.stringify(payload),
  extra: Record<string, string> = {},
) =>
  new Request("http://store.test/api/cart", {
    method: "POST",
    headers: {
      Cookie: "mh_session=opaque",
      Origin: "http://store.test",
      "Content-Type": "application/json",
      "Idempotency-Key": operationId,
      "X-User-Id": "attacker",
      ...extra,
    },
    body,
  });
beforeEach(() => {
  vi.stubEnv("MARIHANDMADE_API_URL", "http://backend.test/");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("forwards only approved headers, exact body, status/content type and cookies", async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        error: { code: "CART_CHANGED", message: "Safe conflict" },
      }),
      {
        status: 409,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": "mh_session=renewed; HttpOnly",
        },
      },
    ),
  );
  const response = await POST(request());
  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({
    error: { code: "CART_CHANGED", message: "Safe conflict" },
  });
  expect(response.headers.get("set-cookie")).toContain("renewed");
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("vary")).toBe("Cookie");
  const [url, init] = fetchMock.mock.calls[0];
  expect(url.href).toBe("http://backend.test/api/cart");
  expect(init.body).toBe(JSON.stringify(payload));
  expect(Object.fromEntries(init.headers)).toEqual({
    accept: "application/json",
    "content-type": "application/json",
    cookie: "mh_session=opaque",
    "idempotency-key": operationId,
    origin: "http://store.test",
  });
  expect(init).toMatchObject({
    method: "POST",
    redirect: "error",
    cache: "no-store",
  });
  expect(init.signal).toBeInstanceOf(AbortSignal);
});
it("GET forwards the session without a body or synthesized Origin", async () => {
  fetchMock.mockResolvedValue(Response.json(wireCart()));
  const response = await GET(
    new Request("http://store.test/api/cart", {
      headers: { Cookie: "mh_session=opaque" },
    }),
  );
  expect(response.status).toBe(200);
  expect(fetchMock.mock.calls[0][1].headers.has("origin")).toBe(false);
  expect(fetchMock.mock.calls[0][1].method).toBe("GET");
});
it("rejects untrusted Origin, query parameters and oversized bodies before Backend access", async () => {
  expect(
    (await POST(request("{}", { Origin: "https://evil.test" }))).status,
  ).toBe(403);
  expect(
    (await GET(new Request("http://store.test/api/cart?userId=attacker")))
      .status,
  ).toBe(400);
  expect((await POST(request("x".repeat(65537)))).status).toBe(413);
  expect(fetchMock).not.toHaveBeenCalled();
});
it("retains Backend authentication and validation failures", async () => {
  for (const status of [400, 401, 403, 413, 415, 500]) {
    fetchMock.mockResolvedValue(
      Response.json({ error: { code: "SAFE", message: "Safe" } }, { status }),
    );
    expect((await POST(request())).status).toBe(status);
  }
});
it("returns safe 503 on transport failure and never leaks internals", async () => {
  fetchMock.mockRejectedValue(new Error("private connection credentials"));
  const response = await POST(request());
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain("credentials");
});
it("browser client validates DTOs and preserves the supplied retry identity and payload", async () => {
  fetchMock.mockImplementation(async () => Response.json(wireCart()));
  await postAccountCart(operationId, payload);
  await postAccountCart(operationId, payload);
  expect(
    fetchMock.mock.calls.map(([, init]) => [
      init.headers["Idempotency-Key"],
      JSON.parse(init.body),
    ]),
  ).toEqual([
    [operationId, payload],
    [operationId, payload],
  ]);
  expect(fetchMock.mock.calls[0][1].body).toBe(fetchMock.mock.calls[1][1].body);
  fetchMock.mockResolvedValue(Response.json({ items: [] }));
  await expect(getAccountCart()).rejects.toMatchObject({
    status: 503,
    uncertain: true,
  });
});
it("browser errors remain safe and distinguish rolled-back failures from uncertainty", async () => {
  fetchMock.mockResolvedValue(
    Response.json(
      { error: { code: "CART_QUANTITY_UNAVAILABLE", message: "private SQL" } },
      { status: 409 },
    ),
  );
  await expect(postAccountCart(operationId, payload)).rejects.toMatchObject({
    uncertain: false,
    code: "CART_QUANTITY_UNAVAILABLE",
  });
  fetchMock.mockRejectedValue(new Error("private SQL"));
  await expect(postAccountCart(operationId, payload)).rejects.toMatchObject({
    uncertain: true,
  });
});

it("retains uncertainty on authentication or exhausted concurrency retries", async () => {
  for (const [status, code] of [
    [401, "UNAUTHENTICATED"],
    [403, "ACCOUNT_DISABLED"],
    [409, "CART_CHANGED"],
  ] as const) {
    fetchMock.mockImplementation(async () =>
      Response.json({ error: { code, message: "Safe" } }, { status }),
    );
    await expect(postAccountCart(operationId, payload)).rejects.toMatchObject({
      uncertain: true,
      code,
    });
  }
});
