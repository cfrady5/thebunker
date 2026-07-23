/**
 * Approved homepage copy and gallery content. Keeping this out of
 * components makes it easy to move into Supabase-managed content
 * later without touching layout code.
 */

export const homeCopy = {
  hero: {
    eyebrow: "Coming to Linton, Indiana",
    headlineLines: ["Indoor Golf.", "Real Connections."],
    paragraph:
      "State-of-the-art simulators, leagues, lessons, good food and a place for our community to play, compete and connect—year-round.",
    primaryCta: "Join the Opening List",
    secondaryCta: "Learn More",
    locationRow: "Linton, Indiana · Opening Fall 2026",
  },
  values: {
    eyebrow: "A year-round destination to",
    pillars: [
      {
        title: "Play",
        body: "Premium simulators and world-class courses for every skill level.",
      },
      {
        title: "Learn",
        body: "Lessons and clinics for juniors, beginners and seasoned golfers.",
      },
      {
        title: "Compete",
        body: "Leagues, tournaments and team events for every age and ability.",
      },
      {
        title: "Connect",
        body: "Great food, drinks and a welcoming place to gather with friends.",
      },
    ],
  },
  gallery: {
    eyebrow: "More than just golf",
    heading: "Where Golf Brings People Together.",
  },
  signup: {
    eyebrow: "Be the first to know",
    heading: "Opening Fall 2026",
    body: "Get updates on our progress, opening events, league registration and special offers.",
    placeholder: "Enter your email address",
    button: "Join the List",
    success: "You're on the list. We'll keep you updated as opening day gets closer.",
  },
  footer: {
    statement: "A year-round place to play, learn, compete and connect.",
  },
} as const;

export interface GalleryImage {
  src: string;
  alt: string;
}

/**
 * Interim stock photography (crops from the two supplied source
 * photos). As facility shoots happen — lounge, lessons, food, live
 * music, league nights — add those images here with accurate alt
 * text. Tracked in LAUNCH_CHECKLIST.md.
 */
export const galleryImages: GalleryImage[] = [
  {
    src: "/gallery/putting-stroke.jpg",
    alt: "A golfer lining up a putt on the practice green",
  },
  {
    src: "/gallery/teed-up.jpg",
    alt: "A golf ball teed up at dusk, ready for a round",
  },
  {
    src: "/gallery/putting-green.jpg",
    alt: "Practice putts rolling toward the hole on the putting green",
  },
  {
    src: "/gallery/fairway-dusk.jpg",
    alt: "Warm evening light across the turf",
  },
  {
    src: "/gallery/cup-detail.jpg",
    alt: "A close look at the cup on the putting green",
  },
  {
    src: "/gallery/ball-detail.jpg",
    alt: "A golf ball balanced on its tee in the evening light",
  },
];
