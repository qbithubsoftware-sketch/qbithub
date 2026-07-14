"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import { IMPORT_JOBS } from "@/lib/cms/placeholder-data";

const STATUS_VARIANT: Record<string, "success" | "warning" | "error" | "info" | "neutral"> = {
  completed: "success",
  importing: "info",
  failed: "error",
  rolled_back: "neutral",
  pending: "neutral",
  previewing: "info",
};

const TYPE_ICON: Record<string, string> = {
  product: "inventory_2",
  driver: "settings_input_component",
  manual: "menu_book",
  category: "category",
  youtube: "videocam",
  image: "image",
  document: "description",
};

/**
 * ImportLog — import history table showing all past and current import jobs.
 * Displays job type, file name, status, row counts, and actions (view details, rollback).
 */
export function ImportLog() {
  return (
    <section className="space-y-4">
      <SectionHeader title="Import History" actionLabel="Export log" />
      <SurfaceCard className="overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-qbit-surface-container-low border-b border-qbit-outline-variant">
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant">Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant">File</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant hidden md:table-cell">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant hidden sm:table-cell">Rows</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant hidden lg:table-cell">Started By</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant hidden lg:table-cell">Date</th>
                <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-qbit-outline-variant/40">
              {IMPORT_JOBS.map((job) => (
                <tr key={job.id} className="hover:bg-qbit-surface-container-low transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Icon name={TYPE_ICON[job.type] ?? "description"} className="text-[18px] text-qbit-primary" />
                      <span className="text-xs font-semibold text-qbit-on-surface capitalize hidden sm:inline">{job.type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-qbit-on-surface truncate max-w-[180px]">{job.fileName}</p>
                    <p className="text-[10px] text-qbit-outline">{job.fileSize}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <StatusBadge variant={STATUS_VARIANT[job.status] ?? "neutral"}>{job.status.replace("_", " ")}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-emerald-600 font-semibold">{job.successCount}</span>
                    <span className="text-xs text-qbit-outline">/{job.totalRows}</span>
                    {job.errorCount > 0 && (
                      <span className="text-xs text-red-600 font-semibold ml-1">({job.errorCount} err)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-qbit-on-surface-variant hidden lg:table-cell">{job.startedBy}</td>
                  <td className="px-4 py-3 text-xs text-qbit-on-surface-variant hidden lg:table-cell whitespace-nowrap">{job.createdAt}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button aria-label="View details" className="flex h-7 w-7 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-qbit-surface-container hover:text-qbit-primary transition-colors">
                        <Icon name="visibility" className="text-[16px]" />
                      </button>
                      {job.status === "completed" && (
                        <button aria-label="Rollback import" className="flex h-7 w-7 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-red-50 hover:text-red-600 transition-colors">
                          <Icon name="undo" className="text-[16px]" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </section>
  );
}
