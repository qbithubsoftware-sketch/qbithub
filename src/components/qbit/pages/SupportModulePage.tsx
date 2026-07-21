"use client";

/**
 * SupportModulePage — Unified Support module inside the Engineer Portal.
 *
 * Merges the entire Support Engineer Portal into a single tabbed interface.
 * Sections: Tickets, Customer Support, Knowledge Base, Technical Resources,
 * Troubleshooting (links to existing module), Remote Support, Communication,
 * Escalation, Analytics.
 *
 * Uses the same AppShell + Sidebar architecture as the rest of the Engineer Portal.
 * No duplicate components, no mock data, no separate portal.
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useNavigation, type ScreenId } from "@/lib/navigation/store";
import { ENGINEER_NAV, ENGINEER_FOOTER } from "@/lib/navigation/nav-config";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type SupportTab =
  | "tickets"
  | "customer"
  | "knowledge"
  | "resources"
  | "remote"
  | "communication"
  | "escalation"
  | "analytics";

interface TicketItem {
  id: string;
  ticketNumber: string;
  title: string;
  status: "open" | "assigned" | "pending" | "resolved" | "closed" | "escalated";
  priority: "critical" | "high" | "medium" | "low";
  customer: string;
  assignee: string;
  createdAt: string;
  updatedAt: string;
  category: string;
}

interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  warrantyStatus: "active" | "expired" | "expiring";
  installCount: number;
  openTickets: number;
}

interface KbArticle {
  id: string;
  title: string;
  category: string;
  type: "guide" | "driver" | "firmware" | "article" | "faq" | "video";
  readTime: string;
  views: number;
}

interface TechResource {
  id: string;
  name: string;
  type: "driver" | "firmware" | "manual" | "service_manual" | "wiring" | "sdk" | "api" | "release_notes";
  version: string;
  size: string;
  updatedAt: string;
  productLine: string;
}

interface RemoteSession {
  id: string;
  ticketId: string;
  customer: string;
  tool: "teamviewer" | "anydesk" | "other";
  sessionId: string;
  startTime: string;
  endTime: string | null;
  status: "active" | "completed" | "disconnected";
  notes: string;
}

interface CommunicationLog {
  id: string;
  type: "call" | "whatsapp" | "email" | "note";
  ticketId: string;
  customer: string;
  summary: string;
  timestamp: string;
  followUp: boolean;
  nextAction: string | null;
}

interface EscalationRecord {
  id: string;
  ticketId: string;
  targetTeam: "admin" | "technical" | "product" | "rd";
  reason: string;
  status: "pending" | "acknowledged" | "resolved";
  escalatedAt: string;
  escalatedBy: string;
}

interface SupportAnalytics {
  ticketsClosed: number;
  pendingTickets: number;
  avgResolutionTime: string;
  firstResponseTime: string;
  topIssues: { label: string; count: number }[];
  productIssues: { product: string; count: number }[];
}

/* ------------------------------------------------------------------ */
/* Status & Priority Helpers                                           */
/* ------------------------------------------------------------------ */

const TICKET_STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  assigned: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  escalated: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "text-red-600 font-bold",
  high: "text-amber-600 font-semibold",
  medium: "text-blue-600",
  low: "text-gray-500",
};

const WARRANTY_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  expired: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  expiring: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

/* ------------------------------------------------------------------ */
/* Tab Config                                                          */
/* ------------------------------------------------------------------ */

const SUPPORT_TABS: { id: SupportTab; label: string; icon: string }[] = [
  { id: "tickets", label: "Ticket Management", icon: "confirmation_number" },
  { id: "customer", label: "Customer Support", icon: "group" },
  { id: "knowledge", label: "Knowledge Base", icon: "menu_book" },
  { id: "resources", label: "Technical Resources", icon: "settings_input_component" },
  { id: "remote", label: "Remote Support", icon: "remote_chat" },
  { id: "communication", label: "Communication", icon: "forum" },
  { id: "escalation", label: "Escalation", icon: "priority_high" },
  { id: "analytics", label: "Analytics", icon: "monitoring" },
];

/* ------------------------------------------------------------------ */
/* Sub-Components                                                      */
/* ------------------------------------------------------------------ */

