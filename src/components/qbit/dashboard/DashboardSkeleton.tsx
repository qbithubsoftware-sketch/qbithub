"use client";

import { cn } from "@/lib/utils";

/**
 * DashboardSkeleton — loading placeholder matching the dashboard layout.
 * Shows shimmer blocks for hero, search, KPIs, quick access, and sidebar.
 */
export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Hero skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-qbit-surface-container-low border border-qbit-outline-variant rounded-2xl overflow-hidden p-6 md:p-8">
        <div className="md:col-span-7 space-y-3">
          <div className="h-6 w-48 rounded-full bg-qbit-surface-container-high animate-pulse" />
          <div className="h-9 w-64 rounded-lg bg-qbit-surface-container-high animate-pulse" />
          <div className="h-7 w-56 rounded-lg bg-qbit-surface-container-high animate-pulse" />
          <div className="flex gap-8 mt-4">
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-qbit-surface-container-high animate-pulse" />
              <div className="h-5 w-40 rounded bg-qbit-surface-container-high animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-qbit-surface-container-high animate-pulse" />
              <div className="h-5 w-32 rounded bg-qbit-surface-container-high animate-pulse" />
            </div>
          </div>
        </div>
        <div className="md:col-span-5 h-48 rounded-xl bg-qbit-surface-container-high animate-pulse" />
      </div>

      {/* Search skeleton */}
      <div className="max-w-4xl mx-auto w-full">
        <div className="h-14 rounded-2xl bg-qbit-surface-container-high animate-pulse" />
      </div>

      {/* KPI skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-qbit-surface-container-high animate-pulse border border-qbit-outline-variant"
          />
        ))}
      </div>

      {/* Quick access skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-qbit-surface-container-high animate-pulse border border-qbit-outline-variant"
          />
        ))}
      </div>

      {/* Bottom row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 rounded-2xl bg-qbit-surface-container-high animate-pulse border border-qbit-outline-variant" />
        <div className="h-64 rounded-2xl bg-qbit-surface-container-high animate-pulse border border-qbit-outline-variant" />
      </div>
    </div>
  );
}
