import { product } from "./catalog.fixture";
import { productDto } from "@/lib/api/contracts";
export function wireProduct(value: any = product) {
  return productDto.parse({
    ...product,
    ...value,
    variants: (value.variants ?? product.variants).map((variant: any) => ({
      ...product.variants[0],
      ...variant,
      sku: variant.sku ?? "SKU",
      inventory:
        variant.inventory === null
          ? null
          : { ...product.variants[0].inventory, ...variant.inventory },
      optionAssignments: variant.optionAssignments ?? [],
      bundleComponents: variant.bundleComponents ?? [],
    })),
  });
}
export function wireCart(userId = "user-a", items: any[] = []) {
  return {
    userId,
    createdAt: items.length ? "2026-09-30T00:00:00.000Z" : null,
    updatedAt: items.length ? "2026-09-30T00:00:00.000Z" : null,
    items: items.map((item, index) => {
      const p = item.product === null ? null : wireProduct(item.product);
      return {
        id: item.id ?? `item-${index}`,
        cartId: userId,
        productId: item.productId,
        variantId: item.variantId ?? null,
        count: item.count,
        product: p,
        variant:
          p?.variants.find((variant) => variant.id === item.variantId) ?? null,
      };
    }),
  };
}
export function webLocks() {
  let queue: Promise<unknown> = Promise.resolve();
  return {
    request: (_name: string, run: () => Promise<unknown>) => {
      const task = queue.then(run, run);
      queue = task.catch(() => {});
      return task;
    },
  };
}
