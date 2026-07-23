"use client";

import * as React from "react";
import Image from "next/image";
import { Pause, Play } from "lucide-react";
import type { GalleryImage } from "@/lib/content/home";
import { cn } from "@/lib/utils";

/**
 * Continuously scrolling photo marquee. The track holds two copies
 * of the image set and translates -50% on a linear loop, so the
 * scroll never ends. Accessibility: an explicit pause/play control
 * (WCAG 2.2.2), auto-pause on hover and keyboard focus, and under
 * prefers-reduced-motion the animation is disabled in favor of a
 * normal swipe/scrollable row.
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
  const [paused, setPaused] = React.useState(false);

  const renderSet = (hidden: boolean) => (
    <ul
      aria-hidden={hidden || undefined}
      className={cn(
        "flex shrink-0 gap-5 pr-5",
        hidden && "motion-reduce:hidden",
      )}
    >
      {images.map((image) => (
        <li
          key={image.src}
          className="aspect-square w-[240px] shrink-0 overflow-hidden rounded-md border border-gold/25 sm:w-[280px]"
        >
          <Image
            src={image.src}
            alt={hidden ? "" : image.alt}
            width={480}
            height={480}
            className="h-full w-full select-none object-cover"
            draggable={false}
            sizes="280px"
          />
        </li>
      ))}
    </ul>
  );

  return (
    <section className="relative overflow-hidden bg-primary-dark py-20 md:py-28">
      {/* Very subtle tartan texture for depth */}
      <div aria-hidden className="tartan-band pointer-events-none absolute inset-0 opacity-[0.05]" />
      <div className="relative">
        <div className="mx-auto max-w-[1400px] px-5 md:px-8 xl:px-16">
          <p className="text-center text-[13px] font-semibold uppercase tracking-[0.28em] text-gold md:text-sm">
            {eyebrow}
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-center font-serif text-[32px] font-semibold leading-tight text-cream md:text-[46px]">
            {heading}
          </h2>
        </div>

        <div
          role="region"
          aria-label="Photo gallery of life at The Bunker"
          className="group mt-12 overflow-hidden motion-reduce:overflow-x-auto"
        >
          <div
            className={cn(
              "flex w-max animate-marquee group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused] motion-reduce:animate-none",
            )}
            style={paused ? { animationPlayState: "paused" } : undefined}
          >
            {renderSet(false)}
            {renderSet(true)}
          </div>
        </div>

        <div className="mt-8 flex justify-center motion-reduce:hidden">
          <button
            type="button"
            aria-pressed={paused}
            aria-label={paused ? "Resume gallery scrolling" : "Pause gallery scrolling"}
            onClick={() => setPaused(!paused)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/25 text-cream/80 transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {paused ? (
              <Play aria-hidden className="h-4 w-4" />
            ) : (
              <Pause aria-hidden className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
