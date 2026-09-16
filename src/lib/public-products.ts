import type { Prisma } from '@/generated/client'
import { ProductStatus } from '@/generated/client'

/**
 * Public storefront visibility boundary for catalog products.
 * Priority rule:
 * - Prefer explicit ACTIVE publication state.
 * - Keep legacy fallback (status null + isAvailable true) only for old records.
 * - Respect publication date when set.
 */
export function getPublicProductWhere(now: Date = new Date()): Prisma.ProductWhereInput {
  return {
    AND: [
      {
        OR: [
          { status: ProductStatus.ACTIVE },
          {
            AND: [{ status: null }, { isAvailable: true }],
          },
        ],
      },
      {
        OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
      },
    ],
  }
}

export function withPublicProductWhere(
  where: Prisma.ProductWhereInput = {},
  now: Date = new Date()
): Prisma.ProductWhereInput {
  return {
    AND: [getPublicProductWhere(now), where],
  }
}
