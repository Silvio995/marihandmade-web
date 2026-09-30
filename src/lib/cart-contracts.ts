import { z } from "zod";
import { productDto } from "@/lib/api/contracts";
const id = z
  .string()
  .min(1)
  .max(100)
  .refine((value) => value.trim().length > 0);
const identity = {
  productId: id,
  variantId: id
    .nullable()
    .optional()
    .transform((value) => value ?? null),
};
export const cartMutationSchema = z
  .object({
    operations: z
      .array(
        z.discriminatedUnion("action", [
          z
            .object({
              ...identity,
              action: z.literal("adjust"),
              delta: z
                .number()
                .int()
                .min(-2147483647)
                .max(2147483647)
                .refine((value) => value !== 0),
            })
            .strict(),
          z.object({ ...identity, action: z.literal("remove") }).strict(),
        ]),
      )
      .min(1)
      .max(100),
  })
  .strict();
export type CartMutation = z.infer<typeof cartMutationSchema>;
export type CartOperation = CartMutation["operations"][number];
export const cartDtoSchema = z.object({
  userId: z.string(),
  createdAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime().nullable(),
  items: z.array(
    z.object({
      id: z.string(),
      cartId: z.string(),
      productId: z.string(),
      variantId: z.string().nullable(),
      count: z.number().int().positive(),
      product: productDto.nullable(),
      variant: productDto.shape.variants.element.nullable(),
    }),
  ),
});
export type CartDto = z.infer<typeof cartDtoSchema>;
export class CartError extends Error {
  constructor(
    public readonly status = 503,
    public readonly uncertain = status >= 500,
    public readonly code = "UNAVAILABLE",
  ) {
    super(
      status === 401
        ? "Your session has expired. Please sign in again."
        : status === 409
          ? "Cart could not be changed. Check availability and try again."
          : status === 403
            ? "This cart request is not permitted."
            : status === 400
              ? "Please check the cart quantities."
              : "Cart is temporarily unavailable. Please try again.",
    );
  }
}
export const cartMessage = (error: unknown) =>
  error instanceof CartError ? error.message : new CartError().message;
