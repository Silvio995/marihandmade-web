import { getProducts, getProductById } from '@/lib/api/catalog'
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET(_req: Request, { params }: { params: { productId: string } }) {
  try {
    const data = await getProductById(params.productId)
    if (data === null) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch { return NextResponse.json({ error: 'Catalog temporarily unavailable' }, { status: 503 }) }
}
