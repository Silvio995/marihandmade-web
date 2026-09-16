import CategoryCollection from '@/components/native/CategoryCollection'
import { getCategories, getProducts } from '@/lib/api/catalog'
import { getPrimaryImageUrl } from '@/lib/product-display'
import { getSafeImageSrc } from '@/lib/safe-image'
import { notFound } from 'next/navigation'
export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = (await getCategories()).find(c => c.slug === params.slug)
  if (!category) notFound()
  const products = (await getProducts()).filter(p => p.categories.some(c => c.id === category.id))
  return <CategoryCollection category={{ title: category.title, description: category.description ?? undefined, heroImage: getSafeImageSrc(category.banners[0]?.image, getPrimaryImageUrl(products[0])) }} products={products} variant="retail" />
}
