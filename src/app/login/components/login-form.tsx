"use client";

import { Button } from "@/components/ui/button";
import { clientAuth, safeCallback } from "@/lib/client-auth";
import { useAuth } from "@/state/Auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function LoginForm() {
  const auth = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const email = formData.get("email")?.toString() ?? "";
      const password = formData.get("password")?.toString() ?? "";

      await clientAuth("login", { email, password });
      await auth.changed();
      const target = safeCallback(
        new URLSearchParams(window.location.search).get("callbackUrl"),
        window.location.origin,
      );
      router.replace(target);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Authentication unavailable",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit(new FormData(event.currentTarget));
      }}
    >
      <div className="grid gap-1">
        <label className="text-sm font-medium">Email</label>
        <input
          name="email"
          type="email"
          className="rounded-md border px-3 py-2 text-sm"
          required
        />
      </div>
      <div className="grid gap-1">
        <label className="text-sm font-medium">Password</label>
        <input
          name="password"
          type="password"
          className="rounded-md border px-3 py-2 text-sm"
          required
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Loading..." : "Login"}
      </Button>
      <Link href="/signup" className="text-sm underline">
        Create an account
      </Link>
      <Link href="/reset" className="text-sm underline">
        Forgot password?
      </Link>
    </form>
  );
}
