import MDXComponents from '@/components/native/mdx/MDXComponents'
import { Separator } from '@/components/native/separator'
import prisma from '@/lib/prisma'
import { format } from 'date-fns'
import { MDXRemote } from 'next-mdx-remote'
import type { MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

async function getBlog(slug: string) {
   return prisma.blog.findUnique({
      where: {
         slug,
      },
      include: { author: true },
   })
}

async function getRecommendations(currentSlug: string) {
   return prisma.blog.findMany({
      where: {
         NOT: {
            slug: currentSlug,
         },
      },
      include: { author: true },
      take: 3,
   })
}

type BlogWithAuthor = NonNullable<Awaited<ReturnType<typeof getBlog>>>
type BlogRecommendation = Awaited<ReturnType<typeof getRecommendations>>
type RecommendationItem = BlogRecommendation[number]

export default async function Blog({ params }: { params: { slug: string } }) {
   const blog = await getBlog(params.slug)

   if (!blog) {
      notFound()
   }

   const recommendations = await getRecommendations(blog.slug)
   const mdx = await serialize(blog.content ?? '')

   return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
         <Content blog={blog} mdx={mdx} />
         <Recommendations recommendations={recommendations} />
      </div>
   )
}

function Content({
   blog,
   mdx,
}: {
   blog: BlogWithAuthor
   mdx: MDXRemoteSerializeResult
}) {
   const { title, updatedAt, author } = blog

   return (
      <div className="rounded-lg bg-white p-6 text-justify text-neutral-900 dark:bg-neutral-800 dark:text-neutral-200 md:col-span-3">
         <h1 className="mb-1 text-3xl font-medium">{title}</h1>
         <p className="mt-2 text-sm font-medium text-neutral-400">
            {author?.name ? `${author.name} • ` : ''}
            {updatedAt ? format(updatedAt, 'PPP') : 'Updated'}
         </p>
         <Separator />
         <MDXRemote lazy {...mdx} components={MDXComponents} />
      </div>
   )
}

function Recommendations({
   recommendations,
}: {
   recommendations: BlogRecommendation
}) {
   return (
      <div className="col-span-1">
         {recommendations.map((rec: RecommendationItem) => {
            const { slug, author, updatedAt, title, image } = rec

            return (
               <div key={slug} className="mb-4 w-full">
                  <Link href={`/blog/${slug}`}>
                     <div className="w-full rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
                        <div className="relative h-40 w-full">
                           <Image
                              className="rounded-t-lg"
                              src={image}
                              alt="Blog Post Cover"
                              fill
                              sizes="(min-width: 1000px) 30vw, 50vw"
                              style={{ objectFit: 'cover' }}
                           />
                        </div>
                        <div className="p-5">
                           <div className="w-full">
                              <h5 className="mb-3 text-justify font-medium tracking-tight text-neutral-900 dark:text-white">
                                 {title}
                              </h5>
                              <p className="block text-sm text-neutral-700 dark:text-neutral-400">
                                 <span>
                                    {author?.name ?? 'Autore'}
                                    {updatedAt ? `, ${format(updatedAt, 'PPP')}` : ''}
                                 </span>
                              </p>
                           </div>
                        </div>
                     </div>
                  </Link>
               </div>
            )
         })}
      </div>
   )
}
