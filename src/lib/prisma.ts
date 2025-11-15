import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'], // Disabled query logging for better performance
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
