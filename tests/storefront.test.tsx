import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { productDto } from "@/lib/api/contracts";
import { category, product } from "./catalog.fixture";
import {
  CategoryTiles,
  CatalogProductCard,
  FeaturedCatalog,
} from "@/components/storefront/CatalogSections";
import {
  heroSlides,
  homepageHeroSlides,
  featuredEditorial,
} from "@/data/storefront";
import { ValueMarquee } from "@/components/storefront/ValueMarquee";
import { HeroCarousel } from "@/components/storefront/HeroCarousel";
import Header from "@/components/native/nav/parent";
import NewsletterSection from "@/components/native/NewsletterSection";
vi.mock("@/state/Cart", () => ({
  useCartContext: () => ({ cart: { items: [{ count: 2 }] } }),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/categories/borse" }));
const { api } = vi.hoisted(() => ({
  api: {
    selectedScrollSnap: vi.fn(() => 0),
    on: vi.fn(),
    off: vi.fn(),
    scrollNext: vi.fn(),
    scrollPrev: vi.fn(),
    scrollTo: vi.fn(),
  },
}));
vi.mock("embla-carousel-react", () => ({ default: () => [vi.fn(), api] }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
describe("storefront presentation", () => {
  it("renders account actions, search, active backend category and keyboard-operable mobile menu", () => {
    render(<Header categories={[category]} />);
    expect(screen.getByRole("search")).toHaveAttribute("action", "/products");
    expect(screen.getByRole("searchbox")).toHaveAttribute("name", "q");
    for (const label of ["Account", "Wishlist", "Carrello"])
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Borse" })[0]).toHaveAttribute(
      "aria-current",
      "page",
    );
    const trigger = screen.getByRole("button", { name: "Apri menu" });
    fireEvent.click(trigger);
    expect(
      screen.getByRole("navigation", { name: "Categorie mobile" }),
    ).toBeVisible();
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });
  it("renders category tiles from DTOs without inventing categories", () => {
    render(<CategoryTiles categories={[category]} />);
    expect(
      screen.getByRole("link", { name: /Scopri le borse/ }),
    ).toHaveAttribute("href", "/categories/borse");
    expect(screen.queryByText("Filati")).not.toBeInTheDocument();
    expect(screen.queryByText("Bambole")).not.toBeInTheDocument();
  });
  it("renders DTO product title, category, price, image fallback and detail route", () => {
    const dto = productDto.parse({ ...product, images: [] });
    render(<CatalogProductCard product={dto} />);
    expect(screen.getByRole("heading", { name: "Borsa" })).toBeInTheDocument();
    expect(screen.getByText("Borse")).toBeInTheDocument();
    expect(screen.getByText(/25,00/)).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "/images/product-placeholder.svg",
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "/products/borsa");
  });
  it("distinguishes empty featured products from a failed request", () => {
    const { rerender } = render(<FeaturedCatalog products={[]} />);
    expect(screen.getByText(/Nessun prodotto in evidenza/)).toBeInTheDocument();
    rerender(<FeaturedCatalog products={null} />);
    expect(screen.getByRole("status")).toHaveTextContent("temporaneamente");
  });
  it("renders configured hero content and wires carousel controls", () => {
    render(<HeroCarousel slides={heroSlides} />);
    expect(
      screen.getByRole("heading", { name: /Stile unico/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Scopri le borse/ }),
    ).toHaveAttribute("href", "/products");
    fireEvent.click(
      screen.getByRole("button", { name: "Diapositiva successiva" }),
    );
    expect(api.scrollNext).toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Diapositiva precedente" }),
    );
    expect(api.scrollPrev).toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: /Mostra diapositiva 2/ }),
    );
    expect(api.scrollTo).toHaveBeenCalledWith(1);
  });
  it("supports arrow-key carousel navigation without exposing inactive slide links", () => {
    render(<HeroCarousel slides={heroSlides} />);
    const hero = screen.getByRole("region", {
      name: "Ispirazioni MariHandmade",
    });
    fireEvent.keyDown(hero, { key: "ArrowRight" });
    expect(api.scrollNext).toHaveBeenCalled();
    fireEvent.keyDown(hero, { key: "ArrowLeft" });
    expect(api.scrollPrev).toHaveBeenCalled();
    expect(
      screen
        .getAllByRole("link", { hidden: true })
        .filter((link) => link.tabIndex === 0),
    ).toHaveLength(1);
  });
  it("lets users pause and resume the decorative marquee", () => {
    render(<ValueMarquee />);
    const pause = screen.getByRole("button", { name: "Pausa scorrimento" });
    fireEvent.click(pause);
    expect(
      screen.getByRole("button", { name: "Riprendi lo scorrimento" }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(pause);
    expect(
      screen.getByRole("button", { name: "Pausa scorrimento" }),
    ).toHaveAttribute("aria-pressed", "false");
  });
  it("resolves campaign links from backend categories and falls back without a fake Clutch category", () => {
    const categories = [{ ...category, slug: "borse-artigianali" }];
    expect(homepageHeroSlides(categories)[0].cta.href).toBe(
      "/categories/borse-artigianali",
    );
    expect(
      homepageHeroSlides(null).every((slide) => slide.cta.href === "/products"),
    ).toBe(true);
    render(
      <FeaturedCatalog
        products={[productDto.parse(product)]}
        categories={categories}
      />,
    );
    expect(screen.getByRole("heading", { name: "Borsa" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Esplora le borse" }),
    ).toHaveAttribute("href", "/categories/borse-artigianali");
    for (const story of featuredEditorial)
      expect(screen.getByAltText(story.alt)).toHaveAttribute(
        "src",
        story.image,
      );
  });
  it("does not offer a fake newsletter submission", () => {
    render(<NewsletterSection />);
    expect(
      screen.getByRole("button", { name: "Prossimamente" }),
    ).toBeDisabled();
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
