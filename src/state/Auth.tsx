"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { AuthSession } from "@/lib/auth-contracts";
import { clientAuth } from "@/lib/client-auth";

type AuthState = {
  session: AuthSession | null;
  status: "loading" | "authenticated" | "unauthenticated" | "error";
};
type AuthContextValue = AuthState & {
  refresh: () => Promise<void>;
  changed: () => Promise<void>;
  logout: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue>({
  session: null,
  status: "loading",
  refresh: async () => {},
  changed: async () => {},
  logout: async () => {},
});
const eventKey = "mh-auth-change";
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    status: "loading",
  });
  const version = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++version.current;
    try {
      const session = await clientAuth("me");
      if (current === version.current)
        setState({
          session,
          status: session ? "authenticated" : "unauthenticated",
        });
    } catch {
      if (current === version.current)
        setState({ session: null, status: "error" });
      throw new Error(
        "Authentication is temporarily unavailable. Please try again.",
      );
    }
  }, []);
  const broadcast = () => {
    try {
      localStorage.setItem(eventKey, `${Date.now()}-${Math.random()}`);
    } catch {
      /* Storage may be disabled. Focus still refreshes. */
    }
  };
  const changed = async () => {
    ++version.current;
    setState({ session: null, status: "loading" });
    broadcast();
    await refresh();
  };
  const logout = async () => {
    await clientAuth("logout");
    ++version.current; // Ignore any /me response started before revocation.
    setState({ session: null, status: "unauthenticated" });
    broadcast();
  };
  useEffect(() => {
    const requestVersion = version;
    const update = () => {
      void refresh().catch(() => {});
    };
    const storage = (event: StorageEvent) => {
      if (event.key !== eventKey) return;
      setState({ session: null, status: "loading" });
      update();
    };
    const visible = () => {
      if (document.visibilityState === "visible") update();
    };
    update();
    window.addEventListener("storage", storage);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", visible);
    return () => {
      ++requestVersion.current;
      window.removeEventListener("storage", storage);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refresh]);
  return (
    <AuthContext.Provider value={{ ...state, refresh, changed, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
