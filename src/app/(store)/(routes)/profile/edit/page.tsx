import { readPrivatePage } from "@/lib/server-profile-addresses";
import { profileSchema } from "@/lib/profile-addresses-contracts";
import ProfileForm from "./components/server-profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await readPrivatePage("/api/profile", profileSchema);

  return (
    <div className="max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Profilo</h1>
      <ProfileForm initialData={user} />
    </div>
  );
}
