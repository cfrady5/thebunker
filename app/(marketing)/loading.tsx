import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingLoading() {
  return (
    <div className="container py-16" aria-busy="true" aria-label="Loading page">
      <Skeleton className="mx-auto h-4 w-40" />
      <Skeleton className="mx-auto mt-4 h-10 w-2/3 max-w-lg" />
      <Skeleton className="mx-auto mt-4 h-4 w-1/2 max-w-md" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
