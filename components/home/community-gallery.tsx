import Image from "next/image";
import type { GalleryImage } from "@/lib/content/home";
import { cn } from "@/lib/utils";

/**
 * Continuously scrolling photo marquee. The track holds two copies
 * of the image set and translates -50% on a linear loop, so the
 * scroll never ends. The motion auto-pauses on hover and keyboard
 * focus, and under prefers-reduced-motion the animation is disabled
 * in favor of a normal swipe/scrollable row.
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
  const renderSet = (hidden: boolean) => (
    <ul
      aria-hidden={hidden || undefined}
      className={cn("flex shrink-0 gap-5 pr-5", hidden && "motion-reduce:hidden")}
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
          <div className="flex w-max animate-marquee group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
            {renderSet(false)}
            {renderSet(true)}
          </div>
        </div>
      </div>
    </section>
  );
}
