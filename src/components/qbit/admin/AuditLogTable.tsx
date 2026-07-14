"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import type { AuditLogEntry } from "@/lib/admin/types";

const DOT_COLOR: Record<string, string> = {
  primary: "bg-qbit-primary",
  secondary: "bg-qbit-secondary-container",
  error: "bg-qbit-error",
  neutral: "bg-qbit-outline-variant",
};

/**
 * AuditLogTable — enterprise audit log table showing user, action, entity,
 * date, IP address, and device.  Reuses the existing SurfaceCard primitive.
 */
export function AuditLogTable({ logs }: { logs: AuditLogEntry[] }) {
  return (
    <SurfaceCard className="overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-qbit-surface-container-low border-b border-qbit-outline-variant">
              <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant">User</th>
              <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant">Action</th>
              <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant">Entity</th>
              <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant">Date</th>
              <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-qbit-outline-variant/40">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-qbit-surface-container-low transition-colors">
                {/* User */}
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", DOT_COLOR[log.dotColor])} />
                    <span className="font-medium text-qbit-on-surface">{log.userName}</span>
                  </div>
                </td>
                {/* Action */}
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Icon name={log.icon} className="text-[14px] text-qbit-on-surface-variant" />
                    <span className="text-qbit-on-surface-variant">{log.actionLabel}</span>
                  </div>
                  {log.description && (
                    <p className="text-[11px] text-qbit-outline mt-0.5">{log.description}</p>
                  )}
                </td>
                {/* Entity */}
                <td className="px-4 py-2.5">
                  <span className="text-qbit-on-surface-variant">{log.entityName ?? log.entity}</span>
                </td>
                {/* Date */}
                <td className="px-4 py-2.5 text-qbit-on-surface-variant whitespace-nowrap">{log.createdAt}</td>
                {/* IP */}
                <td className="px-4 py-2.5 text-qbit-on-surface-variant font-mono text-xs">{log.ipAddress ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
}
