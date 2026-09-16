"use client";

import Image from "next/image";
import { PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/product-display";
import { useEffect, useMemo, useRef, useState } from "react";

type GalleryImage = {
  url: string;
  alt: string;
};

export default function ProductGallery({
  images,
  productTitle,
}: {
  images: GalleryImage[];
  productTitle: string;
}) {
  const normalizedImages = useMemo(() => {
    if (images.length > 0) return images;
    return [{ url: PRODUCT_IMAGE_PLACEHOLDER, alt: productTitle }];
  }, [images, productTitle]);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = normalizedImages[activeIndex] ?? normalizedImages[0];
  const hasThumbs = normalizedImages.length > 1;
  const mobileScrollerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset index when the product changes images set (e.g. navigation).
    setActiveIndex(0);
  }, [normalizedImages.length]);

  function scrollMobileTo(index: number) {
    const el = mobileScrollerRef.current;
    if (!el) return;
    const targetLeft = el.clientWidth * index;
    el.scrollTo({ left: targetLeft, behavior: "smooth" });
  }

  function onMobileScroll() {
    const el = mobileScrollerRef.current;
    if (!el) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const width = el.clientWidth || 1;
      const next = Math.max(
        0,
        Math.min(
          normalizedImages.length - 1,
          Math.round(el.scrollLeft / width),
        ),
      );
      setActiveIndex((prev) => (prev === next ? prev : next));
    });
  }

  return (
    <section aria-label="Galleria prodotto">
      {/* Mobile: swipe/scroll gallery with snap */}
      <div className="lg:hidden">
        <div
          ref={mobileScrollerRef}
          onScroll={onMobileScroll}
          className="flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {normalizedImages.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              className="relative w-full shrink-0 snap-center"
              aria-label={`Immagine ${index + 1} di ${normalizedImages.length}`}
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-[12px] border border-neutral-200 bg-white">
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  priority={index === 0}
                  className="object-contain p-10"
                  sizes="100vw"
                />
              </div>
            </div>
          ))}
        </div>

        {hasThumbs && (
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {normalizedImages.map((image, index) => {
                const selected = index === activeIndex;
                return (
                  <button
                    key={`${image.url}-thumb-${index}`}
                    type="button"
                    aria-label={`Vai a immagine ${index + 1}`}
                    aria-pressed={selected}
                    onClick={() => scrollMobileTo(index)}
                    className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] border bg-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f6f6] ${
                      selected
                        ? "border-neutral-900"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      className="object-contain p-2"
                      sizes="20vw"
                    />
                  </button>
                );
              })}
            </div>
            <div className="text-xs font-semibold text-neutral-500 tabular-nums">
              {activeIndex + 1}/{normalizedImages.length}
            </div>
          </div>
        )}
      </div>

      {/* Desktop: thumbnails column + main image */}
      <div
        className={`hidden gap-4 lg:grid ${hasThumbs ? "lg:grid-cols-[92px,1fr]" : ""}`}
      >
        {hasThumbs && (
          <div className="flex max-h-[560px] flex-col gap-3 overflow-y-auto pr-1">
            {normalizedImages.map((image, index) => {
              const selected = index === activeIndex;
              return (
                <button
                  key={`${image.url}-${index}`}
                  type="button"
                  aria-label={`Mostra immagine ${index + 1} di ${normalizedImages.length}`}
                  aria-pressed={selected}
                  onClick={() => setActiveIndex(index)}
                  className={`relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[10px] border bg-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f6f6] ${
                    selected
                      ? "border-neutral-900"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    className="object-contain p-2"
                    sizes="10vw"
                  />
                </button>
              );
            })}
          </div>
        )}

        <div className="group relative aspect-square w-full overflow-hidden rounded-[12px] border border-neutral-200 bg-white shadow-sm">
          <Image
            key={activeImage.url}
            src={activeImage.url}
            alt={activeImage.alt}
            fill
            priority
            className="object-contain p-12 transition duration-200 group-hover:scale-[1.01]"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
      </div>
    </section>
  );
}
