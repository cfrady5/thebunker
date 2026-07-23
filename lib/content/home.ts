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
 * Placeholder art ships with the repo so the gallery works from day
 * one; swap each src for real photography (same filenames) as shoots
 * happen. Tracked in LAUNCH_CHECKLIST.md.
 */
export const galleryImages: GalleryImage[] = [
  {
    src: "/gallery/friends-food.svg",
    alt: "Friends sharing food and drinks in the lounge after a round",
  },
  {
    src: "/gallery/youth-lesson.svg",
    alt: "An instructor helping a young golfer with their swing",
  },
  {
    src: "/gallery/burger-drink.svg",
    alt: "A burger and cold drink from the kitchen",
  },
  {
    src: "/gallery/highland-stage.svg",
    alt: "Live acoustic music on the Highland Stage",
  },
  {
    src: "/gallery/simulator-lounge.svg",
    alt: "A simulator bay with lounge seating and a course on screen",
  },
  {
    src: "/gallery/adult-lesson.svg",
    alt: "A golfer reviewing swing data with an instructor",
  },
  {
    src: "/gallery/league-night.svg",
    alt: "A league team celebrating a good shot on league night",
  },
  {
    src: "/gallery/putting-green.svg",
    alt: "Practice putts rolling on the indoor putting green",
  },
];
