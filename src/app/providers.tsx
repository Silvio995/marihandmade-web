"use client";
import { CartContextProvider } from "@/state/Cart";
import { UserContextProvider } from "@/state/User";
import { AuthProvider, useAuth } from "@/state/Auth";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
function IdentityProviders({ children }: { children: React.ReactNode }) {
  const { session, status } = useAuth();
  const router = useRouter();
  const previousIdentity = useRef<string>();
  // Discard profile, cart, and descendant state on logout/account changes/errors.
  const identity = status === "authenticated" ? session!.user.id : status;
  useEffect(() => {
    if (status === "loading") return;
    if (
      previousIdentity.current !== undefined &&
      previousIdentity.current !== identity
    )
      router.refresh();
    previousIdentity.current = identity;
  }, [identity, status, router]);
  return (
    <>
      {status === "error" && (
        <p role="alert">
          Authentication is temporarily unavailable. Reload to try again.
        </p>
      )}
      <UserContextProvider key={identity}>
        <CartContextProvider>
          {children}
          <Toaster position="top-right" />
        </CartContextProvider>
      </UserContextProvider>
    </>
  );
}
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <IdentityProviders>{children}</IdentityProviders>
    </AuthProvider>
  );
}
