import { getServerAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { readPrivatePage } from "@/lib/server-profile-addresses";
import { addressSchema } from "@/lib/profile-addresses-contracts";

import { AddressForm } from "./components/address-form";

export default async function AddressPage({
  params,
}: {
  params: { addressId: string };
}) {
  const session = await getServerAuthSession();
  if (!session) redirect("/login");
  const address =
    params.addressId === "new"
      ? null
      : await readPrivatePage(
          `/api/addresses/${encodeURIComponent(params.addressId)}`,
          addressSchema,
        );
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <AddressForm initialData={address} />
      </div>
    </div>
  );
}
