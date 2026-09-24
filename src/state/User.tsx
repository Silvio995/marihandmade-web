"use client";
import { useAuth } from "@/state/Auth";
import type { UserWithIncludes } from "@/types/prisma";
import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
  useState,
} from "react";

type UserContextValue = {
  user: UserWithIncludes | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
};
const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});
export const useUserContext = () => useContext(UserContext);
export function UserContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, status } = useAuth();
  const userId = session?.user.id;
  const [profile, setProfile] = useState<{
    id: string;
    user: UserWithIncludes;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const version = useRef(0);
  const refreshUser = useCallback(async () => {
    const current = ++version.current;
    if (status !== "authenticated" || !userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/profile", { cache: "no-store" });
      if (!response.ok) throw new Error("Profile unavailable");
      const user: UserWithIncludes = await response.json();
      if (current === version.current) setProfile({ id: userId, user });
    } catch {
      if (current === version.current) setProfile(null);
    } finally {
      if (current === version.current) setLoading(false);
    }
  }, [status, userId]);
  useEffect(() => {
    const requestVersion = version;
    void refreshUser();
    return () => {
      ++requestVersion.current;
    };
  }, [refreshUser]);
  const user =
    status === "authenticated" && profile && profile.id === userId
      ? profile.user
      : null;
  return (
    <UserContext.Provider
      value={{ user, loading: loading || status === "loading", refreshUser }}
    >
      {children}
    </UserContext.Provider>
  );
}
