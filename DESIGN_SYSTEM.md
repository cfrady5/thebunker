# Design System

The Bunker's visual language: a traditional Scottish golf clubhouse crossed
with a modern reservation app — warm, tactile, refined without being exclusive.

## Colors

Defined as HSL channel triplets in `app/globals.css` (so Tailwind opacity
modifiers work) and mapped in `tailwind.config.ts`.

| Token             | Hex       | Tailwind             | Use                                  |
| ----------------- | --------- | -------------------- | ------------------------------------ |
| Bunker Green      | `#123D2A` | `primary`            | Brand primary, buttons, headings     |
| Deep Forest       | `#09291D` | `primary-dark`       | Hero/footer backgrounds              |
| Clubhouse Green   | `#1D5137` | `primary-light`      | Hovers, tartan accent                |
| Warm Cream        | `#F5E8C8` | `cream`              | Text on green, badges                |
| Parchment         | `#E8D3A5` | `cream-dark`         | Borders on cream                     |
| Soft Ivory        | `#FAF8F1` | `background`/`ivory` | Page background                      |
| Warm White        | `#FFFDF8` | `surface`            | Cards                                |
| Antique Gold      | `#B58A3A` | `gold`               | Accents, focus rings, eyebrows       |
| Brass             | `#8D6B2E` | `gold-dark`          | Gold text on light backgrounds       |
| Thistle Purple    | `#6D3470` | `thistle`            | Highland Stage, secondary accent     |
| Charcoal          | `#1C211E` | `charcoal`           | Body text                            |
| Muted Charcoal    | `#4A514C` | `charcoal-muted`     | Secondary text                       |
| Border Tan        | `#C7AE79` | `border`             | Borders                              |
| Success / Warning / Error | `#2D7B50` / `#C7812C` / `#A8433E` | `success`/`warning`/`danger` | State colors |

**Tartan** appears only as a controlled accent: the `.tartan-band` utility (thin
divider bands, hero top edge) — never as a content background.

## Typography

- **Fraunces** (`font-serif`) — headlines, display numerals, brand moments.
- **Inter** (`font-sans`) — body, buttons, forms, prices, admin.
- Loaded with `next/font` (self-hosted at build, `display: swap`), weights
  400–700 only.

Fluid display sizes: `text-display-xl` (42–80px), `-lg` (36–64px), `-md`
(30–48px), `-sm` (26–32px). Body is 16–18px; nothing below 14px.

## Spacing & shape

- Container: max 1200px, 16–32px gutters.
- Radius: `--radius: 0.625rem` (10px) on cards/inputs.
- Shadows: `shadow-card` (rest) and `shadow-card-hover` (lift) only.

## Components

- `components/ui` — shadcn-style primitives (Button, Card, Input, Select,
  Checkbox, Dialog, Accordion, Tabs, DropdownMenu, Badge, Skeleton, Slot).
  Note: Button uses a local RSC-safe `Slot`, not `@radix-ui/react-slot`.
- `components/brand` — `Logo` (all treatments), `TartanDivider`, `GoldRule`.
- `components/marketing` — `SectionHeading`, cards (league/program/event/menu),
  `NewsletterForm`, `MenuBrowser`, forms.
- `components/booking` — `BookingFlow` (stepper, hold timer, slot grid).
- `components/account`, `components/admin` — dashboard building blocks
  (`MetricCard`, `DataTable`, `AdminPageHeader`, status controls).
- `components/feedback` — `InlineAlert`, `EmptyState`.

## Logo usage

Assets in `public/brand/`:

| File                  | Use                                              |
| --------------------- | ------------------------------------------------ |
| `logo-full.svg`       | Hero, auth pages, about, emails                  |
| `logo-horizontal.svg` | Header navigation, narrow spaces                 |
| `logo-shield.svg`     | Small brand moments, error pages                 |
| `logo-cream.svg`      | One-color on dark green (footer, admin sidebar)  |
| `logo-green.svg`      | One-color on light backgrounds                   |
| `app/icon.svg`        | Favicon / app icon                               |

Rules: never stretch or recolor; use the cream variant on dark backgrounds;
don't place the full crest smaller than ~40px wide (use the shield instead).
If final raster artwork replaces these SVG interpretations, keep the same file
names and store a high-resolution source alongside.

## Motion

150–250ms color/shadow transitions, subtle card lift, accordion expansion, and
the booking hold countdown. All animation collapses under
`prefers-reduced-motion` (global CSS override).

## Accessibility

- WCAG 2.2 AA targets: 44px touch targets (buttons are h-11+), visible gold
  focus rings on every interactive element, skip-to-content link, semantic
  headings, labeled forms with `role="alert"` errors, `aria-live` for slot
  loading and hold countdown, status conveyed by text + color (never color
  alone), keyboard-completable booking flow (native date/time inputs, real
  buttons for slots).
