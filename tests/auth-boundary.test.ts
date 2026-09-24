import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: () => ({
    toString: () => "mh_session=opaque; next-auth.session-token=ignored",
  }),
}));
import {
  requestBackendAuth,
  getSetCookies,
  AuthUnavailableError,
} from "@/lib/api/auth";
import { getServerAuthSession, getCurrentUserId } from "@/lib/auth";
import { POST as signup } from "@/app/api/auth/signup/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as me } from "@/app/api/auth/me/route";
import { identity, authFailure } from "./auth.fixture";
const fetchMock = vi.fn();
const origin = "http://localhost:7777";
function request(
  method = "POST",
  body = "{}",
  extra: Record<string, string> = {},
) {
  return new Request(`${origin}/api/auth/login?userId=attacker`, {
    method,
    headers: {
      Origin: origin,
      "Content-Type": "application/json; charset=utf-8",
      Cookie: "mh_session=opaque; next-auth.session-token.0=old",
      "X-User-Id": "attacker",
      "X-Forwarded-For": "1.2.3.4",
      ...extra,
    },
    ...(method === "GET" ? {} : { body }),
  });
}
function response(
  body: unknown = identity,
  status = 200,
  headers: HeadersInit = {},
) {
  fetchMock.mockResolvedValueOnce(
    new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers,
    }),
  );
}
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("MARIHANDMADE_API_URL", "http://backend.test");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", origin);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("same-origin auth forwarding", () => {
  it.each([
    ["signup", signup, 201],
    ["login", login, 200],
    ["logout", logout, 204],
    ["me", me, 200],
  ] as const)(
    "forwards %s with private headers and no cache",
    async (operation, handler, status) => {
      const cookies = new Headers();
      cookies.append(
        "Set-Cookie",
        "mh_session=opaque; Path=/; HttpOnly; SameSite=Lax",
      );
      cookies.append(
        "Set-Cookie",
        "other=expired; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/",
      );
      response(identity, status, cookies);
      const body = JSON.stringify({
        email: "a@example.test",
        password: "secret",
      });
      const result = await handler(
        request(operation === "me" ? "GET" : "POST", body),
      );
      expect(result.status).toBe(status);
      expect(result.headers.get("cache-control")).toBe("no-store");
      const relayed = getSetCookies(result.headers);
      expect(relayed).toContain(
        "mh_session=opaque; Path=/; HttpOnly; SameSite=Lax",
      );
      expect(relayed).toContain(
        "other=expired; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/",
      );
      expect(
        relayed.some((value) =>
          value.startsWith("next-auth.session-token.0=;"),
        ),
      ).toBe(true);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url.href).toBe(`http://backend.test/api/auth/${operation}`);
      expect(init.cache).toBe("no-store");
      expect(init.redirect).toBe("error");
      expect(init.signal).toBeDefined();
      expect(init.headers.get("Cookie")).toContain("mh_session=opaque");
      expect(init.headers.get("Origin")).toBe(origin);
      expect(init.headers.get("X-User-Id")).toBeNull();
      expect(init.headers.get("X-Forwarded-For")).toBeNull();
      if (operation !== "me") {
        expect(init.body).toBe(body);
        expect(init.headers.get("content-type")).toBe(
          "application/json; charset=utf-8",
        );
      } else expect(init.body).toBeUndefined();
      if (status === 204) expect(await result.text()).toBe("");
      else expect(await result.json()).toEqual(identity);
    },
  );
  it.each([
    [400, "BAD_REQUEST"],
    [401, "INVALID_CREDENTIALS"],
    [403, "ACCOUNT_DISABLED"],
    [409, "ACCOUNT_EXISTS"],
    [429, "RATE_LIMITED"],
    [500, "INTERNAL_ERROR"],
  ])("preserves backend %s and safe code", async (status, code) => {
    response(authFailure(String(code)), Number(status), {
      "Retry-After": "60",
    });
    const result = await login(request());
    expect(result.status).toBe(status);
    expect(await result.json()).toEqual(authFailure(String(code)));
    expect(result.headers.get("retry-after")).toBe("60");
  });
  it.each(["https://attacker.test", "null", "http://localhost:7777.evil.test"])(
    "does not manufacture trusted origin for %s",
    async (value) => {
      const result = await login(
        request("POST", "{}", {
          Origin: value,
          "X-Forwarded-Host": "localhost:7777",
        }),
      );
      expect(result.status).toBe(403);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
  it("rejects missing origin, even with a trusted Referer", async () => {
    const req = request();
    req.headers.delete("origin");
    req.headers.set("referer", origin);
    expect((await login(req)).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("bounds bodies before sending credentials upstream", async () => {
    expect((await signup(request("POST", "x".repeat(4097)))).status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("preserves content type so backend rejects non-JSON", async () => {
    response(authFailure("BAD_REQUEST"), 415);
    expect(
      (
        await login(
          request("POST", "email=a", {
            "Content-Type": "application/x-www-form-urlencoded",
          }),
        )
      ).status,
    ).toBe(415);
    expect(fetchMock.mock.calls[0][1].headers.get("content-type")).toBe(
      "application/x-www-form-urlencoded",
    );
  });
  it("returns a safe unavailable response for network errors", async () => {
    fetchMock.mockRejectedValue(new Error("secret upstream details"));
    const result = await me(request("GET"));
    expect(result.status).toBe(503);
    expect(await result.text()).not.toContain("secret upstream details");
  });
  it("rejects malformed success/error bodies, and strips unexpected credential fields", async () => {
    response({ user: { id: "attacker" } });
    await expect(requestBackendAuth("me")).rejects.toBeInstanceOf(
      AuthUnavailableError,
    );
    response({
      ...identity,
      token: "secret",
      user: { ...identity.user, passwordHash: "secret" },
    });
    expect((await requestBackendAuth("me")).body).toEqual(identity);
    response({ stack: "secret" }, 500);
    await expect(requestBackendAuth("me")).rejects.toBeInstanceOf(
      AuthUnavailableError,
    );
  });
  it("splits combined Set-Cookie only at cookie boundaries", () => {
    const headers = {
      get: () =>
        "a=one; Expires=Thu, 01 Jan 1970 00:00:00 GMT, b=two; HttpOnly",
    } as unknown as Headers;
    expect(getSetCookies(headers)).toEqual([
      "a=one; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
      "b=two; HttpOnly",
    ]);
  });
  it("repeated logout still reaches the revocation endpoint", async () => {
    response(null, 204);
    response(null, 204);
    expect((await logout(request())).status).toBe(204);
    expect((await logout(request())).status).toBe(204);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
describe("request-origin regression", () => {
  it.each([
    ["signup", signup],
    ["login", login],
    ["logout", logout],
  ] as const)(
    "%s forwards localhost:7777 despite a stale public URL",
    async (operation, handler) => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://your-production-domain.com");
      vi.stubEnv("MARIHANDMADE_API_URL", "http://localhost:3001");
      response(authFailure("BAD_REQUEST"), 400);
      const req = new Request(`http://localhost:7777/api/auth/${operation}`, {
        method: "POST",
        headers: {
          Origin: origin,
          Host: "localhost:7777",
          "Content-Type": "application/json",
        },
        body: "{}",
      });
      const result = await handler(req);
      expect(result.status).toBe(400);
      expect(await result.json()).toEqual(authFailure("BAD_REQUEST"));
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url.origin).toBe("http://localhost:3001");
      expect(init.headers.get("Origin")).toBe(origin);
      expect(init.body).toBe("{}");
    },
  );
  it.each([
    "http://localhost",
    "http://localhost:3001",
    "https://localhost:7777",
    "http://attacker.test:7777",
  ])(
    "rejects mismatched Origin %s despite forged host headers",
    async (candidate) => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("NEXT_PUBLIC_APP_URL", candidate);
      const req = request("POST", "{}", {
        Origin: candidate,
        Host: new URL(candidate).host,
        "X-Forwarded-Host": new URL(candidate).host,
        "X-Forwarded-Proto": new URL(candidate).protocol.slice(0, -1),
      });
      expect((await signup(req)).status).toBe(403);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
  it("uses the actual development port instead of a hardcoded localhost exception", async () => {
    vi.stubEnv("NODE_ENV", "development");
    response(authFailure("BAD_REQUEST"), 400);
    const req = new Request("http://localhost:8888/api/auth/signup", {
      method: "POST",
      headers: { Origin: "http://localhost:8888" },
      body: "{}",
    });
    expect((await signup(req)).status).toBe(400);
    expect(fetchMock.mock.calls[0][1].headers.get("Origin")).toBe(
      "http://localhost:8888",
    );
  });
  it.each([
    "https://store.example.test/api/auth/signup",
    "http://internal-next:3000/api/auth/signup",
  ])("preserves the configured production HTTPS origin for %s", async (url) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://store.example.test");
    response(authFailure("BAD_REQUEST"), 400);
    const req = new Request(url, {
      method: "POST",
      headers: {
        Origin: "https://store.example.test",
        Host: "internal-next:3000",
        "X-Forwarded-Host": "attacker.test",
        "X-Forwarded-Proto": "http",
      },
      body: "{}",
    });
    expect((await signup(req)).status).toBe(400);
    expect(fetchMock.mock.calls[0][1].headers.get("Origin")).toBe(
      "https://store.example.test",
    );
    expect(
      fetchMock.mock.calls[0][1].headers.get("X-Forwarded-Host"),
    ).toBeNull();
  });
  it.each([
    "https://attacker.test",
    "http://store.example.test",
    "http://localhost:7777",
  ])(
    "production rejects %s even when request URL and forged headers match",
    async (candidate) => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://store.example.test");
      const req = new Request(`${candidate}/api/auth/signup`, {
        method: "POST",
        headers: {
          Origin: candidate,
          Host: new URL(candidate).host,
          "X-Forwarded-Host": new URL(candidate).host,
          "X-Forwarded-Proto": new URL(candidate).protocol.slice(0, -1),
        },
        body: "{}",
      });
      expect((await signup(req)).status).toBe(403);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
  it.each(["", "invalid", "http://store.example.test"])(
    "production fails closed for invalid public origin configuration %s",
    async (configured) => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("NEXT_PUBLIC_APP_URL", configured);
      expect((await signup(request())).status).toBe(403);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
  it("GET /me remains independent of mutation Origin validation", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    response(authFailure("UNAUTHENTICATED"), 401);
    const req = request("GET");
    req.headers.delete("origin");
    const result = await me(req);
    expect(result.status).toBe(401);
    expect(await result.json()).toEqual(authFailure("UNAUTHENTICATED"));
    expect(fetchMock.mock.calls[0][1].headers.get("Cookie")).toContain(
      "mh_session=opaque",
    );
  });
});
describe("SSR authority", () => {
  it("uses only backend identity and explicitly forwards incoming cookies without caching", async () => {
    response();
    expect(await getCurrentUserId()).toBe("user-a");
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers.get("cookie")).toBe(
      "mh_session=opaque; next-auth.session-token=ignored",
    );
    expect(init.cache).toBe("no-store");
  });
  it("maps only 401 to anonymous", async () => {
    response(authFailure("UNAUTHENTICATED"), 401);
    expect(await getServerAuthSession()).toBeNull();
  });
  it.each([403, 500, 503])("does not map %s to anonymous", async (status) => {
    response(authFailure("FAILURE"), status);
    await expect(getServerAuthSession()).rejects.toThrow();
  });
  it("does not map transport failure to anonymous", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    await expect(getServerAuthSession()).rejects.toThrow();
  });
});
