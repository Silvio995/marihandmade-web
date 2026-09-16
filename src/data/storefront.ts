import type { CategoryDto } from "@/lib/api/contracts";

// Single source of truth for homepage campaign imagery and editorial copy.
// Image files remain in public/images/home; catalog product images stay in DTOs.
interface CampaignImage {
  unoptimized?: boolean;
  image: string;
  alt: string;
  objectPosition: string;
}
export interface HeroSlide extends CampaignImage {
  id: string;
  mobileImage?: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  targetCategory?: string;
  cta: { label: string; href: string };
}
export const heroSlides: HeroSlide[] = [
  {
    id: "borse",
    image: "/images/home/hero_borse.png",
    alt: "Borsa artigianale crochet azzurra MariHandmade",
    objectPosition: "85% center",
    eyebrow: "Creazioni artigianali",
    title: "Stile unico, come te.",
    subtitle: "Borse realizzate a mano, curate in ogni dettaglio.",
    targetCategory: "borse",
    cta: { label: "Scopri le borse", href: "/products" },
  },
  {
    id: "bambole",
    image: "/images/home/hero_bambole.png",
    alt: "Bambola crochet artigianale turchese MariHandmade",
    objectPosition: "80% center",
    eyebrow: "Bambole fatte a mano",
    title: "Piccole amiche, grandi emozioni.",
    subtitle: "Creazioni uniche, realizzate con cura e passione.",
    targetCategory: "bambole",
    cta: { label: "Scopri le bambole", href: "/products" },
  },
  {
    id: "storie",
    image: "/images/home/hero_bambole_2.png",
    alt: "Bambola crochet artigianale con dettagli blu e gialli",
    objectPosition: "70% center",
    eyebrow: "Fatto a mano",
    title: "Creazioni che raccontano una storia.",
    subtitle: "Ogni dettaglio nasce da tempo, cura e immaginazione.",
    cta: { label: "Esplora le creazioni", href: "/products" },
  },
];
export const categoryVisuals: Record<
  string,
  CampaignImage & { copy: string; cta: string }
> = {
  borse: {
    image: "/images/home/category_borse.png",
    // The runtime WebP conversion stalls for this PNG at mobile sizes.
    unoptimized: true,
    alt: "Borsa artigianale beige con dettagli dorati",
    objectPosition: "85% center",
    copy: "Intrecci e dettagli da portare con te, ogni giorno.",
    cta: "Scopri le borse",
  },
  bambole: {
    image: "/images/home/category_bambole.png",
    alt: "Bambola crochet artigianale con abito nero e decorazioni floreali",
    objectPosition: "75% center",
    copy: "Piccole compagne di storie, da regalare e custodire.",
    cta: "Scopri le bambole",
  },
};
export const featuredEditorial: Array<
  CampaignImage & {
    id: string;
    title: string;
    copy: string;
    cta: string;
    targetCategory: string;
  }
> = [
  {
    id: "dettagli",
    image: "/images/home/featured_borse.png",
    alt: "Borsa artigianale crochet bianca e viola con paillettes",
    objectPosition: "85% center",
    title: "Il carattere è nei dettagli.",
    copy: "Trame, colori e piccoli riflessi: una borsa racconta anche il tuo modo di essere.",
    cta: "Scopri le borse",
    targetCategory: "borse",
  },
  {
    id: "clutch",
    image: "/images/home/featured_clutch.png",
    alt: "Clutch artigianale crochet verde oliva",
    objectPosition: "75% center",
    title: "Ispirazione clutch.",
    copy: "Una forma essenziale, un intreccio speciale. Lasciati ispirare da questo stile e scopri le nostre borse.",
    cta: "Esplora le borse",
    targetCategory: "borse",
  },
];
export function categoryCampaignKey(
  category: Pick<CategoryDto, "title" | "slug">,
) {
  const title = category.title.toLocaleLowerCase("it");
  return categoryVisuals[category.slug] ? category.slug : title;
}
export function campaignCategoryHref(
  categories: CategoryDto[] | null,
  key: string,
) {
  const category = categories?.find((c) => categoryCampaignKey(c) === key);
  return category
    ? `/categories/${encodeURIComponent(category.slug)}`
    : "/products";
}
export function homepageHeroSlides(
  categories: CategoryDto[] | null,
): HeroSlide[] {
  return heroSlides.map((slide) => ({
    ...slide,
    cta: {
      ...slide.cta,
      href: slide.targetCategory
        ? campaignCategoryHref(categories, slide.targetCategory)
        : slide.cta.href,
    },
  }));
}
export const serviceValues = [
  {
    title: "Creazioni artigianali",
    text: "Il valore del lavoro fatto a mano.",
  },
  {
    title: "Un dialogo personale",
    text: "Scrivici per conoscere le nostre creazioni.",
  },
  { title: "Idee su misura", text: "Raccontaci il progetto che hai in mente." },
  {
    title: "Cura nei dettagli",
    text: "Dall’ispirazione all’ultimo intreccio.",
  },
];
