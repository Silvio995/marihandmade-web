import { getServerAuthSession } from "@/lib/auth";
import { readOrder } from "@/lib/server-orders";
import { notFound, redirect } from "next/navigation";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("it-IT", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export default async function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) redirect("/login");

  const order = await readOrder(params.orderId);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Ordine {order.number ?? order.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-neutral-600">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm">Stato: {order.status}</p>
          <p className="text-sm">
            Pagamento: {order.isPaid ? "Pagato" : "In attesa"}
          </p>
          <p className="text-sm">
            Spedizione: {order.shippingStatus ?? "PENDING"}
          </p>
          {order.carrier && order.trackingCode && (
            <p className="text-sm text-neutral-700">
              Tracking: {order.carrier} — {order.trackingCode}
            </p>
          )}
          {order.shippedAt && (
            <p className="text-xs text-neutral-600">
              Spedito il {formatDate(order.shippedAt)}
            </p>
          )}
          <p className="font-semibold">Totale: {order.payable}</p>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-2">
        <h2 className="text-lg font-semibold">Articoli</h2>
        {order.items.length === 0 && (
          <p className="text-sm text-neutral-600">Nessun articolo presente.</p>
        )}
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex justify-between text-sm border-b py-2 last:border-b-0"
          >
            <div>
              <p className="font-medium">{item.title ?? "Prodotto"}</p>
              {item.sku && <p className="text-neutral-600">SKU: {item.sku}</p>}
            </div>
            <div className="text-right">
              <p>Qty: {item.quantity}</p>
              <p>Prezzo: {item.unitPrice}</p>
            </div>
          </div>
        ))}
      </div>

      {order.shippingAddress && (
        <div className="rounded-lg border p-4 space-y-1">
          <h2 className="text-lg font-semibold">Indirizzo</h2>
          <p className="text-sm text-neutral-700">
            {order.shippingAddress.address}
          </p>
          <p className="text-sm text-neutral-700">
            {order.shippingAddress.city}, {order.shippingAddress.country} -{" "}
            {order.shippingAddress.postalCode}
          </p>
          <p className="text-sm text-neutral-700">
            Tel: {order.shippingAddress.phone}
          </p>
        </div>
      )}
    </div>
  );
}
