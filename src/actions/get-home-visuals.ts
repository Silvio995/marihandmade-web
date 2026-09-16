import prisma from '@/lib/prisma'

/**
 * @deprecated Home storefront boundary is hardcoded in app/page.tsx + data/homepage-editorial.ts.
 * This DB-driven helper is intentionally kept as legacy and is not used by the home page.
 */
export async function getHomeVisuals() {
  const [hero, slides] = await Promise.all([
    prisma.homeHero.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.homeCarouselSlide.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    }),
  ])

  return { hero, slides }
}
