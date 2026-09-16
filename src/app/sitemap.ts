import { getProducts } from '@/lib/api/catalog'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const URL = process.env.NEXT_PUBLIC_URL

export default async function sitemap() {
   const products = (await getProducts()).map(product => ({ url: `${URL}/products/${encodeURIComponent(product.slug ?? product.id)}` }))

   const blogs = (await prisma.blog.findMany()).map(
      (blog: { slug: string; updatedAt: Date }) => ({
         url: `${URL}/blog/${blog.slug}`,
         lastModified: blog.updatedAt,
      })
   )

   const routes = ['', '/products', '/blog'].map((route) => ({
      url: `${URL}${route}`,
      lastModified: new Date().toISOString(),
   }))

   return [...routes, ...products, ...blogs]
}
