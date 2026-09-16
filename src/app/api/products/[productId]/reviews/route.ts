import prisma from '@/lib/prisma'
import { withPublicProductWhere } from '@/lib/public-products'
import { ReviewStatus } from '@/generated/client'
import { isEmailValid } from '@persepolis/regex'
import { NextResponse } from 'next/server'
import { ZodError, z } from 'zod'

const POST_HEADERS = {
   'Cache-Control': 'no-store',
   'Content-Type': 'application/json',
}

const GET_HEADERS = {
   'Cache-Control': 'no-store',
}

function getPostErrorResponse(
   status: number,
   message: string,
   errors: ZodError | null = null
) {
   console.error({ errors, status, message })

   return new NextResponse(
      JSON.stringify({
         status: status < 500 ? 'fail' : 'error',
         message,
         errors: errors ? errors.flatten() : null,
      }),
      {
         status,
         headers: POST_HEADERS,
      }
   )
}

const createReviewSchema = z.object({
   customerName: z
      .string()
      .trim()
      .min(2, 'Customer name must be at least 2 characters.')
      .max(80, 'Customer name must be at most 80 characters.'),
   customerEmail: z
      .string()
      .trim()
      .max(120, 'Email must be at most 120 characters.')
      .optional()
      .refine((value) => !value || isEmailValid(value), 'Invalid email'),
   rating: z
      .number({ invalid_type_error: 'Rating must be a number.' })
      .int('Rating must be an integer.')
      .min(1, 'Rating must be between 1 and 5.')
      .max(5, 'Rating must be between 1 and 5.'),
   title: z
      .string()
      .trim()
      .max(120, 'Title must be at most 120 characters.')
      .optional(),
   body: z
      .string()
      .trim()
      .min(10, 'Review body must be at least 10 characters.')
      .max(1000, 'Review body must be at most 1000 characters.'),
   website: z.string().trim().optional(),
})

async function findPublicProductByIdentifier(productId: string) {
   return prisma.product.findFirst({
      where: withPublicProductWhere({
         OR: [{ id: productId }, { slug: productId }],
      }),
      select: { id: true, slug: true },
   })
}

function emptyBreakdown() {
   return {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
   }
}

export async function GET(
   _req: Request,
   { params }: { params: { productId: string } }
) {
   try {
      const productId = params.productId?.trim()
      if (!productId) {
         return new NextResponse('Product slug is required', { status: 400 })
      }

      const product = await findPublicProductByIdentifier(productId)
      if (!product) {
         return new NextResponse('Product not found', { status: 404 })
      }

      const reviews = await prisma.review.findMany({
         where: {
            productId: product.id,
            status: ReviewStatus.APPROVED,
         },
         orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
         select: {
            id: true,
            customerName: true,
            rating: true,
            title: true,
            body: true,
            isFeatured: true,
            createdAt: true,
         },
      })

      const ratingBreakdown = emptyBreakdown()
      let ratingTotal = 0

      for (const review of reviews) {
         ratingBreakdown[review.rating as keyof typeof ratingBreakdown] += 1
         ratingTotal += review.rating
      }

      const reviewCount = reviews.length
      const averageRating =
         reviewCount > 0 ? Number((ratingTotal / reviewCount).toFixed(2)) : 0

      return NextResponse.json(
         {
            productSlug: product.slug,
            averageRating,
            reviewCount,
            ratingBreakdown,
            reviews: reviews.map((review) => ({
               ...review,
               createdAt: review.createdAt.toISOString(),
            })),
         },
         {
            headers: GET_HEADERS,
         }
      )
   } catch (error) {
      console.error('[PRODUCT_REVIEWS_GET]', error)
      return new NextResponse('Internal error', { status: 500 })
   }
}

export async function POST(
   req: Request,
   { params }: { params: { productId: string } }
) {
   try {
      const productId = params.productId?.trim()
      if (!productId) {
         return new NextResponse('Product slug is required', {
            status: 400,
            headers: POST_HEADERS,
         })
      }

      const product = await findPublicProductByIdentifier(productId)
      if (!product) {
         return new NextResponse('Product not found', {
            status: 404,
            headers: POST_HEADERS,
         })
      }

      const parsed = createReviewSchema.parse(await req.json())

      if (parsed.website) {
         return NextResponse.json(
            {
               status: 'success',
               message: 'Thanks. Your review is waiting for approval.',
            },
            {
               status: 200,
               headers: POST_HEADERS,
            }
         )
      }

      await prisma.review.create({
         data: {
            productId: product.id,
            customerName: parsed.customerName,
            customerEmail: parsed.customerEmail || null,
            rating: parsed.rating,
            title: parsed.title || null,
            body: parsed.body,
            status: ReviewStatus.PENDING,
         },
      })

      return NextResponse.json(
         {
            status: 'success',
            message: 'Thanks. Your review is waiting for approval.',
         },
         {
            status: 201,
            headers: POST_HEADERS,
         }
      )
   } catch (error) {
      if (error instanceof ZodError) {
         return getPostErrorResponse(400, 'Invalid review payload', error)
      }

      console.error('[PRODUCT_REVIEWS_POST]', error)
      return getPostErrorResponse(500, 'Internal error')
   }
}
