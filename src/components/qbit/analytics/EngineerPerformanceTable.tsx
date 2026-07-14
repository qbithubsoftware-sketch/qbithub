"use client";

/**
 * EngineerPerformanceTable — engineer metrics table.
 *
 * Reuses SurfaceCard, Icon, StatusBadge, TagBadge.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { TagBadge } from "@/components/qbit/primitives/StatusBadge";

interface EngineerMetric {
  engineerId: string;
  engineerName: string;
  jobsAssigned: number;
  jobsCompleted: number;
  jobsPending: number;
  averageCompletionHours: number | null;
  averageRating: number | null;
  totalRatings: number;
  photoCompliance: number | null;
  reportSubmissionRate: number | null;
}

interface EngineerPerformanceTableProps {
  engineers: EngineerMetric[];
}

export function EngineerPerformanceTable({ engineers }: EngineerPerformanceTableProps) {
  if (engineers.length === 0) {
    return (
      <SurfaceCard className="p-6 text-center">
        <Icon name="person_off" className="mx-auto text-[32px] text-qbit-on-surface-variant/40" />
        <p className="mt-2 text-sm text-qbit-on-surface-variant">No engineer data available.</p>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-qbit-surface-container-low text-xs uppercase tracking-wider text-qbit-on-surface-variant">
            <tr>
              <th className="px-3 py-2 text-left">Engineer</th>
              <th className="px-3 py-2 text-right">Assigned</th>
              <th className="px-3 py-2 text-right">Completed</th>
              <th className="px-3 py-2 text-right">Pending</th>
              <th className="px-3 py-2 text-right">Avg Hours</th>
              <th className="px-3 py-2 text-right">Rating</th>
              <th className="px-3 py-2 text-right">Photo %</th>
              <th className="px-3 py-2 text-right">Report %</th>
            </tr>
          </thead>
          <tbody>
            {engineers.map((e) => (
              <tr key={e.engineerId} className="border-t border-qbit-outline-variant/30">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-qbit-primary/10 text-qbit-primary">
                      <Icon name="engineering" className="text-[16px]" />
                    </div>
                    <span className="font-medium text-qbit-on-surface">{e.engineerName}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right font-medium">{e.jobsAssigned}</td>
                <td className="px-3 py-2 text-right text-qbit-success font-medium">{e.jobsCompleted}</td>
                <td className="px-3 py-2 text-right text-qbit-warning">{e.jobsPending}</td>
                <td className="px-3 py-2 text-right">
                  {e.averageCompletionHours !== null ? `${e.averageCompletionHours}h` : "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  {e.averageRating !== null ? (
                    <span className="inline-flex items-center gap-0.5">
                      <Icon name="star" className="text-[14px] text-amber-400" filled />
                      {e.averageRating.toFixed(1)}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  {e.photoCompliance !== null ? (
                    <TagBadge variant={e.photoCompliance >= 80 ? "primary" : "error"}>{e.photoCompliance}%</TagBadge>
                  ) : "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  {e.reportSubmissionRate !== null ? (
                    <TagBadge variant={e.reportSubmissionRate >= 80 ? "primary" : "error"}>{e.reportSubmissionRate}%</TagBadge>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
}
