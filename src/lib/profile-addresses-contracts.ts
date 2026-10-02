import { z } from "zod";
import { productDto } from "@/lib/api/contracts";
import type { ProductWithIncludes } from "@/types/product";
export const profileSchema = z.object({
  name: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  birthday: z.string().nullable(),
});
export const addressSchema = z.object({
  id: z.string(),
  country: z.string(),
  address: z.string(),
  city: z.string(),
  phone: z.string(),
  postalCode: z.string(),
  createdAt: z.string().datetime(),
});
export type Profile = z.infer<typeof profileSchema>;
export type ProfilePatch = { name?: string | null; phone?: string | null };
export type Address = z.infer<typeof addressSchema>;
export type AddressCreate = Pick<
  Address,
  "address" | "city" | "phone" | "postalCode"
> & { country?: string };
export type AddressPatch = Partial<Required<AddressCreate>>;
// Transitional product/cart data retains its existing domain shape.
const product = z.custom<ProductWithIncludes>(
  (value) =>
    !!value && typeof value === "object" && typeof value.id === "string",
);
export const profileSummarySchema = profileSchema.extend({
  addresses: addressSchema.array(),
  wishlist: productDto.array(),
  cart: z
    .object({
      items: z
        .object({
          productId: z.string(),
          count: z.number(),
          variantId: z.string().nullable().optional(),
          product: product.nullable().optional(),
        })
        .passthrough()
        .array(),
    })
    .passthrough()
    .nullable(),
});
export type ProfileSummary = z.infer<typeof profileSummarySchema>;
export class ProfileAddressesError extends Error {
  constructor(public readonly status: number) {
    super(
      status === 401
        ? "Your session has expired. Please sign in again."
        : status === 403
          ? "This request is not permitted."
          : status === 404
            ? "The requested profile or address was not found."
            : status === 409
              ? "This change conflicts with existing data. The phone may be unavailable or the address may be linked to an order."
              : [400, 413, 414, 415].includes(status)
                ? "Please check the submitted fields and try again."
                : "Profile and addresses are temporarily unavailable. Please try again.",
    );
    this.name = "ProfileAddressesError";
  }
}
export function profileAddressesMessage(error: unknown) {
  return (
    error instanceof ProfileAddressesError
      ? error
      : new ProfileAddressesError(503)
  ).message;
}
export async function parsePrivateResponse<T>(
  response: Response,
  schema: z.ZodType<T>,
): Promise<T> {
  if (!response.ok) throw new ProfileAddressesError(response.status);
  try {
    return schema.parse(await response.json());
  } catch {
    throw new ProfileAddressesError(503);
  }
}
