import { NextResponse } from 'next/server'

// Legacy customer auth cleanup only. Auth.js session logout happens client-side via next-auth signOut().
export async function POST() {
   const response = NextResponse.json({ ok: true })
   response.cookies.delete('token')
   response.cookies.delete('logged-in')
   return response
}

export async function GET() {
   return NextResponse.json(
      { error: 'Use Auth.js signOut for customer logout' },
      { status: 405 }
   )
}
