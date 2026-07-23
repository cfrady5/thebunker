import { GoldRule } from "@/components/brand/tartan-divider";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {eyebrow ? (
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold-dark">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-display-md font-semibold text-primary">{title}</h2>
      <GoldRule className={cn("mt-4", align === "left" && "mx-0")} />
      {description ? (
        <p className="mt-4 text-lg leading-relaxed text-charcoal-muted">{description}</p>
      ) : null}
    </div>
  );
}
