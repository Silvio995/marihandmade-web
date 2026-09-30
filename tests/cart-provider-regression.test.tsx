import { wireCart } from "./cart.fixture";
import { useState } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const { db, auth } = vi.hoisted(() => ({
  auth: { status: "authenticated", session: { user: { id: "user-a" } } },
  db: {
    cart: { upsert: vi.fn(), findUnique: vi.fn() },
    cartItem: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    productVariant: { findFirst: vi.fn() },
    product: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: () => ({ toString: () => "mh_session=opaque" }),
}));
vi.mock("@/state/Auth", () => ({ useAuth: () => auth }));
vi.mock("@/lib/auth", () => ({
  getServerAuthSession: async () => auth.session,
  getCurrentUserId: async () =>
    auth.status === "authenticated" ? auth.session.user.id : null,
}));
vi.mock("@/lib/prisma", () => ({ default: db }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/products/p",
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/components/native/nav/user", () => ({ UserNav: () => null }));
import { UserContextProvider, useUserContext } from "@/state/User";
import { CartContextProvider } from "@/state/Cart";
import Header from "@/components/native/nav/parent";
import CartButton from "@/app/(store)/(routes)/products/[productId]/components/cart_button";
import { DataSection } from "@/app/(store)/(routes)/products/[productId]/components/data";
import CartPage from "@/app/(store)/(routes)/cart/page";
import CheckoutPage from "@/app/(store)/checkout/page";
import {
  POST as prepareCheckout,
  GET as readCheckout,
} from "@/app/api/checkout/route";
import { profileSummarySchema } from "@/lib/profile-addresses-contracts";
import type { ProductWithIncludes } from "@/types/product";

const product = {
  id: "p",
  title: "Smoke test product",
  price: 10,
  stock: 3,
  isAvailable: true,
  variants: [],
  options: [],
} as unknown as ProductWithIncludes;
let items: any[];
let selectedVariantId: string | null;
let catalogProduct: any;
let preparation: any;
let useProductDetail: boolean;
const fetchMock = vi.fn();
function Navigation() {
  const [open, setOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const { refreshUser } = useUserContext();
  return (
    <>
      <Header />
      <button onClick={() => setOpen(true)}>Open cart</button>
      <button onClick={() => setCheckout(true)}>Open checkout</button>
      <button onClick={() => void refreshUser()}>Refresh account</button>
      {checkout ? (
        <CheckoutPage />
      ) : open ? (
        <CartPage />
      ) : useProductDetail ? (
        <DataSection product={catalogProduct} />
      ) : (
        <CartButton
          product={catalogProduct}
          selectedVariantId={selectedVariantId}
        />
      )}
    </>
  );
}
function mount() {
  render(
    <UserContextProvider>
      <CartContextProvider>
        <Navigation />
      </CartContextProvider>
    </UserContextProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  auth.status = "authenticated";
  items = [];
  selectedVariantId = null;
  catalogProduct = { ...product };
  preparation = null;
  useProductDetail = false;
  db.product.findMany.mockImplementation(async () => [catalogProduct]);
  db.productVariant.findFirst.mockImplementation(
    async ({ where }) =>
      catalogProduct.variants.find(
        (v: any) =>
          v.id === where.id && v.productId === where.productId && v.active,
      ) ?? null,
  );
  db.$transaction.mockImplementation(async (run) => {
    const snapshot = structuredClone(items);
    try {
      return await run(db);
    } catch (error) {
      items = snapshot;
      throw error;
    }
  });
  db.cartItem.findFirst.mockImplementation(async () => items[0] ?? null);
  db.cartItem.create.mockImplementation(async ({ data }) => {
    items.push({ ...data, id: "item", product: catalogProduct });
  });
  db.cartItem.update.mockImplementation(async ({ data }) => {
    items[0].count = data.count;
  });
  db.cartItem.deleteMany.mockImplementation(async () => {
    items = [];
  });
  db.cart.findUnique.mockImplementation(async () => ({
    userId: "user-a",
    items,
  }));
  fetchMock.mockImplementation(async (url, init) => {
    // Backend persistence is a synthetic HTTP fixture; Web never uses its Cart delegates.
    if (url instanceof URL && url.pathname === "/api/cart")
      return Response.json(wireCart("user-a", items));
    if (url === "/api/checkout") {
      const response = await prepareCheckout(
        new Request("http://store.test/api/checkout", init),
      );
      preparation = await response.clone().json();
      return response;
    }
    if (url === "/api/addresses")
      return Response.json([
        {
          id: "address-a",
          country: "IRI",
          address: "Saved street",
          city: "City",
          phone: "0",
          postalCode: "001",
          createdAt: "2026-09-29T00:00:00.000Z",
        },
      ]);
    // Stop at the order boundary: no real order or payment request.
    if (url === "/api/orders")
      return new Response("Mock order boundary", { status: 503 });
    if (url === "/api/cart") {
      if (init?.method === "POST") {
        for (const operation of JSON.parse(init.body).operations) {
          const existing = items.find(
            (item) =>
              item.productId === operation.productId &&
              (item.variantId ?? null) === operation.variantId,
          );
          const count =
            operation.action === "remove"
              ? 0
              : Math.max(0, (existing?.count ?? 0) + operation.delta);
          if (!count) items = items.filter((item) => item !== existing);
          else if (existing) existing.count = count;
          else
            items.push({
              id: "item",
              cartId: "user-a",
              productId: operation.productId,
              variantId: operation.variantId,
              count,
              product: catalogProduct,
            });
        }
      }
      return Response.json(wireCart("user-a", items));
    }
    if (url === "/api/profile/summary" || url === "/api/profile")
      return Response.json({
        name: "A",
        phone: null,
        email: null,
        birthday: null,
        addresses: [],
        wishlist: [],
        cart: { userId: "user-a", items },
      });
    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("alert", vi.fn());
  vi.stubEnv("MARIHANDMADE_API_URL", "http://backend.test");
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("persists the added item and preserves explicit account refresh compatibility", async () => {
  mount();
  const add = await screen.findByRole("button", {
    name: /Aggiungi al carrello/,
  });
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  fireEvent.click(add);
  await waitFor(() =>
    expect(screen.getByRole("link", { name: "Carrello" })).toHaveTextContent(
      "1",
    ),
  );
  expect(
    JSON.parse(
      fetchMock.mock.calls.find(
        ([url, init]) => url === "/api/cart" && init?.method === "POST",
      )![1].body,
    ),
  ).toEqual({
    operations: [
      { action: "adjust", productId: "p", variantId: null, delta: 1 },
    ],
  });
  expect(db.cartItem.create).not.toHaveBeenCalled();
  expect(items[0].count).toBe(1);
  fireEvent.click(screen.getByText("Open cart"));
  expect(await screen.findByText(product.title)).toBeVisible();
  expect(screen.queryByText("Your Cart is empty...")).not.toBeInTheDocument();
  expect(
    fetchMock.mock.calls.filter(([url]) =>
      String(url).startsWith("/api/profile"),
    ),
  ).toHaveLength(1);
  fireEvent.click(screen.getByText("Refresh account"));
  expect(await screen.findByText(product.title)).toBeVisible();
  cleanup();
  mount();
  await waitFor(() =>
    expect(screen.getByRole("link", { name: "Carrello" })).toHaveTextContent(
      "1",
    ),
  );
  fireEvent.click(screen.getByText("Open cart"));
  expect(screen.getByText(product.title)).toBeVisible();
});

it("cart quantity updates and removal also update the global badge and totals", async () => {
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: /Aggiungi al carrello/ }),
  );
  await waitFor(() =>
    expect(screen.getByRole("link", { name: "Carrello" })).toHaveTextContent(
      "1",
    ),
  );
  fireEvent.click(screen.getByText("Open cart"));
  const itemCard = screen.getByText(product.title).closest(".col-span-4")!;
  fireEvent.click(itemCard.querySelector(".lucide-plus")!.closest("button")!);
  await waitFor(() =>
    expect(screen.getByRole("link", { name: "Carrello" })).toHaveTextContent(
      "2",
    ),
  );
  expect(db.cartItem.update).not.toHaveBeenCalled();
  expect(
    JSON.parse(
      fetchMock.mock.calls
        .filter(([url, init]) => url === "/api/cart" && init?.method === "POST")
        .at(-1)![1].body,
    ).operations[0].delta,
  ).toBe(1);
  expect(screen.getByText("$20.00")).toBeVisible();
  expect(screen.getByRole("button", { name: "Checkout ospite" })).toBeEnabled();
  fireEvent.click(itemCard.querySelector(".lucide-minus")!.closest("button")!);
  await waitFor(() =>
    expect(screen.getByRole("link", { name: "Carrello" })).toHaveTextContent(
      "1",
    ),
  );
  fireEvent.click(itemCard.querySelector(".lucide-x")!.closest("button")!);
  expect(await screen.findByText("Your Cart is empty...")).toBeVisible();
  expect(items).toEqual([]);
  expect(screen.getByRole("link", { name: "Carrello" })).not.toHaveTextContent(
    "articoli",
  );
  expect(
    screen.getByRole("button", { name: "Checkout ospite" }),
  ).toBeDisabled();
});

it("authenticated Add-to-Cart must render the badge's same item after navigating to Cart", async () => {
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: /Aggiungi al carrello/ }),
  );
  await waitFor(() =>
    expect(screen.getByRole("link", { name: "Carrello" })).toHaveTextContent(
      "1",
    ),
  );
  fireEvent.click(screen.getByText("Open cart"));
  expect(screen.getByText(product.title)).toBeVisible();
  expect(
    fetchMock.mock.calls.filter(([url]) =>
      String(url).startsWith("/api/profile"),
    ),
  ).toHaveLength(1);
});

it("guest navigation renders the locally persisted item with the badge quantity", async () => {
  auth.status = "unauthenticated";
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: /Aggiungi al carrello/ }),
  );
  await waitFor(() =>
    expect(screen.getByRole("link", { name: "Carrello" })).toHaveTextContent(
      "1",
    ),
  );
  fireEvent.click(screen.getByText("Open cart"));
  expect(await screen.findByText(product.title)).toBeVisible();
  expect(db.cartItem.create).not.toHaveBeenCalled();
});

