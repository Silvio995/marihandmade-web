import { NextResponse } from 'next/server'

export async function POST(
  _req: Request,
  _context: { params: { orderId: string } }
) {
  return new NextResponse('Not found', { status: 404 })
}
