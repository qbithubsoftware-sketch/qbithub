"use client";

import { cn } from "@/lib/utils";
import { Skeleton, SkeletonCard, SkeletonRow, SkeletonSection } from "@/components/ui/skeleton";

/**
 * DashboardSkeleton — loading placeholder matching the Home Dashboard layout.
 * Shows shimmer skeletons for hero, search, KPIs, quick access, and sidebar.
 */
export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Hero skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-qbit-surface-container-low border border-qbit-outline-variant/40 rounded-2xl overflow-hidden p-6 md:p-8">
        <div className="md:col-span-7 space-y-3">
          <Skeleton className="h-6 w-48 rounded-full" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-7 w-56" />
          <div className="flex gap-6 mt-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </div>
        <div className="md:col-span-5 h-40 rounded-xl skeleton-premium" />
      </div>

      {/* Search skeleton */}
      <div className="max-w-4xl mx-auto w-full">
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>

      {/* KPI skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Quick access + sidebar skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-5 rounded-xl border border-qbit-outline-variant/30 space-y-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg border border-qbit-outline-variant/30 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2">
          <Skeleton className="h-5 w-32 mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRow key={i} columns={4} />
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
