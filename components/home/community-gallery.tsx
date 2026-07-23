"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryImage } from "@/lib/content/home";
import { cn } from "@/lib/utils";

/**
 * Accessible horizontal photo carousel: native scroll with snap,
 * arrow buttons, drag, keyboard and touch support, and position
 * indicators. No autoplay.
 */
export function CommunityGallery({
  images,
  eyebrow,
  heading,
}: {
  images: GalleryImage[];
  eyebrow: string;
  heading: string;
}) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const dragState = React.useRef<{ startX: number; startScroll: number } | null>(null);

  const updateActive = React.useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const children = Array.from(track.children) as HTMLElement[];
    if (children.length === 0) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    children.forEach((child, i) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const dist = Math.abs(childCenter - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setActiveIndex(best);
  }, []);

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", updateActive, { passive: true });
    return () => track.removeEventListener("scroll", updateActive);
  }, [updateActive]);

  function scrollByCards(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 20 : track.clientWidth * 0.5;
    track.scrollBy({ left: direction * step * 2, behavior: "smooth" });
  }

  function scrollToIndex(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[index] as HTMLElement | undefined;
    if (!child) return;
    track.scrollTo({
      left: child.offsetLeft - (track.clientWidth - child.offsetWidth) / 2,
      behavior: "smooth",
    });
  }

  // Mouse drag support (touch scrolling is native).
  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return;
    const track = trackRef.current;
    if (!track) return;
    dragState.current = { startX: e.clientX, startScroll: track.scrollLeft };
    track.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragState.current) return;
    const track = trackRef.current;
    if (!track) return;
    track.scrollLeft = dragState.current.startScroll - (e.clientX - dragState.current.startX);
  }
  function onPointerUp() {
    dragState.current = null;
  }

  return (
    <section className="relative overflow-hidden bg-primary-dark py-20 md:py-28">
      {/* Very subtle tartan texture for depth */}
      <div aria-hidden className="tartan-band pointer-events-none absolute inset-0 opacity-[0.05]" />
      <div className="relative mx-auto max-w-[1400px] px-5 md:px-8 xl:px-16">
        <p className="text-center text-[13px] font-semibold uppercase tracking-[0.28em] text-gold md:text-sm">
          {eyebrow}
        </p>
        <h2 className="mx-auto mt-4 max-w-3xl text-center font-serif text-[32px] font-semibold leading-tight text-cream md:text-[46px]">
          {heading}
        </h2>

        <div
          role="region"
          aria-label="Photo gallery of life at The Bunker"
          className="relative mt-12"
        >
          <div
            ref={trackRef}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {images.map((image) => (
              <div
                key={image.src}
                className="aspect-square w-[72%] shrink-0 snap-center overflow-hidden rounded-md border border-gold/25 sm:w-[45%] md:w-[30%] lg:w-[19%] lg:snap-start"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={480}
                  height={480}
                  className="h-full w-full select-none object-cover"
                  draggable={false}
                  sizes="(max-width: 640px) 72vw, (max-width: 1024px) 30vw, 19vw"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            aria-label="Scroll gallery left"
            onClick={() => scrollByCards(-1)}
            className="absolute -left-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cream/25 bg-primary-dark/85 text-cream transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold md:flex"
          >
            <ChevronLeft aria-hidden className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Scroll gallery right"
            onClick={() => scrollByCards(1)}
            className="absolute -right-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cream/25 bg-primary-dark/85 text-cream transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold md:flex"
          >
            <ChevronRight aria-hidden className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 flex justify-center gap-2.5" role="tablist" aria-label="Gallery position">
          {images.map((image, i) => (
            <button
              key={image.src}
              type="button"
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`Go to photo ${i + 1} of ${images.length}`}
              onClick={() => scrollToIndex(i)}
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-primary-dark",
                i === activeIndex ? "bg-gold" : "bg-cream/25 hover:bg-cream/40",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
