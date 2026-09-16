import BlogPostGrid from '@/components/native/BlogCard'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getBlogs() {
   return prisma.blog.findMany({
      include: { author: true },
   })
}

type BlogsWithAuthor = Awaited<ReturnType<typeof getBlogs>>

export default async function Index() {
   const blogs: BlogsWithAuthor = await getBlogs()

   return (
      <div className="flex flex-col border-neutral-200 dark:border-neutral-700">
         <h3 className="mb-6 text-2xl font-bold tracking-tight md:text-4xl">
            Blog Posts
         </h3>

         <BlogPostGrid blogs={blogs} />
      </div>
   )
}
