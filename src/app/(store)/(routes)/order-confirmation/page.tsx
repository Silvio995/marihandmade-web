import { PaymentStatus } from "@/components/payment-status";
export default function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: { orderId?: string; cancel?: string };
}) {
  return (
    <main className="bg-[#f8f6f2] text-neutral-900 min-h-screen">
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Order Confirmation</h1>
        <PaymentStatus
          orderId={searchParams.orderId}
          cancelled={searchParams.cancel === "1"}
        />
      </section>
    </main>
  );
}
