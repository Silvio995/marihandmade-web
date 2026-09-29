import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: () => ({ toString: () => "mh_session=opaque" }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
  notFound: () => {
    throw new Error("not-found");
  },
}));
vi.mock(
  "@/app/(store)/(routes)/profile/edit/components/server-profile-form",
  () => ({ default: () => null }),
);
vi.mock(
  "@/app/(store)/(routes)/profile/addresses/components/addresses-client",
  () => ({ default: () => null }),
);
import ProfilePage from "@/app/(store)/(routes)/profile/edit/page";
import AddressesPage from "@/app/(store)/(routes)/profile/addresses/page";
const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("MARIHANDMADE_API_URL", "http://backend.test");
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it.each([
  [
    ProfilePage,
    "/api/profile",
    { name: "A", phone: null, email: null, birthday: null },
  ],
  [AddressesPage, "/api/addresses", []],
] as const)(
  "SSR reads through backend with cookie and no-store",
  async (page, path, dto) => {
    fetchMock.mockResolvedValue(Response.json(dto));
    expect(await page()).toBeTruthy();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`http://backend.test${path}`);
    expect(init.headers.get("cookie")).toBe("mh_session=opaque");
    expect(init.cache).toBe("no-store");
  },
);
it.each([ProfilePage, AddressesPage])(
  "SSR redirects only explicit unauthenticated responses",
  async (page) => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));
    await expect(page()).rejects.toThrow("redirect:/login");
  },
);
it.each([ProfilePage, AddressesPage])(
  "SSR outage throws a safe error, never an empty page or login redirect",
  async (page) => {
    fetchMock.mockRejectedValue(new Error("Prisma secret"));
    await expect(page()).rejects.toThrow("temporarily unavailable");
  },
);
