import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { wireProduct } from "./cart.fixture";
const { auth, api, replace } = vi.hoisted(() => ({
  auth: {
    status: "authenticated",
    session: { user: { id: "user-a" } },
    refresh: vi.fn(async () => {}),
  },
  api: { get: vi.fn(), add: vi.fn(), remove: vi.fn() },
  replace: vi.fn(),
}));
vi.mock("@/state/Auth", () => ({ useAuth: () => auth }));
vi.mock("@/lib/client-wishlist", () => ({ clientWishlist: api }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/state/User", () => {
  throw new Error("Wishlist must not depend on account summary");
});
vi.mock("@/lib/prisma", () => {
  throw new Error("Wishlist UI must not import Prisma");
});
vi.mock(
  "@/app/(store)/(routes)/products/[productId]/components/cart_button",
  () => ({ default: () => <button>Cart unchanged</button> }),
);
import WishlistPage from "@/app/(store)/(routes)/wishlist/page";
import { WishlistProvider, useWishlist } from "@/state/Wishlist";
import WishlistButton from "@/components/native/WishlistButton";
import CategoryCollection from "@/components/native/CategoryCollection";
import { CatalogProductCard } from "@/components/storefront/CatalogSections";
import { ProductCard } from "@/components/native/ProductGrid";
import { DataSection } from "@/app/(store)/(routes)/products/[productId]/components/data";
import { WishlistError } from "@/lib/wishlist-contracts";
const product = wireProduct({
  id: "p",
  title: "Saved doll",
  variants: [],
  options: [],
});
const item = { productId: "p", visibility: "PUBLIC", product };
const channels: FakeChannel[] = [];
class FakeChannel {
  onmessage: (() => void) | null = null;
  postMessage = vi.fn();
  close = vi.fn();
  constructor(public name: string) {
    channels.push(this);
  }
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { resolve, promise };
}
function Controls() {
  const state = useWishlist();
  return (
    <>
      <output data-testid="membership">
        {[...state.membership].join(",")}
      </output>
      <output data-testid="items">
        {state.items.map((item) => item.productId).join(",")}
      </output>
      <button onClick={() => void state.refresh()}>Refresh Wishlist</button>
      <button
        onClick={() => {
          void state.add("p").catch(() => {});
          void state.add("p").catch(() => {});
        }}
      >
        Double add
      </button>
    </>
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  channels.splice(0);
  auth.status = "authenticated";
  auth.session = { user: { id: "user-a" } };
  api.get.mockResolvedValue({ items: [] });
  api.add.mockResolvedValue(undefined);
  api.remove.mockResolvedValue(undefined);
  vi.stubGlobal("BroadcastChannel", FakeChannel);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("shared Wishlist page, detail and cards", () => {
  it("deduplicates consumer/StrictMode initial reads and shows actual empty state", async () => {
    render(
      <StrictMode>
        <WishlistProvider>
          <WishlistPage />
          <WishlistButton productId="p" />
          <Controls />
        </WishlistProvider>
      </StrictMode>,
    );
    expect(await screen.findByText(/Nessun articolo/)).toBeVisible();
    expect(api.get).toHaveBeenCalledTimes(1);
  });
  it("shows request failure, never false empty, and retries", async () => {
    api.get.mockRejectedValueOnce(new WishlistError());
    render(
      <WishlistProvider>
        <WishlistPage />
      </WishlistProvider>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "temporarily unavailable",
    );
    expect(screen.queryByText(/Nessun articolo/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Try again"));
    expect(await screen.findByText(/Nessun articolo/)).toBeVisible();
  });
  it("synchronizes card/detail/page membership after confirmed add and remove", async () => {
    api.get
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: [item] })
      .mockResolvedValue({ items: [] });
    const { container } = render(
      <WishlistProvider>
        <ProductCard product={product} />
        <DataSection product={product} />
        <WishlistPage />
      </WishlistProvider>,
    );
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: "Add to Wishlist" })[0],
      ).toBeEnabled(),
    );
    for (const button of container.querySelectorAll("button"))
      expect(button.closest("a")).toBeNull();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Add to Wishlist" })[0],
    );
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: "Remove from Wishlist" }),
      ).toHaveLength(3),
    );
    expect(api.add).toHaveBeenCalledWith("p");
    expect(api.add).toHaveBeenCalledTimes(1);
    expect(channels.at(-1)!.postMessage).toHaveBeenCalledWith("invalidate");
    fireEvent.click(
      screen.getAllByRole("button", { name: "Remove from Wishlist" })[1],
    );
    expect(await screen.findByText(/Nessun articolo/)).toBeVisible();
    expect(api.remove).toHaveBeenCalledWith("p");
    expect(
      screen.getAllByRole("button", { name: "Add to Wishlist" }),
    ).toHaveLength(2);
  });
  it("keeps confirmed removal when the following GET fails", async () => {
    api.get
      .mockResolvedValueOnce({ items: [item] })
      .mockRejectedValue(new WishlistError(503));
    render(
      <WishlistProvider>
        <WishlistButton productId="p" />
        <Controls />
      </WishlistProvider>,
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Remove from Wishlist" }),
    );
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByTestId("membership")).toBeEmptyDOMElement(),
    );
    expect(screen.getByTestId("items")).toBeEmptyDOMElement();
    expect(api.remove).toHaveBeenCalledWith("p");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "temporarily unavailable",
    );
    expect(
      screen.getByRole("button", { name: "Add to Wishlist" }),
    ).toHaveAttribute("aria-pressed", "false");
  });
  it("all active card renderers share Product-ID membership with accessible sibling actions", async () => {
    api.get
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValue({ items: [item] });
    const { container } = render(
      <WishlistProvider>
        <ProductCard product={product} />
        <CatalogProductCard product={product} />
        <CategoryCollection
          category={{ title: "Catalogo", heroImage: "/placeholder.jpg" }}
          products={[product]}
          variant="retail"
        />
      </WishlistProvider>,
    );
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: "Add to Wishlist" }),
      ).toHaveLength(3),
    );
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: "Add to Wishlist" })[0],
      ).toBeEnabled(),
    );
    fireEvent.click(
      screen.getAllByRole("button", { name: "Add to Wishlist" })[2],
    );
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: "Remove from Wishlist" }),
      ).toHaveLength(3),
    );
    for (const button of container.querySelectorAll("button"))
      expect(button.closest("a")).toBeNull();
  });
  it("renders and removes unavailable entries without private Product presentation", async () => {
    api.get
      .mockResolvedValueOnce({
        items: [
          { productId: "private-id", visibility: "UNAVAILABLE", product: null },
        ],
      })
      .mockResolvedValue({ items: [] });
    render(
      <WishlistProvider>
        <WishlistPage />
      </WishlistProvider>,
    );
    expect(
      await screen.findByText("This saved product is no longer available."),
    ).toBeVisible();
    expect(screen.queryByText("private-id")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Remove from Wishlist" }),
    );
    expect(await screen.findByText(/Nessun articolo/)).toBeVisible();
    expect(api.remove).toHaveBeenCalledWith("private-id");
  });
  it("per-product pending state prevents double-click writes", async () => {
    const pending = deferred<void>();
    api.add.mockReturnValue(pending.promise);
    api.get
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValue({ items: [item] });
    render(
      <WishlistProvider>
        <WishlistButton productId="p" />
        <Controls />
      </WishlistProvider>,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Add to Wishlist" }),
      ).toBeEnabled(),
    );
    fireEvent.click(screen.getByText("Double add"));
    expect(api.add).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "Add to Wishlist" }),
    ).toBeDisabled();
    await act(async () => pending.resolve());
    expect(
      await screen.findByRole("button", { name: "Remove from Wishlist" }),
    ).toBeEnabled();
  });
  it("clears on logout, does not create guest reads, and redirects through an effect", async () => {
    api.get.mockResolvedValue({ items: [item] });
    const view = render(
      <WishlistProvider>
        <WishlistPage />
        <Controls />
      </WishlistProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("membership")).toHaveTextContent("p"),
    );
    auth.status = "unauthenticated";
    view.rerender(
      <WishlistProvider>
        <WishlistPage />
        <Controls />
      </WishlistProvider>,
    );
    expect(screen.getByTestId("membership")).toBeEmptyDOMElement();
    expect(replace).toHaveBeenCalledWith("/login");
    expect(api.get).toHaveBeenCalledTimes(1);
  });
  it("ignores late old-user reads after account switch", async () => {
    const old = deferred<{ items: (typeof item)[] }>();
    api.get.mockReturnValueOnce(old.promise).mockResolvedValue({ items: [] });
    const view = render(
      <WishlistProvider>
        <WishlistPage />
        <Controls />
      </WishlistProvider>,
    );
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    auth.session = { user: { id: "user-b" } };
    view.rerender(
      <WishlistProvider>
        <WishlistPage />
        <Controls />
      </WishlistProvider>,
    );
    expect(await screen.findByText(/Nessun articolo/)).toBeVisible();
    await act(async () => old.resolve({ items: [item] }));
    expect(screen.getByTestId("membership")).toBeEmptyDOMElement();
  });
  it("ignores obsolete reads superseded by confirmed mutations", async () => {
    const stale = deferred<{ items: (typeof item)[] }>();
    api.get
      .mockResolvedValueOnce({ items: [] })
      .mockReturnValueOnce(stale.promise)
      .mockResolvedValue({ items: [item] });
    render(
      <WishlistProvider>
        <Controls />
      </WishlistProvider>,
    );
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByText("Refresh Wishlist"));
    fireEvent.click(screen.getByText("Double add"));
    await waitFor(() =>
      expect(screen.getByTestId("membership")).toHaveTextContent("p"),
    );
    await act(async () => stale.resolve({ items: [] }));
    expect(screen.getByTestId("membership")).toHaveTextContent("p");
  });
  it("ignores old-user mutations, including switch away and back", async () => {
    const old = deferred<void>();
    api.add.mockReturnValue(old.promise);
    const view = render(
      <WishlistProvider>
        <Controls />
      </WishlistProvider>,
    );
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByText("Double add"));
    auth.session = { user: { id: "user-b" } };
    view.rerender(
      <WishlistProvider>
        <Controls />
      </WishlistProvider>,
    );
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    auth.session = { user: { id: "user-a" } };
    view.rerender(
      <WishlistProvider>
        <Controls />
      </WishlistProvider>,
    );
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(3));
    await act(async () => old.resolve());
    expect(screen.getByTestId("membership")).toBeEmptyDOMElement();
    expect(api.get).toHaveBeenCalledTimes(3);
  });
  it("refreshes on focus/cross-tab invalidation without stored Wishlist data", async () => {
    const store = vi.spyOn(Storage.prototype, "setItem");
    render(
      <WishlistProvider>
        <Controls />
      </WishlistProvider>,
    );
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(api.get).toHaveBeenCalledTimes(2);
    api.get.mockResolvedValue({ items: [item] });
    await act(async () => channels.at(-1)!.onmessage?.());
    expect(screen.getByTestId("membership")).toHaveTextContent("p");
    expect(store).not.toHaveBeenCalled();
    store.mockRestore();
  });
  it("reconciles lost mutation responses and keeps a visible actionable error", async () => {
    api.add.mockRejectedValue(new WishlistError());
    api.get
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValue({ items: [item] });
    render(
      <WishlistProvider>
        <WishlistButton productId="p" />
        <Controls />
      </WishlistProvider>,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Add to Wishlist" }),
      ).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Add to Wishlist" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "temporarily unavailable",
    );
    await waitFor(() =>
      expect(screen.getByTestId("membership")).toHaveTextContent("p"),
    );
    fireEvent.click(screen.getByText("Try Wishlist again"));
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
  });
  it("shows auth failure without a false login redirect", () => {
    auth.status = "error";
    render(
      <WishlistProvider>
        <WishlistPage />
      </WishlistProvider>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Authentication");
    expect(replace).not.toHaveBeenCalled();
    expect(api.get).not.toHaveBeenCalled();
  });
});
