"use client";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { HeroSlide } from "@/data/storefront";
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const reduced = useReducedMotion();
  const [ref, api] = useEmblaCarousel({
    loop: slides.length > 1,
    duration: reduced ? 0 : 45,
  });
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    if (!api) return;
    const update = () => setSelected(api.selectedScrollSnap());
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);
  if (!slides.length) return null;
  return (
    <section
      aria-label="Ispirazioni MariHandmade"
      aria-roledescription="carosello"
      className="shop-hero"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          api?.scrollNext();
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          api?.scrollPrev();
        }
      }}
    >
      <h1 className="sr-only">
        MariHandmade — creazioni artigianali fatte a mano
      </h1>
      <div ref={ref} className="overflow-hidden">
        <div className="flex touch-pan-y">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${index + 1} di ${slides.length}`}
              aria-hidden={selected !== index}
              className="shop-hero-slide min-w-0 flex-[0_0_100%]"
              data-active={selected === index}
            >
              <div className="shop-hero-grid">
                <div className="shop-hero-copy">
                  <p className="shop-eyebrow shop-hero-enter">
                    {slide.eyebrow}
                  </p>
                  <h2 className="shop-hero-title shop-hero-enter">
                    {slide.title}
                  </h2>
                  <p className="shop-hero-subtitle shop-hero-enter">
                    {slide.subtitle}
                  </p>
                  <Link
                    tabIndex={selected === index ? 0 : -1}
                    href={slide.cta.href}
                    className="shop-button shop-hero-enter"
                  >
                    {slide.cta.label}
                    <ArrowRight size={17} />
                  </Link>
                </div>
                <div className="shop-hero-image">
                  <Image
                    src={slide.image}
                    alt={slide.alt}
                    style={{ objectPosition: slide.objectPosition }}
                    fill
                    priority={index === 0}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className={`shop-hero-photo object-cover ${slide.mobileImage ? "hidden md:block" : ""}`}
                  />
                  {slide.mobileImage && (
                    <Image
                      src={slide.mobileImage}
                      alt={slide.alt}
                      style={{ objectPosition: slide.objectPosition }}
                      fill
                      priority={index === 0}
                      sizes="100vw"
                      className="shop-hero-photo object-cover md:hidden"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {slides.length > 1 && (
        <div className="shop-hero-controls">
          <div className="flex gap-1">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => api?.scrollTo(index)}
                aria-label={`Mostra diapositiva ${index + 1}: ${slide.eyebrow}`}
                aria-pressed={selected === index}
                className="shop-hero-dot"
              >
                <span className="shop-hero-dot-line" />
              </button>
            ))}
          </div>
          <p className="sr-only" aria-live="polite">
            Diapositiva {selected + 1} di {slides.length}
          </p>
          <span className="shop-hero-caption" aria-hidden="true">
            Un piccolo mondo, fatto a mano.
          </span>
          <div className="flex items-center gap-2">
            <span
              className="mr-3 text-xs tabular-nums text-shop-muted"
              aria-hidden="true"
            >
              0{selected + 1} / 0{slides.length}
            </span>
            <button
              aria-label="Diapositiva precedente"
              onClick={() => api?.scrollPrev()}
              className="shop-icon shop-hero-arrow"
            >
              <ArrowLeft size={19} />
            </button>
            <button
              aria-label="Diapositiva successiva"
              onClick={() => api?.scrollNext()}
              className="shop-icon shop-hero-arrow"
            >
              <ArrowRight size={19} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
