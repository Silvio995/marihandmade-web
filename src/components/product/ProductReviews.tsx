'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StarIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type ReviewItem = {
   id: string
   customerName: string
   rating: number
   title: string | null
   body: string
   isFeatured: boolean
   createdAt: string
}

type RatingBreakdown = {
   5: number
   4: number
   3: number
   2: number
   1: number
}

type ReviewsResponse = {
   productSlug: string
   averageRating: number
   reviewCount: number
   ratingBreakdown: RatingBreakdown
   reviews: ReviewItem[]
}

type ReviewFormState = {
   customerName: string
   customerEmail: string
   rating: number
   title: string
   body: string
   website: string
}

type ApiErrorPayload = {
   message?: string
   errors?: {
      fieldErrors?: Record<string, string[] | undefined>
   } | null
}

const INITIAL_FORM: ReviewFormState = {
   customerName: '',
   customerEmail: '',
   rating: 5,
   title: '',
   body: '',
   website: '',
}

function formatReviewDate(input: string) {
   return new Intl.DateTimeFormat('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
   }).format(new Date(input))
}

function StarRow({
   rating,
   size = 'sm',
}: {
   rating: number
   size?: 'sm' | 'lg'
}) {
   const iconSize = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
   const filledCount = Math.max(0, Math.min(5, Math.round(rating)))

   return (
      <div className="flex items-center gap-1" aria-label={`${rating} su 5`}>
         {Array.from({ length: 5 }).map((_, index) => (
            <StarIcon
               key={index}
               className={`${iconSize} ${
                  index < filledCount
                     ? 'fill-[#c98b46] text-[#c98b46]'
                     : 'text-[#d9c8b4]'
               }`}
            />
         ))}
      </div>
   )
}

