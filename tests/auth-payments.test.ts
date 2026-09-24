import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: () => ({ toString: () => "mh_session=opaque" }),
}));
const { backend, db, paypal } = vi.hoisted(() => ({
  backend: vi.fn(),
  db: {
    order: { findUnique: vi.fn() },
    payment: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  },
  paypal: {
    createPayPalOrder: vi.fn(),
    getPayPalOrder: vi.fn(),
    capturePayPalOrder: vi.fn(),
    validatePayPalOrderForLocalOrder: vi.fn(),
    reconcilePayPalPayment: vi.fn(),
    verifyPayPalWebhookSignature: vi.fn(),
  },
}));
vi.mock("@/lib/api/auth", () => ({
  requestBackendAuth: backend,
  AuthUnavailableError: class extends Error {},
}));
vi.mock("@/lib/prisma", () => ({ default: db }));
vi.mock("@/lib/paypal", () => ({
  ...paypal,
  resolvePayPalEnvironment: () => "sandbox",
  PayPalValidationError: class extends Error {},
}));
vi.mock("@/lib/email", () => ({ sendOrderEmail: vi.fn() }));
import {
  createGuestOrderAccessToken,
  getGuestOrderAccessClaimsFromRequest,
  getGuestOrderAccessCookieOptions,
} from "@/lib/auth";
import { resolveOrderPaymentAccess } from "@/lib/order-access";
import { POST as create } from "@/app/api/orders/[orderId]/pay/paypal/route";
import { POST as capture } from "@/app/api/orders/[orderId]/pay/paypal/capture/route";
import { POST as sync } from "@/app/api/orders/[orderId]/pay/paypal/sync/route";
import { POST as webhook } from "@/app/api/paypal/webhook/route";
import { identity } from "./auth.fixture";
const order = {
  id: "order-a",
  userId: "user-a",
  guestEmail: null,
  status: "Pending",
  payable: 12,
  payments: [],
  isPaid: false,
};
const guestOrder = { ...order, userId: null, guestEmail: "guest@example.test" };
function req(token?: string) {
  return new Request("http://store.test/api/pay?token=paypal-order", {
    method: "POST",
    headers: token
      ? { Cookie: `guest_order_access=${token}; mh_session=invalid` }
      : { "X-User-Id": "user-a" },
  });
}
function guestToken() {
  return createGuestOrderAccessToken({
    orderId: "order-a",
    guestEmail: "guest@example.test",
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("GUEST_ORDER_TOKEN_SECRET", "independent-test-only-guest-secret");
  vi.stubEnv("PAYPAL_WEBHOOK_ID", "test-hook");
  backend.mockResolvedValue({ status: 200, body: identity });
  db.order.findUnique.mockResolvedValue(order);
  paypal.createPayPalOrder.mockResolvedValue({
    id: "paypal-order",
    approvalUrl: "https://sandbox.example.test/approve",
  });
  paypal.getPayPalOrder.mockResolvedValue({
    id: "paypal-order",
    referenceId: "order-a",
    status: "COMPLETED",
    captureId: "capture",
    amountValue: "12.00",
    currencyCode: "EUR",
  });
  paypal.reconcilePayPalPayment.mockResolvedValue({ alreadyPaid: true });
  paypal.verifyPayPalWebhookSignature.mockResolvedValue(true);
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
describe("independent guest payment capability", () => {
  it("retains two-hour cookie scope and signature validation", () => {
    const token = guestToken();
    const claims = getGuestOrderAccessClaimsFromRequest(req(token))!;
    expect(claims.exp - claims.iat).toBe(7200);
    expect(getGuestOrderAccessCookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7200,
    });
    expect(getGuestOrderAccessClaimsFromRequest(req(`${token}bad`))).toBeNull();
  });
  it("rejects expired tokens", () => {
    vi.useFakeTimers();
    const token = guestToken();
    vi.advanceTimersByTime(7200 * 1000);
    expect(getGuestOrderAccessClaimsFromRequest(req(token))).toBeNull();
    vi.useRealTimers();
  });
  it("valid guest access needs no customer session, even during auth outage", async () => {
    backend.mockRejectedValue(new Error("offline"));
    expect(
      await resolveOrderPaymentAccess(req(guestToken()), guestOrder),
    ).toEqual({ authorized: true, actor: "guest" });
    expect(backend).not.toHaveBeenCalled();
  });
  it("cannot use guest capability for account orders or other guest orders", async () => {
    backend.mockResolvedValue({ status: 401, body: null });
    expect(
      (await resolveOrderPaymentAccess(req(guestToken()), order)).authorized,
    ).toBe(false);
    expect(
      (
        await resolveOrderPaymentAccess(req(guestToken()), {
          ...guestOrder,
          id: "other",
        })
      ).authorized,
    ).toBe(false);
    expect(
      (
        await resolveOrderPaymentAccess(req(guestToken()), {
          ...guestOrder,
          guestEmail: "other@example.test",
        })
      ).authorized,
    ).toBe(false);
  });
  it("account access uses backend User.id, never an identity header or matching guest email", async () => {
    expect(await resolveOrderPaymentAccess(req(), order)).toEqual({
      authorized: true,
      actor: "user",
    });
    backend.mockResolvedValue({
      status: 200,
      body: { ...identity, user: { ...identity.user, id: "user-b" } },
    });
    expect((await resolveOrderPaymentAccess(req(), order)).authorized).toBe(
      false,
    );
    expect(
      (
        await resolveOrderPaymentAccess(req(), {
          ...guestOrder,
          guestEmail: identity.user.email,
        })
      ).authorized,
    ).toBe(false);
  });
  it("customer secret changes do not affect guest signatures", () => {
    const token = guestToken();
    vi.stubEnv("NEXTAUTH_SECRET", "irrelevant");
    vi.stubEnv("JWT_SECRET_KEY", "irrelevant");
    expect(getGuestOrderAccessClaimsFromRequest(req(token))?.orderId).toBe(
      "order-a",
    );
  });
});
describe("PayPal route compatibility", () => {
  it.each([create, capture, sync])(
    "authorizes account payment using backend identity",
    async (handler) => {
      expect(
        (await handler(req(), { params: { orderId: "order-a" } })).status,
      ).toBe(200);
      expect(backend).toHaveBeenCalledWith("me", {
        cookie: "mh_session=opaque",
      });
    },
  );
  it.each([create, capture, sync])(
    "authorizes guest payment without customer session",
    async (handler) => {
      db.order.findUnique.mockResolvedValue(guestOrder);
      backend.mockRejectedValue(new Error("unavailable"));
      expect(
        (await handler(req(guestToken()), { params: { orderId: "order-a" } }))
          .status,
      ).toBe(200);
      expect(backend).not.toHaveBeenCalled();
    },
  );
  it.each([capture, sync])(
    "preserves PayPal return token and provider/order validation",
    async (handler) => {
      expect(
        (await handler(req(), { params: { orderId: "order-a" } })).status,
      ).toBe(200);
      expect(paypal.getPayPalOrder).toHaveBeenCalledWith("paypal-order");
      expect(paypal.validatePayPalOrderForLocalOrder).toHaveBeenCalled();
      expect(paypal.reconcilePayPalPayment).toHaveBeenCalled();
      paypal.getPayPalOrder.mockResolvedValue({
        referenceId: "other-order",
        status: "COMPLETED",
      });
      expect(
        (await handler(req(), { params: { orderId: "order-a" } })).status,
      ).toBe(409);
    },
  );
  it("webhook verifies provider signature without customer auth", async () => {
    backend.mockRejectedValue(new Error("Customer auth must not run"));
    const headers = {
      "paypal-transmission-id": "transmission",
      "paypal-transmission-time": "time",
      "paypal-transmission-sig": "signature",
      "paypal-cert-url": "https://provider.test/cert",
      "paypal-auth-algo": "algo",
    };
    const body = JSON.stringify({
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      resource: {
        id: "capture",
        supplementary_data: { related_ids: { order_id: "paypal-order" } },
      },
    });
    const response = await webhook(
      new Request("http://store.test/api/paypal/webhook", {
        method: "POST",
        headers,
        body,
      }),
    );
    expect(response.status).toBe(200);
    expect(paypal.verifyPayPalWebhookSignature).toHaveBeenCalled();
    expect(paypal.reconcilePayPalPayment).toHaveBeenCalled();
    expect(backend).not.toHaveBeenCalled();
    paypal.verifyPayPalWebhookSignature.mockResolvedValue(false);
    expect(
      (
        await webhook(
          new Request("http://store.test/api/paypal/webhook", {
            method: "POST",
            headers,
            body,
          }),
        )
      ).status,
    ).toBe(400);
  });
});
