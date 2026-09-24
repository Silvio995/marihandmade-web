import {
  authSessionSchema,
  type AuthOperation,
  type LoginInput,
  type SignupInput,
} from "@/lib/auth-contracts";

export class ClientAuthError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(authErrorMessage(status, code));
  }
}
export function authErrorMessage(status: number, code: string) {
  if (status >= 500 || status === 0)
    return "Authentication is temporarily unavailable. Please try again.";
  if (code === "ACCOUNT_DISABLED")
    return "This account is disabled. Please contact support.";
  if (status === 429) return "Too many attempts. Please wait and try again.";
  if (code === "ACCOUNT_EXISTS")
    return "An account with this email already exists.";
  if (status === 401) return "Invalid email or password.";
  if (status === 403)
    return "This request could not be accepted. Please reload and try again.";
  return "Please check your email and password (6–72 bytes) and try again.";
}
export async function clientAuth(
  operation: AuthOperation,
  input?: LoginInput | SignupInput,
) {
  try {
    const response = await fetch(`/api/auth/${operation}`, {
      method: operation === "me" ? "GET" : "POST",
      credentials: "same-origin",
      cache: "no-store",
      ...(operation === "me"
        ? {}
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input ?? {}),
          }),
    });
    if (operation === "me" && response.status === 401) return null;
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new ClientAuthError(
        response.status,
        body?.error?.code ?? "AUTH_UNAVAILABLE",
      );
    }
    if (operation === "logout" && response.status === 204) return null;
    return authSessionSchema.parse(await response.json());
  } catch (error) {
    if (error instanceof ClientAuthError) throw error;
    throw new ClientAuthError(0, "AUTH_UNAVAILABLE");
  }
}
export function safeCallback(value: string | null, origin: string) {
  if (!value || /[\\\x00-\x20]/.test(value)) return "/";
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin || url.username || url.password) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
