"use client";

import { useState } from "react";
import Link from "next/link";
import { profileAddresses } from "@/lib/client-profile-addresses";
import {
  profileAddressesMessage,
  type Address,
  type AddressCreate,
} from "@/lib/profile-addresses-contracts";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

type FormState = Required<AddressCreate>;

export default function AddressesClient({
  initialAddresses,
}: {
  initialAddresses: Address[];
}) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [form, setForm] = useState<FormState>({
    country: "IRI",
    address: "",
    city: "",
    phone: "",
    postalCode: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function createAddress(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const addr = await profileAddresses.createAddress(form);
      setAddresses((prev) => [addr, ...prev]);
      toast.success("Address added.");
    } catch (err: unknown) {
      toast.error(profileAddressesMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function deleteAddress(id: string) {
    setLoading(true);
    try {
      await profileAddresses.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Address removed.");
    } catch (err: unknown) {
      toast.error(profileAddressesMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        className="grid gap-3 rounded-md border p-4"
        onSubmit={createAddress}
      >
        <div className="grid gap-1">
          <label className="text-sm font-medium">Country</label>
          <input
            className="rounded-md border px-3 py-2 text-sm"
            value={form.country}
            onChange={(e) => handleChange("country", e.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium">Address</label>
          <input
            className="rounded-md border px-3 py-2 text-sm"
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
            required
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium">City</label>
          <input
            className="rounded-md border px-3 py-2 text-sm"
            value={form.city}
            onChange={(e) => handleChange("city", e.target.value)}
            required
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium">Phone</label>
          <input
            className="rounded-md border px-3 py-2 text-sm"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            required
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium">Postal code</label>
          <input
            className="rounded-md border px-3 py-2 text-sm"
            value={form.postalCode}
            onChange={(e) => handleChange("postalCode", e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Add address"}
        </Button>
      </form>

      <div className="space-y-3">
        {addresses.length === 0 && (
          <p className="text-sm text-neutral-600">No addresses saved.</p>
        )}
        {addresses.map((addr) => (
          <div key={addr.id} className="rounded-md border p-4 space-y-1">
            <p className="text-sm font-semibold">{addr.address}</p>
            <p className="text-sm text-neutral-600">
              {addr.city}, {addr.country} — {addr.postalCode}
            </p>
            <p className="text-sm text-neutral-600">Phone: {addr.phone}</p>
            <Link href={`/profile/addresses/${encodeURIComponent(addr.id)}`}>
              Edit
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteAddress(addr.id)}
              disabled={loading}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
