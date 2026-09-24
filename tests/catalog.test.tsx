vi.mock('@/components/native/nav/user', () => ({ UserNav: () => null }))
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { productDto } from "@/lib/api/contracts";
import { getPrimaryImageUrl, getVariantMinPrice } from "@/lib/product-display";
import { getProductDisplayAvailability } from "@/lib/inventory-availability";
vi.mock("server-only", () => ({}));
vi.mock("@/state/Cart", () => ({ useCartContext: () => ({ cart: null }) }));
import {
  getProducts,
  getProductById,
  getCategories,
  getBrands,
} from "@/lib/api/catalog";
import { GET } from "@/app/api/products/[productId]/route";
import Header from "@/components/native/nav/parent";
import { category, product } from "./catalog.fixture";
const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubEnv("MARIHANDMADE_API_URL", "http://catalog.test");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function response(body: unknown, status = 200) {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), { status }),
  );
}
describe("HTTP catalog boundary", () => {
  it("validates product DTOs and preserves price, image and reserved inventory consumption", async () => {
    response([product]);
    const [dto] = await getProducts();
    expect(dto).toEqual(productDto.parse(product));
    expect(getPrimaryImageUrl(dto)).toBe("/brand/logo.jpeg");
    expect(getVariantMinPrice(dto)).toBe(25);
    expect(getProductDisplayAvailability(dto).availableQuantity).toBe(1);
    expect(fetchMock.mock.calls[0][0].href).toBe(
      "http://catalog.test/api/products",
    );
    expect(fetchMock.mock.calls[0][1].cache).toBe("no-store");
  });
  it("consumes categories and brands as bare arrays", async () => {
    response([category]);
    expect(await getCategories()).toEqual([category]);
    response([product.brand]);
    expect(await getBrands()).toEqual([product.brand]);
  });
  it("accepts empty lists", async () => {
    response([]);
    expect(await getProducts()).toEqual([]);
    response([]);
    expect(await getCategories()).toEqual([]);
  });
  it("encodes identifiers and distinguishes product 404", async () => {
    response({}, 404);
    expect(await getProductById("a/b")).toBeNull();
    expect(fetchMock.mock.calls[0][0].pathname).toBe("/api/products/a%2Fb");
    response({}, 404);
    expect(
      (
        await GET(new Request("http://web.test"), {
          params: { productId: "missing" },
        })
      ).status,
    ).toBe(404);
  });
  it.each([{}, [{ id: "bad" }]])("rejects malformed products", async (body) => {
    response(body);
    await expect(getProducts()).rejects.toThrow("Catalogo temporaneamente");
  });
  it("rejects malformed categories", async () => {
    response([{ title: "Wrong" }]);
    await expect(getCategories()).rejects.toThrow("Catalogo temporaneamente");
  });
  it("sanitizes backend failures and returns 503 instead of 404", async () => {
    fetchMock.mockRejectedValueOnce(new Error("private database detail"));
    await expect(getProducts()).rejects.toThrow("Catalogo temporaneamente");
    response({ error: "private" }, 500);
    const res = await GET(new Request("http://web.test"), {
      params: { productId: "p1" },
    });
    expect(res.status).toBe(503);
    expect(await res.text()).not.toContain("private");
  });
  it("builds category navigation only from supplied DTOs", () => {
    render(<Header categories={[category]} />);
    expect(screen.getAllByRole("link", { name: "Borse" })[0]).toHaveAttribute(
      "href",
      "/categories/borse",
    );
    expect(screen.queryByText("Costumi")).not.toBeInTheDocument();
    expect(screen.queryByText("Filati")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apri menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
