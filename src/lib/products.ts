import { getProducts } from '@/lib/api/catalog'
export async function getFilatiProducts() { return (await getProducts()).filter(p => p.categories.some(c => c.slug === 'filati')) }
