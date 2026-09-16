import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { productDto } from "@/lib/api/contracts";
import {
  formatEuro,
  getCatalogCompareAtPrice,
  getPrimaryImageUrl,
  getProductGallery,
  PRODUCT_IMAGE_PLACEHOLDER,
} from "@/lib/product-display";
import { getAvailabilityLabel } from "@/lib/inventory-availability";
import { isSafeImageSrc } from "@/lib/safe-image";
import { category, product } from "./catalog.fixture";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
// Fail if catalog rendering ever imports a direct database client.
vi.mock("@/lib/prisma", () => {
  throw new Error("Catalog must not import Prisma");
});
vi.mock("@/components/storefront/HeroCarousel", () => ({
  HeroCarousel: () => <div>Campagna</div>,
}));
vi.mock(
  "@/app/(store)/(routes)/products/[productId]/components/cart_button",
  () => ({
    default: ({
      disabled,
      selectedVariantId,
    }: {
      disabled: boolean;
      selectedVariantId?: string;
    }) => (
      <button disabled={disabled} data-variant={selectedVariantId}>
        Aggiungi al carrello
      </button>
    ),
  }),
);
import Products from "@/app/(store)/(routes)/products/page";
import CategoryPage from "@/app/(store)/(routes)/categories/[slug]/page";
import ProductPage from "@/app/(store)/(routes)/products/[productId]/page";
import HomePage from "@/app/page";
import CatalogError from "@/app/(store)/(routes)/error";
import { DataSection } from "@/app/(store)/(routes)/products/[productId]/components/data";
import { ProductCard } from "@/components/native/ProductGrid";
import { CatalogProductCard } from "@/components/storefront/CatalogSections";
import { getFeaturedProducts } from "@/actions/get-featured-products";

const fetchMock = vi.fn();
const cloudImage = (id: string, position = 0, isCover = false) => ({
  id,
  position,
  isCover,
  url: `https://res.cloudinary.com/catalog-test/image/upload/${id}.jpg`,
  altText: `${id} foto`,
});
const dto = (changes: Record<string, unknown> = {}) =>
  productDto.parse({ ...product, ...changes });
beforeEach(() => {
  vi.stubEnv("MARIHANDMADE_API_URL", "http://catalog.test");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function response(body: unknown, status = 200) {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), { status }),
  );
}

describe("catalog image and price presentation", () => {
  it("uses cover then position, skips unusable images, and keeps the gallery authoritative", () => {
    const data = dto({
      productImages: [
        cloudImage("later", 9),
        cloudImage("first", 1),
        cloudImage("cover", 5, true),
      ],
    });
    expect(getProductGallery(data).map((i) => i.url)).toEqual(
      ["cover", "first", "later"].map((id) => cloudImage(id).url),
    );
    expect(getPrimaryImageUrl(data)).toBe(cloudImage("cover").url);
    const brokenCover = dto({
      productImages: [
        { ...cloudImage("bad", 0, true), url: "javascript:bad" },
        cloudImage("usable", 2),
      ],
    });
    expect(getPrimaryImageUrl(brokenCover)).toBe(cloudImage("usable").url);
    expect(
      getPrimaryImageUrl(
        dto({
          productImages: [cloudImage("later", 9), cloudImage("first", 1)],
        }),
      ),
    ).toBe(cloudImage("first").url);
  });
  it("uses legacy compatibility images only without usable gallery images, then a neutral local placeholder", () => {
    expect(getPrimaryImageUrl(dto())).toBe("/brand/logo.jpeg");
    expect(getPrimaryImageUrl(dto({ images: [], productImages: [] }))).toBe(
      PRODUCT_IMAGE_PLACEHOLDER,
    );
    expect(
      getPrimaryImageUrl(dto({ images: ["bad", cloudImage("legacy").url] })),
    ).toBe(cloudImage("legacy").url);
    expect(isSafeImageSrc("//untrusted.test/image.jpg")).toBe(false);
    expect(isSafeImageSrc("https://untrusted.test/image.jpg")).toBe(false);
  });
  it("formats euros and never borrows a sale price from a different variant", () => {
    expect(formatEuro(39).replace(/\s/g, " ")).toBe("39,00 €");
    const data = dto({
      variants: [
        { ...product.variants[0], price: 39, compareAtPrice: null },
        { ...product.variants[0], id: "v2", price: 60, compareAtPrice: 75 },
      ],
    });
    expect(getCatalogCompareAtPrice(data)).toBeNull();
    render(<ProductCard product={data} />);
    expect(screen.getByText(/39,00/)).toBeInTheDocument();
    expect(screen.queryByText(/75,00/)).not.toBeInTheDocument();
  });
  it("renders matching compare-at and real cover without seed branding", () => {
    const data = dto({
      brand: { ...product.brand, title: "Phase 1 Seed" },
      productImages: [cloudImage("cover", 0, true)],
      variants: [{ ...product.variants[0], compareAtPrice: 40 }],
    });
    render(<CatalogProductCard product={data} />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      cloudImage("cover").url,
    );
    expect(screen.getByText(/40,00/).tagName).toBe("DEL");
    expect(screen.queryByText("Phase 1 Seed")).not.toBeInTheDocument();
  });
});

