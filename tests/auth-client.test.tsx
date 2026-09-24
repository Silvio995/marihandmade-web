import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const { replace, refreshRouter } = vi.hoisted(() => ({
  replace: vi.fn(),
  refreshRouter: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh: refreshRouter }),
}));
import { AuthProvider, useAuth } from "@/state/Auth";
import { Providers } from "@/app/providers";
import { useUserContext } from "@/state/User";
import { useCartContext } from "@/state/Cart";
import LoginForm from "@/app/login/components/login-form";
import LoginPage from "@/app/login/page";
import SignupForm from "@/app/signup/components/signup-form";
import { UserNav } from "@/components/native/nav/user";
import { safeCallback } from "@/lib/client-auth";
import { identity, authFailure } from "./auth.fixture";
const fetchMock = vi.fn();
const reply = (body: unknown, status = 200) =>
  new Response(status === 204 ? null : JSON.stringify(body), { status });
function Probe() {
  const auth = useAuth();
  const { user } = useUserContext();
  const { cart, dispatchCart } = useCartContext();
  return (
    <>
      <div data-testid="status">{auth.status}</div>
      <div data-testid="identity">{auth.session?.user.id}</div>
      <div data-testid="profile">{user?.name}</div>
      <div data-testid="cart">{JSON.stringify(cart)}</div>
      <button onClick={() => void auth.refresh().catch(() => {})}>
        Refresh identity
      </button>
      <button onClick={() => void auth.changed().catch(() => {})}>
        Identity changed
      </button>
      <button onClick={() => void auth.logout()}>Direct logout</button>
      <button
        onClick={() =>
          void dispatchCart({
            items: [{ productId: "account-only", count: 9 }],
          })
        }
      >
        Set account cart
      </button>
    </>
  );
}
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  localStorage.clear();
  replace.mockReset();
  refreshRouter.mockReset();
  window.history.replaceState({}, "", "/login");
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("auth provider", () => {
  it("starts loading, then publishes validated identity", async () => {
    let resolve!: (value: Response) => void;
    fetchMock.mockReturnValue(
      new Promise<Response>((r) => {
        resolve = r;
      }),
    );
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByTestId("status")).toHaveTextContent("loading");
    await act(async () => resolve(reply(identity)));
    expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    expect(screen.getByTestId("identity")).toHaveTextContent("user-a");
  });
  it.each([401, 500])("distinguishes /me status %s", async (status) => {
    fetchMock.mockResolvedValue(reply(authFailure("FAILURE"), status));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent(
        status === 401 ? "unauthenticated" : "error",
      ),
    );
  });
  it("refreshes on focus and cross-tab events and drops expired identity", async () => {
    fetchMock
      .mockResolvedValueOnce(reply(identity))
      .mockResolvedValueOnce(reply(identity))
      .mockResolvedValueOnce(reply(authFailure("UNAUTHENTICATED"), 401));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await screen.findByText("authenticated");
    fireEvent(window, new Event("focus"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    fireEvent(
      window,
      new StorageEvent("storage", {
        key: "mh-auth-change",
        newValue: "changed",
      }),
    );
    await screen.findByText("unauthenticated");
    expect(screen.getByTestId("identity")).toBeEmptyDOMElement();
  });
  it("late /me cannot restore identity after successful logout", async () => {
    let finish!: (r: Response) => void;
    fetchMock
      .mockResolvedValueOnce(reply(identity))
      .mockReturnValueOnce(
        new Promise<Response>((r) => {
          finish = r;
        }),
      )
      .mockResolvedValueOnce(reply(null, 204));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await screen.findByText("authenticated");
    fireEvent.click(screen.getByText("Refresh identity"));
    fireEvent.click(screen.getByText("Direct logout"));
    await screen.findByText("unauthenticated");
    await act(async () => finish(reply(identity)));
    expect(screen.getByTestId("identity")).toBeEmptyDOMElement();
    expect(localStorage.getItem("mh-auth-change")).toBeTruthy();
  });
});
function submit(container: HTMLElement, signup = false) {
  fireEvent.change(container.querySelector('[name="email"]')!, {
    target: { value: "a@example.test" },
  });
  fireEvent.change(container.querySelector('[name="password"]')!, {
    target: { value: "secret123" },
  });
  if (signup)
    fireEvent.change(container.querySelector('[name="confirmPassword"]')!, {
      target: { value: "secret123" },
    });
  fireEvent.submit(container.querySelector("form")!);
}
describe("rendered auth forms", () => {
  it("login succeeds, refreshes identity and navigates to safe callback", async () => {
    window.history.replaceState(
      {},
      "",
      "/login?callbackUrl=%2Fprofile%2Forders",
    );
    fetchMock
      .mockResolvedValueOnce(reply(authFailure("UNAUTHENTICATED"), 401))
      .mockResolvedValueOnce(reply(identity))
      .mockResolvedValueOnce(reply(identity));
    const { container } = render(
      <AuthProvider>
        <LoginPage />
        <Probe />
      </AuthProvider>,
    );
    await screen.findByText("unauthenticated");
    submit(container);
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/profile/orders"),
    );
    expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    expect(refreshRouter).toHaveBeenCalled();
    expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/login");
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify({ email: "a@example.test", password: "secret123" }),
    });
  });
  it.each([
    [401, "INVALID_CREDENTIALS", "Invalid email or password"],
    [429, "RATE_LIMITED", "Too many attempts"],
    [503, "AUTH_UNAVAILABLE", "temporarily unavailable"],
    [403, "ACCOUNT_DISABLED", "disabled"],
    [400, "BAD_REQUEST", "check your email"],
  ])("login shows safe %s feedback", async (status, code, message) => {
    fetchMock
      .mockResolvedValueOnce(reply(authFailure("UNAUTHENTICATED"), 401))
      .mockResolvedValueOnce(reply(authFailure(String(code)), Number(status)));
    const { container } = render(
      <AuthProvider>
        <LoginForm />
        <Probe />
      </AuthProvider>,
    );
    await screen.findByText("unauthenticated");
    submit(container);
    expect(await screen.findByRole("alert")).toHaveTextContent(String(message));
    expect(replace).not.toHaveBeenCalled();
  });
  it("signup authenticates with one signup and no second login", async () => {
    fetchMock
      .mockResolvedValueOnce(reply(authFailure("UNAUTHENTICATED"), 401))
      .mockResolvedValueOnce(reply(identity, 201))
      .mockResolvedValueOnce(reply(identity));
    const { container } = render(
      <AuthProvider>
        <SignupForm />
        <Probe />
      </AuthProvider>,
    );
    await screen.findByText("unauthenticated");
    submit(container, true);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "/api/auth/me",
      "/api/auth/signup",
      "/api/auth/me",
    ]);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      email: "a@example.test",
      password: "secret123",
    });
    expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
  });
  it.each([
    [409, "ACCOUNT_EXISTS", "already exists"],
    [400, "BAD_REQUEST", "check your email"],
    [429, "RATE_LIMITED", "Too many attempts"],
  ])("signup shows safe %s feedback", async (status, code, message) => {
    fetchMock
      .mockResolvedValueOnce(reply(authFailure("UNAUTHENTICATED"), 401))
      .mockResolvedValueOnce(reply(authFailure(String(code)), Number(status)));
    const { container } = render(
      <AuthProvider>
        <SignupForm />
        <Probe />
      </AuthProvider>,
    );
    await screen.findByText("unauthenticated");
    submit(container, true);
    expect(await screen.findByRole("alert")).toHaveTextContent(String(message));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("signup mismatched confirmation never sends credentials", async () => {
    fetchMock.mockResolvedValue(reply(authFailure("UNAUTHENTICATED"), 401));
    const { container } = render(
      <AuthProvider>
        <SignupForm />
        <Probe />
      </AuthProvider>,
    );
    await screen.findByText("unauthenticated");
    submit(container);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Passwords do not match",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it.each([
    "https://evil.test/path",
    "//evil.test",
    "/\\evil.test",
    "javascript:alert(1)",
    "https://store.test@evil.test",
    "/\n/evil.test",
  ])("rejects unsafe callback %s", (value) => {
    expect(safeCallback(value, "https://store.test")).toBe("/");
  });
  it("accepts absolute same-origin callback", () =>
    expect(
      safeCallback("https://store.test/profile?tab=1", "https://store.test"),
    ).toBe("/profile?tab=1"));
});
describe("profile/cart isolation and visible logout", () => {
  let current: typeof identity | null;
  const guestCart = { items: [{ productId: "guest-product", count: 2 }] };
  beforeEach(() => {
    current = identity;
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url === "/api/auth/me")
        return reply(
          current ?? authFailure("UNAUTHENTICATED"),
          current ? 200 : 401,
        );
      if (url === "/api/auth/logout") {
        current = null;
        return reply(null, 204);
      }
      if (url === "/api/profile")
        return reply({
          name: current?.user.name,
          cart: { items: [{ productId: current?.user.id, count: 1 }] },
        });
      if (url === "/api/cart" && init?.method === "POST")
        return reply({ items: [{ productId: "merged", count: 3 }] });
      throw new Error("Unexpected request");
    });
  });
  it("preserves guest cart when anonymous", async () => {
    current = null;
    localStorage.setItem("Cart", JSON.stringify(guestCart));
    render(
      <Providers>
        <Probe />
      </Providers>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("cart")).toHaveTextContent("guest-product"),
    );
    expect(JSON.parse(localStorage.getItem("Cart")!)).toEqual(guestCart);
    expect(fetchMock.mock.calls.some((call) => call[0] === "/api/cart")).toBe(
      false,
    );
  });
  it("merges only after authoritative login and removes only guest snapshot", async () => {
    current = null;
    localStorage.setItem("Cart", JSON.stringify(guestCart));
    render(
      <Providers>
        <Probe />
      </Providers>,
    );
    await screen.findByText("unauthenticated");
    current = identity;
    fireEvent.click(screen.getByText("Identity changed"));
    await waitFor(() =>
      expect(screen.getByTestId("cart")).toHaveTextContent("merged"),
    );
    const mutations = fetchMock.mock.calls.filter(
      (call) => call[0] === "/api/cart",
    );
    expect(mutations).toHaveLength(1);
    expect(JSON.parse(mutations[0][1].body).items[0]).toEqual({
      productId: "guest-product",
      variantId: null,
      count: 2,
      merge: true,
    });
    expect(localStorage.getItem("Cart")).toBe("null");
  });
  it("logout revokes, clears profile/account cart and navigates without writing account cart locally", async () => {
    render(
      <Providers>
        <Probe />
        <UserNav />
      </Providers>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("profile")).toHaveTextContent("A"),
    );
    fireEvent.click(screen.getByText("Set account cart"));
    expect(localStorage.getItem("Cart")).toBeNull();
    fireEvent.click(screen.getByText("Logout"));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.getByTestId("profile")).toBeEmptyDOMElement();
    expect(screen.getByTestId("cart")).not.toHaveTextContent("account-only");
    expect(screen.getByTestId("identity")).toBeEmptyDOMElement();
    expect(
      fetchMock.mock.calls.find((call) => call[0] === "/api/auth/logout")?.[1],
    ).toMatchObject({ method: "POST", body: "{}" });
    expect(refreshRouter).toHaveBeenCalled();
  });
  it("account switch clears old cart/profile and never merges the prior account cart", async () => {
    render(
      <Providers>
        <Probe />
      </Providers>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("cart")).toHaveTextContent("user-a"),
    );
    current = {
      ...identity,
      user: { ...identity.user, id: "user-b", name: "B" },
    };
    fireEvent(window, new StorageEvent("storage", { key: "mh-auth-change" }));
    await waitFor(() =>
      expect(screen.getByTestId("profile")).toHaveTextContent("B"),
    );
    await waitFor(() =>
      expect(screen.getByTestId("cart")).toHaveTextContent("user-b"),
    );
    expect(screen.getByTestId("cart")).not.toHaveTextContent("user-a");
    expect(refreshRouter).toHaveBeenCalled();
    expect(fetchMock.mock.calls.some((call) => call[0] === "/api/cart")).toBe(
      false,
    );
  });
  it("failed logout does not claim revocation or navigate", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url === "/api/auth/me"
        ? reply(identity)
        : reply(authFailure("INTERNAL_ERROR"), 500),
    );
    render(
      <AuthProvider>
        <Probe />
        <UserNav />
      </AuthProvider>,
    );
    fireEvent.click(await screen.findByText("Logout"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Logout failed");
    expect(screen.getByTestId("identity")).toHaveTextContent("user-a");
    expect(replace).not.toHaveBeenCalled();
  });
});
