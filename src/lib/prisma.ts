import path from 'node:path'
import { PrismaClient } from '../generated/client'

// The copied client embeds its old generation directory. Resolve bundled engines locally.
if (!process.env.PRISMA_QUERY_ENGINE_LIBRARY && process.platform === 'linux') {
  const target = process.env.AWS_EXECUTION_ENV ? 'rhel-openssl-3.0.x' : 'debian-openssl-3.0.x'
  process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(process.cwd(), 'src/generated/client', `libquery_engine-${target}.so.node`)
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
