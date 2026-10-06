import { z } from "zod";
export const CONTRACT_VERSION = "checkout-orders-v1";
export const idSchema = z
  .string()
  .min(1)
  .max(100)
  .refine((v) => v === v.trim());
const optionalId = z
  .union([idSchema, z.literal(""), z.null()])
  .optional()
  .transform((v) => v || null);
export const lineSchema = z
  .object({
    productId: idSchema,
    variantId: idSchema
      .nullable()
      .optional()
      .transform((v) => v ?? null),
    quantity: z.number().int().min(1).max(2147483647),
  })
  .strict();
export const linesSchema = z.array(lineSchema).min(1).max(100);
export const guestSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1)
      .max(254)
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      .transform((v) => v.toLowerCase()),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    phone: z
      .string()
      .trim()
      .max(50)
      .nullable()
      .optional()
      .transform((v) => v || null),
  })
  .strict();
export const previewBody = z.object({ checkoutLines: linesSchema }).strict();
export const orderBody = z
  .object({
    checkoutLines: linesSchema,
    addressId: optionalId,
    discountCode: z
      .string()
      .max(100)
      .nullable()
      .optional()
      .transform((v) => v || null),
    guest: guestSchema.optional(),
  })
  .strict();
export type Intent = z.infer<typeof orderBody>;
export type Line = z.infer<typeof lineSchema>;
const bytesCompare = (a: string, b: string) => {
  const encoder = new TextEncoder();
  const x = encoder.encode(a),
    y = encoder.encode(b);
  for (let i = 0; i < Math.min(x.length, y.length); i++)
    if (x[i] !== y[i]) return x[i] - y[i];
  return x.length - y.length;
};
export function normalizeLines(lines: Line[]): Line[] {
  const map = new Map<string, Line>();
  for (const line of lines) {
    const key = JSON.stringify([line.productId, line.variantId]);
    const prior = map.get(key);
    const quantity = (prior?.quantity ?? 0) + line.quantity;
    if (!Number.isSafeInteger(quantity) || quantity > 2147483647)
      throw new Error("Quantity overflow");
    map.set(key, { ...line, quantity });
  }
  return [...map.values()].sort(
    (a, b) =>
      bytesCompare(a.productId, b.productId) ||
      (a.variantId === b.variantId
        ? 0
        : a.variantId === null
          ? -1
          : b.variantId === null
            ? 1
            : bytesCompare(a.variantId, b.variantId)),
  );
}
export function fingerprintData(kind: "USER" | "GUEST", input: Intent) {
  return JSON.stringify([
    CONTRACT_VERSION,
    kind,
    normalizeLines(input.checkoutLines).map((l) => [
      l.productId,
      l.variantId,
      l.quantity,
    ]),
    input.addressId,
    input.discountCode,
    input.guest
      ? [
          input.guest.email,
          input.guest.firstName,
          input.guest.lastName,
          input.guest.phone,
        ]
      : null,
  ]);
}
const money = z.string().regex(/^-?\d+\.\d{2}$/);
const date = z.string().datetime();
export const totalsSchema = z
  .object({
    subtotal: money,
    discount: money,
    tax: money,
    shipping: money,
    payable: money,
  })
  .strict();
export const shippingSchema = z
  .object({
    country: z.string(),
    address: z.string(),
    city: z.string(),
    postalCode: z.string(),
    phone: z.string(),
  })
  .strict();
const status = z.enum([
  "Processing",
  "Shipped",
  "Delivered",
  "ReturnProcessing",
  "ReturnCompleted",
  "Cancelled",
  "RefundProcessing",
  "RefundCompleted",
  "Denied",
  "Pending",
]);
const shippingStatus = z.enum(["PENDING", "READY_TO_SHIP", "SHIPPED"]);
export const previewSchema = z
  .object({
    lines: z.array(
      z
        .object({
          productId: idSchema,
          variantId: idSchema.nullable(),
          productTitle: z.string(),
          variantTitle: z.string().nullable(),
          imageUrl: z.string().nullable(),
          quantity: z.number().int().positive(),
          unitPrice: money,
          unitDiscount: money,
          subtotal: money,
          availability: z.literal("AVAILABLE"),
        })
        .strict(),
    ),
    totals: totalsSchema,
    currency: z.literal("EUR"),
    isCheckoutReady: z.boolean(),
    issues: z.array(
      z
        .object({
          productId: idSchema,
          variantId: idSchema.nullable(),
          code: z.string(),
        })
        .strict(),
    ),
  })
  .strict();
export const createdSchema = z
  .object({
    id: idSchema,
    number: z.number().int(),
    status: z.literal("Pending"),
    isPaid: z.literal(false),
    createdAt: date,
    payable: money,
    guestOrderAccessToken: z.string().optional(),
  })
  .strict();
export const summarySchema = z
  .object({
    id: idSchema,
    number: z.number().int(),
    status,
    isPaid: z.boolean(),
    shippingStatus,
    payable: money,
    createdAt: date,
  })
  .strict();
export const listSchema = z
  .object({ items: z.array(summarySchema), nextCursor: z.string().nullable() })
  .strict();
export const detailSchema = summarySchema
  .extend({
    total: money,
    discount: money,
    tax: money,
    shipping: money,
    carrier: z.string().nullable(),
    trackingCode: z.string().nullable(),
    shippedAt: date.nullable(),
    contact: z
      .object({
        email: z.string().nullable(),
        name: z.string().nullable(),
        phone: z.string().nullable(),
        source: z.enum(["COMMITTED", "LEGACY_CURRENT"]),
      })
      .strict(),
    items: z.array(
      z
        .object({
          id: idSchema,
          productId: idSchema,
          variantId: idSchema.nullable(),
          title: z.string().nullable(),
          variantTitle: z.string().nullable(),
          sku: z.string().nullable(),
          imageUrl: z.string().nullable(),
          quantity: z.number().int(),
          unitPrice: money,
          unitDiscount: money,
          snapshotSource: z.enum(["COMMITTED", "LEGACY_CURRENT"]),
        })
        .strict(),
    ),
    shippingAddress: shippingSchema.nullable(),
    addressSource: z.enum(["COMMITTED", "LEGACY_CURRENT", "NONE"]),
  })
  .strict();
export const listQuery = z
  .object({
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().int().min(1).max(100))
      .optional()
      .default("20"),
    cursor: z.string().max(500).optional(),
  })
  .strict();
