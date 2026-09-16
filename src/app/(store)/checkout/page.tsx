'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuthenticated } from '@/hooks/useAuthentication'
import { useCartContext } from '@/state/Cart'
import type { AddressType } from '@/types/prisma'

type CheckoutLine = {
  productId: string
  variantId: string | null
  quantity: number
  unitPrice: number
  subtotal: number
}

type CheckoutLineInput = {
  productId: string
  variantId?: string | null
  quantity: number
}

type CheckoutResponse = {
  items?: CheckoutLine[]
  lines?: CheckoutLine[]
  hasDroppedLines?: boolean
  isCheckoutReady?: boolean
  requiresCartReview?: boolean
  itemCount?: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const { authenticated } = useAuthenticated()
  const { cart } = useCartContext()

  const [addresses, setAddresses] = useState<AddressType[]>([])
  const [addressId, setAddressId] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  const [guestOrderAccessToken, setGuestOrderAccessToken] = useState<string | undefined>()
  const [paypalError, setPaypalError] = useState<string | null>(null)
  const [guestEmail, setGuestEmail] = useState('')
  const [guestFirstName, setGuestFirstName] = useState('')
  const [guestLastName, setGuestLastName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')

  const requestLines = useMemo<CheckoutLineInput[]>(
    () =>
      (cart?.items ?? [])
        .filter((item) => item?.productId && (item?.count ?? 0) > 0)
        .map((item) => ({
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.count ?? 0,
        })),
    [cart]
  )

  useEffect(() => {
    if (!authenticated) {
      setAddresses([])
      setAddressId('')
      return
    }

    const fetchAddresses = async () => {
      try {
        const res = await fetch('/api/addresses', { credentials: 'include' })
        if (!res.ok) {
          setAddresses([])
          setAddressId('')
          return
        }

        const data: AddressType[] = await res.json()
        setAddresses(data)
        if (data.length > 0) {
          setAddressId(data[0]?.id ?? '')
        }
      } catch {
        setAddresses([])
        setAddressId('')
      }
    }

    fetchAddresses()
  }, [authenticated])

  async function startPayPalPayment(
    orderId: string,
    guestOrderAccessToken?: string
  ) {
    const payRes = await fetch(`/api/orders/${orderId}/pay/paypal`, {
      method: 'POST',
      credentials: 'include',
      headers: guestOrderAccessToken
        ? {
            'x-guest-order-access': guestOrderAccessToken,
          }
        : undefined,
    })

    if (!payRes.ok) {
      const text = await payRes.text().catch(() => '')
      throw new Error(text || 'Impossibile avviare PayPal')
    }

    const payData: { providerApproveUrl?: string | null } = await payRes.json()
    if (!payData.providerApproveUrl) {
      throw new Error('PayPal approval URL mancante')
    }

    window.location.href = payData.providerApproveUrl
  }

  async function handleCheckout() {
    setLoading(true)
    setPaypalError(null)

    if (!requestLines.length) {
      setLoading(false)
      return alert('Cart is empty or invalid for checkout')
    }

    if (!authenticated && (!guestEmail || !guestFirstName || !guestLastName)) {
      setLoading(false)
      return alert('Inserisci nome, cognome ed email per checkout ospite')
    }

    let checkoutLines: CheckoutLine[] = []

    try {
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          lines: requestLines,
        }),
      })

      if (!checkoutRes.ok) {
        throw new Error('Checkout prep failed')
      }

      const checkoutData: CheckoutResponse = await checkoutRes.json()
      const lines = checkoutData.lines ?? checkoutData.items ?? []
      checkoutLines = lines
      const totalQuantity =
        checkoutData.itemCount ??
        lines.reduce((sum, line) => sum + (line.quantity ?? 0), 0)

      if (!lines.length || totalQuantity < 1) {
        throw new Error('Cart is empty or invalid for checkout')
      }

      if (
        checkoutData.hasDroppedLines ||
        checkoutData.requiresCartReview ||
        checkoutData.isCheckoutReady === false
      ) {
        throw new Error('Cart needs review before checkout')
      }
    } catch (error) {
      setLoading(false)
      return alert(error instanceof Error ? error.message : 'Checkout prep failed')
    }

    const orderRes = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        addressId: authenticated ? addressId : undefined,
        checkoutLines,
        guest: authenticated
          ? undefined
          : {
              email: guestEmail,
              firstName: guestFirstName,
              lastName: guestLastName,
              phone: guestPhone || undefined,
            },
      }),
    })

    setLoading(false)

    if (!orderRes.ok) {
      return alert('Checkout failed')
    }

    const order: { id: string; guestOrderAccessToken?: string } = await orderRes.json()
    setCreatedOrderId(order.id)
    setGuestOrderAccessToken(order.guestOrderAccessToken)

    try {
      await startPayPalPayment(order.id, order.guestOrderAccessToken)
      return
    } catch {
      setPaypalError('Non siamo riusciti ad avviare PayPal. Puoi riprovare o vedere la conferma ordine.')
      return
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <p className="text-sm text-neutral-600">
        Checkout ospite attivo: completa l&apos;ordine senza creare un account.
      </p>

      {authenticated ? (
        <div className="space-y-2">
          <label htmlFor="addressId" className="text-sm font-medium text-neutral-700">
            Indirizzo di spedizione (opzionale)
          </label>
          {addresses.length > 0 ? (
            <select
              id="addressId"
              value={addressId}
              onChange={(e) => setAddressId(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              {addresses.map((addr) => (
                <option key={addr.id} value={addr.id}>
                  {addr.address}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-neutral-500">
              Nessun indirizzo salvato: l&apos;ordine verrà creato comunque.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="guestFirstName" className="text-sm font-medium text-neutral-700">
              Nome
            </label>
            <input
              id="guestFirstName"
              value={guestFirstName}
              onChange={(event) => setGuestFirstName(event.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="guestLastName" className="text-sm font-medium text-neutral-700">
              Cognome
            </label>
            <input
              id="guestLastName"
              value={guestLastName}
              onChange={(event) => setGuestLastName(event.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="guestEmail" className="text-sm font-medium text-neutral-700">
              Email
            </label>
            <input
              id="guestEmail"
              type="email"
              value={guestEmail}
              onChange={(event) => setGuestEmail(event.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="guestPhone" className="text-sm font-medium text-neutral-700">
              Telefono (opzionale)
            </label>
            <input
              id="guestPhone"
              value={guestPhone}
              onChange={(event) => setGuestPhone(event.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      <Button onClick={handleCheckout} disabled={loading || requestLines.length === 0}>
        {loading ? 'Elaborazione...' : 'Completa ordine come ospite'}
      </Button>

      {paypalError && createdOrderId && (
        <div className="rounded-md border border-neutral-200 bg-white p-4 text-sm">
          <p className="text-neutral-800">{paypalError}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="default"
              onClick={() => startPayPalPayment(createdOrderId, guestOrderAccessToken)}
              disabled={loading}
            >
              Riprova PayPal
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/order-confirmation?orderId=${createdOrderId}`)}
              disabled={loading}
            >
              Vedi conferma ordine
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
