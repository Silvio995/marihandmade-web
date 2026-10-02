"use client";
import { Heart } from "lucide-react";
import { useAuth } from "@/state/Auth";
import { useWishlist } from "@/state/Wishlist";
import { useState } from "react";
import { wishlistMessage } from "@/lib/wishlist-contracts";
export default function WishlistButton({
  productId,
  compact = false,
}: {
  productId: string;
  compact?: boolean;
}) {
  const { status } = useAuth();
  const { membership, pending, loading, add, remove, error, refresh } =
    useWishlist();
  const [actionError, setActionError] = useState<string | null>(null);
  const saved = membership.has(productId);
  const label =
    status !== "authenticated"
      ? "Sign in to save to Wishlist"
      : saved
        ? "Remove from Wishlist"
        : "Add to Wishlist";
  return (
    <div className={compact ? "relative" : "flex flex-col gap-2"}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={saved}
        disabled={
          status !== "authenticated" ||
          loading ||
          !!error ||
          pending.has(productId)
        }
        className={
          compact
            ? "rounded-full bg-white/95 p-2 text-neutral-900 shadow-sm disabled:opacity-60"
            : "inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm disabled:opacity-60"
        }
        onClick={() => {
          setActionError(null);
          void (saved ? remove(productId) : add(productId)).catch((failure) =>
            setActionError(wishlistMessage(failure)),
          );
        }}
      >
        <Heart
          className="h-4 w-4"
          fill={saved ? "currentColor" : "none"}
          aria-hidden="true"
        />
        {!compact && label}
      </button>
      {(actionError || error) && (
        <p
          role="alert"
          className={
            compact
              ? "absolute right-0 top-full z-20 w-56 rounded bg-white p-2 text-xs text-neutral-900"
              : "text-sm"
          }
        >
          {actionError || error}{" "}
          <button
            type="button"
            onClick={() => {
              setActionError(null);
              void refresh();
            }}
          >
            Try Wishlist again
          </button>
        </p>
      )}
    </div>
  );
}
