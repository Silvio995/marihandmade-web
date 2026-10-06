export const orderCreated = {
  id: "order",
  number: 1,
  status: "Pending" as const,
  isPaid: false as const,
  createdAt: "2026-10-03T00:00:00.000Z",
  payable: "13.08",
};
export const checkoutPreview = {
  lines: [
    {
      productId: "p",
      variantId: null,
      quantity: 1,
      productTitle: "Product",
      variantTitle: null,
      imageUrl: null,
      unitPrice: "12.00",
      unitDiscount: "0.00",
      subtotal: "12.00",
      availability: "AVAILABLE" as const,
    },
  ],
  totals: {
    subtotal: "12.00",
    discount: "0.00",
    tax: "1.08",
    shipping: "0.00",
    payable: "13.08",
  },
  currency: "EUR" as const,
  isCheckoutReady: true,
  issues: [],
};