it("summary parsing retains cart/item metadata, variant identity, quantity and wishlist", () => {
  const cart = {
    userId: "user-a",
    items: [
      {
        id: "item",
        productId: "p",
        variantId: "v",
        count: 2,
        product: {
          ...product,
          variants: [{ id: "v", inventory: { quantityOnHand: 3 } }],
        },
      },
    ],
  };
  const summary = {
    name: "A",
    phone: null,
    email: null,
    birthday: null,
    addresses: [],
    wishlist: [product],
    cart,
  };
  expect(profileSummarySchema.parse(summary)).toEqual(summary);
});

async function addAndOpenCheckout() {
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: /Aggiungi al carrello/ }),
  );
  await waitFor(() =>
    expect(screen.getByRole("link", { name: "Carrello" })).toHaveTextContent(
      "1",
    ),
  );
  fireEvent.click(screen.getByText("Open cart"));
  expect(screen.getByText(product.title)).toBeVisible();
  fireEvent.click(screen.getByText("Open checkout"));
  await waitFor(() =>
    expect(screen.getByRole("combobox")).toHaveValue("address-a"),
  );
  expect(screen.getByRole("button", { name: "Completa ordine" })).toBeEnabled();
}

it.each([false, true])(
  "accepts the same persisted purchasable cart through checkout submission (variant=%s)",
  async (hasVariant) => {
    if (hasVariant) {
      selectedVariantId = "v";
      catalogProduct = {
        ...product,
        stock: 0,
        variants: [
          {
            id: "v",
            productId: "p",
            active: true,
            price: 25,
            inventory: {
              quantityOnHand: 3,
              quantityReserved: 2,
              trackQuantity: true,
              allowBackorder: false,
            },
          },
        ],
      };
    }
    await addAndOpenCheckout();
    expect(items[0]).toMatchObject({
      cartId: "user-a",
      productId: "p",
      variantId: selectedVariantId,
      count: 1,
    });
    const persistedResult = await (
      await readCheckout(new Request("http://store.test/api/checkout"))
    ).json();
    expect(persistedResult).toMatchObject({
      itemCount: 1,
      isCheckoutReady: true,
      droppedReasons: [],
      lines: [
        {
          productId: "p",
          variantId: selectedVariantId,
          quantity: 1,
          unitPrice: hasVariant ? 25 : 10,
        },
      ],
    });
    db.cart.findUnique.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Completa ordine" }));
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => url === "/api/orders")).toBe(
        true,
      ),
    );
    expect(preparation).toEqual(persistedResult);
    // Submitted lines take precedence: preparation doesn't reload the account cart.
    expect(db.cart.findUnique).not.toHaveBeenCalled();
    const orderCall = fetchMock.mock.calls.find(
      ([url]) => url === "/api/orders",
    )!;
    expect(JSON.parse(orderCall[1].body)).toMatchObject({
      addressId: "address-a",
      checkoutLines: persistedResult.lines,
    });
    expect(alert).not.toHaveBeenCalledWith(
      "Cart is empty or invalid for checkout",
    );
  },
);