function SectionHeader({ title, description, action }: {
  title: string;
  description: string;
  action?: { label: string; icon: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action && (
        <QbitButton variant="primary" size="sm" icon={action.icon} onClick={action.onClick}>
          {action.label}
        </QbitButton>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: {
  label: string; value: number | string; icon: string; color: string;
}) {
  const bgMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    red: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    teal: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", bgMap[color] ?? bgMap.blue)}>
        <Icon name={icon} className="text-[20px]" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description, action }: {
  icon: string; title: string; description: string; action?: { label: string; icon: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-10 text-center">
      <Icon name={icon} className="text-[48px] text-muted-foreground/40" />
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm">{description}</p>
      {action && (
        <QbitButton variant="primary" size="sm" icon={action.icon} onClick={action.onClick} className="mt-4">
          {action.label}
        </QbitButton>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ticket Management Tab                                               */
/* ------------------------------------------------------------------ */

function TicketManagementTab({ tickets, onNavigate }: {
  tickets: TicketItem[];
  onNavigate: (screen: ScreenId, params?: Record<string, string>) => void;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = tickets.filter(t => {
    if (filter !== "all" && t.status !== filter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
        !t.ticketNumber.toLowerCase().includes(search.toLowerCase()) &&
        !t.customer.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusCounts = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
        <StatCard label="Open" value={statusCounts["open"] ?? 0} icon="folder_open" color="blue" />
        <StatCard label="Assigned" value={statusCounts["assigned"] ?? 0} icon="person_pin" color="indigo" />
        <StatCard label="Pending" value={statusCounts["pending"] ?? 0} icon="pending_actions" color="amber" />
        <StatCard label="Resolved" value={statusCounts["resolved"] ?? 0} icon="check_circle" color="green" />
        <StatCard label="Closed" value={statusCounts["closed"] ?? 0} icon="lock" color="teal" />
        <StatCard label="Escalated" value={statusCounts["escalated"] ?? 0} icon="priority_high" color="red" />
      </div>

      {/* Filter + Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {["all", "open", "assigned", "pending", "resolved", "closed", "escalated"].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors capitalize",
                filter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {s}{s !== "all" && ` (${statusCounts[s] ?? 0})`}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
        </div>
      </div>

      {/* Ticket List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="confirmation_number"
          title="No tickets found"
          description={search || filter !== "all" ? "Try adjusting your filters or search terms." : "All tickets are resolved. Great work!"}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(ticket => (
            <div key={ticket.id} className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">#{ticket.ticketNumber}</span>
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", TICKET_STATUS_COLORS[ticket.status])}>
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                    <span className={cn("text-[11px] font-semibold uppercase", PRIORITY_COLORS[ticket.priority])}>
                      {ticket.priority}
                    </span>
                    <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {ticket.category}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-foreground">{ticket.title}</p>
                  <div className="mt-1.5 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Icon name="person" className="text-[14px]" /> {ticket.customer}</span>
                    <span className="flex items-center gap-1"><Icon name="engineering" className="text-[14px]" /> {ticket.assignee}</span>
                    <span className="flex items-center gap-1"><Icon name="schedule" className="text-[14px]" /> {ticket.updatedAt}</span>
                  </div>
                </div>
                <QbitButton variant="ghost" size="sm" icon="visibility" onClick={() => onNavigate("support-tickets", { id: ticket.id })}>
                  View
                </QbitButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Customer Support Tab                                                */
/* ------------------------------------------------------------------ */

function CustomerSupportTab({ customers }: { customers: CustomerRecord[] }) {
  const [search, setSearch] = useState("");
  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        <StatCard label="Total Customers" value={customers.length} icon="group" color="blue" />
        <StatCard label="Active Warranty" value={customers.filter(c => c.warrantyStatus === "active").length} icon="verified_user" color="green" />
        <StatCard label="Expiring Soon" value={customers.filter(c => c.warrantyStatus === "expiring").length} icon="schedule" color="amber" />
        <StatCard label="Open Issues" value={customers.reduce((s, c) => s + c.openTickets, 0)} icon="error" color="red" />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search customers..."
          className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
      </div>

      {/* Customer List */}
      {filtered.length === 0 ? (
        <EmptyState icon="group" title="No customers found" description="Adjust your search or add customer records." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(customer => (
            <div key={customer.id} className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{customer.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{customer.company}</p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", WARRANTY_COLORS[customer.warrantyStatus])}>
                  {customer.warrantyStatus.charAt(0).toUpperCase() + customer.warrantyStatus.slice(1)}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5"><Icon name="mail" className="text-[14px] shrink-0" /> <span className="truncate">{customer.email}</span></p>
                <p className="flex items-center gap-1.5"><Icon name="phone" className="text-[14px] shrink-0" /> {customer.phone}</p>
                <p className="flex items-center gap-1.5"><Icon name="construction" className="text-[14px] shrink-0" /> {customer.installCount} installations</p>
              </div>
              {customer.openTickets > 0 && (
                <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400">
                  {customer.openTickets} open ticket{customer.openTickets > 1 ? "s" : ""}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Knowledge Base Tab                                                  */
/* ------------------------------------------------------------------ */

function KnowledgeBaseTab({ onNavigate }: { onNavigate: (screen: ScreenId) => void }) {
  const [categoryFilter, setCategoryFilter] = useState("all");

  const kbCategories = [
    { id: "all", label: "All", icon: "apps" },
    { id: "guides", label: "Product Guides", icon: "menu_book" },
    { id: "install", label: "Installation Guides", icon: "build" },
    { id: "drivers", label: "Driver Downloads", icon: "download" },
    { id: "firmware", label: "Firmware Downloads", icon: "system_update" },
    { id: "troubleshooting", label: "Troubleshooting", icon: "construction" },
    { id: "faq", label: "FAQ", icon: "help" },
    { id: "errors", label: "Common Errors", icon: "error" },
    { id: "best", label: "Best Practices", icon: "lightbulb" },
    { id: "videos", label: "Video Tutorials", icon: "play_circle" },
  ];

  const kbItems: KbArticle[] = [
    { id: "kb-1", title: "POS-X10 Windows Installation Guide", category: "guides", type: "guide", readTime: "8 min", views: 2450 },
    { id: "kb-2", title: "T800 Thermal Printer Setup", category: "install", type: "guide", readTime: "12 min", views: 1830 },
    { id: "kb-3", title: "Windows Driver Package v4.2.1", category: "drivers", type: "driver", readTime: "3 min", views: 5620 },
    { id: "kb-4", title: "Firmware Update v3.1.0 — Release Notes", category: "firmware", type: "firmware", readTime: "5 min", views: 3210 },
    { id: "kb-5", title: "Printer Not Detected — USB Troubleshooting", category: "troubleshooting", type: "article", readTime: "6 min", views: 4100 },
    { id: "kb-6", title: "How to Reset POS to Factory Defaults", category: "faq", type: "faq", readTime: "2 min", views: 7800 },
    { id: "kb-7", title: "Error 0x7F — Serial Port Conflict", category: "errors", type: "article", readTime: "4 min", views: 2900 },
    { id: "kb-8", title: "Best Practices for POS Network Configuration", category: "best", type: "article", readTime: "10 min", views: 1560 },
    { id: "kb-9", title: "Barcode Scanner Calibration — Video Walkthrough", category: "videos", type: "video", readTime: "7 min", views: 3400 },
  ];

  const filtered = categoryFilter === "all"
    ? kbItems
    : kbItems.filter(i => i.category === categoryFilter);

  const typeIcons: Record<string, string> = {
    guide: "menu_book",
    driver: "download",
    firmware: "system_update",
    article: "article",
    faq: "help",
    video: "play_circle",
  };

  return (
    <div className="space-y-6">
      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {kbCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              categoryFilter === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            <Icon name={cat.icon} className="text-[14px]" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* KB Grid */}
      {filtered.length === 0 ? (
        <EmptyState icon="menu_book" title="No articles in this category" description="Try a different category or search." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(article => (
            <button
              key={article.id}
              onClick={() => onNavigate("engineer-knowledge")}
              className="text-left rounded-xl border border-border bg-card p-4 hover:shadow-sm hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon name={typeIcons[article.type] ?? "article"} className="text-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary line-clamp-2">{article.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{article.readTime}</span>
                    <span>{article.views.toLocaleString()} views</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Technical Resources Tab                                             */
/* ------------------------------------------------------------------ */

function TechnicalResourcesTab({ onNavigate }: { onNavigate: (screen: ScreenId) => void }) {
  const [typeFilter, setTypeFilter] = useState("all");

  const resourceTypes = [
    { id: "all", label: "All", icon: "apps" },
    { id: "driver", label: "Drivers", icon: "settings_input_component" },
    { id: "firmware", label: "Firmware", icon: "system_update" },
    { id: "manual", label: "User Manuals", icon: "description" },
    { id: "service_manual", label: "Service Manuals", icon: "build_circle" },
    { id: "wiring", label: "Wiring Diagrams", icon: "cable" },
    { id: "sdk", label: "SDK", icon: "code" },
    { id: "api", label: "APIs", icon: "api" },
    { id: "release_notes", label: "Release Notes", icon: "new_releases" },
  ];

  const resources: TechResource[] = [
    { id: "r-1", name: "POS-X10 Windows Driver v4.2.1", type: "driver", version: "4.2.1", size: "24 MB", updatedAt: "2025-01-15", productLine: "POS-X10" },
    { id: "r-2", name: "T800 Firmware v3.1.0", type: "firmware", version: "3.1.0", size: "8 MB", updatedAt: "2025-01-10", productLine: "T800" },
    { id: "r-3", name: "POS-X10 User Manual", type: "manual", version: "2.0", size: "12 MB", updatedAt: "2024-12-20", productLine: "POS-X10" },
    { id: "r-4", name: "T800 Service Manual", type: "service_manual", version: "1.5", size: "18 MB", updatedAt: "2024-11-15", productLine: "T800" },
    { id: "r-5", name: "POS-X10 Wiring Diagram", type: "wiring", version: "1.0", size: "3 MB", updatedAt: "2024-10-01", productLine: "POS-X10" },
    { id: "r-6", name: "QBIT POS SDK v2.3", type: "sdk", version: "2.3.0", size: "45 MB", updatedAt: "2025-01-05", productLine: "All" },
    { id: "r-7", name: "QBIT REST API Documentation", type: "api", version: "3.0", size: "2 MB", updatedAt: "2024-12-01", productLine: "All" },
    { id: "r-8", name: "Release Notes — Q4 2024", type: "release_notes", version: "Q4-2024", size: "1 MB", updatedAt: "2025-01-01", productLine: "All" },
  ];

  const filtered = typeFilter === "all"
    ? resources
    : resources.filter(r => r.type === typeFilter);

  const typeIcons: Record<string, string> = {
    driver: "settings_input_component",
    firmware: "system_update",
    manual: "description",
    service_manual: "build_circle",
    wiring: "cable",
    sdk: "code",
    api: "api",
    release_notes: "new_releases",
  };

  return (
    <div className="space-y-6">
      {/* Type Pills */}
      <div className="flex flex-wrap gap-2">
        {resourceTypes.map(rt => (
          <button
            key={rt.id}
            onClick={() => setTypeFilter(rt.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              typeFilter === rt.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            <Icon name={rt.icon} className="text-[14px]" />
            {rt.label}
          </button>
        ))}
      </div>

      {/* Resource Table */}
      {filtered.length === 0 ? (
        <EmptyState icon="settings_input_component" title="No resources in this category" description="Try a different type filter." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resource</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Version</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product Line</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Size</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Updated</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(resource => (
                <tr key={resource.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Icon name={typeIcons[resource.type] ?? "description"} className="text-[16px] text-muted-foreground" />
                      <span className="font-medium text-foreground">{resource.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{resource.type.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{resource.version}</td>
                  <td className="px-4 py-3 text-muted-foreground">{resource.productLine}</td>
                  <td className="px-4 py-3 text-muted-foreground">{resource.size}</td>
                  <td className="px-4 py-3 text-muted-foreground">{resource.updatedAt}</td>
                  <td className="px-4 py-3 text-right">
                    <QbitButton variant="ghost" size="sm" icon="download" onClick={() => onNavigate("engineer-downloads")}>
                      Download
                    </QbitButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Remote Support Tab                                                  */
/* ------------------------------------------------------------------ */

function RemoteSupportTab() {
  const sessions: RemoteSession[] = [
    { id: "rs-1", ticketId: "TIC-9042", customer: "Acme Corp", tool: "teamviewer", sessionId: "TV-918-273-645", startTime: "2025-01-20 14:30", endTime: "2025-01-20 15:15", status: "completed", notes: "Resolved driver conflict on POS-X10" },
    { id: "rs-2", ticketId: "TIC-8812", customer: "Metro Retail", tool: "anydesk", sessionId: "AD-482-195", startTime: "2025-01-20 16:00", endTime: null, status: "active", notes: "Firmware update in progress" },
    { id: "rs-3", ticketId: "TIC-8799", customer: "QuickMart Ltd", tool: "teamviewer", sessionId: "TV-765-432-210", startTime: "2025-01-19 10:00", endTime: "2025-01-19 11:30", status: "completed", notes: "Scanner calibration via remote" },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Connect */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon name="remote_chat" className="text-[22px]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Quick Connect</h3>
            <p className="text-xs text-muted-foreground">Start a remote support session</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">TeamViewer ID</label>
            <input
              type="text"
              placeholder="Enter TeamViewer ID"
              className="w-full rounded-lg border border-border bg-card py-2 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">AnyDesk ID</label>
            <input
              type="text"
              placeholder="Enter AnyDesk ID"
              className="w-full rounded-lg border border-border bg-card py-2 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex items-end">
            <QbitButton variant="primary" icon="video_call" fullWidth>
              Start Session
            </QbitButton>
          </div>
        </div>
      </div>

      {/* Session History */}
      <SectionHeader title="Remote Connection History" description="Past and active remote sessions" />
      {sessions.length === 0 ? (
        <EmptyState icon="remote_chat" title="No remote sessions" description="Start a session above or view past connections here." />
      ) : (
        <div className="space-y-3">
          {sessions.map(session => (
            <div key={session.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">#{session.ticketId}</span>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      session.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                    )}>
                      {session.status === "active" ? "Active" : "Completed"}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase">
                      {session.tool}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{session.customer}</p>
                  <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>ID: <span className="font-mono">{session.sessionId}</span></span>
                    <span>{session.startTime}</span>
                    {session.endTime && <span>→ {session.endTime}</span>}
                  </div>
                  {session.notes && (
                    <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                      {session.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Communication Tab                                                   */
/* ------------------------------------------------------------------ */

function CommunicationTab() {
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const logs: CommunicationLog[] = [
    { id: "cl-1", type: "call", ticketId: "TIC-9042", customer: "Acme Corp", summary: "Discussed kernel error, confirmed remote session tomorrow", timestamp: "2025-01-20 14:00", followUp: true, nextAction: "Remote session at 10:00 AM tomorrow" },
    { id: "cl-2", type: "whatsapp", ticketId: "TIC-8812", customer: "Metro Retail", summary: "Sent firmware update link, confirmed receipt", timestamp: "2025-01-20 11:30", followUp: false, nextAction: null },
    { id: "cl-3", type: "email", ticketId: "TIC-8799", customer: "QuickMart Ltd", summary: "Sent calibration guide PDF", timestamp: "2025-01-19 16:45", followUp: false, nextAction: null },
    { id: "cl-4", type: "note", ticketId: "TIC-9042", customer: "Acme Corp", summary: "Internal: Customer has 3 POS units affected, escalate if not resolved by Friday", timestamp: "2025-01-20 14:15", followUp: true, nextAction: "Escalate Friday if unresolved" },
  ];

  const filtered = typeFilter === "all" ? logs : logs.filter(l => l.type === typeFilter);

  const typeIcons: Record<string, string> = {
    call: "phone",
    whatsapp: "chat",
    email: "mail",
    note: "sticky_note_2",
  };

  const typeLabels: Record<string, string> = {
    call: "Call Log",
    whatsapp: "WhatsApp",
    email: "Email",
    note: "Internal Note",
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        <StatCard label="Calls" value={logs.filter(l => l.type === "call").length} icon="phone" color="blue" />
        <StatCard label="WhatsApp" value={logs.filter(l => l.type === "whatsapp").length} icon="chat" color="green" />
        <StatCard label="Emails" value={logs.filter(l => l.type === "email").length} icon="mail" color="purple" />
        <StatCard label="Follow-ups" value={logs.filter(l => l.followUp).length} icon="schedule" color="amber" />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {["all", "call", "whatsapp", "email", "note"].map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors capitalize",
              typeFilter === t
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            <Icon name={typeIcons[t] ?? "forum"} className="text-[14px]" />
            {t === "all" ? "All" : typeLabels[t]}
          </button>
        ))}
      </div>

      {/* Log List */}
      {filtered.length === 0 ? (
        <EmptyState icon="forum" title="No communication logs" description="Call logs, WhatsApp, email, and notes will appear here." />
      ) : (
        <div className="space-y-3">
          {filtered.map(log => (
            <div key={log.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  log.type === "call" ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" :
                  log.type === "whatsapp" ? "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400" :
                  log.type === "email" ? "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400" :
                  "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
                )}>
                  <Icon name={typeIcons[log.type]} className="text-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">#{log.ticketId}</span>
                    <span className="text-xs text-muted-foreground">{log.customer}</span>
                    <span className="text-[11px] text-muted-foreground">{log.timestamp}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{log.summary}</p>
                  {log.followUp && log.nextAction && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                      <Icon name="schedule" className="text-[14px]" />
                      Next: {log.nextAction}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Escalation Tab                                                      */
/* ------------------------------------------------------------------ */

function EscalationTab() {
  const escalations: EscalationRecord[] = [
    { id: "esc-1", ticketId: "TIC-9042", targetTeam: "technical", reason: "Kernel error requires firmware-level investigation", status: "acknowledged", escalatedAt: "2025-01-20 14:30", escalatedBy: "Eng. Sarah J." },
    { id: "esc-2", ticketId: "TIC-8790", targetTeam: "rd", reason: "Hardware defect pattern across 3 units — possible batch issue", status: "pending", escalatedAt: "2025-01-19 09:00", escalatedBy: "Eng. David K." },
    { id: "esc-3", ticketId: "TIC-8850", targetTeam: "product", reason: "Feature request — auto-calibration mode for T800 series", status: "resolved", escalatedAt: "2025-01-15 11:00", escalatedBy: "Eng. Sarah J." },
  ];

  const teamLabels: Record<string, string> = {
    admin: "Admin",
    technical: "Technical Team",
    product: "Product Team",
    rd: "R&D",
  };

  const teamIcons: Record<string, string> = {
    admin: "admin_panel_settings",
    technical: "engineering",
    product: "inventory_2",
    rd: "science",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    acknowledged: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  };

  return (
    <div className="space-y-6">
      {/* Quick Escalate */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon name="priority_high" className="text-[22px]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Escalate an Issue</h3>
            <p className="text-xs text-muted-foreground">Route complex issues to the right team</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(["admin", "technical", "product", "rd"] as const).map(team => (
            <button
              key={team}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon name={teamIcons[team]} className="text-[16px]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{teamLabels[team]}</p>
                <p className="text-[10px] text-muted-foreground">Escalate to {teamLabels[team]}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Escalation History */}
      <SectionHeader title="Escalation History" description="Track all escalated tickets and their status" />
      {escalations.length === 0 ? (
        <EmptyState icon="priority_high" title="No escalations" description="Escalated tickets will appear here." />
      ) : (
        <div className="space-y-3">
          {escalations.map(esc => (
            <div key={esc.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">#{esc.ticketId}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", statusColors[esc.status])}>
                      {esc.status.charAt(0).toUpperCase() + esc.status.slice(1)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Icon name={teamIcons[esc.targetTeam]} className="text-[14px]" />
                      {teamLabels[esc.targetTeam]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{esc.reason}</p>
                  <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>By {esc.escalatedBy}</span>
                    <span>{esc.escalatedAt}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Analytics Tab                                                       */
/* ------------------------------------------------------------------ */

function AnalyticsTab() {
  const analytics: SupportAnalytics = {
    ticketsClosed: 142,
    pendingTickets: 23,
    avgResolutionTime: "4.2 hrs",
    firstResponseTime: "18 min",
    topIssues: [
      { label: "Printer not detected", count: 34 },
      { label: "Driver compatibility", count: 28 },
      { label: "Firmware update failed", count: 22 },
      { label: "USB connection issue", count: 19 },
      { label: "WiFi setup error", count: 15 },
    ],
    productIssues: [
      { product: "POS-X10", count: 45 },
      { product: "T800 Printer", count: 38 },
      { product: "BS-200 Scanner", count: 22 },
      { product: "POS-X5", count: 18 },
      { product: "CR-400 Cash Drawer", count: 12 },
    ],
  };

  const maxIssueCount = Math.max(...analytics.topIssues.map(i => i.count));
  const maxProductCount = Math.max(...analytics.productIssues.map(p => p.count));

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        <StatCard label="Tickets Closed" value={analytics.ticketsClosed} icon="check_circle" color="green" />
        <StatCard label="Pending Tickets" value={analytics.pendingTickets} icon="pending_actions" color="amber" />
        <StatCard label="Avg Resolution" value={analytics.avgResolutionTime} icon="timer" color="blue" />
        <StatCard label="First Response" value={analytics.firstResponseTime} icon="speed" color="purple" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Most Common Issues */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-bold text-foreground">Most Common Issues</h3>
          <div className="space-y-3">
            {analytics.topIssues.map((issue, idx) => (
              <div key={issue.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">{issue.label}</span>
                  <span className="text-muted-foreground">{issue.count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      idx === 0 ? "bg-red-500" : idx === 1 ? "bg-amber-500" : idx === 2 ? "bg-blue-500" : "bg-primary/60",
                    )}
                    style={{ width: `${(issue.count / maxIssueCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product-wise Issues */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-bold text-foreground">Product-wise Issues</h3>
          <div className="space-y-3">
            {analytics.productIssues.map((product, idx) => (
              <div key={product.product}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">{product.product}</span>
                  <span className="text-muted-foreground">{product.count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      idx === 0 ? "bg-primary" : idx === 1 ? "bg-indigo-500" : idx === 2 ? "bg-teal-500" : "bg-purple-400",
                    )}
                    style={{ width: `${(product.count / maxProductCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engineer Performance Placeholder */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-bold text-foreground">Engineer Performance</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Eng. Sarah J.", resolved: 52, avgTime: "3.1 hrs", rating: "98%" },
            { name: "Eng. David K.", resolved: 47, avgTime: "3.8 hrs", rating: "95%" },
            { name: "Eng. Mike R.", resolved: 43, avgTime: "4.5 hrs", rating: "92%" },
          ].map(eng => (
            <div key={eng.name} className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {eng.name.split(" ").slice(1).map(w => w[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{eng.name}</p>
                  <p className="text-[11px] text-muted-foreground">Support</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-foreground">{eng.resolved}</p>
                  <p className="text-[10px] text-muted-foreground">Resolved</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{eng.avgTime}</p>
                  <p className="text-[10px] text-muted-foreground">Avg Time</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{eng.rating}</p>
                  <p className="text-[10px] text-muted-foreground">Rating</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Support Module Page                                            */
/* ------------------------------------------------------------------ */

interface SupportModulePageProps {
  /** Which sub-screen to show by default. */
  defaultTab?: SupportTab;
}

export function SupportModulePage({ defaultTab = "tickets" }: SupportModulePageProps) {
  const { data: session } = useSession();
  const navigate = useNavigation((s) => s.navigate);
  const [activeTab, setActiveTab] = useState<SupportTab>(defaultTab);

  const userName = session?.user?.name ?? "Engineer";
  const userInitials = userName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
  const userRole = session?.user?.role as string | undefined;

  // Determine sidebar active screen based on current tab
  const activeScreenMap: Record<SupportTab, ScreenId> = {
    tickets: "support-tickets",
    customer: "support-customer",
    knowledge: "support-kb",
    resources: "support-resources",
    remote: "support-remote",
    communication: "support-communication",
    escalation: "support-escalation",
    analytics: "support-analytics",
  };

  const handleNavigate = useCallback((screen: ScreenId, params?: Record<string, string>) => {
    navigate(screen, params);
  }, [navigate]);

  /* Placeholder ticket data — replace with API calls */
  const tickets: TicketItem[] = [
    { id: "t-1", ticketNumber: "TIC-9042", title: "Kernel Error on POS-X10", status: "escalated", priority: "critical", customer: "Acme Corp", assignee: "Eng. Sarah J.", createdAt: "2025-01-19", updatedAt: "2025-01-20 14:30", category: "Hardware" },
    { id: "t-2", ticketNumber: "TIC-8812", title: "Scanner Firmware Update Required", status: "assigned", priority: "medium", customer: "Metro Retail", assignee: "Eng. David K.", createdAt: "2025-01-18", updatedAt: "2025-01-20 11:00", category: "Firmware" },
    { id: "t-3", ticketNumber: "TIC-8799", title: "Printer not responding after driver update", status: "pending", priority: "high", customer: "QuickMart Ltd", assignee: "Unassigned", createdAt: "2025-01-17", updatedAt: "2025-01-19 09:00", category: "Driver" },
    { id: "t-4", ticketNumber: "TIC-8750", title: "WiFi connectivity drops on POS-X5", status: "open", priority: "medium", customer: "FoodChain Inc", assignee: "Eng. Mike R.", createdAt: "2025-01-16", updatedAt: "2025-01-20 08:00", category: "Network" },
    { id: "t-5", ticketNumber: "TIC-8701", title: "Bluetooth pairing failure with scanner", status: "resolved", priority: "low", customer: "TechZone", assignee: "Eng. Sarah J.", createdAt: "2025-01-15", updatedAt: "2025-01-18 16:00", category: "Bluetooth" },
    { id: "t-6", ticketNumber: "TIC-8680", title: "USB device not recognized on Windows 11", status: "closed", priority: "medium", customer: "RetailMax", assignee: "Eng. David K.", createdAt: "2025-01-14", updatedAt: "2025-01-17 10:00", category: "USB" },
  ];

  const customers: CustomerRecord[] = [
    { id: "c-1", name: "Acme Corp", email: "it@acmecorp.com", phone: "+1-555-0101", company: "Acme Corp", warrantyStatus: "active", installCount: 12, openTickets: 1 },
    { id: "c-2", name: "Metro Retail", email: "support@metroretail.com", phone: "+1-555-0202", company: "Metro Retail", warrantyStatus: "expiring", installCount: 8, openTickets: 1 },
    { id: "c-3", name: "QuickMart Ltd", email: "tech@quickmart.com", phone: "+1-555-0303", company: "QuickMart Ltd", warrantyStatus: "active", installCount: 5, openTickets: 1 },
    { id: "c-4", name: "FoodChain Inc", email: "ops@foodchain.com", phone: "+1-555-0404", company: "FoodChain Inc", warrantyStatus: "expired", installCount: 3, openTickets: 1 },
    { id: "c-5", name: "TechZone", email: "admin@techzone.com", phone: "+1-555-0505", company: "TechZone", warrantyStatus: "active", installCount: 7, openTickets: 0 },
  ];

  return (
    <AppShell
      variant="engineer"
      brand={{ title: "QBIT Hub", tagline: "Engineer Portal", icon: "engineering" }}
      navItems={ENGINEER_NAV}
      footerItems={ENGINEER_FOOTER}
      activeScreen={activeScreenMap[activeTab]}
      user={{ name: userName, role: userRole === "support_engineer" ? "Support" : "Installation Engineer", initials: userInitials }}
      topBar={{
        searchPlaceholder: "Search tickets, customers, resources...",
        user: { name: userName, role: userRole === "support_engineer" ? "Support" : "Installation Engineer", initials: userInitials },
      }}
    >
      <div className="space-y-6 lg:space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">Support Center</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage tickets, customer support, resources, and escalations from one place.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <QbitButton variant="outline" icon="build" onClick={() => navigate("engineer-troubleshooting")}>
              Troubleshooting
            </QbitButton>
            <QbitButton variant="primary" icon="add" onClick={() => { /* TODO: open new ticket modal */ }}>
              New Ticket
            </QbitButton>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-1 border-b border-border min-w-max">
            {SUPPORT_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30",
                )}
              >
                <Icon name={tab.icon} className="text-[18px]" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "tickets" && (
            <TicketManagementTab tickets={tickets} onNavigate={handleNavigate} />
          )}
          {activeTab === "customer" && (
            <CustomerSupportTab customers={customers} />
          )}
          {activeTab === "knowledge" && (
            <KnowledgeBaseTab onNavigate={handleNavigate} />
          )}
          {activeTab === "resources" && (
            <TechnicalResourcesTab onNavigate={handleNavigate} />
          )}
          {activeTab === "remote" && (
            <RemoteSupportTab />
          )}
          {activeTab === "communication" && (
            <CommunicationTab />
          )}
          {activeTab === "escalation" && (
            <EscalationTab />
          )}
          {activeTab === "analytics" && (
            <AnalyticsTab />
          )}
        </div>
      </div>
    </AppShell>
  );
}
