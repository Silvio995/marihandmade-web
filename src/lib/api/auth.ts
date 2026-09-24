import "server-only";
import {
  authSessionSchema,
  authErrorSchema,
  type AuthOperation,
  type AuthSession,
  type AuthErrorBody,
} from "@/lib/auth-contracts";

export class AuthUnavailableError extends Error {
  constructor() {
    super("Authentication is temporarily unavailable");
    this.name = "AuthUnavailableError";
  }
}
export type AuthResult = {
  status: number;
  body: AuthSession | AuthErrorBody | null;
  cookies: string[];
  retryAfter: string | null;
};

// Only split at a cookie-name boundary, never at the comma inside Expires.
export function getSetCookies(headers: Headers): string[] {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const value = headers.get("set-cookie");
  return value
    ? value.split(/,(?=\s*[^\s;,=]+=)/).map((value) => value.trim())
    : [];
}
export async function requestBackendAuth(
  operation: AuthOperation,
  input: {
    cookie?: string | null;
    origin?: string | null;
    contentType?: string | null;
    body?: string;
  } = {},
): Promise<AuthResult> {
  try {
    const base = process.env.MARIHANDMADE_API_URL;
    if (!base) throw new AuthUnavailableError();
    const url = new URL(`${base.replace(/\/$/, "")}/api/auth/${operation}`);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new AuthUnavailableError();
    const headers = new Headers({ Accept: "application/json" });
    if (input.cookie) headers.set("Cookie", input.cookie);
    if (input.origin) headers.set("Origin", input.origin);
    if (input.contentType) headers.set("Content-Type", input.contentType);
    const response = await fetch(url, {
      method: operation === "me" ? "GET" : "POST",
      headers,
      body: operation === "me" ? undefined : input.body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    const body =
      response.status === 204 && operation === "logout"
        ? null
        : response.ok
          ? authSessionSchema.parse(await response.json())
          : authErrorSchema.parse(await response.json());
    return {
      status: response.status,
      body,
      cookies: getSetCookies(response.headers),
      retryAfter: response.headers.get("retry-after"),
    };
  } catch {
    throw new AuthUnavailableError();
  }
}
