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
  why: [
    {
      title: "No dress code. No gatekeeping.",
      body: "Scratch golfers and total beginners share the same bays. If you're curious about golf, you belong here.",
    },
    {
      title: "Weather-proof, year-round.",
      body: "Snow in January or storms in July — inside it's always 72° with a perfect lie.",
    },
    {
      title: "Built for Linton.",
      body: "Local drafts at the bar, local musicians on the stage, local causes on the calendar.",
    },
  ],
  faqs: [
    {
      q: "I've never used a golf simulator. Is that okay?",
      a: "Absolutely — our team sets up your bay, picks an easy game mode and shows you the basics. Most first-timers are hitting shots within five minutes.",
    },
    {
      q: "How does pricing work?",
      a: "You rent the bay by the hour — not per person. Up to six people can share one bay and split the cost however you like.",
    },
    {
      q: "Do I need my own clubs?",
      a: "No. Bring your own or use our rental sets — right-handed, left-handed and junior clubs included.",
    },
    {
      q: "Can kids play?",
      a: "Yes! Kids are welcome in bays with an adult, and our youth clinics and junior league are built just for them.",
    },
    {
      q: "When do you open?",
      a: "Fall 2026. Join the opening list below and you'll be first to know when reservations go live.",
    },
  ],
  /**
   * Real customer quotes only — populated after opening. The
   * testimonials section stays hidden while this is empty.
   */
  testimonials: [] as Array<{ quote: string; name: string }>,
};

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
    src: "/gallery/friends-on-course.jpg",
    alt: "Friends sizing up the next shot together on the course",
  },
  {
    src: "/gallery/putting-stroke.jpg",
    alt: "A golfer lining up a putt on the practice green",
  },
  {
    src: "/gallery/sunset-swing.jpg",
    alt: "A tee shot swung through golden-hour light",
  },
  {
    src: "/gallery/putting-green.jpg",
    alt: "Practice putts rolling toward the hole on the putting green",
  },
  {
    src: "/gallery/range-basket.jpg",
    alt: "A basket of range balls waiting on the turf",
  },
  {
    src: "/gallery/teed-up.jpg",
    alt: "A golf ball teed up at dusk, ready for a round",
  },
  {
    src: "/gallery/ocean-swing.jpg",
    alt: "A golfer following through on a tee shot by the water",
  },
  {
    src: "/gallery/balls-pile.jpg",
    alt: "A heap of fresh golf balls",
  },
  {
    src: "/gallery/fairway-dusk.jpg",
    alt: "Warm evening light across the turf",
  },
];
