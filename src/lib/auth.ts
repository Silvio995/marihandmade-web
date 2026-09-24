import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { getOptionalEnv, isProductionEnvironment, requireEnv } from "@/lib/env";
import { requestBackendAuth, AuthUnavailableError } from "@/lib/api/auth";
import { authSessionSchema } from "@/lib/auth-contracts";

export async function getServerAuthSession() {
  const result = await requestBackendAuth("me", {
    cookie: cookies().toString(),
  });
  if (result.status === 401) return null;
  if (result.status !== 200) throw new AuthUnavailableError();
  return authSessionSchema.parse(result.body);
}
export async function getCurrentUserId() {
  return (await getServerAuthSession())?.user.id;
}
export async function getRequiredUserId() {
  return (await getCurrentUserId()) ?? null;
}

export const GUEST_ORDER_ACCESS_COOKIE = "guest_order_access";
export const GUEST_ORDER_ACCESS_HEADER = "x-guest-order-access";
const DEFAULT_GUEST_ORDER_ACCESS_TTL_SECONDS = 60 * 60 * 2;

export type GuestOrderAccessClaims = {
  orderId: string;
  guestEmail: string;
  iat: number;
  exp: number;
};

function normalizeGuestEmail(value: string) {
  return value.trim().toLowerCase();
}

function getGuestOrderAccessSecret() {
  if (isProductionEnvironment) {
    return requireEnv("GUEST_ORDER_TOKEN_SECRET");
  }

  const secret = getOptionalEnv("GUEST_ORDER_TOKEN_SECRET");

  if (!secret) {
    throw new Error("Guest order token secret is not configured");
  }

  return secret;
}

function signGuestOrderPayload(payloadBase64: string) {
  return createHmac("sha256", getGuestOrderAccessSecret())
    .update(payloadBase64)
    .digest("base64url");
}

export function createGuestOrderAccessToken(params: {
  orderId: string;
  guestEmail: string;
  ttlSeconds?: number;
}) {
  const ttlSeconds =
    params.ttlSeconds && params.ttlSeconds > 0
      ? params.ttlSeconds
      : DEFAULT_GUEST_ORDER_ACCESS_TTL_SECONDS;
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttlSeconds;

  const payload: GuestOrderAccessClaims = {
    orderId: params.orderId,
    guestEmail: normalizeGuestEmail(params.guestEmail),
    iat,
    exp,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  const signature = signGuestOrderPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function parseCookieValue(cookieHeader: string | null, key: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [name, ...rest] = part.trim().split("=");
    if (name === key) {
      const value = rest.join("=");
      return value ? decodeURIComponent(value) : null;
    }
  }
  return null;
}

export function getGuestOrderAccessClaimsFromRequest(req: Request) {
  const rawToken =
    req.headers.get(GUEST_ORDER_ACCESS_HEADER) ??
    parseCookieValue(req.headers.get("cookie"), GUEST_ORDER_ACCESS_COOKIE);

  if (!rawToken) return null;

  const [payloadBase64, signature] = rawToken.split(".");
  if (!payloadBase64 || !signature) return null;

  const expectedSignature = signGuestOrderPayload(payloadBase64);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf8"),
    ) as GuestOrderAccessClaims;

    if (!payload?.orderId || !payload?.guestEmail || !payload?.exp) {
      return null;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      ...payload,
      guestEmail: normalizeGuestEmail(payload.guestEmail),
    };
  } catch {
    return null;
  }
}

export function getGuestOrderAccessCookieOptions(ttlSeconds?: number) {
  const maxAge =
    ttlSeconds && ttlSeconds > 0
      ? ttlSeconds
      : DEFAULT_GUEST_ORDER_ACCESS_TTL_SECONDS;
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
