import Image from "next/image";
import Link from "next/link";
import { getCategories } from "@/lib/api/catalog";
import { HomeMediaCarousel } from "@/components/native/HomeMediaCarousel";
import { CategoryTiles } from "@/components/storefront/CatalogSections";
import { homepageEditorialContent } from "@/data/homepage-editorial";

export default async function HomePage() {
  const categories = await getCategories().catch(() => null);
  const { carousel, customCreation } = homepageEditorialContent;
  // A fixed editorial identifier, not a general-purpose URL converter.
  const videoId = customCreation.youtubeVideoId;
  const videoUrl = /^[\w-]{11}$/.test(videoId)
    ? `https://www.youtube.com/embed/${videoId}`
    : null;
  return (
    <main id="main-content" className="shop-home atelier-home">
      <section className="atelier-opening" aria-labelledby="home-title">
        <h1 id="home-title" className="sr-only">
          Marì Atelier — Creazioni artigianali fatte a mano
        </h1>
        <div className="atelier-opening-brand">
          <Image
            src="/atelier/logo_fool.svg"
            alt=""
            width={380}
            height={240}
            priority
            className="atelier-fool"
          />
          <Image
            src="/brand/logo.svg"
            alt="Marì Atelier"
            width={240}
            height={90}
            priority
            className="atelier-signature"
          />
        </div>
      </section>
      <HomeMediaCarousel slides={carousel} />
      <section
        id="creazioni-personalizzate"
        className="atelier-custom"
        aria-labelledby="custom-title"
      >
        <div className="atelier-custom-grid">
          <article className="space-y-5">
            <p className="atelier-eyebrow">{customCreation.eyebrow}</p>
            <h2 id="custom-title" className="atelier-heading">
              {customCreation.title}
            </h2>
            <p className="atelier-custom-copy">{customCreation.paragraph}</p>
            <Link href={customCreation.cta.href} className="atelier-cta">
              {customCreation.cta.label}
            </Link>
          </article>
          <div className="atelier-custom-media">
            {videoUrl ? (
              <iframe
                src={videoUrl}
                title={customCreation.videoTitle}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="atelier-video-fallback">
                <p className="atelier-eyebrow">
                  {customCreation.videoPlaceholder.badge}
                </p>
                <h3 className="mt-4 text-2xl">
                  {customCreation.videoPlaceholder.title}
                </h3>
                <p className="mt-2 text-sm">
                  {customCreation.videoPlaceholder.subtitle}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      <CategoryTiles categories={categories} />
    </main>
  );
}
