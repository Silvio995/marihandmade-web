import { getFeaturedProducts } from '@/actions/get-featured-products'
import { ProductGrid } from '@/components/native/ProductGrid'

export default async function FeaturedProducts() {
  const products = await getFeaturedProducts()

  if (!products || products.length === 0) return null

  return (
    <section className="container py-16">
      <div className="mb-8 text-center">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-neutral-500">
          Atelier Mari’
        </p>
        <h2 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
          Creazioni in evidenza
        </h2>
      </div>

      <ProductGrid products={products} />
    </section>
  )
}