it.each([
  "invalid_or_unpublished_product",
  "inactive_or_mismatched_variant",
  "insufficient_variant_inventory",
  "insufficient_legacy_stock",
])(
  "reproduces the generic empty-cart error before orders/PayPal for %s",
  async (reason) => {
    if (reason.includes("variant")) {
      selectedVariantId = "v";
      catalogProduct = {
        ...product,
        variants: [
          {
            id: "v",
            productId: "p",
            active: true,
            price: 25,
            inventory: { quantityOnHand: 1, quantityReserved: 0 },
          },
        ],
      };
    }
    await addAndOpenCheckout();
    if (reason === "invalid_or_unpublished_product")
      db.product.findMany.mockResolvedValue([]);
    if (reason === "inactive_or_mismatched_variant")
      catalogProduct.variants[0].active = false;
    if (reason === "insufficient_variant_inventory")
      catalogProduct.variants[0].inventory.quantityReserved = 1;
    if (reason === "insufficient_legacy_stock") catalogProduct.stock = 0;
    fireEvent.click(screen.getByRole("button", { name: "Completa ordine" }));
    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith(
        "Cart is empty or invalid for checkout",
      ),
    );
    expect(preparation).toMatchObject({
      lines: [],
      itemCount: 0,
      droppedLineCount: 1,
      droppedReasons: [reason],
    });
    expect(items).toHaveLength(1);
    expect(
      fetchMock.mock.calls.some(
        ([url]) => url === "/api/orders" || String(url).includes("/pay/paypal"),
      ),
    ).toBe(false);
  },
);

