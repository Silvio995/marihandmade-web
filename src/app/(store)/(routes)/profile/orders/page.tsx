import { getServerAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export default async function OrdersPage() {
  const session = await getServerAuthSession()
  if (!session?.user?.id) redirect('/login')

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      number: true,
      status: true,
      isPaid: true,
      payable: true,
      createdAt: true,
      shippingStatus: true,
    },
  })

  if (!orders) notFound()

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">I tuoi ordini</h1>
      {orders.length === 0 ? (
        <p className="text-sm text-neutral-600">Nessun ordine disponibile.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/profile/orders/${order.id}`}
              className="block rounded-lg border p-4 hover:border-neutral-400"
            >
              <div className="flex justify-between text-sm">
                <div className="space-y-1">
                  <p className="font-semibold">
                    Ordine {order.number ?? order.id.slice(0, 8)}
                  </p>
              <p className="text-neutral-600">{formatDate(order.createdAt)}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm">Stato: {order.status}</p>
              <p className="text-sm">Pagamento: {order.isPaid ? 'Pagato' : 'In attesa'}</p>
              <p className="text-sm">Spedizione: {order.shippingStatus ?? 'PENDING'}</p>
              <p className="font-semibold">
                Totale: {typeof order.payable === 'number' ? order.payable.toFixed(2) : '—'}
              </p>
            </div>
          </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
