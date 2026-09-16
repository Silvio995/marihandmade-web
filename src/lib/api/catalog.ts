import 'server-only'
import { z } from 'zod'
import { productDto, categoryListDto, brandDto } from './contracts'

export class CatalogUnavailableError extends Error {
  constructor() { super('Catalogo temporaneamente non disponibile. Riprova più tardi.'); this.name = 'CatalogUnavailableError' }
}
async function read<T>(path: string, schema: z.ZodType<T>, allowNotFound = false): Promise<T | null> {
  try {
    const base = process.env.MARIHANDMADE_API_URL
    if (!base) throw new CatalogUnavailableError()
    const url = new URL(`${base.replace(/\/$/, '')}/api/${path}`)
    if (!['http:', 'https:'].includes(url.protocol)) throw new CatalogUnavailableError()
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (allowNotFound && response.status === 404) return null
    if (!response.ok) throw new CatalogUnavailableError()
    return schema.parse(await response.json())
  } catch { throw new CatalogUnavailableError() }
}
export async function getProducts() { return (await read('products', z.array(productDto)))! }
export async function getCategories() { return (await read('categories', z.array(categoryListDto)))! }
export async function getBrands() { return (await read('brands', z.array(brandDto)))! }
export async function getProductById(identifier: string) {
  return read(`products/${encodeURIComponent(identifier)}`, productDto, true)
}