function inventoryProduct(available: number) {
  return {
    ...product,
    stock: 999,
    variants: [
      {
        id: "v",
        productId: "p",
        active: true,
        price: 25,
        inventory: {
          quantityOnHand: available + 2,
          quantityReserved: 2,
          trackQuantity: true,
          allowBackorder: false,
        },
      },
    ],
  };
}

it("actual product detail disables an active fully reserved variant; Checkout also rejects it despite legacy stock", async () => {
  useProductDetail = true;
  selectedVariantId = "v";
  catalogProduct = inventoryProduct(0);
  mount();
  const add = await screen.findByRole("button", {
    name: /Aggiungi al carrello/,
  });
  expect(add).toBeDisabled();
  fireEvent.click(add);
  expect(db.cartItem.create).not.toHaveBeenCalled();
  const response = await prepareCheckout(
    new Request("http://store.test/api/checkout", {
      method: "POST",
      body: JSON.stringify({
        lines: [{ productId: "p", variantId: "v", quantity: 1 }],
      }),
    }),
  );
  expect(await response.json()).toMatchObject({
    lines: [],
    droppedReasons: ["insufficient_variant_inventory"],
  });
});

it.each([1, 2, 3])(
  "checkout validates quantity %s against available inventory 2",
  async (quantity) => {
    catalogProduct = inventoryProduct(2);
    const response = await prepareCheckout(
      new Request("http://store.test/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          lines: [{ productId: "p", variantId: "v", quantity }],
        }),
      }),
    );
    expect(await response.json()).toMatchObject(
      quantity <= 2
        ? { itemCount: quantity, isCheckoutReady: true, droppedReasons: [] }
        : {
            itemCount: 0,
            isCheckoutReady: false,
            droppedReasons: ["insufficient_variant_inventory"],
          },
    );
  },
);

