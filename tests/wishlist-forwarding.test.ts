import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { wireProduct } from "./cart.fixture";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => {
  throw new Error("Wishlist HTTP must not import Prisma");
});
import { GET, POST } from "@/app/api/wishlist/route";
import { DELETE } from "@/app/api/wishlist/[productId]/route";
import { clientWishlist } from "@/lib/client-wishlist";
const fetchMock = vi.fn();
const req = (
  method = "GET",
  body?: unknown,
  origin = "http://store.test",
  path = "/api/wishlist",
) =>
  new Request(`http://store.test${path}`, {
    method,
    headers: {
      Cookie: "mh_session=opaque",
      Origin: origin,
      "Content-Type": "application/json",
      "X-User-Id": "attacker",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
beforeEach(() => {
  vi.stubEnv("MARIHANDMADE_API_URL", "http://backend.test");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("GET validates/allowlists DTO and forwards cookie and actual origin only", async () => {
  const product = wireProduct({ id: "p" });
  fetchMock.mockResolvedValue(
    Response.json(
      {
        items: [
          {
            productId: "p",
            visibility: "PUBLIC",
            product: { ...product, metadata: "secret" },
          },
        ],
        user: "secret",
      },
      { headers: { "Set-Cookie": "mh_session=next; Path=/; HttpOnly" } },
    ),
  );
  const response = await GET(req());
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    items: [{ productId: "p", visibility: "PUBLIC", product }],
  });
  expect(response.headers.get("set-cookie")).toContain("mh_session=next");
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("vary")).toBe("Cookie");
  const [url, init] = fetchMock.mock.calls[0];
  expect(url.toString()).toBe("http://backend.test/api/wishlist");
  expect(init.headers.get("cookie")).toBe("mh_session=opaque");
  expect(init.headers.get("origin")).toBe("http://store.test");
  expect(init.headers.get("x-user-id")).toBeNull();
  expect(init).toMatchObject({
    cache: "no-store",
    redirect: "error",
    method: "GET",
  });
  expect(init.signal).toBeTruthy();
});
it("POST forwards only canonical validated fields", async () => {
  fetchMock.mockResolvedValue(Response.json({ productId: "p", present: true }));
  expect((await POST(req("POST", { productId: "p" }))).status).toBe(200);
  expect(fetchMock.mock.calls[0][1].body).toBe('{"productId":"p"}');
});
it.each(["userId", "ownerId", "variantId"])(
  "never forwards ownership/variant field %s",
  async (key) => {
    expect(
      (await POST(req("POST", { productId: "p", [key]: "attacker" }))).status,
    ).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  },
);
it("DELETE forwards ID in fixed path with no body and preserves 204", async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
  const response = await DELETE(req("DELETE"), { params: { productId: "p" } });
  expect(response.status).toBe(204);
  expect(await response.text()).toBe("");
  expect(fetchMock.mock.calls[0][0].pathname).toBe("/api/wishlist/p");
  expect(fetchMock.mock.calls[0][1]).toMatchObject({
    method: "DELETE",
    body: undefined,
  });
});
it("rejects untrusted/missing Origin, invalid bodies, queries and DELETE bodies", async () => {
  for (const origin of ["", "https://evil.test"])
    expect((await POST(req("POST", { productId: "p" }, origin))).status).toBe(
      403,
    );
  expect((await POST(req("POST", { productId: " p" }))).status).toBe(400);
  expect(
    (
      await GET(
        req(
          "GET",
          undefined,
          "http://store.test",
          "/api/wishlist?userId=other",
        ),
      )
    ).status,
  ).toBe(400);
  expect(
    (await DELETE(req("DELETE", {}), { params: { productId: "p" } })).status,
  ).toBe(400);
  expect(
    (
      await POST(
        new Request("http://store.test/api/wishlist", {
          method: "POST",
          headers: {
            Origin: "http://store.test",
            "Content-Type": "text/plain",
          },
          body: "text",
        }),
      )
    ).status,
  ).toBe(415);
  expect(
    (await POST(req("POST", { productId: "x".repeat(4096) }))).status,
  ).toBe(413);
  expect(fetchMock).not.toHaveBeenCalled();
});
it.each([401, 403, 404, 500])(
  "preserves safe Backend error status %s and private caching",
  async (status) => {
    fetchMock.mockResolvedValue(
      Response.json(
        { error: { code: "FAILURE", message: "Safe error" } },
        { status },
      ),
    );
    const response = await GET(req());
    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("no-store");
  },
);
it.each(["offline", "invalid", "mismatched", "duplicate"])(
  "fails closed for %s Backend response",
  async (mode) => {
    if (mode === "offline")
      fetchMock.mockRejectedValue(new Error("private detail"));
    else
      fetchMock.mockResolvedValue(
        Response.json({
          items:
            mode === "invalid"
              ? [{}]
              : mode === "mismatched"
                ? [
                    {
                      productId: "p",
                      visibility: "PUBLIC",
                      product: wireProduct({ id: "other" }),
                    },
                  ]
                : Array(2).fill({
                    productId: "p",
                    visibility: "UNAVAILABLE",
                    product: null,
                  }),
        }),
      );
    const response = await GET(req());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private detail");
  },
);
it("browser client uses explicit add/remove and validates acknowledgments", async () => {
  fetchMock
    .mockResolvedValueOnce(Response.json({ items: [] }))
    .mockResolvedValueOnce(Response.json({ productId: "p", present: true }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  expect(await clientWishlist.get()).toEqual({ items: [] });
  await clientWishlist.add("p");
  await clientWishlist.remove("p");
  expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method])).toEqual(
    [
      ["/api/wishlist", "GET"],
      ["/api/wishlist", "POST"],
      ["/api/wishlist/p", "DELETE"],
    ],
  );
  expect(fetchMock.mock.calls[2][1].body).toBeUndefined();
  fetchMock.mockResolvedValue(
    Response.json({ productId: "other", present: true }),
  );
  await expect(clientWishlist.add("p")).rejects.toMatchObject({ status: 503 });
  fetchMock.mockResolvedValue(Response.json({}, { status: 401 }));
  await expect(clientWishlist.get()).rejects.toMatchObject({ status: 401 });
});
it("Web source has no authenticated Wishlist Prisma persistence", () => {
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.name === "generated"
        ? []
        : entry.isDirectory()
          ? files(join(dir, entry.name))
          : /\.[jt]sx?$/.test(entry.name)
            ? [join(dir, entry.name)]
            : [],
    );
  for (const file of files("src")) {
    const source = readFileSync(file, "utf8");
    expect(source, file).not.toMatch(
      /wishlists\s*:\s*\{\s*some|wishlist\s*:\s*\{\s*(connect|disconnect|include|select)/,
    );
    if (/wishlist/i.test(file))
      expect(source, file).not.toMatch(/@\/lib\/prisma|generated\/client/);
  }
});
