"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import { EXPORT_TYPES, EXPORT_JOBS } from "@/lib/cms/placeholder-data";

/**
 * ExportPanel — export products, drivers, manuals, articles, categories,
 * users, and analytics to CSV or Excel format.
 */
export function ExportPanel() {
  return (
    <section className="space-y-4">
      <SectionHeader title="Bulk Export" accentDot />

      {/* Export type grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {EXPORT_TYPES.map((type) => (
          <button
            key={type.id}
            className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-qbit-outline-variant bg-white hover:border-qbit-primary/30 hover:shadow-sm transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary group-hover:bg-qbit-primary group-hover:text-white transition-colors">
              <Icon name={type.icon} className="text-[20px]" />
            </div>
            <span className="text-xs font-semibold text-qbit-on-surface">{type.label}</span>
          </button>
        ))}
      </div>

      {/* Format selector + export button */}
      <SurfaceCard className="p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-qbit-on-surface-variant">
          <Icon name="file_download" className="text-[18px] text-qbit-primary" />
          <span>Export as:</span>
        </div>
        <div className="flex gap-2">
          <QbitButton size="sm" variant="outline" icon="description">CSV</QbitButton>
          <QbitButton size="sm" variant="outline" icon="table_view">Excel (.xlsx)</QbitButton>
        </div>
        <QbitButton size="sm" variant="primary" icon="download" className="sm:ml-auto">Generate Export</QbitButton>
      </SurfaceCard>

      {/* Export history */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant mb-2">Recent Exports</p>
        <SurfaceCard className="overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-qbit-surface-container-low border-b border-qbit-outline-variant">
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase text-qbit-on-surface-variant">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase text-qbit-on-surface-variant hidden sm:table-cell">Format</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase text-qbit-on-surface-variant">Rows</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase text-qbit-on-surface-variant hidden md:table-cell">Size</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase text-qbit-on-surface-variant hidden lg:table-cell">Created By</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase text-qbit-on-surface-variant hidden lg:table-cell">Date</th>
                  <th className="px-3 py-2 text-right text-xs font-bold uppercase text-qbit-on-surface-variant">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-qbit-outline-variant/40">
                {EXPORT_JOBS.map((job) => (
                  <tr key={job.id} className="hover:bg-qbit-surface-container-low transition-colors">
                    <td className="px-3 py-2 text-xs font-medium text-qbit-on-surface">{job.type}</td>
                    <td className="px-3 py-2 hidden sm:table-cell">
                      <span className="text-[10px] font-bold uppercase bg-qbit-surface-container-high px-1.5 py-0.5 rounded text-qbit-on-surface-variant">{job.format}</span>
                    </td>
                    <td className="px-3 py-2 text-xs text-qbit-on-surface-variant">{job.rowCount.toLocaleString()}</td>
                    <td className="px-3 py-2 text-xs text-qbit-on-surface-variant hidden md:table-cell">{job.fileSize}</td>
                    <td className="px-3 py-2 text-xs text-qbit-on-surface-variant hidden lg:table-cell">{job.createdBy}</td>
                    <td className="px-3 py-2 text-xs text-qbit-on-surface-variant hidden lg:table-cell">{job.createdAt}</td>
                    <td className="px-3 py-2 text-right">
                      <button aria-label="Download export" className="flex h-7 w-7 items-center justify-center rounded-lg text-qbit-primary hover:bg-qbit-primary/10 transition-colors ml-auto">
                        <Icon name="download" className="text-[16px]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      </div>
    </section>
  );
}
