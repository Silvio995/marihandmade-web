"use client";
import { useAuth } from "@/state/Auth";
import { useWishlist } from "@/state/Wishlist";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ProductGrid,
  ProductSkeletonGrid,
} from "@/components/native/ProductGrid";
export default function WishlistPage() {
  const { status } = useAuth();
  const { items, loading, error, refresh, remove, pending } = useWishlist();
  const router = useRouter();
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);
  if (status === "error")
    return (
      <p role="alert">
        Authentication is temporarily unavailable. Please try again.
      </p>
    );
  if (status === "unauthenticated") return null;
  const products = items.flatMap((item) =>
    item.visibility === "PUBLIC" ? [item.product] : [],
  );
  const unavailable = items.filter((item) => item.visibility === "UNAVAILABLE");
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Wishlist</h1>
      {error && (
        <p role="alert">
          {error} <button onClick={() => void refresh()}>Try again</button>
        </p>
      )}
      {status === "loading" || loading ? (
        <ProductSkeletonGrid />
      ) : (
        <>
          {!error && items.length === 0 && (
            <p className="text-sm text-neutral-600">
              Nessun articolo in wishlist.
            </p>
          )}
          {products.length > 0 && <ProductGrid products={products} />}
          {unavailable.length > 0 && (
            <ul className="mt-4 space-y-3">
              {unavailable.map((item) => (
                <li key={item.productId}>
                  <span>This saved product is no longer available.</span>{" "}
                  <button
                    disabled={pending.has(item.productId)}
                    onClick={() => void remove(item.productId).catch(() => {})}
                  >
                    Remove from Wishlist
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
