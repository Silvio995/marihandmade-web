import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  GET as profileGet,
  PATCH as profilePatch,
} from "@/app/api/profile/route";
import { GET as list, POST as create } from "@/app/api/addresses/route";
import {
  GET as detail,
  PATCH as update,
  DELETE as remove,
} from "@/app/api/addresses/[addressId]/route";
import { profileAddresses } from "@/lib/client-profile-addresses";
import { ProfileAddressesError } from "@/lib/profile-addresses-contracts";
const profile = {
  name: "A",
  phone: null,
  email: "a@test.invalid",
  birthday: null,
};
const address = {
  id: "existing-id",
  country: "IRI",
  address: "Street",
  city: "City",
  phone: "0123",
  postalCode: "001",
  createdAt: "2026-09-29T00:00:00.000Z",
};
const input = {
  country: "IRI",
  address: "Street",
  city: "City",
  phone: "0123",
  postalCode: "001",
};
const fetchMock = vi.fn();
const context = { params: { addressId: address.id } };
function request(method = "GET", body?: unknown, origin = "http://store.test") {
  return new Request("http://store.test/api/profile?userId=attacker", {
    method,
    headers: {
      Cookie: "mh_session=opaque",
      Origin: origin,
      "Content-Type": "application/json; charset=utf-8",
      "X-User-Id": "attacker",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  vi.stubEnv("MARIHANDMADE_API_URL", "http://backend.test");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("private forwarding", () => {
  it.each([
    ["profile GET", profileGet, "GET", "/api/profile", profile],
    ["profile PATCH", profilePatch, "PATCH", "/api/profile", profile],
    ["address list", list, "GET", "/api/addresses", [address]],
    ["address create", create, "POST", "/api/addresses", address],
    ["address detail", detail, "GET", `/api/addresses/${address.id}`, address],
    [
      "address update",
      update,
      "PATCH",
      `/api/addresses/${address.id}`,
      address,
    ],
    ["address delete", remove, "DELETE", `/api/addresses/${address.id}`, null],
  ] as const)(
    "%s preserves contract, Cookie, Origin and private caching",
    async (_, handler, method, path, dto) => {
      fetchMock.mockResolvedValue(
        new Response(dto === null ? null : JSON.stringify(dto), {
          status: dto === null ? 204 : 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": "mh_session=rotated; HttpOnly; Path=/",
          },
        }),
      );
      const body = ["POST", "PATCH"].includes(method)
        ? { name: "new" }
        : undefined;
      const response = await handler(request(method, body), context);
      expect(response.status).toBe(dto === null ? 204 : 200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("vary")).toBe("Cookie");
      expect(response.headers.get("set-cookie")).toContain("HttpOnly");
      if (dto !== null) expect(await response.json()).toEqual(dto);
      else expect(await response.text()).toBe("");
      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toBe(`http://backend.test${path}`);
      expect(init).toMatchObject({
        method,
        cache: "no-store",
        redirect: "error",
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      expect(init.headers.get("cookie")).toBe("mh_session=opaque");
      expect(init.headers.get("origin")).toBe("http://store.test");
      expect(init.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      expect(init.headers.get("x-user-id")).toBeNull();
      expect(String(url)).not.toContain("userId");
    },
  );
  it.each([400, 401, 403, 404, 409, 500, 503])(
    "preserves backend %s status/body and no-store",
    async (status) => {
      const error = { error: { code: "FAILURE", message: "Safe error" } };
      fetchMock.mockResolvedValue(Response.json(error, { status }));
      const response = await remove(request("DELETE"), context);
      expect(response.status).toBe(status);
      expect(await response.json()).toEqual(error);
      expect(response.headers.get("cache-control")).toBe("no-store");
    },
  );
  it.each(["http://evil.test", "null", ""])(
    "rejects untrusted write Origin %s before forwarding",
    async (origin) => {
      expect(
        (await profilePatch(request("PATCH", { name: "x" }, origin))).status,
      ).toBe(403);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
  it("uses configured public production origin, never spoofed Host", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://store.test");
    expect(
      (await profilePatch(request("PATCH", { name: "x" }, "http://store.test")))
        .status,
    ).toBe(403);
    fetchMock.mockResolvedValue(Response.json(profile));
    expect(
      (
        await profilePatch(
          request("PATCH", { name: "x" }, "https://store.test"),
        )
      ).status,
    ).toBe(200);
  });
  it("bounds bodies using backend limits", async () => {
    expect(
      (await profilePatch(request("PATCH", { name: "x".repeat(4096) }))).status,
    ).toBe(413);
    expect(
      (await create(request("POST", { address: "x".repeat(16384) }))).status,
    ).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("forwards DELETE without manufacturing a body or content type", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const req = new Request("http://store.test/api/addresses/existing-id", {
      method: "DELETE",
      headers: { Origin: "http://store.test", Cookie: "mh_session=opaque" },
    });
    expect((await remove(req, context)).status).toBe(204);
    const init = fetchMock.mock.calls[0][1];
    expect(init.body).toBeUndefined();
    expect(init.headers.get("content-type")).toBeNull();
  });
  it("returns safe unavailable response on network failure", async () => {
    fetchMock.mockRejectedValue(new Error("database password secret"));
    const result = await profileGet(request());
    expect(result.status).toBe(503);
    expect(await result.text()).not.toContain("secret");
    expect(result.headers.get("cache-control")).toBe("no-store");
  });
});
describe("typed browser client", () => {
  it.each([
    [
      "profile",
      () => profileAddresses.profile(),
      "/api/profile",
      "GET",
      profile,
    ],
    [
      "update profile",
      () => profileAddresses.updateProfile({ name: "New" }),
      "/api/profile",
      "PATCH",
      profile,
    ],
    [
      "list",
      () => profileAddresses.addresses(),
      "/api/addresses",
      "GET",
      [address],
    ],
    [
      "create",
      () => profileAddresses.createAddress(input),
      "/api/addresses",
      "POST",
      address,
    ],
    [
      "detail",
      () => profileAddresses.address(address.id),
      `/api/addresses/${address.id}`,
      "GET",
      address,
    ],
    [
      "update",
      () => profileAddresses.updateAddress(address.id, { city: "New" }),
      `/api/addresses/${address.id}`,
      "PATCH",
      address,
    ],
    [
      "delete",
      () => profileAddresses.deleteAddress(address.id),
      `/api/addresses/${address.id}`,
      "DELETE",
      null,
    ],
  ] as const)(
    "%s uses same-origin contract",
    async (_, call, url, method, dto) => {
      fetchMock.mockResolvedValue(
        dto === null ? new Response(null, { status: 204 }) : Response.json(dto),
      );
      expect(await call()).toEqual(dto === null ? undefined : dto);
      expect(fetchMock.mock.calls[0][0]).toBe(url);
      expect(fetchMock.mock.calls[0][1]).toMatchObject({
        method,
        cache: "no-store",
        credentials: "same-origin",
      });
      if (["POST", "PATCH"].includes(method))
        expect(fetchMock.mock.calls[0][1].headers).toEqual({
          "Content-Type": "application/json",
        });
    },
  );
  it("only sends supported profile fields, preserving omitted/null/blank semantics", async () => {
    fetchMock.mockImplementation(async () => Response.json(profile));
    await profileAddresses.updateProfile({
      name: null,
      email: "private",
      birthday: "x",
      passwordHash: "secret",
      userId: "attacker",
      isPhoneVerified: true,
    } as never);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ name: null });
    await profileAddresses.updateProfile({ phone: "" });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ phone: "" });
  });
  it("never sends address ownership or timestamps and encodes IDs", async () => {
    fetchMock.mockResolvedValue(Response.json(address));
    await profileAddresses.updateAddress("id/other", {
      ...address,
      userId: "attacker",
    } as never);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/addresses/id%2Fother");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(input);
  });
  it.each([400, 401, 403, 404, 409, 500, 503])(
    "maps %s to useful safe typed errors",
    async (status) => {
      fetchMock.mockResolvedValue(new Response("Prisma secret", { status }));
      await expect(
        profileAddresses.deleteAddress("foreign-or-missing"),
      ).rejects.toMatchObject({ status });
      try {
        await profileAddresses.profile();
      } catch (error) {
        expect(error).toBeInstanceOf(ProfileAddressesError);
        expect((error as Error).message).not.toContain("Prisma");
      }
    },
  );
  it.each([
    "invalid json",
    JSON.stringify({ name: "missing required fields" }),
  ])("rejects malformed successful reads", async (body) => {
    fetchMock.mockResolvedValue(new Response(body));
    await expect(profileAddresses.profile()).rejects.toMatchObject({
      status: 503,
    });
  });
  it("reports network outage rather than empty data", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    await expect(profileAddresses.addresses()).rejects.toMatchObject({
      status: 503,
    });
  });
});
