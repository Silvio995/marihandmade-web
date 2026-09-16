import prisma from '@/lib/prisma'
import {
  buildNeutralAccountEmailResponse,
  isAuthEmailRequestThrottled,
  markAuthEmailRequestSent,
} from '@/lib/auth-request-throttle'
import { getErrorResponse } from '@/lib/utils'
import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { isEmailValid } from '@persepolis/regex'
import { sendPasswordResetEmail } from '@/lib/password-reset-email'

export async function POST(req: Request) {
  try {
    const body = req.headers.get('content-type')?.includes('application/json')
      ? await req.json()
      : Object.fromEntries(new URLSearchParams(await req.text()))
    const email = (body as any)?.email
    const normalizedEmail = email?.toString().trim().toLowerCase()
    if (!normalizedEmail || !isEmailValid(normalizedEmail)) {
      return getErrorResponse(400, 'Invalid email')
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } })
    if (user && !(await isAuthEmailRequestThrottled(user.id))) {
      const token = crypto.randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + 1000 * 60 * 60) // 1h
      await markAuthEmailRequestSent(user.id)
      await prisma.verificationToken.create({
        data: {
          identifier: normalizedEmail,
          token,
          expires,
        },
      })
      await sendPasswordResetEmail({ email: normalizedEmail, token })
    }

    return NextResponse.json(buildNeutralAccountEmailResponse())
  } catch (error) {
    console.error('[AUTH_RESET_REQUEST]', error)
    return getErrorResponse(500, 'Internal error')
  }
}
