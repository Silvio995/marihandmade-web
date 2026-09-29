"use client";

import { useState } from "react";
import { profileAddresses } from "@/lib/client-profile-addresses";
import { profileAddressesMessage } from "@/lib/profile-addresses-contracts";
import { useAuth } from "@/state/Auth";
import { useUserContext } from "@/state/User";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

type Props = {
  initialData: {
    name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
};

export default function ProfileForm({ initialData }: Props) {
  const { refresh } = useAuth();
  const { refreshUser } = useUserContext();
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await profileAddresses.updateProfile({ name, phone });
      await Promise.all([refresh(), refreshUser()]);
      router.refresh();
      toast.success("Profile updated.");
    } catch (err: unknown) {
      toast.error(profileAddressesMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-1">
        <label className="text-sm font-medium">Name</label>
        <input
          className="rounded-md border px-3 py-2 text-sm"
          maxLength={100}
          disabled={loading}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
      </div>
      <div className="grid gap-1">
        <label className="text-sm font-medium">Phone</label>
        <input
          className="rounded-md border px-3 py-2 text-sm"
          maxLength={64}
          disabled={loading}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
        />
      </div>
      <p className="text-sm text-neutral-600">
        Email changes are not supported yet.
      </p>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
