import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * "The Bunker" script wordmark. White variant for dark green
 * surfaces (header, footer, sign-in); black for light surfaces.
 */
export function BrandWordmark({
  tone = "white",
  width = 150,
  className,
  priority = false,
}: {
  tone?: "white" | "black";
  width?: number;
  className?: string;
  priority?: boolean;
}) {
  const height = Math.round(width * (411 / 900));
  return (
    <Image
      src={
        tone === "white"
          ? "/brand/bunker-wordmark-white.png"
          : "/brand/bunker-wordmark-black.png"
      }
      alt="The Bunker"
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto", className)}
    />
  );
}

export function WordmarkLink({
  tone = "white",
  width = 150,
  className,
}: {
  tone?: "white" | "black";
  width?: number;
  className?: string;
}) {
  return (
    <Link
      href="/"
      aria-label="The Bunker Indoor Golf — home"
      className={cn("inline-flex items-center", className)}
    >
      <BrandWordmark tone={tone} width={width} priority />
    </Link>
  );
}
