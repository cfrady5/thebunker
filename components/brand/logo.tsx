import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoVariant = "full" | "shield" | "horizontal" | "cream" | "green";

/** Per-variant source + intrinsic dimensions (height derives from width). */
const VARIANTS: Record<LogoVariant, { src: string; w: number; h: number }> = {
  // Original crest artwork (transparent PNG produced from the source file).
  full: { src: "/brand/bunker-primary-logo.png", w: 800, h: 746 },
  shield: { src: "/brand/logo-shield.svg", w: 240, h: 280 },
  horizontal: { src: "/brand/logo-horizontal.svg", w: 560, h: 120 },
  cream: { src: "/brand/logo-cream.svg", w: 240, h: 280 },
  green: { src: "/brand/logo-green.svg", w: 240, h: 280 },
};

export function Logo({
  variant = "full",
  className,
  width = 120,
  priority = false,
}: {
  variant?: LogoVariant;
  className?: string;
  width?: number;
  /** Deprecated — height is derived from the asset's aspect ratio. */
  height?: number;
  priority?: boolean;
}) {
  const cfg = VARIANTS[variant];
  return (
    <Image
      src={cfg.src}
      alt="The Bunker Indoor Golf"
      width={width}
      height={Math.round(width * (cfg.h / cfg.w))}
      priority={priority}
      className={cn("h-auto", className)}
    />
  );
}

export function LogoLink({
  variant = "horizontal",
  className,
  width = 190,
}: {
  variant?: LogoVariant;
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center", className)}
      aria-label="The Bunker Indoor Golf — home"
    >
      <Logo variant={variant} width={width} priority />
    </Link>
  );
}
