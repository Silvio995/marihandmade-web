import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const { auth } = vi.hoisted(() => ({
  auth: { status: "authenticated", session: { user: { id: "user-a" } } },
}));
vi.mock("@/state/Auth", () => ({ useAuth: () => auth }));
import { CartContextProvider, useCartContext } from "@/state/Cart";
import { wireCart, webLocks } from "./cart.fixture";
const fetchMock = vi.fn();
function Probe() {
  const { cart, loading, refreshCart, mutateCart } = useCartContext();
  return (
    <>
      <output data-testid="cart">{JSON.stringify(cart)}</output>
      <output data-testid="loading">{String(loading)}</output>
      <button onClick={() => void refreshCart()}>Refresh cart</button>
      <button
        onClick={() =>
          void mutateCart({
            action: "adjust",
            productId: "p",
            variantId: null,
            delta: 1,
          }).catch(() => {})
        }
      >
        Plus
      </button>
    </>
  );
}
const mount = () =>
  render(
    <CartContextProvider>
      <Probe />
    </CartContextProvider>,
  );
beforeEach(() => {
  auth.status = "authenticated";
  auth.session = { user: { id: "user-a" } };
  localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: webLocks(),
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});
it("fetches authoritative state and preserves confirmed cart on read failure", async () => {
  fetchMock.mockResolvedValue(
    Response.json(
      wireCart("user-a", [{ productId: "confirmed", count: 2, product: null }]),
    ),
  );
  mount();
  await screen.findByText(/confirmed/);
  fetchMock.mockRejectedValue(new Error("private transport details"));
  fireEvent.click(screen.getByText("Refresh cart"));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "temporarily unavailable",
  );
  expect(screen.getByTestId("cart")).toHaveTextContent("confirmed");
});
it("ignores obsolete reads after switching accounts", async () => {
  let finish!: (value: Response) => void;
  fetchMock.mockImplementation(
    () =>
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
  );
  const view = mount();
  await waitFor(() => expect(finish).toBeDefined());
  auth.session = { user: { id: "user-b" } };
  fetchMock.mockResolvedValue(
    Response.json(
      wireCart("user-b", [{ productId: "b", count: 1, product: null }]),
    ),
  );
  view.rerender(
    <CartContextProvider>
      <Probe />
    </CartContextProvider>,
  );
  await act(async () =>
    finish(
      Response.json(
        wireCart("user-a", [{ productId: "a", count: 1, product: null }]),
      ),
    ),
  );
  await waitFor(() =>
    expect(screen.getByTestId("cart")).toHaveTextContent('"userId":"user-b"'),
  );
  expect(screen.getByTestId("cart")).not.toHaveTextContent('"productId":"a"');
});
it("uncertain adjustment retries exactly once with the same key/payload and no new click", async () => {
  let count = 0;
  const receipts = new Set<string>();
  let uncertain = true;
  fetchMock.mockImplementation(async (_url, init) => {
    if (init?.method === "POST") {
      const key = init.headers["Idempotency-Key"];
      if (!receipts.has(key)) {
        receipts.add(key);
        count++;
      }
      if (uncertain) {
        uncertain = false;
        throw new Error("response lost after commit");
      }
    }
    return Response.json(
      wireCart(
        "user-a",
        count ? [{ productId: "p", count, product: null }] : [],
      ),
    );
  });
  mount();
  await waitFor(() =>
    expect(screen.getByTestId("loading")).toHaveTextContent("false"),
  );
  fireEvent.click(screen.getByText("Plus"));
  await screen.findByRole("alert");
  fireEvent.click(screen.getByText("Retry cart"));
  await waitFor(() =>
    expect(screen.getByTestId("cart")).toHaveTextContent('"count":1'),
  );
  const posts = fetchMock.mock.calls.filter(
    ([, init]) => init?.method === "POST",
  );
  expect(posts).toHaveLength(2);
  expect(posts[0][1].headers).toEqual(posts[1][1].headers);
  expect(posts[0][1].body).toBe(posts[1][1].body);
  expect(receipts.size).toBe(1);
});
it("recovers pending operations after remount without generating another key", async () => {
  fetchMock.mockResolvedValue(Response.json(wireCart()));
  const key = "392d885e-c951-4a8f-82a6-589d8d8e2388";
  const payload = {
    operations: [
      { action: "adjust", productId: "p", variantId: null, delta: 1 },
    ],
  };
  localStorage.setItem(
    `mh-cart-operation-v1:user-a:${key}`,
    JSON.stringify(payload),
  );
  mount();
  await waitFor(() =>
    expect(screen.getByTestId("loading")).toHaveTextContent("false"),
  );
  expect(fetchMock.mock.calls[0][1].headers["Idempotency-Key"]).toBe(key);
  expect(localStorage.getItem(`mh-cart-operation-v1:user-a:${key}`)).toBeNull();
  expect(localStorage.getItem("Cart")).toBeNull();
});
it("guest cart remains local and does not call authenticated Cart", async () => {
  auth.status = "unauthenticated";
  localStorage.setItem(
    "Cart",
    JSON.stringify({ items: [{ productId: "guest", count: 2 }] }),
  );
  mount();
  await screen.findByText(/guest/);
  expect(fetchMock).not.toHaveBeenCalled();
});
it("login recovers an uncertain transfer with exactly the original operation", async () => {
  const guest = { items: [{ productId: "guest", count: 2 }] };
  localStorage.setItem("Cart", JSON.stringify(guest));
  let first = true;
  fetchMock.mockImplementation(async (_url, init) => {
    if (init?.method === "POST" && first) {
      first = false;
      throw new Error("uncertain merge");
    }
    return Response.json(
      wireCart("user-a", [{ productId: "guest", count: 2, product: null }]),
    );
  });
  mount();
  await screen.findByRole("alert");
  expect(JSON.parse(localStorage.getItem("Cart")!)).toEqual(guest);
  fireEvent.click(screen.getByText("Retry cart"));
  await waitFor(() => expect(localStorage.getItem("Cart")).toBe("null"));
  const posts = fetchMock.mock.calls.filter(
    ([, init]) => init?.method === "POST",
  );
  expect(posts[0][1].headers["Idempotency-Key"]).toBe(
    posts[1][1].headers["Idempotency-Key"],
  );
  expect(posts[0][1].body).toBe(posts[1][1].body);
});

