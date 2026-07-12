"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Checkbox } from "@/components/ui/checkbox";
import type { PermissionRow, PermissionKey } from "@/lib/admin/types";

/**
 * RoleMatrix — permission matrix showing which roles have which permissions.
 * Supports 10 permissions: View, Create, Edit, Delete, Upload, Download,
 * Publish, Approve, Manage Users, Manage Settings.
 *
 * Locked rows (e.g. Administrator) are read-only.  View-only rows (e.g.
 * Viewer) only show View checked and disable the rest.
 */
export function RoleMatrix({
  rows,
  permissionKeys,
}: {
  rows: PermissionRow[];
  permissionKeys: { key: PermissionKey; label: string }[];
}) {
  return (
    <SurfaceCard className="overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-qbit-surface-container-low border-b border-qbit-outline-variant">
              <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant min-w-[200px]">Role</th>
              {permissionKeys.map((pk) => (
                <th key={pk.key} className="px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant whitespace-nowrap">
                  {pk.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-qbit-outline-variant/40">
            {rows.map((row) => (
              <tr key={row.roleKey} className="hover:bg-qbit-surface-container-low transition-colors">
                {/* Role */}
                <td className="px-4 py-3">
                  <p className="font-semibold text-qbit-on-surface">{row.role}</p>
                  <p className="text-xs text-qbit-on-surface-variant">{row.subtitle}</p>
                </td>
                {/* Permissions */}
                {permissionKeys.map((pk) => {
                  const checked = row.permissions[pk.key];
                  const disabled = row.locked || (row.viewOnly && pk.key !== "view");
                  return (
                    <td key={pk.key} className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={checked}
                          disabled={disabled}
                          className={cn(
                            "border-qbit-outline-variant data-[state=checked]:bg-qbit-primary data-[state=checked]:border-qbit-primary",
                            disabled && "opacity-50",
                          )}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
}
