"use client";

import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import type { HomeCarouselSlideContent } from "@/types/homepage";
import { getSafeImageSrc } from "@/lib/safe-image";

export function HomeMediaCarousel({
  slides,
}: {
  slides: HomeCarouselSlideContent[];
}) {
  const safeSlides = slides ?? [];
  const multiple = safeSlides.length > 1;
  // Autoplay stays off until the browser preference has been read.
  const [reducedMotion, setReducedMotion] = useState(true);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const autoplay = useMemo(
    () =>
      Autoplay({
        delay: 5200,
        playOnInit: false,
        stopOnInteraction: true,
        stopOnMouseEnter: false,
        stopOnFocusIn: false,
      }),
    [],
  );
  const plugins = useMemo(() => [autoplay], [autoplay]);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: multiple,
      align: "start",
      skipSnaps: false,
      dragFree: false,
    },
    plugins,
  );

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  const syncPlayback = useCallback(() => {
    if (!emblaApi) return;
    if (
      !multiple ||
      emblaApi.scrollSnapList().length < 2 ||
      document.hidden ||
      reducedMotion ||
      paused ||
      hovered ||
      focused ||
      dragging
    )
      autoplay.stop();
    else autoplay.play();
  }, [
    emblaApi,
    multiple,
    reducedMotion,
    paused,
    hovered,
    focused,
    dragging,
    autoplay,
  ]);

  useEffect(() => {
    syncPlayback();
    emblaApi?.on("reInit", syncPlayback);
    document.addEventListener("visibilitychange", syncPlayback);
    return () => {
      emblaApi?.off("reInit", syncPlayback);
      document.removeEventListener("visibilitychange", syncPlayback);
    };
  }, [emblaApi, syncPlayback]);

  useEffect(() => {
    if (!emblaApi) return;
    const down = () => setDragging(true);
    const up = () => setDragging(false);
    emblaApi.on("pointerDown", down);
    emblaApi.on("pointerUp", up);
    return () => {
      emblaApi.off("pointerDown", down);
      emblaApi.off("pointerUp", up);
    };
  }, [emblaApi]);

  if (!safeSlides.length) return null;
  return (
    <section
      className="atelier-carousel relative left-1/2 w-screen -translate-x-1/2 overflow-hidden"
      role="region"
      aria-roledescription="carosello"
      aria-label="Fotografie dell’atelier"
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
      onKeyDown={(event) => {
        if (!multiple || event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          if (event.key === "ArrowRight") emblaApi?.scrollNext(reducedMotion);
          else emblaApi?.scrollPrev(reducedMotion);
        }
      }}
    >
      <div ref={emblaRef} className="w-full overflow-hidden" aria-live="off">
        <div className="flex h-[44vh] min-h-[320px] max-h-[430px] gap-0 sm:h-[50vh] md:h-[54vh] lg:h-[62vh] lg:min-h-[500px] lg:max-h-[680px] xl:h-[64vh]">
          {safeSlides.map((slide, index) => (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${index + 1} di ${safeSlides.length}`}
              className="relative h-full w-full flex-[0_0_86vw] overflow-hidden sm:flex-[0_0_58vw] lg:flex-[0_0_36vw] xl:flex-[0_0_34vw]"
            >
              <Image
                src={getSafeImageSrc(
                  slide.mobileImageUrl || slide.imageUrl,
                  "/brand/logo.jpeg",
                )}
                alt={slide.altText || "Fotografia dell’atelier"}
                fill
                className="object-cover object-center"
                sizes="(min-width: 1280px) 34vw, (min-width: 1024px) 36vw, (min-width: 640px) 58vw, 86vw"
                priority={index < 2}
              />
            </div>
          ))}
        </div>
      </div>
      {multiple && (
        <div className="atelier-carousel-controls">
          <button
            type="button"
            aria-label="Fotografia precedente"
            onClick={() => emblaApi?.scrollPrev(reducedMotion)}
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={
              reducedMotion
                ? "Scorrimento automatico disattivato: movimento ridotto"
                : paused
                  ? "Riprendi scorrimento automatico"
                  : "Pausa scorrimento automatico"
            }
            aria-pressed={paused || reducedMotion}
            disabled={reducedMotion}
            onClick={() => setPaused(!paused)}
          >
            {paused || reducedMotion ? (
              <Play size={17} aria-hidden="true" />
            ) : (
              <Pause size={17} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            aria-label="Fotografia successiva"
            onClick={() => emblaApi?.scrollNext(reducedMotion)}
          >
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
