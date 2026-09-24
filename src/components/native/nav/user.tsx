"use client";
import { useAuth } from "@/state/Auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function UserNav() {
  const { status, logout } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (status !== "authenticated" && !error) return null;
  async function onLogout() {
    setBusy(true);
    setError("");
    try {
      await logout();
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Logout failed. Please try again.");
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={onLogout}
        className="text-sm underline"
      >
        {busy ? "Logging out…" : "Logout"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
