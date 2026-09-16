import { getAuthOptions } from '@/lib/auth'
import NextAuth from 'next-auth'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

function getHandler() {
  return NextAuth(getAuthOptions())
}

export async function GET(req: NextRequest, context: { params: { nextauth: string[] } }) {
  return getHandler()(req, context)
}

export async function POST(req: NextRequest, context: { params: { nextauth: string[] } }) {
  return getHandler()(req, context)
}
