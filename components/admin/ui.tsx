import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small shared building blocks for admin pages. */

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-primary md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-charcoal-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        {Icon ? <Icon aria-hidden className="h-4 w-4 text-gold-dark" /> : null}
      </div>
      <p
        className={cn(
          "mt-2 font-serif text-3xl font-semibold",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-danger",
          tone === "default" && "text-primary",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function DataTable({
  headers,
  children,
  caption,
}: {
  headers: string[];
  children: React.ReactNode;
  caption?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/40 bg-surface">
      <table className="w-full min-w-[640px] text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-border/40 bg-surface-muted/60 text-left">
            {headers.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-semibold text-charcoal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">{children}</tbody>
      </table>
    </div>
  );
}
