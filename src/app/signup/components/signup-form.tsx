"use client";

import { Button } from "@/components/ui/button";
import { clientAuth, safeCallback } from "@/lib/client-auth";
import { useAuth } from "@/state/Auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupForm() {
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
      if (password !== formData.get("confirmPassword"))
        throw new Error("Passwords do not match.");
      await clientAuth("signup", { email, password });
      await auth.changed();
      const target = "/";
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
          minLength={6}
        />
      </div>
      <div className="grid gap-1">
        <label className="text-sm font-medium">Confirm password</label>
        <input
          name="confirmPassword"
          type="password"
          className="rounded-md border px-3 py-2 text-sm"
          required
          minLength={6}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Creating account..." : "Sign up"}
      </Button>
    </form>
  );
}