describe("server catalog routes over mocked HTTP", () => {
  it("renders backend products, null-slug ID links and the correct product count", async () => {
    response([
      dto({
        slug: null,
        title: "Catalog DTO product",
        brand: { ...product.brand, title: "Phase 1 Seed" },
      }),
    ]);
    render(await Products({}));
    expect(
      screen.getByRole("link", { name: "Catalog DTO product" }),
    ).toHaveAttribute("href", "/products/p1");
    expect(screen.getByText("1 prodotto")).toBeInTheDocument();
    expect(screen.queryByText("Phase 1 Seed")).not.toBeInTheDocument();
  });
  it("searches only fetched backend products", async () => {
    response([
      dto({ title: "Rosa antica" }),
      dto({ id: "p2", title: "Bambola", shortDescription: "Blu" }),
    ]);
    render(await Products({ searchParams: { q: " rosa " } }));
    expect(
      screen.getByRole("link", { name: "Rosa antica" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Bambola" }),
    ).not.toBeInTheDocument();
  });
  it("filters category pages by backend category ID and supports future slugs", async () => {
    const future = {
      ...category,
      id: "future",
      title: "Nuova collezione",
      slug: "nuova-collezione",
    };
    response([future, category]);
    response([
      dto(),
      dto({ id: "p2", title: "Nuova creazione", categories: [future] }),
    ]);
    render(await CategoryPage({ params: { slug: future.slug } }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      future.title,
    );
    expect(
      screen.getByRole("link", { name: "Nuova creazione" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Borsa" }),
    ).not.toBeInTheDocument();
  });
  it("renders a valid empty category", async () => {
    response([category]);
    response([]);
    render(await CategoryPage({ params: { slug: "borse" } }));
    expect(
      screen.getByText("Nessun prodotto disponibile."),
    ).toBeInTheDocument();
  });
  it("returns not-found for an unknown category without querying products", async () => {
    response([category]);
    await expect(CategoryPage({ params: { slug: "missing" } })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("renders empty catalog without substitute products", async () => {
    response([]);
    render(await Products({}));
    expect(screen.getByText("0 prodotti")).toBeInTheDocument();
    expect(
      screen.getByText("Nessun prodotto disponibile."),
    ).toBeInTheDocument();
  });
  it("uses only backend featured flags, including public sold-out products", async () => {
    const featured = dto({
      title: "Featured DTO",
      isAvailable: false,
      variants: [],
      stock: 0,
    });
    response([category]);
    response([
      featured,
      dto({ id: "p2", title: "Non featured", isFeatured: false }),
    ]);
    render(await HomePage());
    expect(
      screen.getByRole("heading", { name: "Featured DTO" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Non featured" }),
    ).not.toBeInTheDocument();
    response([featured]);
    expect(await getFeaturedProducts()).toEqual([featured]);
  });
  it("renders a real empty featured state", async () => {
    response([category]);
    response([dto({ isFeatured: false })]);
    render(await HomePage());
    expect(screen.getByText(/Nessun prodotto in evidenza/)).toBeInTheDocument();
  });
  it("shows homepage unavailable states without fake fallback data", async () => {
    fetchMock.mockRejectedValue(new Error("private connection detail"));
    render(await HomePage());
    expect(screen.getAllByRole("status")).toHaveLength(2);
    expect(
      screen.queryByRole("heading", { name: "Borsa" }),
    ).not.toBeInTheDocument();
  });
  it.each(["products", "category", "detail"])(
    "sends %s backend failures to a sanitized error boundary",
    async (route) => {
      fetchMock.mockRejectedValue(new Error("private connection detail"));
      const request =
        route === "products"
          ? Products({})
          : route === "category"
            ? CategoryPage({ params: { slug: "borse" } })
            : ProductPage({ params: { productId: "p1" } });
      await expect(request).rejects.toThrow(
        "Catalogo temporaneamente non disponibile",
      );
      render(<CatalogError reset={vi.fn()} />);
      expect(screen.getByRole("alert")).toHaveTextContent(
        "temporaneamente non disponibile",
      );
      expect(screen.queryByText(/private/)).not.toBeInTheDocument();
    },
  );
  it("rejects malformed detail DTOs instead of rendering partial sample data", async () => {
    response({ id: "p1", title: "Bad DTO" });
    await expect(ProductPage({ params: { productId: "p1" } })).rejects.toThrow(
      "Catalogo temporaneamente",
    );
  });
});

describe("product detail and variant rendering", () => {
  it("renders a null-slug product by ID, gallery, description, categories and cart UI without Prisma reviews", async () => {
    response(
      dto({
        slug: null,
        title: "Detail DTO",
        description: "Descrizione dal backend",
        shortDescription: "Sintesi dal backend",
        brand: { ...product.brand, title: "Phase 1 Seed" },
        productImages: [cloudImage("cover", 0, true)],
      }),
    );
    render(await ProductPage({ params: { productId: "p1" } }));
    expect(fetchMock.mock.calls[0][0].pathname).toBe("/api/products/p1");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Detail DTO",
    );
    expect(screen.getByText("Descrizione dal backend")).toBeInTheDocument();
    expect(screen.getByText("Sintesi dal backend")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Borse" })).toHaveAttribute(
      "href",
      "/categories/borse",
    );
    expect(screen.getAllByAltText("cover foto")[0]).toHaveAttribute(
      "src",
      cloudImage("cover").url,
    );
    expect(
      screen.getByRole("button", { name: "Aggiungi al carrello" }),
    ).toBeEnabled();
    expect(screen.queryByText("Phase 1 Seed")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("returns not-found for a backend product 404", async () => {
    response({}, 404);
    await expect(
      ProductPage({ params: { productId: "missing" } }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
  it("handles empty variants and never labels zero legacy stock as made-to-order", () => {
    const data = dto({ variants: [], stock: 0 });
    render(<DataSection product={data} />);
    expect(
      screen.getByRole("button", { name: "Aggiungi al carrello" }),
    ).toBeDisabled();
    expect(screen.getAllByText("Esaurito").length).toBeGreaterThan(0);
    expect(screen.queryByText("Su ordinazione")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByText(/20,00/)).toBeInTheDocument();
  });
  it("selects optionless variants and updates actual price and eligibility", () => {
    const data = dto({
      variants: [
        {
          ...product.variants[0],
          title: "Piccola",
          inventory: { ...product.variants[0].inventory, quantityOnHand: 0 },
        },
        { ...product.variants[0], id: "v2", title: "Grande", price: 39 },
      ],
    });
    render(<DataSection product={data} />);
    expect(screen.getByLabelText("Variante")).toHaveValue("v2");
    expect(
      screen.getByRole("button", { name: "Aggiungi al carrello" }),
    ).toHaveAttribute("data-variant", "v2");
    fireEvent.change(screen.getByLabelText("Variante"), {
      target: { value: "v1" },
    });
    expect(
      screen.getByRole("button", { name: "Aggiungi al carrello" }),
    ).toBeDisabled();
  });
  it("preserves option-based selection and handles empty option definitions", () => {
    const option = { id: "color", name: "Colore", position: 0 };
    const red = { id: "red", value: "Rosso", position: 0 };
    const blue = { id: "blue", value: "Blu", position: 1 };
    const data = dto({
      options: [
        { ...option, values: [red, blue] },
        { id: "empty", name: "Vuoto", position: 1, values: [] },
      ],
      variants: [
        {
          ...product.variants[0],
          title: "Rosso",
          optionAssignments: [{ optionValue: { ...red, option } }],
        },
        {
          ...product.variants[0],
          id: "v2",
          title: "Blu",
          price: 39,
          optionAssignments: [{ optionValue: { ...blue, option } }],
        },
      ],
    });
    render(<DataSection product={data} />);
    fireEvent.click(screen.getByRole("button", { name: "Blu" }));
    expect(
      screen.getByRole("button", { name: "Aggiungi al carrello" }),
    ).toHaveAttribute("data-variant", "v2");
    expect(screen.getByText(/39,00/)).toBeInTheDocument();
    expect(screen.queryByText("Vuoto")).not.toBeInTheDocument();
  });
  it("derives labels from inventory and fulfillment without exposing counts", () => {
    expect(getAvailabilityLabel(dto())).toBe("Disponibile");
    const empty = {
      ...product.variants[0],
      inventory: { ...product.variants[0].inventory, quantityOnHand: 2 },
    };
    expect(getAvailabilityLabel(dto({ variants: [empty] }))).toBe("Esaurito");
    expect(
      getAvailabilityLabel(
        dto({
          variants: [
            {
              ...empty,
              inventory: { ...empty.inventory, allowBackorder: true },
            },
          ],
        }),
      ),
    ).toBe("Su ordinazione");
    expect(
      getAvailabilityLabel(dto({ fulfillmentMode: "MADE_TO_ORDER" })),
    ).toBe("Su ordinazione");
    expect(
      getAvailabilityLabel(dto({ variants: [{ ...empty, inventory: null }] })),
    ).toBe("Esaurito");
  });
});
