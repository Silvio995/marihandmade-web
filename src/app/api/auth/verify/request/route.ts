import prisma from '@/lib/prisma'
import {
  buildNeutralAccountEmailResponse,
  isAuthEmailRequestThrottled,
  markAuthEmailRequestSent,
} from '@/lib/auth-request-throttle'
import { sendEmail } from '@/lib/resend'
import { getErrorResponse } from '@/lib/utils'
import { isEmailValid } from '@persepolis/regex'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

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
    if (!user) {
      return NextResponse.json(buildNeutralAccountEmailResponse())
    }

    if (await isAuthEmailRequestThrottled(user.id)) {
      return NextResponse.json(buildNeutralAccountEmailResponse())
    }

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

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/verify/${token}`
    await sendEmail({
      tag: 'auth-verify',
      to: normalizedEmail,
      subject: 'Verify your email',
      text: `Click to verify your email: ${verifyUrl}`,
      throwOnFailure: true,
    })

    return NextResponse.json(buildNeutralAccountEmailResponse())
  } catch (error) {
    console.error('[AUTH_VERIFY_REQUEST]', error)
    return getErrorResponse(500, 'Internal error')
  }
}
