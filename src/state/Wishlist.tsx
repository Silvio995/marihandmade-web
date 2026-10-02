"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/state/Auth";
import { clientWishlist } from "@/lib/client-wishlist";
import {
  WishlistError,
  wishlistMessage,
  type WishlistItem,
} from "@/lib/wishlist-contracts";
const channelName = "mh-wishlist-invalidated";
type WishlistState = {
  items: WishlistItem[];
  membership: ReadonlySet<string>;
  pending: ReadonlySet<string>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  add: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
};
const WishlistContext = createContext<WishlistState | null>(null);
export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) throw new Error("WishlistProvider is required");
  return value;
}
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const userId =
    auth.status === "authenticated" ? auth.session!.user.id : undefined;
  const [snapshot, setSnapshot] = useState<{
    userId?: string;
    items: WishlistItem[];
    membership: Set<string>;
  }>({ items: [], membership: new Set() });
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const identity = useRef(userId);
  identity.current = userId;
  const version = useRef(0);
  const alive = useRef(true);
  const lifetime = useRef(0);
  const running = useRef<Promise<void> | null>(null);
  const mutations = useRef(new Set<string>());
  const channel = useRef<BroadcastChannel | null>(null);
  const authRefresh = useRef(auth.refresh);
  authRefresh.current = auth.refresh;
  const refresh = useCallback((): Promise<void> => {
    if (!userId || identity.current !== userId || !alive.current)
      return Promise.resolve();
    if (running.current) return running.current;
    if (mutations.current.size) return Promise.resolve();
    const current = ++version.current;
    setLoading(true);
    const valid = () =>
      alive.current &&
      identity.current === userId &&
      current === version.current;
    const task = (async () => {
      try {
        const result = await clientWishlist.get();
        if (valid()) {
          setSnapshot({
            userId,
            items: result.items,
            membership: new Set(result.items.map((item) => item.productId)),
          });
          setError(null);
        }
      } catch (failure) {
        if (valid()) {
          setError(wishlistMessage(failure));
          if (failure instanceof WishlistError && failure.status === 401)
            void authRefresh.current().catch(() => {});
        }
      } finally {
        if (valid()) setLoading(false);
      }
    })();
    running.current = task;
    void task.finally(() => {
      if (running.current === task) running.current = null;
    });
    return task;
  }, [userId]);
  useEffect(() => {
    const requestLifetime = lifetime;
    const requestVersion = version;
    alive.current = true;
    ++lifetime.current;
    ++version.current;
    running.current = null;
    mutations.current.clear();
    setSnapshot({ userId, items: [], membership: new Set() });
    setPending(new Set());
    setError(null);
    setLoading(!!userId);
    void Promise.resolve().then(refresh);
    return () => {
      alive.current = false;
      ++requestLifetime.current;
      ++requestVersion.current;
      running.current = null;
    };
  }, [userId, refresh]);
  useEffect(() => {
    const invalidate = () => {
      ++version.current;
      running.current = null;
      void refresh();
    };
    window.addEventListener("focus", invalidate);
    const visible = () => {
      if (document.visibilityState === "visible") invalidate();
    };
    document.addEventListener("visibilitychange", visible);
    // Messages contain invalidation only: no product data, identity or persistence.
    if (typeof BroadcastChannel !== "undefined") {
      const connection = new BroadcastChannel(channelName);
      channel.current = connection;
      connection.onmessage = invalidate;
    }
    return () => {
      window.removeEventListener("focus", invalidate);
      document.removeEventListener("visibilitychange", visible);
      channel.current?.close();
      channel.current = null;
    };
  }, [refresh]);
  const mutate = async (productId: string, present: boolean) => {
    if (!userId || !alive.current || mutations.current.has(productId)) return;
    const owner = userId;
    const epoch = lifetime.current;
    let mutationError: string | null = null;
    const valid = () =>
      alive.current && identity.current === owner && lifetime.current === epoch;
    mutations.current.add(productId);
    ++version.current;
    running.current = null;
    setPending(new Set(mutations.current));
    try {
      await (present
        ? clientWishlist.add(productId)
        : clientWishlist.remove(productId));
      if (!valid()) return;
      setSnapshot((previous) => {
        const membership = new Set(
          previous.userId === owner ? previous.membership : [],
        );
        if (present) membership.add(productId);
        else membership.delete(productId);
        return {
          userId: owner,
          membership,
          items: present
            ? previous.items
            : previous.items.filter((item) => item.productId !== productId),
        };
      });
      setError(null);
      channel.current?.postMessage("invalidate");
    } catch (failure) {
      mutationError = wishlistMessage(failure);
      if (valid()) {
        setError(mutationError);
        if (failure instanceof WishlistError && failure.status === 401)
          void authRefresh.current().catch(() => {});
      }
      // A failed/lost response may still have committed; reconcile but keep the
      // mutation failure visible until a deliberate successful refresh/action.
      throw failure;
    } finally {
      if (valid()) {
        mutations.current.delete(productId);
        setPending(new Set(mutations.current));
        ++version.current;
        running.current = null;
        if (!mutations.current.size) await refresh();
        if (valid() && mutationError) setError(mutationError);
      }
    }
  };
  const owned = !!userId && snapshot.userId === userId;
  return (
    <WishlistContext.Provider
      value={{
        items: owned ? snapshot.items : [],
        membership: owned ? snapshot.membership : new Set(),
        pending: userId ? pending : new Set(),
        loading: userId ? loading : false,
        error: userId ? error : null,
        refresh,
        add: (id) => mutate(id, true),
        remove: (id) => mutate(id, false),
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}
