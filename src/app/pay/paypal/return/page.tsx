'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

type CaptureResponse = {
   orderId: string
   captureStatus?: string | null
   isPaid?: boolean
}

export default function PayPalReturnPage() {
   const searchParams = useSearchParams()
   const router = useRouter()
   const [status, setStatus] = useState<'pending' | 'success' | 'error'>(
      'pending'
   )
   const [message, setMessage] = useState<string | null>(null)
   const [orderId, setOrderId] = useState<string | null>(null)

   useEffect(() => {
      const providerOrderId =
         searchParams.get('token') ?? searchParams.get('providerOrderId')
      const orderIdParam = searchParams.get('orderId')

      if (!providerOrderId || !orderIdParam) {
         setStatus('error')
         setMessage('Missing PayPal return parameters')
         return
      }

      setOrderId(orderIdParam)

      const capture = async () => {
         try {
            const res = await fetch(
               `/api/orders/${orderIdParam}/pay/paypal/capture?providerOrderId=${encodeURIComponent(
                  providerOrderId
               )}`,
               {
                  method: 'POST',
                  credentials: 'include',
               }
            )

            if (!res.ok) {
               const text = await res.text()
               throw new Error(text || 'Capture failed')
            }

            const json: CaptureResponse = await res.json()

            if (json?.isPaid) {
               setStatus('success')
               setMessage('Payment completed')
               router.push(`/order-confirmation?orderId=${json.orderId}`)
            } else if (json?.captureStatus === 'ALREADY_PAID') {
               setStatus('success')
               setMessage('Payment already completed')
               router.push(`/order-confirmation?orderId=${json.orderId}`)
            } else {
               setStatus('error')
               setMessage('Payment not completed')
            }
         } catch (err) {
            setStatus('error')
            setMessage(
               err instanceof Error ? err.message : 'Unable to confirm payment'
            )
         }
      }

      capture()
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [searchParams])

   return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
         <div className="text-xl font-semibold">
            {status === 'pending' && 'Confirming PayPal payment...'}
            {status === 'success' && 'Payment confirmed'}
            {status === 'error' && 'Payment confirmation failed'}
         </div>
         {message && <p className="text-sm text-muted-foreground">{message}</p>}
         {orderId && (
            <Button
               variant="outline"
               onClick={() => router.push(`/order-confirmation?orderId=${orderId}`)}
            >
               Vedi conferma ordine
            </Button>
         )}
      </div>
   )
}