export default function ProductReviews({ slug }: { slug: string }) {
   const [data, setData] = useState<ReviewsResponse | null>(null)
   const [loading, setLoading] = useState(true)
   const [loadError, setLoadError] = useState<string | null>(null)
   const [form, setForm] = useState(INITIAL_FORM)
   const [submitting, setSubmitting] = useState(false)
   const [submitError, setSubmitError] = useState<string | null>(null)
   const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
   const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({})

   useEffect(() => {
      let cancelled = false

      async function loadReviews() {
         setLoading(true)
         setLoadError(null)

         try {
            const response = await fetch(`/api/products/${slug}/reviews`, {
               cache: 'no-store',
            })

            if (!response.ok) {
               throw new Error('Non è stato possibile caricare le recensioni.')
            }

            const json = (await response.json()) as ReviewsResponse
            if (!cancelled) {
               setData(json)
            }
         } catch (error) {
            if (!cancelled) {
               setLoadError(
                  error instanceof Error
                     ? error.message
                     : 'Non è stato possibile caricare le recensioni.'
               )
            }
         } finally {
            if (!cancelled) {
               setLoading(false)
            }
         }
      }

      loadReviews()

      return () => {
         cancelled = true
      }
   }, [slug])

   const breakdownRows = useMemo(() => {
      const breakdown = data?.ratingBreakdown ?? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      const total = data?.reviewCount ?? 0

      return [5, 4, 3, 2, 1].map((value) => {
         const count = breakdown[value as keyof RatingBreakdown] ?? 0
         const width = total > 0 ? `${(count / total) * 100}%` : '0%'

         return {
            value,
            count,
            width,
         }
      })
   }, [data])

   function updateForm<K extends keyof ReviewFormState>(
      key: K,
      value: ReviewFormState[K]
   ) {
      setForm((current) => ({ ...current, [key]: value }))
   }

   async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault()
      setSubmitting(true)
      setSubmitError(null)
      setSubmitSuccess(null)
      setFieldErrors({})

      try {
         const response = await fetch(`/api/products/${slug}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
            cache: 'no-store',
         })

         const json = (await response.json().catch(() => null)) as ApiErrorPayload | null

         if (!response.ok) {
            setFieldErrors(json?.errors?.fieldErrors ?? {})
            setSubmitError(
               json?.message ??
                  'Non è stato possibile inviare la recensione. Riprova tra poco.'
            )
            return
         }

         setForm(INITIAL_FORM)
         setSubmitSuccess(
            'Grazie! La tua recensione è stata inviata e sarà pubblicata dopo l’approvazione.'
         )
      } catch (error) {
         setSubmitError(
            error instanceof Error
               ? error.message
               : 'Non è stato possibile inviare la recensione. Riprova tra poco.'
         )
      } finally {
         setSubmitting(false)
      }
   }

   return (
      <section className="grid gap-8 lg:grid-cols-[1.15fr,0.85fr]">
         <div className="rounded-[18px] border border-[#e6ddd2] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 border-b border-[#efe7dc] pb-6 sm:flex-row sm:items-end sm:justify-between">
               <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9b7b60]">
                     Recensioni autentiche
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#241b16]">
                     Recensioni dei clienti
                  </h2>
                  <p className="max-w-2xl text-sm leading-relaxed text-[#6d5b4c]">
                     Scopri le impressioni di chi ha scelto una creazione Marì Atelier.
                  </p>
               </div>
               {!loading && !loadError && (
                  <div className="rounded-2xl border border-[#eadfce] bg-[#fcf8f2] px-5 py-4">
                     <div className="flex items-center gap-3">
                        <span className="text-3xl font-semibold tracking-tight text-[#241b16]">
                           {data?.averageRating.toFixed(1) ?? '0.0'}
                        </span>
                        <div className="space-y-1">
                           <StarRow rating={data?.averageRating ?? 0} size="lg" />
                           <p className="text-xs font-medium text-[#7c6958]">
                              {data?.reviewCount ?? 0}{' '}
                              {data?.reviewCount === 1 ? 'recensione' : 'recensioni'}
                           </p>
                        </div>
                     </div>
                  </div>
               )}
            </div>

            {loading ? (
               <div className="space-y-4 py-6">
                  <div className="h-24 rounded-2xl bg-[#f5efe7]" />
                  <div className="h-24 rounded-2xl bg-[#f5efe7]" />
               </div>
            ) : loadError ? (
               <div className="mt-6 rounded-2xl border border-[#ead6d0] bg-[#fff7f4] px-4 py-3 text-sm text-[#8e4d3b]">
                  {loadError}
               </div>
            ) : (
               <div className="space-y-6 pt-6">
                  <div className="grid gap-6 rounded-[18px] border border-[#efe5d9] bg-[#fdfaf6] p-5 md:grid-cols-[0.78fr,1.22fr]">
                     <div className="space-y-2">
                        <p className="text-sm font-medium text-[#6a584a]">
                           Valutazione media
                        </p>
                        <div className="flex items-end gap-3">
                           <span className="text-4xl font-semibold tracking-tight text-[#241b16]">
                              {data?.averageRating.toFixed(1) ?? '0.0'}
                           </span>
                           <div className="pb-1">
                              <StarRow rating={data?.averageRating ?? 0} size="lg" />
                           </div>
                        </div>
                        <p className="text-sm text-[#7c6958]">
                           Basata su {data?.reviewCount ?? 0}{' '}
                           {data?.reviewCount === 1 ? 'opinione' : 'opinioni'}
                        </p>
                     </div>

                     <div className="space-y-3">
                        {breakdownRows.map((row) => (
                           <div
                              key={row.value}
                              className="grid grid-cols-[54px,1fr,32px] items-center gap-3"
                           >
                              <div className="flex items-center gap-1 text-sm font-medium text-[#6a584a]">
                                 <span>{row.value}</span>
                                 <StarIcon className="h-3.5 w-3.5 fill-[#c98b46] text-[#c98b46]" />
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-[#eee2d3]">
                                 <div
                                    className="h-full rounded-full bg-[#c98b46]"
                                    style={{ width: row.width }}
                                 />
                              </div>
                              <span className="text-right text-sm text-[#7c6958]">
                                 {row.count}
                              </span>
                           </div>
                        ))}
                     </div>
                  </div>

                  {data && data.reviews.length > 0 ? (
                     <div className="space-y-4">
                        {data.reviews.map((review) => (
                           <article
                              key={review.id}
                              className={`rounded-[18px] border p-5 shadow-sm transition-colors sm:p-6 ${
                                 review.isFeatured
                                    ? 'border-[#e2c8a7] bg-[#fffaf3]'
                                    : 'border-[#ece2d6] bg-white'
                              }`}
                           >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                 <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                       <h3 className="text-base font-semibold text-[#241b16]">
                                          {review.title || 'Recensione cliente'}
                                       </h3>
                                       {review.isFeatured && (
                                          <span className="rounded-full border border-[#dcc09b] bg-[#f6e7cd] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a6336]">
                                             In evidenza
                                          </span>
                                       )}
                                    </div>
                                    <StarRow rating={review.rating} />
                                 </div>
                                 <div className="text-sm text-[#7c6958] sm:text-right">
                                    <p className="font-medium text-[#4f4035]">
                                       {review.customerName}
                                    </p>
                                    <p>{formatReviewDate(review.createdAt)}</p>
                                 </div>
                              </div>
                              <p className="mt-4 text-sm leading-7 text-[#4f4035]">
                                 {review.body}
                              </p>
                           </article>
                        ))}
                     </div>
                  ) : (
                     <div className="rounded-[18px] border border-dashed border-[#e2d6c6] bg-[#fcf8f2] px-6 py-10 text-center">
                        <h3 className="text-lg font-semibold text-[#241b16]">
                           Ancora nessuna recensione
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-[#6d5b4c]">
                           Condividi la tua esperienza con questo prodotto fatto a mano.
                        </p>
                     </div>
                  )}
               </div>
            )}
         </div>

         <div className="rounded-[18px] border border-[#e6ddd2] bg-[#fbf7f1] p-6 shadow-sm sm:p-8">
            <div className="space-y-2 border-b border-[#ece1d3] pb-5">
               <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9b7b60]">
                  La tua voce conta
               </p>
               <h2 className="text-2xl font-semibold tracking-tight text-[#241b16]">
                  Lascia una recensione
               </h2>
               <p className="text-sm leading-relaxed text-[#6d5b4c]">
                  Racconta com’è stata la tua esperienza con questa creazione artigianale.
               </p>
            </div>

            <form className="mt-6 space-y-5" onSubmit={onSubmit}>
               <div className="space-y-2">
                  <Label htmlFor="review-customer-name" className="text-[#3d3028]">
                     Nome
                  </Label>
                  <Input
                     id="review-customer-name"
                     value={form.customerName}
                     onChange={(event) =>
                        updateForm('customerName', event.target.value)
                     }
                     placeholder="Il tuo nome"
                     maxLength={80}
                     disabled={submitting}
                     className="h-11 rounded-2xl border-[#d8ccbb] bg-white px-4 text-[#241b16] placeholder:text-[#9f8b79] focus-visible:ring-[#c9a27c]"
                  />
                  {fieldErrors.customerName?.[0] && (
                     <p className="text-xs text-[#a1533f]">
                        {fieldErrors.customerName[0]}
                     </p>
                  )}
               </div>

               <div className="space-y-2">
                  <Label htmlFor="review-customer-email" className="text-[#3d3028]">
                     Email
                     <span className="ml-1 text-[#8f7c6b]">(opzionale)</span>
                  </Label>
                  <Input
                     id="review-customer-email"
                     type="email"
                     value={form.customerEmail}
                     onChange={(event) =>
                        updateForm('customerEmail', event.target.value)
                     }
                     placeholder="nome@email.com"
                     maxLength={120}
                     disabled={submitting}
                     className="h-11 rounded-2xl border-[#d8ccbb] bg-white px-4 text-[#241b16] placeholder:text-[#9f8b79] focus-visible:ring-[#c9a27c]"
                  />
                  {fieldErrors.customerEmail?.[0] && (
                     <p className="text-xs text-[#a1533f]">
                        {fieldErrors.customerEmail[0]}
                     </p>
                  )}
               </div>

               <div className="space-y-3">
                  <Label className="text-[#3d3028]">Valutazione</Label>
                  <div className="flex flex-wrap gap-2">
                     {[1, 2, 3, 4, 5].map((value) => {
                        const active = form.rating === value
                        return (
                           <button
                              key={value}
                              type="button"
                              onClick={() => updateForm('rating', value)}
                              disabled={submitting}
                              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                                 active
                                    ? 'border-[#c98b46] bg-[#fff4df] text-[#7a562f]'
                                    : 'border-[#d8ccbb] bg-white text-[#5e4c3f] hover:border-[#c9a27c]'
                              }`}
                           >
                              <StarIcon
                                 className={`h-4 w-4 ${
                                    active
                                       ? 'fill-[#c98b46] text-[#c98b46]'
                                       : 'text-[#c7b5a2]'
                                 }`}
                              />
                              {value}
                           </button>
                        )
                     })}
                  </div>
                  {fieldErrors.rating?.[0] && (
                     <p className="text-xs text-[#a1533f]">
                        {fieldErrors.rating[0]}
                     </p>
                  )}
               </div>

               <div className="space-y-2">
                  <Label htmlFor="review-title" className="text-[#3d3028]">
                     Titolo
                     <span className="ml-1 text-[#8f7c6b]">(opzionale)</span>
                  </Label>
                  <Input
                     id="review-title"
                     value={form.title}
                     onChange={(event) => updateForm('title', event.target.value)}
                     placeholder="Una breve impressione"
                     maxLength={120}
                     disabled={submitting}
                     className="h-11 rounded-2xl border-[#d8ccbb] bg-white px-4 text-[#241b16] placeholder:text-[#9f8b79] focus-visible:ring-[#c9a27c]"
                  />
                  {fieldErrors.title?.[0] && (
                     <p className="text-xs text-[#a1533f]">
                        {fieldErrors.title[0]}
                     </p>
                  )}
               </div>

               <div className="space-y-2">
                  <Label htmlFor="review-body" className="text-[#3d3028]">
                     La tua esperienza
                  </Label>
                  <Textarea
                     id="review-body"
                     value={form.body}
                     onChange={(event) => updateForm('body', event.target.value)}
                     placeholder="Racconta cosa hai apprezzato, i dettagli, la qualità e l’emozione che ti ha lasciato."
                     rows={6}
                     maxLength={1000}
                     disabled={submitting}
                     className="min-h-[160px] rounded-2xl border-[#d8ccbb] bg-white px-4 py-3 text-[#241b16] placeholder:text-[#9f8b79] focus-visible:ring-[#c9a27c]"
                  />
                  {fieldErrors.body?.[0] && (
                     <p className="text-xs text-[#a1533f]">
                        {fieldErrors.body[0]}
                     </p>
                  )}
               </div>

               <div className="hidden">
                  <Label htmlFor="review-website">Website</Label>
                  <Input
                     id="review-website"
                     value={form.website}
                     onChange={(event) =>
                        updateForm('website', event.target.value)
                     }
                     tabIndex={-1}
                     autoComplete="off"
                  />
               </div>

               {submitError && (
                  <div className="rounded-2xl border border-[#ead6d0] bg-[#fff7f4] px-4 py-3 text-sm text-[#8e4d3b]">
                     {submitError}
                  </div>
               )}

               {submitSuccess && (
                  <div className="rounded-2xl border border-[#d5e3d4] bg-[#f6fbf4] px-4 py-3 text-sm text-[#426140]">
                     {submitSuccess}
                  </div>
               )}

               <Button
                  type="submit"
                  disabled={submitting}
                  className="h-12 w-full rounded-full bg-[#241b16] text-[13px] font-semibold uppercase tracking-[0.18em] text-white hover:bg-[#3a2d25]"
               >
                  {submitting ? 'Invio in corso...' : 'Invia recensione'}
               </Button>
            </form>
         </div>
      </section>
   )
}
