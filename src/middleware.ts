import { NextRequest, NextResponse } from 'next/server'

// Keep middleware edge-safe and lightweight.
// Authentication/authorization is enforced in API route handlers using Auth.js session checks.
export async function middleware(req: NextRequest) {
   if (req.nextUrl.pathname.startsWith('/api/auth')) return NextResponse.next()
   return NextResponse.next()
}

export const config = {
   matcher: [
      '/profile/:path*',
      '/wishlist/:path*',
   ],
}
