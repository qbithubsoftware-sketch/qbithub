import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("skeleton-premium rounded-lg", className)}
      {...props}
    />
  )
}

/** Premium card skeleton — mimics KpiCard layout */
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 rounded-xl border border-qbit-outline-variant/40 bg-qbit-surface-container-lowest space-y-3", className)}>
      <div className="flex justify-between items-start">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  )
}

/** Premium table row skeleton */
function SkeletonRow({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-qbit-outline-variant/30">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === 0 ? "w-8" : i === 1 ? "flex-1" : i === columns - 1 ? "w-16" : "w-24"}`} />
      ))}
    </div>
  )
}

/** Premium section skeleton — title + grid */
function SkeletonSection({ cardCount = 4 }: { cardCount?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-32" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: cardCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonRow, SkeletonSection }
