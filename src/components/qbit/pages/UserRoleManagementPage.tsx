"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { GlassCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useNavigation } from "@/lib/navigation/store";
import { ADMIN_NAV } from "@/lib/navigation/nav-config";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type TabId = "users" | "roles";

type RoleBadgeVariant = "primary" | "secondary" | "neutral";

interface UserRow {
  name: string;
  roleSubtitle: string;
  roleBadge: string;
  roleBadgeVariant: RoleBadgeVariant;
  email: string;
  status: "Active" | "Inactive";
  lastLogin: string;
  initials: string;
  avatarBg: string;
}

interface SessionDatum {
  day: string;
  sessions: number;
}

type PermissionKey = "view" | "create" | "edit" | "delete" | "upload";

interface PermissionRow {
  role: string;
  subtitle: string;
  /** Whether each permission is checked. */
  permissions: Record<PermissionKey, boolean>;
  /** When true, every checkbox in the row is locked (disabled). */
  locked?: boolean;
  /** When true, only View is enabled; the rest are explicitly disabled
   *  even if `permissions` says checked=false. */
  viewOnly?: boolean;
}

/* ------------------------------------------------------------------ */
/* Static data — exact copy from user_role_management_qbit_hub_admin  */
/* ------------------------------------------------------------------ */

const USERS: UserRow[] = [
  {
    name: "Alex Rivera",
    roleSubtitle: "Team Lead",
    roleBadge: "Administrator",
    roleBadgeVariant: "primary",
    email: "alex.rivera@qbithub.com",
    status: "Active",
    lastLogin: "2 hours ago",
    initials: "AR",
    avatarBg: "bg-qbit-primary text-qbit-on-primary",
  },
  {
    name: "Sarah Chen",
    roleSubtitle: "Field Operations",
    roleBadge: "Service Engineer",
    roleBadgeVariant: "secondary",
    email: "s.chen@qbithub.com",
    status: "Active",
    lastLogin: "Yesterday",
    initials: "SC",
    avatarBg: "bg-qbit-secondary-container text-qbit-on-secondary-container",
  },
  {
    name: "Jordan Smythe",
    roleSubtitle: "Logistics",
    roleBadge: "Hub User",
    roleBadgeVariant: "neutral",
    email: "jsmythe@qbithub.com",
    status: "Inactive",
    lastLogin: "3 days ago",
    initials: "JS",
    avatarBg: "bg-qbit-tertiary text-qbit-on-tertiary",
  },
];

const SESSIONS_DATA: SessionDatum[] = [
  { day: "Mon", sessions: 42 },
  { day: "Tue", sessions: 58 },
  { day: "Wed", sessions: 51 },
  { day: "Thu", sessions: 67 },
  { day: "Fri", sessions: 73 },
  { day: "Sat", sessions: 34 },
  { day: "Sun", sessions: 28 },
  { day: "Total", sessions: 353 },
];

const PERMISSIONS: PermissionRow[] = [
  {
    role: "Administrator",
    subtitle: "Full system access",
    permissions: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      upload: true,
    },
    locked: true,
  },
  {
    role: "Service Engineer",
    subtitle: "Maintenance & Diagnostics",
    permissions: {
      view: true,
      create: true,
      edit: true,
      delete: false,
      upload: true,
    },
  },
  {
    role: "Logistics Hub",
    subtitle: "Fleet & Routing only",
    permissions: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      upload: false,
    },
  },
  {
    role: "Guest Observer",
    subtitle: "Read-only analytics",
    permissions: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      upload: false,
    },
    viewOnly: true,
  },
];

