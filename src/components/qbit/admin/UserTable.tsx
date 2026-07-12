"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminUserRow } from "@/lib/admin/types";

const STATUS_VARIANT = {
  Active: "success",
  Inactive: "neutral",
  Suspended: "error",
} as const;

/**
 * UserTable — enterprise user management table with avatar, name, email,
 * phone, department, role, status, last login, created date, and actions
 * (view, edit, suspend, activate, reset password, delete).
 */
export function UserTable({ users }: { users: AdminUserRow[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (query) {
        const q = query.toLowerCase();
        if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      }
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      return true;
    });
  }, [users, query, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-qbit-on-surface-variant" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low py-2.5 pl-10 pr-3 text-sm focus:bg-white focus:ring-2 focus:ring-qbit-primary/40 focus:border-qbit-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low px-3 py-2.5 text-sm font-medium text-qbit-on-surface cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <SurfaceCard className="overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-qbit-surface-container-low border-b border-qbit-outline-variant">
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant">User</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant hidden md:table-cell">Department</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant">Role</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant hidden lg:table-cell">Last Login</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant hidden lg:table-cell">Created</th>
                <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-qbit-outline-variant/40">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-qbit-surface-container-low transition-colors group">
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold", user.avatarBg)}>
                        {user.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-qbit-on-surface truncate">{user.name}</p>
                        <p className="text-xs text-qbit-on-surface-variant truncate">{user.email}</p>
                        <p className="text-[10px] text-qbit-outline truncate md:hidden">{user.phone}</p>
                      </div>
                    </div>
                  </td>
                  {/* Department */}
                  <td className="px-4 py-3 text-qbit-on-surface-variant hidden md:table-cell">{user.department}</td>
                  {/* Role */}
                  <td className="px-4 py-3">
                    <StatusBadge variant={user.roleBadge}>{user.role}</StatusBadge>
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        user.status === "Active" ? "bg-emerald-500" : user.status === "Suspended" ? "bg-red-500" : "bg-qbit-outline",
                      )} />
                      <span className="text-xs font-medium text-qbit-on-surface-variant">{user.status}</span>
                    </span>
                  </td>
                  {/* Last login */}
                  <td className="px-4 py-3 text-qbit-on-surface-variant whitespace-nowrap hidden lg:table-cell">{user.lastLogin}</td>
                  {/* Created */}
                  <td className="px-4 py-3 text-qbit-on-surface-variant whitespace-nowrap hidden lg:table-cell">{user.createdAt}</td>
                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-qbit-surface-container transition-colors ml-auto">
                          <Icon name="more_vert" className="text-[18px]" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                          <Icon name="visibility" className="text-[16px]" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                          <Icon name="edit" className="text-[16px]" /> Edit
                        </DropdownMenuItem>
                        {user.status === "Active" ? (
                          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-amber-600">
                            <Icon name="block" className="text-[16px]" /> Suspend
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-emerald-600">
                            <Icon name="check_circle" className="text-[16px]" /> Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                          <Icon name="lock_reset" className="text-[16px]" /> Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-red-600">
                          <Icon name="delete" className="text-[16px]" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-qbit-on-surface-variant">No users found.</div>
        )}
      </SurfaceCard>
    </div>
  );
}
