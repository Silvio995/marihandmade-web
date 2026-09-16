import CategoryCollection from "@/components/native/CategoryCollection";
import { getProducts } from "@/lib/api/catalog";
import { getProductDisplayAvailability } from "@/lib/inventory-availability";
import { getVariantMinPrice } from "@/lib/product-display";
import { heroSlides } from "@/data/storefront";
export default async function Products({
  searchParams = {},
}: {
  searchParams?: Record<string, string | undefined>;
}) {
  let products = await getProducts();
  const { category, brand, isAvailable, sort, q } = searchParams;
  if (q?.trim())
    products = products.filter((p) =>
      [p.title, p.shortDescription, ...p.categories.map((c) => c.title)].some(
        (value) =>
          value
            ?.toLocaleLowerCase("it")
            .includes(q.trim().toLocaleLowerCase("it")),
      ),
    );
  if (category)
    products = products.filter((p) =>
      p.categories.some(
        (c) =>
          c.slug === category ||
          c.title.toLowerCase() === category.toLowerCase(),
      ),
    );
  if (brand)
    products = products.filter((p) =>
      p.brand.title.toLowerCase().includes(brand.toLowerCase()),
    );
  if (isAvailable === "true")
    products = products.filter(
      (p) => getProductDisplayAvailability(p).isPurchasable,
    );
  if (sort === "featured")
    products.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
  if (sort === "most_expensive" || sort === "least_expensive")
    products.sort(
      (a, b) =>
        (getVariantMinPrice(a) - getVariantMinPrice(b)) *
        (sort === "most_expensive" ? -1 : 1),
    );
  return (
    <CategoryCollection
      category={{
        title: "Catalogo",
        heroImage: heroSlides[0].image,
      }}
      products={products}
      variant="retail"
    />
  );
}