it("actual detail blocks a second unit when only one is available", async () => {
  useProductDetail = true;
  selectedVariantId = "v";
  catalogProduct = inventoryProduct(1);
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: /Aggiungi al carrello/ }),
  );
  await waitFor(() =>
    expect(screen.getByRole("link", { name: "Carrello" })).toHaveTextContent(
      "1",
    ),
  );
  const plus = document.querySelector(".lucide-plus")!.closest("button")!;
  expect(plus).toBeDisabled();
  fireEvent.click(plus);
  expect(items[0].count).toBe(1);
  const result = await (
    await readCheckout(new Request("http://store.test/api/checkout"))
  ).json();
  expect(result).toMatchObject({ itemCount: 1, droppedReasons: [] });
});

// Former Web persistence assertions are covered by Backend cart.test.ts and
// real PostgreSQL tests after the Cart domain cutover.

it.each(["trackQuantity", "allowBackorder"])(
  "%s allows uncapped server and detail increases",
  async (field) => {
    catalogProduct = inventoryProduct(0);
    catalogProduct.variants[0].inventory[field] = field === "allowBackorder";
    selectedVariantId = "v";
    useProductDetail = true;
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: /Aggiungi al carrello/ }),
    );
    await waitFor(() => expect(items[0]?.count).toBe(1));
    const plus = document.querySelector(".lucide-plus")!.closest("button")!;
    expect(plus).toBeEnabled();
    fireEvent.click(plus);
    await waitFor(() => expect(items[0].count).toBe(2));
    expect(items[0].count).toBe(2);
  },
);

it("detail reaches three units then Cart blocks four; stale inventory still allows decrement and removal", async () => {
  catalogProduct = inventoryProduct(3);
  selectedVariantId = "v";
  useProductDetail = true;
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: /Aggiungi al carrello/ }),
  );
  for (const count of [1, 2]) {
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Carrello" })).toHaveTextContent(
        String(count),
      ),
    );
    const plus = document.querySelector(".lucide-plus")!.closest("button")!;
    expect(plus).toBeEnabled();
    fireEvent.click(plus);
  }
  await waitFor(() =>
    expect(screen.getByRole("link", { name: "Carrello" })).toHaveTextContent(
      "3",
    ),
  );
  expect(
    document.querySelector(".lucide-plus")!.closest("button"),
  ).toBeDisabled();
  fireEvent.click(screen.getByText("Open cart"));
  expect(
    document.querySelector(".lucide-plus")!.closest("button"),
  ).toBeDisabled();
  catalogProduct.variants[0].inventory.quantityOnHand = 2;
  catalogProduct.variants[0].active = false;
  // Even inactive/depleted variants can be reduced while still overstocked.
  fireEvent.click(document.querySelector(".lucide-minus")!.closest("button")!);
  await waitFor(() => expect(items[0].count).toBe(2));
  expect(
    document.querySelector(".lucide-plus")!.closest("button"),
  ).toBeDisabled();
  fireEvent.click(document.querySelector(".lucide-minus")!.closest("button")!);
  await waitFor(() => expect(items[0].count).toBe(1));
  fireEvent.click(document.querySelector(".lucide-x")!.closest("button")!);
  expect(await screen.findByText("Your Cart is empty...")).toBeVisible();
  expect(items).toEqual([]);
});

it("profile refresh cannot restore an older cart snapshot after a confirmed adjustment", async () => {
  mount();
  fireEvent.click(
    await screen.findByRole("button", { name: /Aggiungi al carrello/ }),
  );
  await waitFor(() =>
    expect(screen.getByRole("link", { name: "Carrello" })).toHaveTextContent(
      "1",
    ),
  );
  const original = fetchMock.getMockImplementation()!;
  fetchMock.mockImplementation((url, init) =>
    url === "/api/profile/summary"
      ? Response.json({
          name: "A",
          phone: null,
          email: null,
          birthday: null,
          addresses: [],
          wishlist: [],
          cart: { items: [] },
        })
      : original(url, init),
  );
  fireEvent.click(screen.getByText("Refresh account"));
  await waitFor(() =>
    expect(
      fetchMock.mock.calls.filter(([url]) => url === "/api/profile/summary"),
    ).toHaveLength(2),
  );
  expect(screen.getByRole("link", { name: "Carrello" })).toHaveTextContent("1");
  fireEvent.click(screen.getByText("Open cart"));
  expect(screen.getByText(product.title)).toBeVisible();
});
