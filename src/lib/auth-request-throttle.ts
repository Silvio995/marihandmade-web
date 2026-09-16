import prisma from '@/lib/prisma'

export const AUTH_EMAIL_REQUEST_COOLDOWN_MS = 60 * 1000

export function buildNeutralAccountEmailResponse() {
  return {
    status: 'success' as const,
    message: 'If an account exists, an email has been sent.',
  }
}

export async function isAuthEmailRequestThrottled(userId: string, now: Date = new Date()) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { otpLastSentAt: true },
  })

  const lastSentAt = user?.otpLastSentAt?.getTime() ?? 0
  return now.getTime() - lastSentAt < AUTH_EMAIL_REQUEST_COOLDOWN_MS
}

export async function markAuthEmailRequestSent(userId: string, now: Date = new Date()) {
  await prisma.user.update({
    where: { id: userId },
    data: { otpLastSentAt: now },
  })
}
