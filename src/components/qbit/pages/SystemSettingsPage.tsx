"use client";

import { useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import { ADMIN_NAV } from "@/lib/navigation/nav-config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type ThemeId = "light" | "dark" | "system";

type BackupStatus = "success" | "failed";

interface BackupRow {
  date: string;
  subtitle: string;
  size: string;
  status: BackupStatus;
  action: string;
}

interface ThemeOption {
  id: ThemeId;
  label: string;
  icon: string;
}

/* ------------------------------------------------------------------ */
/* Static data — exact copy from system_settings_qbit_hub_admin       */
/* ------------------------------------------------------------------ */

const THEME_OPTIONS: ThemeOption[] = [
  { id: "light", label: "Light", icon: "light_mode" },
  { id: "dark", label: "Dark", icon: "dark_mode" },
  { id: "system", label: "System", icon: "desktop_windows" },
];

const BACKUPS: BackupRow[] = [
  {
    date: "Oct 24, 2023 - 14:00",
    subtitle: "Manual backup initiated by Admin",
    size: "124.5 MB",
    status: "success",
    action: "Restore",
  },
  {
    date: "Oct 23, 2023 - 03:00",
    subtitle: "Scheduled system backup",
    size: "123.8 MB",
    status: "success",
    action: "Restore",
  },
  {
    date: "Oct 22, 2023 - 03:00",
    subtitle: "Scheduled system backup",
    size: "123.2 MB",
    status: "failed",
    action: "Retry",
  },
];

/* ------------------------------------------------------------------ */
/* Small building blocks                                              */
/* ------------------------------------------------------------------ */

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      <Icon name={icon} className="text-[24px] text-qbit-primary" />
      <h3 className="text-headline-sm text-qbit-on-surface">{title}</h3>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-label-md text-qbit-on-surface">
      {children}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export function SystemSettingsPage() {
  const [theme, setTheme] = useState<ThemeId>("light");
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(30);

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Control Center", icon: "bolt" }}
      navItems={ADMIN_NAV}
      activeScreen="system-settings"
      user={{
        name: "Admin User",
        role: "Super Administrator",
        initials: "AU",
      }}
      topBar={{
        searchPlaceholder: "Search settings...",
        user: {
          name: "Admin User",
          role: "Super Administrator",
          initials: "AU",
        },
      }}
    >
      <div className="pb-24">
        {/* Page header */}
        <header className="mb-8">
          <h2 className="text-headline-lg text-qbit-on-surface">
            System Settings
          </h2>
          <p className="mt-1 text-body-md text-qbit-on-surface-variant">
            Configure your enterprise hub branding and global application
            parameters.
          </p>
        </header>

        {/* 12-col bento grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* -------------------------------------------------------- */}
          {/* Branding (col-span-8)                                    */}
          {/* -------------------------------------------------------- */}
          <SurfaceCard className="col-span-12 lg:col-span-8 p-8">
            <SectionHeader icon="palette" title="Branding" />

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* Logo upload */}
              <div className="space-y-4">
                <FieldLabel>Company Logo</FieldLabel>
                <button
                  type="button"
                  className="group flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-qbit-outline-variant bg-qbit-surface-container-low transition-all hover:border-qbit-primary"
                >
                  <Icon
                    name="cloud_upload"
                    className="mb-2 text-3xl text-qbit-outline group-hover:text-qbit-primary"
                  />
                  <p className="text-sm text-qbit-on-surface-variant">
                    Drag and drop or click to upload
                  </p>
                  <p className="text-xs text-qbit-outline">PNG, SVG up to 2MB</p>
                </button>
              </div>

              {/* Color + Font */}
              <div className="space-y-8">
                {/* Primary Color */}
                <div className="space-y-2">
                  <FieldLabel>
                    <span className="flex items-center gap-1">
                      Primary Color
                      <Icon
                        name="info"
                        className="cursor-help text-[14px] text-qbit-outline"
                      />
                    </span>
                  </FieldLabel>
                  <div className="flex items-center gap-4 rounded-lg border border-qbit-outline-variant bg-qbit-surface p-4">
                    <div className="h-12 w-12 shrink-0 rounded border border-white bg-qbit-primary-container shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-semibold text-qbit-on-surface">
                        #0057ff
                      </p>
                      <p className="text-xs text-qbit-outline">
                        Active Corporate Blue
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full bg-qbit-surface-container-high px-4 py-2 text-label-sm text-qbit-on-surface transition-colors hover:bg-qbit-surface-container-highest"
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* Primary Font */}
                <div className="space-y-2">
                  <FieldLabel>Primary Font</FieldLabel>
                  <Select defaultValue="inter">
                    <SelectTrigger className="h-10 w-full rounded-lg border-qbit-outline-variant bg-qbit-surface px-4 text-body-md font-medium text-qbit-on-surface hover:bg-qbit-surface-container-low">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-qbit-outline-variant bg-qbit-surface-container-lowest">
                      <SelectItem value="inter">Inter (Default)</SelectItem>
                      <SelectItem value="roboto">Roboto</SelectItem>
                      <SelectItem value="open-sans">Open Sans</SelectItem>
                      <SelectItem value="ibm-plex">IBM Plex Sans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </SurfaceCard>

          {/* -------------------------------------------------------- */}
          {/* App Settings (col-span-4)                                */}
          {/* -------------------------------------------------------- */}
          <SurfaceCard className="col-span-12 lg:col-span-4 p-8">
            <SectionHeader icon="language" title="App Settings" />

            <div className="space-y-6">
              {/* Default Language */}
              <div className="space-y-1">
                <FieldLabel>Default Language</FieldLabel>
                <Select defaultValue="en-us">
                  <SelectTrigger className="h-10 w-full rounded-lg border-qbit-outline-variant bg-qbit-surface px-4 text-body-md font-medium text-qbit-on-surface hover:bg-qbit-surface-container-low">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-qbit-outline-variant bg-qbit-surface-container-lowest">
                    <SelectItem value="en-us">English (US)</SelectItem>
                    <SelectItem value="es">Spanish (ES)</SelectItem>
                    <SelectItem value="fr">French (FR)</SelectItem>
                    <SelectItem value="de">German (DE)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Appearance Theme */}
              <div className="space-y-1">
                <FieldLabel>Appearance Theme</FieldLabel>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_OPTIONS.map((opt) => {
                    const active = theme === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTheme(opt.id)}
                        className={
                          active
                            ? "flex flex-col items-center gap-1 rounded-lg border border-qbit-primary bg-qbit-primary-container/10 p-2 transition-colors"
                            : "flex flex-col items-center gap-1 rounded-lg border border-qbit-outline-variant bg-qbit-surface p-2 transition-colors hover:bg-qbit-surface-container"
                        }
                      >
                        <Icon
                          name={opt.icon}
                          className={
                            active
                              ? "text-[20px] text-qbit-primary"
                              : "text-[20px] text-qbit-outline"
                          }
                        />
                        <span
                          className={
                            active
                              ? "text-xs font-semibold text-qbit-on-surface"
                              : "text-xs text-qbit-on-surface-variant"
                          }
                        >
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Timezone */}
              <div className="space-y-1">
                <FieldLabel>Timezone</FieldLabel>
                <Select defaultValue="pacific">
                  <SelectTrigger className="h-10 w-full rounded-lg border-qbit-outline-variant bg-qbit-surface px-4 text-body-md font-medium text-qbit-on-surface hover:bg-qbit-surface-container-low">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-qbit-outline-variant bg-qbit-surface-container-lowest">
                    <SelectItem value="pacific">
                      (GMT-08:00) Pacific Time (US &amp; Canada)
                    </SelectItem>
                    <SelectItem value="utc">(GMT+00:00) UTC</SelectItem>
                    <SelectItem value="cet">
                      (GMT+01:00) Central European Time
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SurfaceCard>

          {/* -------------------------------------------------------- */}
          {/* Security & Privacy (col-span-5)                          */}
          {/* -------------------------------------------------------- */}
          <SurfaceCard className="col-span-12 lg:col-span-5 p-8">
            <SectionHeader icon="security" title="Security & Privacy" />

            <div className="space-y-8">
              {/* MFA toggle */}
              <div className="flex items-center justify-between gap-4 rounded-lg border border-qbit-outline-variant bg-qbit-surface p-4">
                <div className="min-w-0 pr-4">
                  <p className="text-label-md text-qbit-on-surface">
                    Multi-factor Authentication (MFA)
                  </p>
                  <p className="mt-0.5 text-xs text-qbit-on-surface-variant">
                    Require additional verification via email or authenticator
                    app.
                  </p>
                </div>
                <Switch
                  checked={mfaEnabled}
                  onCheckedChange={setMfaEnabled}
                  aria-label="Toggle multi-factor authentication"
                  className="shrink-0 data-[state=checked]:bg-qbit-primary"
                />
              </div>

              {/* Session Timeout */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FieldLabel>Session Timeout</FieldLabel>
                  <span className="text-xs font-semibold text-qbit-primary">
                    {sessionTimeout} Minutes
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={120}
                  step={5}
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(Number(e.target.value))}
                  className="qbit-range-slider"
                  aria-label="Session timeout in minutes"
                />
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-qbit-outline">
                  <span>5m</span>
                  <span>60m</span>
                  <span>120m</span>
                </div>
              </div>
            </div>
          </SurfaceCard>

          {/* -------------------------------------------------------- */}
          {/* Backup & Restore (col-span-7)                            */}
          {/* -------------------------------------------------------- */}
          <SurfaceCard className="col-span-12 lg:col-span-7 p-8">
            <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <SectionHeader icon="backup" title="Backup & Restore" />
              <QbitButton
                variant="primary"
                size="md"
                icon="cloud_sync"
                className="shrink-0"
              >
                Create Manual Backup
              </QbitButton>
            </div>

            <div className="overflow-hidden rounded-lg border border-qbit-outline-variant">
              <Table className="w-full text-left text-body-sm">
                <TableHeader className="border-b border-qbit-outline-variant bg-qbit-surface-container-low">
                  <TableRow className="border-qbit-outline-variant hover:bg-transparent">
                    <TableHead className="px-4 py-2 text-label-sm uppercase text-qbit-outline">
                      Date &amp; Time
                    </TableHead>
                    <TableHead className="px-4 py-2 text-label-sm uppercase text-qbit-outline">
                      Size
                    </TableHead>
                    <TableHead className="px-4 py-2 text-label-sm uppercase text-qbit-outline">
                      Status
                    </TableHead>
                    <TableHead className="px-4 py-2 text-right text-label-sm uppercase text-qbit-outline">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-qbit-outline-variant">
                  {BACKUPS.map((row) => (
                    <TableRow
                      key={row.date}
                      className="border-qbit-outline-variant transition-colors hover:bg-qbit-surface-container"
                    >
                      <TableCell className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-qbit-on-surface">
                            {row.date}
                          </span>
                          <span className="text-xs text-qbit-on-surface-variant">
                            {row.subtitle}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-qbit-on-surface-variant">
                        {row.size}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <StatusBadge
                          variant={
                            row.status === "success" ? "success" : "error"
                          }
                          className="text-[10px] font-bold uppercase tracking-wide"
                        >
                          {row.status === "success" ? "SUCCESS" : "FAILED"}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <button
                          type="button"
                          className="font-semibold text-qbit-primary transition-colors hover:underline"
                        >
                          {row.action}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SurfaceCard>
        </div>
      </div>

      {/* Sticky footer action bar */}
      <div className="glass-panel fixed bottom-6 left-4 right-4 z-40 flex flex-col items-start justify-between gap-3 rounded-xl border border-qbit-outline-variant p-4 shadow-xl sm:flex-row sm:items-center md:left-[calc(var(--sidebar-width,256px)+32px)] md:right-8">
        <div className="flex items-center gap-4">
          <div className="h-2 w-2 animate-pulse rounded-full bg-qbit-primary" />
          <span className="text-label-md text-qbit-on-surface-variant">
            Changes detected but not saved.
          </span>
        </div>
        <div className="flex w-full gap-4 sm:w-auto">
          <QbitButton
            variant="outline"
            size="md"
            className="flex-1 sm:flex-none"
          >
            Discard
          </QbitButton>
          <QbitButton
            variant="primary"
            size="md"
            className="flex-1 sm:flex-none"
          >
            Save All Changes
          </QbitButton>
        </div>
      </div>
    </AppShell>
  );
}
