import "server-only";
import { cookies } from "next/headers";
import { requestBackendAuth, AuthUnavailableError } from "@/lib/api/auth";
import { authSessionSchema } from "@/lib/auth-contracts";

export async function getServerAuthSession() {
  const result = await requestBackendAuth("me", {
    cookie: cookies().toString(),
  });
  if (result.status === 401) return null;
  if (result.status !== 200) throw new AuthUnavailableError();
  return authSessionSchema.parse(result.body);
}
export async function getCurrentUserId() {
  return (await getServerAuthSession())?.user.id;
}
export async function getRequiredUserId() {
  return (await getCurrentUserId()) ?? null;
}
