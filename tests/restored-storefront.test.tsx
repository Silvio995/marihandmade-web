import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeMediaCarousel } from "@/components/native/HomeMediaCarousel";
import { CategoryTiles } from "@/components/storefront/CatalogSections";
import Footer from "@/components/native/Footer";
import Header from "@/components/native/nav/parent";
import { homepageEditorialContent } from "@/data/homepage-editorial";
import { category } from "./catalog.fixture";

const mocks = vi.hoisted(() => ({
  play: vi.fn(),
  stop: vi.fn(),
  options: vi.fn(),
  api: {
    scrollNext: vi.fn(),
    scrollPrev: vi.fn(),
    scrollSnapList: vi.fn(() => [0, 1, 2]),
    on: vi.fn(),
    off: vi.fn(),
  },
  logout: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("embla-carousel-react", () => ({
  default: () => [vi.fn(), mocks.api],
}));
vi.mock("embla-carousel-autoplay", () => ({
  default: (options: unknown) => {
    mocks.options(options);
    return { play: mocks.play, stop: mocks.stop };
  },
}));
vi.mock("@/components/native/WishlistButton", () => ({ default: () => null }));
vi.mock("@/state/Cart", () => ({
  useCartContext: () => ({ cart: { items: [{ count: 2 }, { count: 3 }] } }),
}));
vi.mock("@/state/Auth", () => ({
  useAuth: () => ({ status: "authenticated", logout: mocks.logout }),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));
let reduce = false;
let listener: (() => void) | undefined;
beforeEach(() => {
  reduce = false;
  listener = undefined;
  mocks.api.scrollSnapList.mockReturnValue([0, 1, 2]);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      get matches() {
        return reduce;
      },
      addEventListener: (_: string, fn: () => void) => {
        listener = fn;
      },
      removeEventListener: vi.fn(),
    })),
  );
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
const slides = homepageEditorialContent.carousel;
const region = () =>
  screen.getByRole("region", { name: "Fotografie dell’atelier" });

describe("restored photographic carousel", () => {
  it("starts safely and honors initial and live reduced motion for autoplay and manual navigation", () => {
    reduce = true;
    render(<HomeMediaCarousel slides={slides} />);
    expect(mocks.options).toHaveBeenCalledWith(
      expect.objectContaining({ delay: 5200, playOnInit: false }),
    );
    expect(mocks.play).not.toHaveBeenCalled();
    fireEvent.keyDown(region(), { key: "ArrowRight" });
    expect(mocks.api.scrollNext).toHaveBeenCalledWith(true);
    expect(
      screen.getByRole("button", { name: /movimento ridotto/ }),
    ).toBeDisabled();
    act(() => {
      reduce = false;
      listener?.();
    });
    expect(mocks.play).toHaveBeenCalled();
    mocks.play.mockClear();
    act(() => {
      reduce = true;
      listener?.();
    });
    expect(mocks.stop).toHaveBeenCalled();
    expect(mocks.play).not.toHaveBeenCalled();
    expect(region().querySelector('[aria-live="off"]')).toBeInTheDocument();
  });
  it("supports manual buttons and arrow keys, and pauses on hover and focus", () => {
    render(<HomeMediaCarousel slides={slides} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Fotografia successiva" }),
    );
    expect(mocks.api.scrollNext).toHaveBeenCalledWith(false);
    fireEvent.keyDown(region(), { key: "ArrowLeft" });
    expect(mocks.api.scrollPrev).toHaveBeenCalledWith(false);
    mocks.play.mockClear();
    mocks.stop.mockClear();
    fireEvent.mouseEnter(region());
    expect(mocks.stop).toHaveBeenCalled();
    fireEvent.focus(
      screen.getByRole("button", { name: "Fotografia precedente" }),
    );
    fireEvent.mouseLeave(region());
    expect(mocks.play).not.toHaveBeenCalled();
    fireEvent.blur(region(), { relatedTarget: document.body });
    expect(mocks.play).toHaveBeenCalled();
  });
  it("keeps a user pause through hover, focus and preference changes until resume", () => {
    render(<HomeMediaCarousel slides={slides} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Pausa scorrimento automatico" }),
    );
    mocks.play.mockClear();
    fireEvent.mouseEnter(region());
    fireEvent.mouseLeave(region());
    act(() => {
      reduce = true;
      listener?.();
    });
    act(() => {
      reduce = false;
      listener?.();
    });
    expect(mocks.play).not.toHaveBeenCalled();
    const resume = screen.getByRole("button", {
      name: "Riprendi scorrimento automatico",
    });
    expect(resume).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(resume);
    expect(mocks.play).toHaveBeenCalled();
  });
  it("does not rotate zero/one slides or a non-scrollable strip and sanitizes unsafe images", () => {
    const { rerender } = render(<HomeMediaCarousel slides={[]} />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    rerender(
      <HomeMediaCarousel
        slides={[{ ...slides[0], imageUrl: "javascript:unsafe" }]}
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("src", "/brand/logo.jpeg");
    expect(mocks.play).not.toHaveBeenCalled();
    mocks.api.scrollSnapList.mockReturnValue([0]);
    rerender(<HomeMediaCarousel slides={slides.slice(0, 2)} />);
    expect(mocks.play).not.toHaveBeenCalled();
  });
});

describe("restored Backend category and navigation presentation", () => {
  it("preserves absent, empty and arbitrary category identities with encoded routes and safe fallback", () => {
    const { rerender } = render(<CategoryTiles categories={null} />);
    expect(screen.getByRole("status")).toHaveTextContent("temporaneamente");
    rerender(<CategoryTiles categories={[]} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    rerender(
      <CategoryTiles
        categories={[
          {
            ...category,
            title: "Nuova collezione",
            slug: "nuova /&",
            banners: [{ image: "https://unsafe.test/a.jpg" }],
          },
        ]}
      />,
    );
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/categories/nuova%20%2F%26",
    );
    expect(screen.getByRole("img")).toHaveAttribute("src", "/brand/logo.jpeg");
    expect(screen.queryByText("Borse")).not.toBeInTheDocument();
    expect(screen.queryByText("Clutch")).not.toBeInTheDocument();
  });
  it("keeps authenticated logout in the disclosure and returns focus on Escape", async () => {
    render(<Header categories={[{ ...category, slug: "borse /" }]} />);
    expect(
      screen.queryByRole("button", { name: "Logout" }),
    ).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "Apri menu" });
    fireEvent.click(trigger);
    expect(screen.getByRole("link", { name: "Borse" })).toHaveAttribute(
      "href",
      "/categories/borse%20%2F",
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    });
    expect(mocks.logout).toHaveBeenCalledOnce();
    expect(mocks.replace).toHaveBeenCalledWith("/login");
    expect(mocks.refresh).toHaveBeenCalledOnce();
    fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });
  it("keeps local footer destinations same-tab and external socials safely labeled", () => {
    render(<Footer categories={[category]} />);
    for (const link of screen.getAllByRole("link")) {
      if (link.getAttribute("href")?.startsWith("/"))
        expect(link).not.toHaveAttribute("target");
      else {
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
        expect(link).toHaveAccessibleName(/nuova scheda/);
      }
    }
    expect(
      screen.queryByRole("link", { name: /Kit e Filati/ }),
    ).not.toBeInTheDocument();
  });
});
