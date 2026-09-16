import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { isEmailValid } from '@persepolis/regex'

export async function POST(req: Request) {
  try {
    const body = req.headers.get('content-type')?.includes('application/json')
      ? await req.json()
      : Object.fromEntries(new URLSearchParams(await req.text()))

    const { email, password, confirmPassword } = body as {
      email?: string
      password?: string
      confirmPassword?: string
    }
    const normalizedEmail = email?.toString().trim().toLowerCase()

    if (!normalizedEmail || !isEmailValid(normalizedEmail)) {
      return new NextResponse('Invalid email', { status: 400 })
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return new NextResponse('Password too short', { status: 400 })
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return new NextResponse('Passwords do not match', { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return new NextResponse('Email already registered', { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
      },
    })

    return new NextResponse(null, { status: 201 })
  } catch (error) {
    console.error('[AUTH_SIGNUP]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
