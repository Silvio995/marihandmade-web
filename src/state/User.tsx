"use client";
import { useAuth } from "@/state/Auth";
import { profileAddresses } from "@/lib/client-profile-addresses";
import {
  profileAddressesMessage,
  type ProfileSummary,
} from "@/lib/profile-addresses-contracts";
import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
  useState,
} from "react";

type UserContextValue = {
  user: ProfileSummary | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
};
const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  error: null,
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
    user: ProfileSummary;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const version = useRef(0);
  const refreshUser = useCallback(async () => {
    const current = ++version.current;
    if (status !== "authenticated" || !userId) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const user = await profileAddresses.summary();
      if (current === version.current) {
        setProfile({ id: userId, user });
        setError(null);
      }
    } catch (error) {
      if (current === version.current) setError(profileAddressesMessage(error));
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
      value={{
        user,
        loading: loading || status === "loading",
        error,
        refreshUser,
      }}
    >
      {error && status === "authenticated" && (
        <p role="alert">
          {error} <button onClick={() => void refreshUser()}>Try again</button>
        </p>
      )}
      {children}
    </UserContext.Provider>
  );
}