it("ignores obsolete mutation responses after account switch", async () => {
  let finish!: (value: Response) => void;
  fetchMock.mockImplementation(async (_url, init) =>
    init?.method === "POST"
      ? new Promise<Response>((resolve) => {
          finish = resolve;
        })
      : Response.json(wireCart(auth.session.user.id)),
  );
  const view = mount();
  await waitFor(() =>
    expect(screen.getByTestId("loading")).toHaveTextContent("false"),
  );
  fireEvent.click(screen.getByText("Plus"));
  await waitFor(() => expect(finish).toBeDefined());
  auth.session = { user: { id: "user-b" } };
  view.rerender(
    <CartContextProvider>
      <Probe />
    </CartContextProvider>,
  );
  await act(async () =>
    finish(
      Response.json(
        wireCart("user-a", [{ productId: "old", count: 1, product: null }]),
      ),
    ),
  );
  await waitFor(() =>
    expect(screen.getByTestId("cart")).toHaveTextContent('"userId":"user-b"'),
  );
  expect(screen.getByTestId("cart")).not.toHaveTextContent('"productId":"old"');
});
it("queues rapid adjustments and refresh without losing loading completion", async () => {
  let count = 0;
  fetchMock.mockImplementation(async (_url, init) => {
    if (init?.method === "POST") count++;
    return Response.json(
      wireCart(
        "user-a",
        count ? [{ productId: "p", count, product: null }] : [],
      ),
    );
  });
  mount();
  await waitFor(() =>
    expect(screen.getByTestId("loading")).toHaveTextContent("false"),
  );
  fireEvent.click(screen.getByText("Plus"));
  fireEvent.click(screen.getByText("Refresh cart"));
  fireEvent.click(screen.getByText("Plus"));
  await waitFor(() =>
    expect(screen.getByTestId("cart")).toHaveTextContent('"count":2'),
  );
  expect(screen.getByTestId("loading")).toHaveTextContent("false");
});

it("ignores an obsolete response even when the user switches away and back", async () => {
  let finishOld!: (value: Response) => void;
  let finishCurrent!: (value: Response) => void;
  fetchMock.mockImplementationOnce(
    () =>
      new Promise<Response>((resolve) => {
        finishOld = resolve;
      }),
  );
  const view = mount();
  await waitFor(() => expect(finishOld).toBeDefined());
  auth.session = { user: { id: "user-b" } };
  view.rerender(
    <CartContextProvider>
      <Probe />
    </CartContextProvider>,
  );
  auth.session = { user: { id: "user-a" } };
  fetchMock.mockImplementation(
    () =>
      new Promise<Response>((resolve) => {
        finishCurrent = resolve;
      }),
  );
  view.rerender(
    <CartContextProvider>
      <Probe />
    </CartContextProvider>,
  );
  await act(async () =>
    finishOld(
      Response.json(
        wireCart("user-a", [
          { productId: "obsolete", count: 999, product: null },
        ]),
      ),
    ),
  );
  await waitFor(() => expect(finishCurrent).toBeDefined());
  expect(screen.getByTestId("cart")).not.toHaveTextContent("obsolete");
  await act(async () =>
    finishCurrent(
      Response.json(
        wireCart("user-a", [{ productId: "current", count: 1, product: null }]),
      ),
    ),
  );
  expect(screen.getByTestId("cart")).toHaveTextContent("current");
});
