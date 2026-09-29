import { z } from "zod";
import {
  profileSchema,
  profileSummarySchema,
  addressSchema,
  parsePrivateResponse,
  ProfileAddressesError,
  type ProfilePatch,
  type AddressCreate,
  type AddressPatch,
} from "@/lib/profile-addresses-contracts";
async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  method = "GET",
  body?: object,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ProfileAddressesError(503);
  }
  if (method === "DELETE") {
    if (response.status !== 204)
      throw new ProfileAddressesError(response.status);
    return undefined as T;
  }
  return parsePrivateResponse(response, schema);
}
function addressFields(input: AddressPatch) {
  const { country, address, city, phone, postalCode } = input;
  return { country, address, city, phone, postalCode };
}
const addressPath = (id: string) => `/api/addresses/${encodeURIComponent(id)}`;
export const profileAddresses = {
  profile: () => request("/api/profile", profileSchema),
  summary: () => request("/api/profile/summary", profileSummarySchema),
  updateProfile: ({ name, phone }: ProfilePatch) =>
    request("/api/profile", profileSchema, "PATCH", { name, phone }),
  addresses: () => request("/api/addresses", addressSchema.array()),
  address: (id: string) => request(addressPath(id), addressSchema),
  createAddress: (input: AddressCreate) =>
    request("/api/addresses", addressSchema, "POST", addressFields(input)),
  updateAddress: (id: string, input: AddressPatch) =>
    request(addressPath(id), addressSchema, "PATCH", addressFields(input)),
  deleteAddress: (id: string) => request(addressPath(id), z.void(), "DELETE"),
};
