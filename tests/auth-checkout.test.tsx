import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const { auth } = vi.hoisted(() => ({
  auth: { authenticated: false, loading: false, error: false },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/hooks/useAuthentication", () => ({ useAuthenticated: () => auth }));
vi.mock("@/state/Cart", () => ({
  useCartContext: () => ({
    loading: false,
    cart: { items: [{ productId: "p", count: 1 }] },
  }),
}));
import Checkout from "@/app/(store)/checkout/page";
import { getLocalCart } from "@/lib/cart";
const fetchMock = vi.fn();
beforeEach(() => {
  auth.authenticated = false;
  auth.loading = false;
  auth.error = false;
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it.each(["loading", "error"] as const)(
  "prevents guest checkout during auth %s",
  (state) => {
    auth[state] = true;
    render(<Checkout />);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(fetchMock).not.toHaveBeenCalled();
  },
);
it("preserves guest order fields and passes independent capability to PayPal", async () => {
  const lines = [
    {
      productId: "p",
      variantId: null,
      quantity: 1,
      unitPrice: 12,
      subtotal: 12,
    },
  ];
  fetchMock
    .mockResolvedValueOnce(Response.json({ lines, isCheckoutReady: true }))
    .mockResolvedValueOnce(
      Response.json({
        id: "guest-order",
        guestOrderAccessToken: "signed-capability",
      }),
    )
    .mockResolvedValueOnce(
      new Response("Payment temporarily unavailable", { status: 503 }),
    );
  render(<Checkout />);
  fireEvent.change(screen.getByLabelText("Nome"), {
    target: { value: "Guest" },
  });
  fireEvent.change(screen.getByLabelText("Cognome"), {
    target: { value: "Customer" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "guest@example.test" },
  });
  fireEvent.click(screen.getByText("Completa ordine come ospite"));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  const order = JSON.parse(fetchMock.mock.calls[1][1].body);
  expect(order.guest).toEqual({
    email: "guest@example.test",
    firstName: "Guest",
    lastName: "Customer",
  });
  expect(order.checkoutLines).toEqual(lines);
  expect(order.userId).toBeUndefined();
  expect(fetchMock.mock.calls[2][1].headers).toEqual({
    "x-guest-order-access": "signed-capability",
  });
  expect(await screen.findByText("Riprova PayPal")).toBeVisible();
});
it("retires old locally persisted account cart without discarding a real guest cart", () => {
  localStorage.setItem(
    "Cart",
    JSON.stringify({
      userId: "previous-account",
      items: [{ productId: "private", count: 1 }],
    }),
  );
  expect(getLocalCart()).toBeNull();
  localStorage.setItem(
    "Cart",
    JSON.stringify({ items: [{ productId: "guest", count: 1 }] }),
  );
  expect(getLocalCart()?.items[0].productId).toBe("guest");
});
