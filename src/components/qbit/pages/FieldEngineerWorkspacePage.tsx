"use client";

import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { KpiCard } from "@/components/qbit/primitives/KpiCard";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { TagBadge } from "@/components/qbit/primitives/StatusBadge";
import { useNavigation } from "@/lib/navigation/store";
import type { ScreenId } from "@/lib/navigation/store";
import { FIELD_NAV } from "@/lib/navigation/nav-config";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type JobPriority = "high" | "normal";
type JobStatus = "in-progress" | "scheduled";

interface InstallationJob {
  id: string;
  idColorClass: string;
  priority: JobPriority;
  title: string;
  location: string;
  icon: string;
  iconBoxClass: string;
  iconTextClass: string;
  status: JobStatus;
  statusLabel: string;
  statusDotClass: string;
  statusTextClass: string;
  pulse: boolean;
  detailScreen: ScreenId;
}

/* ------------------------------------------------------------------ */
/* Static data — exact copy from field_engineer_workspace_qbit_hub    */
/* ------------------------------------------------------------------ */

const JOBS: InstallationJob[] = [
  {
    id: "INST-550-A",
    idColorClass: "text-qbit-primary",
    priority: "high",
    title: "The Daily Grind - Soho Branch",
    location: "Daily Grind Hospitality Co. • 42nd St, Manhattan",
    icon: "router",
    iconBoxClass: "bg-qbit-primary-fixed",
    iconTextClass: "text-qbit-primary",
    status: "in-progress",
    statusLabel: "In Progress",
    statusDotClass: "bg-qbit-secondary",
    statusTextClass: "text-qbit-secondary",
    pulse: true,
    detailScreen: "job-details-inst-550-a",
  },
  {
    id: "INST-552-C",
    idColorClass: "text-qbit-on-surface-variant",
    priority: "normal",
    title: "Harbor Logistics Hub",
    location: "Global Freight Solutions • Pier 94, Industrial Zone",
    icon: "satellite_alt",
    iconBoxClass: "bg-qbit-surface-container-high",
    iconTextClass: "text-qbit-on-surface-variant",
    status: "scheduled",
    statusLabel: "Scheduled",
    statusDotClass: "bg-qbit-outline-variant",
    statusTextClass: "text-qbit-on-surface-variant",
    pulse: false,
    detailScreen: "job-details-inst-550-a",
  },
  {
    id: "INST-601-B",
    idColorClass: "text-qbit-on-surface-variant",
    priority: "normal",
    title: "Elevate Coworking Space",
    location: "Urban Workplaces LLC • Broadway, Floor 12",
    icon: "sensors",
    iconBoxClass: "bg-qbit-surface-container-high",
    iconTextClass: "text-qbit-on-surface-variant",
    status: "scheduled",
    statusLabel: "Scheduled",
    statusDotClass: "bg-qbit-outline-variant",
    statusTextClass: "text-qbit-on-surface-variant",
    pulse: false,
    detailScreen: "job-details-inst-550-a",
  },
];

/**
 * Field Engineer Workspace — pixel-faithful to the Stitch
 * `field_engineer_workspace_qbit_hub` design. Uses the **Field** sidebar
 * variant via the AppShell.
 */
