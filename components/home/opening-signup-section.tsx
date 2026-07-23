import Image from "next/image";
import { homeCopy } from "@/lib/content/home";
import { OpeningSignupForm } from "@/components/home/opening-signup";

/**
 * Light signup band: photo · copy · form. Sits directly beneath the
 * dark gallery per the approved mockup.
 */
export function OpeningSignupSection() {
  const { signup } = homeCopy;

  return (
    <section id="opening-list" className="scroll-mt-24 bg-surface">
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[30fr_34fr_36fr] lg:gap-14 xl:px-16">
        <div className="hidden overflow-hidden rounded-md border border-border lg:block">
          <Image
            src="/gallery/ball-hole.jpg"
            alt="A golf ball rolling toward the hole on a putting green"
            width={1200}
            height={800}
            className="h-full max-h-[260px] w-full object-cover"
            sizes="(min-width: 1024px) 30vw, 0px"
          />
        </div>
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.28em] text-gold-dark md:text-sm">
            {signup.eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-[32px] font-semibold leading-tight text-primary md:text-[44px]">
            {signup.heading}
          </h2>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-charcoal-muted md:text-[17px]">
            {signup.body}
          </p>
        </div>
        <div>
          <OpeningSignupForm />
        </div>
      </div>
    </section>
  );
}