const PERMISSION_COLUMNS: { key: PermissionKey; label: string }[] = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
  { key: "upload", label: "Upload" },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function roleBadgeClass(variant: RoleBadgeVariant): string {
  switch (variant) {
    case "primary":
      return "bg-qbit-primary-container/10 text-qbit-primary";
    case "secondary":
      return "bg-qbit-secondary-container/10 text-qbit-secondary";
    case "neutral":
      return "bg-qbit-surface-container-highest text-qbit-on-surface-variant";
  }
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export function UserRoleManagementPage() {
  const navigate = useNavigation((s) => s.navigate);
  const [activeTab, setActiveTab] = useState<TabId>("users");

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Control Center", icon: "bolt" }}
      navItems={ADMIN_NAV}
      activeScreen="user-role-management"
      user={{
        name: "Admin User",
        role: "Super Administrator",
        initials: "AU",
      }}
      topBar={{
        searchPlaceholder: "Search resources...",
        title: "QBIT Hub Admin",
        user: {
          name: "Admin User",
          role: "Super Administrator",
          initials: "AU",
        },
      }}
    >
      <div className="space-y-6 lg:space-y-8">
        {/* ------------------------------------------------------------ */}
        {/* 1. Page Header                                               */}
        {/* ------------------------------------------------------------ */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-qbit-on-surface md:text-3xl">
              User Management
            </h2>
            <p className="text-sm text-qbit-on-surface-variant md:text-base">
              Manage organization members and their access levels.
            </p>
          </div>
          <QbitButton
            variant="primary"
            size="md"
            icon="person_add"
            iconFilled
            className="shrink-0"
          >
            Invite User
          </QbitButton>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* 2. Tabs                                                      */}
        {/* ------------------------------------------------------------ */}
        <section
          role="tablist"
          aria-label="User management sections"
          className="flex border-b border-qbit-outline-variant"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "users"}
            aria-controls="users-tab-panel"
            id="users-tab"
            onClick={() => setActiveTab("users")}
            className={
              "px-4 py-3 text-sm font-semibold transition-all duration-200 sm:px-6 md:px-8 " +
              (activeTab === "users"
                ? "border-b-2 border-qbit-primary text-qbit-primary"
                : "border-b-2 border-transparent text-qbit-on-surface-variant hover:text-qbit-on-surface")
            }
          >
            Users
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "roles"}
            aria-controls="roles-tab-panel"
            id="roles-tab"
            onClick={() => setActiveTab("roles")}
            className={
              "px-4 py-3 text-sm font-semibold transition-all duration-200 sm:px-6 md:px-8 " +
              (activeTab === "roles"
                ? "border-b-2 border-qbit-primary text-qbit-primary"
                : "border-b-2 border-transparent text-qbit-on-surface-variant hover:text-qbit-on-surface")
            }
          >
            Roles &amp; Permissions
          </button>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* 3. Users Tab Content                                         */}
        {/* ------------------------------------------------------------ */}
        {activeTab === "users" && (
          <div
            id="users-tab-panel"
            role="tabpanel"
            aria-labelledby="users-tab"
            className="space-y-6"
          >
            {/* Users table */}
            <GlassCard className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-qbit-outline-variant bg-qbit-surface-container-low hover:bg-qbit-surface-container-low">
                    <TableHead className="h-11 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-qbit-on-surface-variant md:px-6">
                      Name
                    </TableHead>
                    <TableHead className="h-11 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-qbit-on-surface-variant md:px-6">
                      Role
                    </TableHead>
                    <TableHead className="h-11 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-qbit-on-surface-variant md:px-6">
                      Email
                    </TableHead>
                    <TableHead className="h-11 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-qbit-on-surface-variant md:px-6">
                      Status
                    </TableHead>
                    <TableHead className="h-11 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-qbit-on-surface-variant md:px-6">
                      Last Login
                    </TableHead>
                    <TableHead className="h-11 px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-qbit-on-surface-variant md:px-6">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-qbit-surface-container">
                  {USERS.map((user) => (
                    <TableRow
                      key={user.email}
                      className="group transition-transform duration-200 hover:bg-qbit-surface-container-low hover:translate-x-1"
                    >
                      <TableCell className="px-4 py-4 md:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-qbit-outline-variant text-xs font-bold " +
                              user.avatarBg
                            }
                            aria-hidden="true"
                          >
                            {user.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-qbit-on-surface">
                              {user.name}
                            </p>
                            <p className="text-xs text-qbit-on-surface-variant">
                              {user.roleSubtitle}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 md:px-6">
                        <span
                          className={
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold " +
                            roleBadgeClass(user.roleBadgeVariant)
                          }
                        >
                          {user.roleBadge}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-qbit-on-surface-variant md:px-6">
                        {user.email}
                      </TableCell>
                      <TableCell className="px-4 py-4 md:px-6">
                        {user.status === "Active" ? (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-qbit-outline">
                            <span className="h-2 w-2 rounded-full border border-qbit-outline" />
                            Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-qbit-on-surface-variant md:px-6">
                        {user.lastLogin}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right md:px-6">
                        <button
                          type="button"
                          aria-label={`More actions for ${user.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-qbit-outline transition-colors hover:bg-qbit-surface-container hover:text-qbit-on-surface"
                        >
                          <Icon name="more_vert" className="text-[20px]" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </GlassCard>

            {/* Insights: Active Sessions + Security Audit */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Active Sessions (spans 2 cols on md+) */}
              <GlassCard className="flex flex-col justify-between p-5 md:col-span-2 md:p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-qbit-on-surface">
                    Active Sessions
                  </h3>
                  <p className="text-sm text-qbit-on-surface-variant">
                    Real-time overview of current platform usage across your organization.
                  </p>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={SESSIONS_DATA}
                      margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke="rgba(115, 118, 136, 0.18)"
                        strokeDasharray="3 3"
                      />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#737688", fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#737688", fontSize: 12 }}
                        width={40}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(0, 67, 200, 0.08)" }}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid rgba(195, 197, 217, 0.6)",
                          background: "rgba(255, 255, 255, 0.96)",
                          fontSize: 12,
                          boxShadow: "0 8px 24px rgba(20, 27, 43, 0.08)",
                        }}
                        labelStyle={{ color: "#141b2b", fontWeight: 600 }}
                        formatter={(value: number) => [`${value} sessions`, "Sessions"]}
                      />
                      <Bar
                        dataKey="sessions"
                        fill="#0043c8"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Security Audit */}
              <GlassCard className="flex flex-col items-center justify-center gap-4 p-5 text-center md:p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-qbit-primary/10 text-qbit-primary">
                  <Icon name="verified_user" className="text-[36px]" filled />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-qbit-on-surface">
                    Security Audit
                  </h3>
                  <p className="text-sm text-qbit-on-surface-variant">
                    All users have 2FA enabled. Last audit was 48 hours ago.
                  </p>
                </div>
                <QbitButton
                  variant="primary"
                  size="md"
                  icon="verified_user"
                  iconFilled
                  fullWidth
                >
                  Run Audit
                </QbitButton>
              </GlassCard>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* 4. Roles Tab Content                                         */}
        {/* ------------------------------------------------------------ */}
        {activeTab === "roles" && (
          <div
            id="roles-tab-panel"
            role="tabpanel"
            aria-labelledby="roles-tab"
            className="space-y-6"
          >
            <GlassCard className="p-5 md:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-qbit-on-surface">
                    Permission Matrix
                  </h3>
                  <p className="text-sm text-qbit-on-surface-variant">
                    Granular access control for system roles.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("system-settings")}
                  className="self-start text-sm font-semibold text-qbit-primary hover:underline sm:self-auto"
                >
                  Edit All Roles
                </button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-qbit-outline-variant hover:bg-transparent">
                      <TableHead className="px-2 py-3 text-[11px] font-bold uppercase tracking-wider text-qbit-on-surface-variant md:pr-6">
                        Role
                      </TableHead>
                      {PERMISSION_COLUMNS.map((col) => (
                        <TableHead
                          key={col.key}
                          className="px-2 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-qbit-on-surface-variant md:px-4"
                        >
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-qbit-surface-container">
                    {PERMISSIONS.map((row) => (
                      <TableRow
                        key={row.role}
                        className="group transition-transform duration-200 hover:bg-qbit-surface-container-low hover:translate-x-1"
                      >
                        <TableCell className="px-2 py-5 md:pr-6">
                          <div className="flex items-center gap-2">
                            {row.locked && (
                              <Icon
                                name="lock"
                                className="text-[16px] text-qbit-on-surface-variant"
                                aria-label="Locked role"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-qbit-on-surface">
                                {row.role}
                              </p>
                              <p className="text-xs text-qbit-on-surface-variant">
                                {row.subtitle}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        {PERMISSION_COLUMNS.map((col) => {
                          const isChecked = row.permissions[col.key];
                          const isDisabled = Boolean(
                            row.locked || (row.viewOnly && col.key !== "view"),
                          );
                          return (
                            <TableCell
                              key={col.key}
                              className="px-2 py-5 text-center md:px-4"
                            >
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={isChecked}
                                  disabled={isDisabled}
                                  aria-label={`${col.label} permission for ${row.role}`}
                                  className="h-5 w-5 rounded border-qbit-outline-variant data-[state=checked]:bg-qbit-primary data-[state=checked]:border-qbit-primary data-[state=checked]:text-qbit-on-primary"
                                />
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </AppShell>
  );
}