export function FieldEngineerWorkspacePage() {
  const navigate = useNavigation((s) => s.navigate);

  const handleOpenJob = (job: InstallationJob) => {
    navigate(job.detailScreen, { jobId: job.id });
  };

  return (
    <AppShell
      variant="field"
      brand={{ title: "QBIT Hub", tagline: "Field Ops v2.4", icon: "engineering" }}
      navItems={FIELD_NAV}
      activeScreen="field-engineer-workspace"
      user={{ name: "Alex Rivera", role: "Senior Field Engineer", initials: "AR" }}
      cta={{ label: "Sync Offline Data", icon: "sync" }}
      topBar={{
        searchPlaceholder: "Search jobs, customers, or serials...",
        user: { name: "Alex Rivera", role: "Senior Field Engineer", initials: "AR" },
        showMobileMenu: true,
      }}
    >
      <div className="space-y-6 lg:space-y-8">
        {/* -------------------------------------------------------------- */}
        {/* 1. Header                                                      */}
        {/* -------------------------------------------------------------- */}
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-qbit-on-surface md:text-4xl">
              Field Workspace
            </h2>
            <p className="mt-1 text-base text-qbit-on-surface-variant md:text-lg">
              Welcome back, Alex. You have{" "}
              <span className="font-bold text-qbit-primary">4 jobs</span> scheduled
              for today.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <QbitButton variant="outline" icon="calendar_today">
              View Schedule
            </QbitButton>
            <QbitButton variant="primary" icon="add">
              New Job Request
            </QbitButton>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* 2. KPI Grid (3-col)                                            */}
        {/* -------------------------------------------------------------- */}
        <section
          aria-label="Today's field metrics"
          className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6"
        >
          <KpiCard
            label="Today's Jobs"
            value="04"
            icon="task_alt"
            delta="+2 from yesterday"
            deltaVariant="up"
            iconBg="bg-qbit-primary/10 text-qbit-primary"
          />
          <KpiCard
            label="Pending Installs"
            value="12"
            icon="pending_actions"
            delta="Current backlog"
            deltaVariant="neutral"
            iconBg="bg-amber-100 text-amber-700"
          />
          <KpiCard
            label="Open Issues"
            value="03"
            icon="emergency_home"
            delta="Requires attention"
            deltaVariant="down"
            iconBg="bg-red-100 text-red-700"
          />
        </section>

        {/* -------------------------------------------------------------- */}
        {/* 3. My Installation Jobs                                        */}
        {/* -------------------------------------------------------------- */}
        <SurfaceCard className="overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between gap-3 border-b border-qbit-outline-variant px-4 py-4 md:px-6">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-qbit-on-surface">
                My Installation Jobs
              </h3>
              <span className="inline-flex items-center rounded-full bg-qbit-surface-container-high px-2 py-0.5 text-xs font-semibold text-qbit-on-surface">
                4 Remaining
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Filter jobs"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-qbit-on-surface-variant transition-colors hover:bg-qbit-surface-container-low active:scale-95"
              >
                <Icon name="filter_list" className="text-[20px]" />
              </button>
              <button
                type="button"
                aria-label="Sort jobs"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-qbit-on-surface-variant transition-colors hover:bg-qbit-surface-container-low active:scale-95"
              >
                <Icon name="sort" className="text-[20px]" />
              </button>
            </div>
          </div>

          {/* Job cards */}
          <ul className="divide-y divide-qbit-outline-variant">
            {JOBS.map((job) => (
              <li
                key={job.id}
                className="group px-4 py-5 transition-colors duration-200 hover:bg-qbit-surface-container-low/50 md:px-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left: icon + job info */}
                  <div className="flex flex-1 items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${job.iconBoxClass} ${job.iconTextClass}`}
                    >
                      <Icon name={job.icon} className="text-[24px]" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-bold uppercase tracking-tight ${job.idColorClass}`}
                        >
                          {job.id}
                        </span>
                        {job.priority === "high" ? (
                          <TagBadge
                            variant="error"
                            className="bg-qbit-error-container text-qbit-error"
                          >
                            High Priority
                          </TagBadge>
                        ) : (
                          <TagBadge
                            variant="neutral"
                            className="bg-qbit-surface-variant text-qbit-on-surface-variant"
                          >
                            Normal
                          </TagBadge>
                        )}
                      </div>
                      <h4 className="text-lg font-semibold text-qbit-on-surface">
                        {job.title}
                      </h4>
                      <p className="text-sm text-qbit-on-surface-variant">
                        {job.location}
                      </p>
                    </div>
                  </div>

                  {/* Right: status + action buttons */}
                  <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${job.statusDotClass} ${job.pulse ? "animate-pulse" : ""}`}
                      />
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${job.statusTextClass}`}
                      >
                        {job.statusLabel}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <QbitButton
                        variant="outline"
                        size="md"
                        icon="near_me"
                        className="h-9"
                      >
                        Navigate
                      </QbitButton>
                      <QbitButton
                        variant="outline"
                        size="md"
                        icon="call"
                        className="h-9"
                      >
                        Call
                      </QbitButton>
                      <QbitButton
                        variant="primary"
                        size="md"
                        iconRight="arrow_forward"
                        className="h-9"
                        onClick={() => handleOpenJob(job)}
                      >
                        Open Job
                      </QbitButton>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Footer link */}
          <div className="bg-qbit-surface-container-low px-4 py-3 text-center md:px-6">
            <button
              type="button"
              className="text-sm font-bold text-qbit-primary transition-all hover:underline"
              onClick={() => navigate("job-details-inst-550-a")}
            >
              View All 12 Pending Installations
            </button>
          </div>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
