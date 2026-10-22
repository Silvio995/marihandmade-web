import { beforeEach, afterEach, expect, it, vi } from "vitest";
import {
  render,
  cleanup,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { payment, paid } from "./payment.fixture";
const { push, params } = vi.hoisted(() => ({
  push: vi.fn(),
  params: { value: "orderId=order&token=PROVIDER" },
}));
const router = { push };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(params.value),
}));
import { PayPalReturn } from "@/app/pay/paypal/return/page";
import { PaymentStatus } from "@/components/payment-status";
import { requestPayment, startPayPalPayment } from "@/lib/client-payments";
const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  push.mockReset();
  params.value = "orderId=order&token=PROVIDER";
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("client approval redirect and already-paid redirect use Backend result", async () => {
  const location = { href: "" };
  vi.stubGlobal("window", { location });
  fetchMock.mockResolvedValueOnce(Response.json(payment));
  await startPayPalPayment("order", "guest");
  expect(location.href).toBe(payment.payment!.approvalUrl);
  expect(fetchMock.mock.calls[0][1]).toMatchObject({
    body: "{}",
    headers: {
      "x-guest-order-access": "guest",
      "Content-Type": "application/json",
    },
  });
  fetchMock.mockResolvedValueOnce(Response.json(paid));
  await startPayPalPayment("order");
  expect(location.href).toBe("/order-confirmation?orderId=order");
});
it("return captures token in body and navigates only after committed payment", async () => {
  fetchMock.mockResolvedValue(Response.json(paid));
  render(<PayPalReturn />);
  await waitFor(() =>
    expect(push).toHaveBeenCalledWith("/order-confirmation?orderId=order"),
  );
  expect(fetchMock.mock.calls[0][0]).toBe(
    "/api/orders/order/pay/paypal/capture",
  );
  expect(fetchMock.mock.calls[0][1].body).toBe(
    '{"providerOrderId":"PROVIDER"}',
  );
});
it("processing return supports safe retry and remount", async () => {
  fetchMock.mockImplementation(async () =>
    Response.json(
      {
        ...payment,
        payment: { ...payment.payment, state: "PROCESSING", approvalUrl: null },
      },
      { status: 202 },
    ),
  );
  const first = render(<PayPalReturn />);
  await screen.findByText(/still processing/);
  expect(push).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Retry confirmation"));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  first.unmount();
  render(<PayPalReturn />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
});
it.each([401, 422, 503])(
  "return error %s remains truthful and sanitized",
  async (status) => {
    fetchMock.mockResolvedValue(new Response("PRIVATE", { status }));
    render(<PayPalReturn />);
    await screen.findByText(/expired|declined|Unable to confirm/);
    expect(push).not.toHaveBeenCalled();
    expect(screen.queryByText("PRIVATE")).toBeNull();
  },
);
it("missing return params cannot charge", () => {
  params.value = "orderId=order";
  render(<PayPalReturn />);
  expect(screen.getByText(/Missing/)).toBeVisible();
  expect(fetchMock).not.toHaveBeenCalled();
});
it("cancel and direct confirmation show unpaid until Backend says paid", async () => {
  fetchMock
    .mockResolvedValueOnce(Response.json(payment))
    .mockResolvedValueOnce(Response.json(paid));
  render(<PaymentStatus orderId="order" cancelled />);
  await screen.findByText(/approval was cancelled/);
  expect(screen.queryByText(/Payment confirmed/)).toBeNull();
  fireEvent.click(screen.getByText("Check payment status"));
  await screen.findByText(/Payment confirmed/);
  expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
    "/api/orders/order/pay/paypal",
    "/api/orders/order/pay/paypal/sync",
  ]);
});
it("direct navigation without order never invents success", () => {
  render(<PaymentStatus cancelled={false} />);
  expect(screen.getByText(/Select an order/)).toBeVisible();
  expect(fetchMock).not.toHaveBeenCalled();
});
it("client rejects forged approval hosts and wrong order response", async () => {
  fetchMock.mockResolvedValueOnce(
    Response.json({
      ...payment,
      payment: { ...payment.payment, approvalUrl: "https://evil.test" },
    }),
  );
  await expect(requestPayment("order", "create")).rejects.toThrow();
  fetchMock.mockResolvedValueOnce(Response.json({ ...paid, orderId: "other" }));
  await expect(requestPayment("order", "capture")).rejects.toThrow();
});

it("explicit resume completes an already approved provider order without a new order/cart operation", async () => {
  const location = { href: "" };
  vi.stubGlobal("window", { location });
  fetchMock
    .mockResolvedValueOnce(
      Response.json({
        ...payment,
        payment: { ...payment.payment, state: "APPROVED", approvalUrl: null },
      }),
    )
    .mockResolvedValueOnce(Response.json(paid));
  await startPayPalPayment("order", "guest");
  expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
    "/api/orders/order/pay/paypal",
    "/api/orders/order/pay/paypal/capture",
  ]);
  expect(location.href).toBe("/order-confirmation?orderId=order");
});
