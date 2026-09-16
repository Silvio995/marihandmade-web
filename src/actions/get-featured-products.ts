import { getProducts } from "@/lib/api/catalog";
export async function getFeaturedProducts() {
  return (await getProducts()).filter((p) => p.isFeatured).slice(0, 8);
}
