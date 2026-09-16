import prisma from '@/lib/prisma'

export async function getBanners() {
  return prisma.banner.findMany({
    orderBy: { createdAt: 'desc' },
    include: { categories: true },
  })
}
