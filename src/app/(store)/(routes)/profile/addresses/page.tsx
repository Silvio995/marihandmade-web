import { readPrivatePage } from "@/lib/server-profile-addresses";
import { addressSchema } from "@/lib/profile-addresses-contracts";
import AddressesClient from "./components/addresses-client";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const addresses = await readPrivatePage(
    "/api/addresses",
    addressSchema.array(),
  );

  return (
    <div className="max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Indirizzi</h1>
      <AddressesClient initialAddresses={addresses} />
    </div>
  );
}
