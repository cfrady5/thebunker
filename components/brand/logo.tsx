import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoVariant = "full" | "shield" | "horizontal" | "cream" | "green";

const sources: Record<LogoVariant, string> = {
  full: "/brand/logo-full.svg",
  shield: "/brand/logo-shield.svg",
  horizontal: "/brand/logo-horizontal.svg",
  cream: "/brand/logo-cream.svg",
  green: "/brand/logo-green.svg",
};

export function Logo({
  variant = "full",
  className,
  width = 120,
  height = 140,
  priority = false,
}: {
  variant?: LogoVariant;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}) {
  return (
    <Image
      src={sources[variant]}
      alt="The Bunker Indoor Golf"
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto", className)}
    />
  );
}

export function LogoLink({
  variant = "horizontal",
  className,
  width = 190,
  height = 40,
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
      <Logo variant={variant} width={width} height={height} priority />
    </Link>
  );
}
