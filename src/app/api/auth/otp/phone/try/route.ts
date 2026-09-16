import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
   void req

   // Legacy customer OTP login is disabled. Storefront customer auth is handled by Auth.js.
   return NextResponse.json(
      { error: 'Legacy OTP customer login is no longer available.' },
      { status: 410 }
   )
}
