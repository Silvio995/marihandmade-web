import { getCategories, getProducts } from "@/lib/api/catalog";
import { Container } from "@/components/storefront/layout";
import { HeroCarousel } from "@/components/storefront/HeroCarousel";
import {
  CategoryTiles,
  FeaturedCatalog,
  EditorialStories,
} from "@/components/storefront/CatalogSections";
import { MotionReveal } from "@/components/storefront/MotionReveal";
import { ValueMarquee } from "@/components/storefront/ValueMarquee";
import NewsletterSection from "@/components/native/NewsletterSection";
import { homepageHeroSlides, serviceValues } from "@/data/storefront";
import { HeartHandshake, Hand, Sparkles, MessageCircle } from "lucide-react";
const serviceIcons = [Hand, MessageCircle, HeartHandshake, Sparkles];
export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getCategories().catch(() => null),
    getProducts().catch(() => null),
  ]);
  const featured =
    products?.filter((product) => product.isFeatured).slice(0, 8) ?? null;
  return (
    <main id="main-content" className="shop-home bg-shop-cream text-shop-ink">
      <Container className="pt-6 sm:pt-8">
        <HeroCarousel slides={homepageHeroSlides(categories)} />
      </Container>
      <ValueMarquee />
      <Container>
        <CategoryTiles categories={categories} />
        <FeaturedCatalog
          products={featured}
          categories={categories}
          includeEditorial={false}
        />
      </Container>
      <EditorialStories categories={categories} />
      <section
        aria-label="I valori del nostro atelier"
        className="shop-values bg-shop-paper"
      >
        <Container>
          <MotionReveal
            stagger
            className="grid grid-cols-2 gap-8 py-14 lg:grid-cols-4"
          >
            {serviceValues.map((value, index) => {
              const Icon = serviceIcons[index];
              return (
                <div
                  key={value.title}
                  className="flex flex-col items-start gap-3"
                >
                  <Icon
                    size={26}
                    strokeWidth={1.3}
                    className="text-shop-brown"
                  />
                  <h2 className="text-sm font-medium">{value.title}</h2>
                  <p className="text-sm leading-6 text-shop-muted">
                    {value.text}
                  </p>
                </div>
              );
            })}
          </MotionReveal>
        </Container>
      </section>
      <MotionReveal>
        <NewsletterSection />
      </MotionReveal>
    </main>
  );
}
