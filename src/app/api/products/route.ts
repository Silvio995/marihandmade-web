import { getProducts, getProductById } from '@/lib/api/catalog'
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const data = await getProducts()
    if (data === null) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch { return NextResponse.json({ error: 'Catalog temporarily unavailable' }, { status: 503 }) }
}
