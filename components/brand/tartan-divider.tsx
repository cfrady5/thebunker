import { cn } from "@/lib/utils";

/** Thin tartan accent band used to separate major page sections. */
export function TartanDivider({ className }: { className?: string }) {
  return <div aria-hidden className={cn("tartan-band h-2.5 w-full", className)} />;
}

/** Short centered gold rule used under section headings. */
export function GoldRule({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("mx-auto h-0.5 w-16 rounded-full bg-gold", className)} />
  );
}
