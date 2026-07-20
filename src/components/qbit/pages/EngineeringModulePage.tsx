"use client";

/**
 * EngineeringModulePage — Super Admin's central engineering management view.
 *
 * Tabs:
 *   1. Dashboard  — KPI overview, engineer list with stats, quick actions
 *   2. Installations — all work orders with filters, status tracking
 *   3. Assign — create new installation job from existing customer data
 *
 * Reuses:
 *   - AppShell, ADMIN_NAV from existing admin architecture
 *   - /api/admin/engineers API
 *   - /api/admin/installations API
 *   - /api/admin/device-lookup for customer auto-fetch
 *   - /api/fsm/work-orders (engineer-facing, reused)
 *   - Existing QBIT design tokens and component library
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import { ADMIN_NAV } from "@/lib/navigation/nav-config";
import { useAuth } from "@/lib/auth/use-auth";
import { useNavigation } from "@/lib/navigation/store";
import { useToast } from "@/hooks/use-toast";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type TabId = "dashboard" | "installations" | "assign";

interface EngineerItem {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: string;
  status: "active" | "inactive";
  jobStats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    delayed: number;
  };
  latestAssignment: {
    jobNumber: string;
    type: string;
    customerName: string;
    productName: string | null;
    scheduledDate: string;
    status: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface InstallationItem {
  id: string;
  jobNumber: string;
  type: string;
  status: string;
  priority: string;
  customerName: string;
  companyName: string | null;
  customerPhone: string;
  customerEmail: string | null;
  address: string;
  productName: string | null;
  model: string | null;
  serialNumber: string | null;
  assignedEngineerId: string | null;
  assignedEngineerName: string | null;
  scheduledDate: string;
  scheduledTime: string | null;
  estimatedMinutes: number;
  description: string | null;
  completedAt: string | null;
  isDelayed: boolean;
  createdAt: string;
}

interface EngineerSummary {
  totalEngineers: number;
  activeEngineers: number;
  inactiveEngineers: number;
  totalPending: number;
  totalInProgress: number;
  totalCompleted: number;
  totalDelayed: number;
}

/* ------------------------------------------------------------------ */
/* Status helpers                                                     */
/* ------------------------------------------------------------------ */

const STATUS_BADGE_VARIANT: Record<string, "success" | "warning" | "error" | "info" | "primary" | "neutral"> = {
  pending: "warning",
  accepted: "info",
  on_the_way: "primary",
  arrived: "primary",
  installing: "info",
  testing: "info",
  completed: "success",
  cancelled: "error",
  rescheduled: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  on_the_way: "On The Way",
  arrived: "Arrived",
  installing: "Installing",
  testing: "Testing",
  completed: "Completed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
};

const PRIORITY_LABEL: Record<string, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

const PRIORITY_BADGE: Record<string, "neutral" | "primary" | "info" | "error"> = {
  low: "neutral",
  normal: "primary",
  high: "info",
  urgent: "error",
};

/* ------------------------------------------------------------------ */
/* Main Page Component                                                */
/* ------------------------------------------------------------------ */

export function EngineeringModulePage() {
  const { user } = useAuth();
  const navigate = useNavigation((s) => s.navigate);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [engineers, setEngineers] = useState<EngineerItem[]>([]);
  const [summary, setSummary] = useState<EngineerSummary | null>(null);
  const [installations, setInstallations] = useState<InstallationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [installationsLoading, setInstallationsLoading] = useState(false);

  // Filters for installations tab
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [engineerFilter, setEngineerFilter] = useState<string>("all");

  // Assign form state
  const [serialSearch, setSerialSearch] = useState("");
  const [customerData, setCustomerData] = useState<Record<string, unknown> | null>(null);
  const [selectedEngineerId, setSelectedEngineerId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [serialSearching, setSerialSearching] = useState(false);

  // Fetch engineers
  const fetchEngineers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/engineers", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setEngineers(data.items ?? []);
      setSummary(data.summary ?? null);
    } catch {
      toast({ title: "Error", description: "Failed to load engineers", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch installations
  const fetchInstallations = useCallback(async () => {
    setInstallationsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (engineerFilter && engineerFilter !== "all") params.set("engineer", engineerFilter);

      const res = await fetch(`/api/admin/installations?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setInstallations(data.items ?? []);
    } catch {
      toast({ title: "Error", description: "Failed to load installations", variant: "destructive" });
    } finally {
      setInstallationsLoading(false);
    }
  }, [statusFilter, engineerFilter, toast]);

  useEffect(() => {
    void fetchEngineers();
  }, [fetchEngineers]);

  useEffect(() => {
    if (activeTab === "installations") {
      void fetchInstallations();
    }
  }, [activeTab, fetchInstallations]);

  // Serial number lookup for assign form
  const handleSerialLookup = useCallback(async () => {
    if (!serialSearch.trim()) return;
    setSerialSearching(true);
    setCustomerData(null);
    try {
      const res = await fetch(
        `/api/admin/device-lookup?serialNumber=${encodeURIComponent(serialSearch.trim())}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data.found) {
        setCustomerData(data);
        toast({ title: "Device found", description: `Customer: ${data.customer?.name ?? "Unknown"}` });
      } else {
        toast({ title: "Not found", description: "No device found with this serial number.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Lookup failed", variant: "destructive" });
    } finally {
      setSerialSearching(false);
    }
  }, [serialSearch, toast]);

  // Assign installation
  const handleAssignInstallation = useCallback(async () => {
    if (!selectedEngineerId || !scheduledDate) {
      toast({ title: "Missing fields", description: "Please select an engineer and date.", variant: "destructive" });
      return;
    }
    if (!customerData) {
      toast({ title: "No customer", description: "Please look up a device first.", variant: "destructive" });
      return;
    }

    setAssigning(true);
    try {
      const cust = customerData.customer as Record<string, string>;
      const device = customerData.device as Record<string, string>;

      // Step 1: Find or create FSMCustomer from the device lookup data
      // The admin installations API needs a FSMCustomer ID.
      // We use a helper API to find-or-create the FSM customer.
      const custRes = await fetch("/api/admin/installations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Pass raw customer data for find-or-create
          _customerData: {
            name: cust.name,
            phone: cust.mobileNumber,
            email: cust.email,
            companyName: cust.companyName,
            address: cust.address,
          },
          _deviceData: {
            productName: device.productName,
            model: device.modelNumber,
            serialNumber: device.serialNumber,
          },
          assignedEngineerId: selectedEngineerId,
          scheduledDate,
          scheduledTime: scheduledTime || undefined,
          type: "installation",
          priority: "normal",
          description: internalNotes || undefined,
        }),
      });

      if (!custRes.ok) {
        const err = await custRes.json();
        throw new Error(err.error || "Failed to create installation");
      }

      const result = await custRes.json();
      toast({
        title: "Installation Assigned",
        description: `Job ${result.workOrder?.jobNumber ?? "created"} assigned to engineer successfully.`,
      });

      // Reset form
      setSerialSearch("");
      setCustomerData(null);
      setSelectedEngineerId("");
      setScheduledDate("");
      setScheduledTime("");
      setInternalNotes("");
      void fetchEngineers();
    } catch (err) {
      toast({
        title: "Assignment Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  }, [selectedEngineerId, scheduledDate, scheduledTime, internalNotes, customerData, fetchEngineers, toast]);

  const adminName = user?.name ?? "Super Admin";
  const adminInitials = adminName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  // Filtered installations
  const filteredInstallations = useMemo(() => {
    let items = [...installations];
    // Client-side date bucketing
    return items;
  }, [installations]);

  const now = new Date();
  const todayInstallations = useMemo(
    () =>
      installations.filter((i) => {
        const d = new Date(i.scheduledDate);
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }),
    [installations, now]
  );

  const pendingInstallations = useMemo(
    () => installations.filter((i) => i.status === "pending" || i.status === "accepted"),
    [installations]
  );

  const completedInstallations = useMemo(
    () => installations.filter((i) => i.status === "completed"),
    [installations]
  );

  const tabs: Array<{ id: TabId; label: string; icon: string; count?: number }> = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "installations", label: "Installations", icon: "assignment", count: installations.length },
    { id: "assign", label: "Assign Installation", icon: "person_add" },
  ];

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Enterprise Admin", icon: "hub" }}
      navItems={ADMIN_NAV}
      activeScreen="engineering-dashboard"
      user={{ name: adminName, role: user?.role ?? "administrator", initials: adminInitials }}
      topBar={{
        title: "Engineering Module",
        searchPlaceholder: "Search engineers, installations...",
      }}
    >
      <div className="space-y-6">
        {/* ---------- Tab Navigation ---------- */}
        <div className="flex gap-1 rounded-xl bg-qbit-surface-container p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={
                "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all " +
                (activeTab === tab.id
                  ? "bg-white text-qbit-primary shadow-sm"
                  : "text-qbit-on-surface-variant hover:text-qbit-on-surface")
              }
            >
              <Icon name={tab.icon} className="text-[18px]" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="rounded-full bg-qbit-primary/10 px-2 py-0.5 text-xs font-semibold text-qbit-primary">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ---------- Dashboard Tab ---------- */}
        {activeTab === "dashboard" && (
          <DashboardTab
            engineers={engineers}
            summary={summary}
            loading={loading}
            onRefresh={fetchEngineers}
            onToggleEngineer={(engineer, action) => {
              fetch(`/api/admin/engineers/${engineer.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
              })
                .then((res) => {
                  if (!res.ok) throw new Error("Failed");
                  return res.json();
                })
                .then((data) => {
                  toast({
                    title: action === "activate" ? "Engineer Activated" : "Engineer Deactivated",
                    description: data.message ?? `${engineer.name} has been ${action}d.`,
                  });
                  void fetchEngineers();
                })
                .catch(() => {
                  toast({ title: "Error", description: "Failed to update engineer status", variant: "destructive" });
                });
            }}
            onViewInstallations={() => setActiveTab("installations")}
          />
        )}

        {/* ---------- Installations Tab ---------- */}
        {activeTab === "installations" && (
          <InstallationsTab
            installations={installations}
            loading={installationsLoading}
            statusFilter={statusFilter}
            engineerFilter={engineerFilter}
            engineers={engineers}
            onStatusFilterChange={setStatusFilter}
            onEngineerFilterChange={setEngineerFilter}
            onRefresh={fetchInstallations}
            todayCount={todayInstallations.length}
            pendingCount={pendingInstallations.length}
            completedCount={completedInstallations.length}
          />
        )}

        {/* ---------- Assign Installation Tab ---------- */}
        {activeTab === "assign" && (
          <AssignTab
            engineers={engineers}
            serialSearch={serialSearch}
            serialSearching={serialSearching}
            customerData={customerData}
            selectedEngineerId={selectedEngineerId}
            scheduledDate={scheduledDate}
            scheduledTime={scheduledTime}
            internalNotes={internalNotes}
            assigning={assigning}
            onSerialSearchChange={setSerialSearch}
            onSerialLookup={handleSerialLookup}
            onEngineerChange={setSelectedEngineerId}
            onDateChange={setScheduledDate}
            onTimeChange={setScheduledTime}
            onNotesChange={setInternalNotes}
            onAssign={handleAssignInstallation}
          />
        )}
      </div>
    </AppShell>
  );
}

/* ================================================================== */
/* DASHBOARD TAB                                                      */
/* ================================================================== */

function DashboardTab({
  engineers,
  summary,
  loading,
  onRefresh,
  onToggleEngineer,
  onViewInstallations,
}: {
  engineers: EngineerItem[];
  summary: EngineerSummary | null;
  loading: boolean;
  onRefresh: () => void;
  onToggleEngineer: (engineer: EngineerItem, action: "activate" | "deactivate") => void;
  onViewInstallations: () => void;
}) {
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-qbit-outline-variant/30 bg-white p-5">
              <div className="h-4 w-24 rounded bg-qbit-surface-container-high" />
              <div className="mt-2 h-8 w-16 rounded bg-qbit-surface-container-high" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Total Engineers"
            value={summary.totalEngineers}
            icon="engineering"
            subtitle={`${summary.activeEngineers} active`}
            color="primary"
          />
          <KpiCard
            label="Pending Jobs"
            value={summary.totalPending}
            icon="pending_actions"
            subtitle={`${summary.totalDelayed} delayed`}
            color="warning"
          />
          <KpiCard
            label="In Progress"
            value={summary.totalInProgress}
            icon="sync"
            subtitle="Currently active"
            color="info"
          />
          <KpiCard
            label="Completed"
            value={summary.totalCompleted}
            icon="task_alt"
            subtitle="All time"
            color="success"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <QbitButton
          variant="primary"
          icon="person_add"
          onClick={onViewInstallations}
        >
          View All Installations
        </QbitButton>
        <QbitButton variant="outline" icon="refresh" onClick={onRefresh}>
          Refresh
        </QbitButton>
      </div>

      {/* Engineer List */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-qbit-on-surface">Engineers</h2>
          <span className="text-sm text-qbit-on-surface-variant">{engineers.length} total</span>
        </div>

        {engineers.length === 0 ? (
          <EmptyState
            icon="engineering"
            title="No Engineers Found"
            description="No installation or support engineers have been registered yet. Add engineers through User Management."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {engineers.map((eng) => (
              <EngineerCard
                key={eng.id}
                engineer={eng}
                onToggle={(action) => onToggleEngineer(eng, action)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* INSTALLATIONS TAB                                                  */
/* ================================================================== */

function InstallationsTab({
  installations,
  loading,
  statusFilter,
  engineerFilter,
  engineers,
  onStatusFilterChange,
  onEngineerFilterChange,
  onRefresh,
  todayCount,
  pendingCount,
  completedCount,
}: {
  installations: InstallationItem[];
  loading: boolean;
  statusFilter: string;
  engineerFilter: string;
  engineers: EngineerItem[];
  onStatusFilterChange: (v: string) => void;
  onEngineerFilterChange: (v: string) => void;
  onRefresh: () => void;
  todayCount: number;
  pendingCount: number;
  completedCount: number;
}) {
  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4">
        <MiniKpi label="Today" value={todayCount} icon="event_available" color="primary" />
        <MiniKpi label="Pending" value={pendingCount} icon="pending_actions" color="warning" />
        <MiniKpi label="Completed" value={completedCount} icon="task_alt" color="success" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Icon name="filter_list" className="text-[18px] text-qbit-on-surface-variant" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="rounded-lg border border-qbit-outline-variant bg-white px-3 py-2 text-sm text-qbit-on-surface focus:border-qbit-primary focus:outline-none focus:ring-1 focus:ring-qbit-primary"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="on_the_way">On The Way</option>
            <option value="installing">Installing</option>
            <option value="testing">Testing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <select
          value={engineerFilter}
          onChange={(e) => onEngineerFilterChange(e.target.value)}
          className="rounded-lg border border-qbit-outline-variant bg-white px-3 py-2 text-sm text-qbit-on-surface focus:border-qbit-primary focus:outline-none focus:ring-1 focus:ring-qbit-primary"
        >
          <option value="all">All Engineers</option>
          {engineers.map((eng) => (
            <option key={eng.id} value={eng.id}>
              {eng.name}
            </option>
          ))}
        </select>
        <QbitButton variant="ghost" icon="refresh" size="sm" onClick={onRefresh}>
          Refresh
        </QbitButton>
      </div>

      {/* Installation List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-qbit-outline-variant/30 bg-white p-5">
              <div className="h-4 w-1/3 rounded bg-qbit-surface-container-high" />
              <div className="mt-2 h-3 w-2/3 rounded bg-qbit-surface-container-high" />
            </div>
          ))}
        </div>
      ) : installations.length === 0 ? (
        <EmptyState
          icon="assignment"
          title="No Installations Found"
          description="No installations match the current filters. Try changing the status or engineer filter."
        />
      ) : (
        <div className="space-y-3">
          {installations.map((inst) => (
            <InstallationCard key={inst.id} installation={inst} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/* ASSIGN INSTALLATION TAB                                            */
/* ================================================================== */

function AssignTab({
  engineers,
  serialSearch,
  serialSearching,
  customerData,
  selectedEngineerId,
  scheduledDate,
  scheduledTime,
  internalNotes,
  assigning,
  onSerialSearchChange,
  onSerialLookup,
  onEngineerChange,
  onDateChange,
  onTimeChange,
  onNotesChange,
  onAssign,
}: {
  engineers: EngineerItem[];
  serialSearch: string;
  serialSearching: boolean;
  customerData: Record<string, unknown> | null;
  selectedEngineerId: string;
  scheduledDate: string;
  scheduledTime: string;
  internalNotes: string;
  assigning: boolean;
  onSerialSearchChange: (v: string) => void;
  onSerialLookup: () => void;
  onEngineerChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onAssign: () => void;
}) {
  const availableEngineers = engineers.filter(
    (e) => e.role === "installation_engineer" && e.status === "active"
  );

  const cust = customerData?.customer as Record<string, string> | undefined;
  const device = customerData?.device as Record<string, string> | undefined;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left column: Customer & Device lookup */}
      <div className="space-y-5">
        {/* Serial Number Lookup */}
        <div className="rounded-xl border border-qbit-outline-variant bg-white p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-qbit-on-surface">
            <Icon name="search" className="text-[20px] text-qbit-primary" />
            Look Up Customer Device
          </h3>
          <p className="mb-3 text-sm text-qbit-on-surface-variant">
            Enter a serial number to auto-fetch customer name, company, mobile, product, and model details from the Device Lookup database. No duplicate data entry needed.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={serialSearch}
              onChange={(e) => onSerialSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSerialLookup()}
              placeholder="Enter serial number..."
              className="flex-1 rounded-lg border border-qbit-outline-variant bg-qbit-surface-container-low px-3 py-2.5 text-sm text-qbit-on-surface placeholder:text-qbit-on-surface-variant focus:border-qbit-primary focus:outline-none focus:ring-1 focus:ring-qbit-primary"
            />
            <QbitButton
              variant="primary"
              icon={serialSearching ? "progress_activity" : "search"}
              onClick={onSerialLookup}
              disabled={serialSearching}
            >
              {serialSearching ? "Searching..." : "Lookup"}
            </QbitButton>
          </div>
        </div>

        {/* Customer Details (auto-filled) */}
        {customerData && (
          <div className="rounded-xl border border-qbit-primary/30 bg-qbit-primary/5 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-qbit-on-surface">
              <Icon name="person" className="text-[20px] text-qbit-primary" />
              Customer Details
              <StatusBadge variant="success">Auto-fetched</StatusBadge>
            </h3>
            <div className="space-y-2">
              {cust?.name && <InfoRow label="Customer Name" value={cust.name} />}
              {cust?.companyName && <InfoRow label="Company" value={cust.companyName} />}
              {cust?.mobileNumber && <InfoRow label="Mobile" value={cust.mobileNumber} />}
              {cust?.email && <InfoRow label="Email" value={cust.email} />}
              {cust?.address && <InfoRow label="Address" value={cust.address} />}
            </div>
          </div>
        )}

        {/* Device Details (auto-filled) */}
        {customerData && device && (
          <div className="rounded-xl border border-qbit-primary/30 bg-qbit-primary/5 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-qbit-on-surface">
              <Icon name="devices" className="text-[20px] text-qbit-primary" />
              Device Details
              <StatusBadge variant="success">Auto-fetched</StatusBadge>
            </h3>
            <div className="space-y-2">
              {device.productName && <InfoRow label="Product" value={device.productName} />}
              {device.modelNumber && <InfoRow label="Model" value={device.modelNumber} />}
              {device.serialNumber && <InfoRow label="Serial" value={device.serialNumber} />}
              {device.brand && <InfoRow label="Brand" value={device.brand} />}
            </div>
          </div>
        )}
      </div>

      {/* Right column: Assignment form */}
      <div className="space-y-5">
        <div className="rounded-xl border border-qbit-outline-variant bg-white p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-qbit-on-surface">
            <Icon name="person_add" className="text-[20px] text-qbit-primary" />
            Assign Installation
          </h3>

          <div className="space-y-4">
            {/* Select Engineer */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-qbit-on-surface">
                Select Engineer <span className="text-qbit-error">*</span>
              </label>
              <select
                value={selectedEngineerId}
                onChange={(e) => onEngineerChange(e.target.value)}
                className="w-full rounded-lg border border-qbit-outline-variant bg-white px-3 py-2.5 text-sm text-qbit-on-surface focus:border-qbit-primary focus:outline-none focus:ring-1 focus:ring-qbit-primary"
              >
                <option value="">Choose an engineer...</option>
                {availableEngineers.map((eng) => (
                  <option key={eng.id} value={eng.id}>
                    {eng.name} ({eng.jobStats.pending} pending, {eng.jobStats.completed} completed)
                  </option>
                ))}
              </select>
              {availableEngineers.length === 0 && (
                <p className="mt-1 text-xs text-qbit-error">No active installation engineers available.</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-qbit-on-surface">
                Installation Date <span className="text-qbit-error">*</span>
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => onDateChange(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-lg border border-qbit-outline-variant bg-white px-3 py-2.5 text-sm text-qbit-on-surface focus:border-qbit-primary focus:outline-none focus:ring-1 focus:ring-qbit-primary"
              />
            </div>

            {/* Time */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-qbit-on-surface">
                Preferred Time
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => onTimeChange(e.target.value)}
                className="w-full rounded-lg border border-qbit-outline-variant bg-white px-3 py-2.5 text-sm text-qbit-on-surface focus:border-qbit-primary focus:outline-none focus:ring-1 focus:ring-qbit-primary"
              />
            </div>

            {/* Internal Notes */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-qbit-on-surface">
                Internal Notes <span className="text-xs text-qbit-on-surface-variant">(optional)</span>
              </label>
              <textarea
                value={internalNotes}
                onChange={(e) => onNotesChange(e.target.value)}
                rows={3}
                placeholder="Add any special instructions for the engineer..."
                className="w-full rounded-lg border border-qbit-outline-variant bg-white px-3 py-2.5 text-sm text-qbit-on-surface placeholder:text-qbit-on-surface-variant focus:border-qbit-primary focus:outline-none focus:ring-1 focus:ring-qbit-primary"
              />
            </div>

            {/* Submit */}
            <QbitButton
              variant="primary"
              icon={assigning ? "progress_activity" : "assignment_turned_in"}
              fullWidth
              onClick={onAssign}
              disabled={assigning || !customerData || !selectedEngineerId || !scheduledDate}
            >
              {assigning ? "Assigning..." : "Assign Installation"}
            </QbitButton>

            {!customerData && (
              <p className="text-center text-xs text-qbit-on-surface-variant">
                Look up a device first to auto-fill customer details
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Sub-components                                                     */
/* ================================================================== */

function KpiCard({
  label,
  value,
  icon,
  subtitle,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  subtitle: string;
  color: "primary" | "warning" | "info" | "success";
}) {
  const colorMap = {
    primary: "bg-qbit-primary/10 text-qbit-primary",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-blue-100 text-blue-700",
    success: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="rounded-xl border border-qbit-outline-variant/50 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-qbit-on-surface-variant">{label}</p>
          <p className="mt-1 text-3xl font-bold text-qbit-on-surface">{value}</p>
          <p className="mt-1 text-xs text-qbit-on-surface-variant">{subtitle}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color]}`}>
          <Icon name={icon} className="text-[20px]" filled />
        </div>
      </div>
    </div>
  );
}

function MiniKpi({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: "primary" | "warning" | "success";
}) {
  const colorMap = {
    primary: "text-qbit-primary bg-qbit-primary/10",
    warning: "text-amber-700 bg-amber-100",
    success: "text-emerald-700 bg-emerald-100",
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-qbit-outline-variant/50 bg-white p-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorMap[color]}`}>
        <Icon name={icon} className="text-[18px]" filled />
      </div>
      <div>
        <p className="text-2xl font-bold text-qbit-on-surface">{value}</p>
        <p className="text-xs text-qbit-on-surface-variant">{label}</p>
      </div>
    </div>
  );
}

function EngineerCard({
  engineer,
  onToggle,
}: {
  engineer: EngineerItem;
  onToggle: (action: "activate" | "deactivate") => void;
}) {
  const { toast } = useToast();
  const initials = engineer.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="rounded-xl border border-qbit-outline-variant/50 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-qbit-primary/10 text-sm font-bold text-qbit-primary">
          {engineer.image ? (
            <img src={engineer.image} alt={engineer.name} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-semibold text-qbit-on-surface">{engineer.name}</p>
            <StatusBadge variant={engineer.status === "active" ? "success" : "neutral"} dot>
              {engineer.status === "active" ? "Active" : "Inactive"}
            </StatusBadge>
          </div>
          <p className="text-xs text-qbit-on-surface-variant">
            {engineer.role === "installation_engineer" ? "Installation Engineer" : "Support Engineer"} · {engineer.email}
          </p>

          {/* Job Stats */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              <Icon name="pending_actions" className="text-[12px]" />
              {engineer.jobStats.pending} pending
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              <Icon name="sync" className="text-[12px]" />
              {engineer.jobStats.inProgress} active
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <Icon name="task_alt" className="text-[12px]" />
              {engineer.jobStats.completed} done
            </span>
            {engineer.jobStats.delayed > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                <Icon name="warning" className="text-[12px]" />
                {engineer.jobStats.delayed} delayed
              </span>
            )}
          </div>

          {/* Latest assignment */}
          {engineer.latestAssignment && (
            <div className="mt-2 rounded-lg bg-qbit-surface-container-low px-3 py-2">
              <p className="text-xs text-qbit-on-surface-variant">
                Latest: <span className="font-medium text-qbit-on-surface">{engineer.latestAssignment.jobNumber}</span>
                {" — "}{engineer.latestAssignment.customerName}
                {engineer.latestAssignment.productName && ` · ${engineer.latestAssignment.productName}`}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex gap-2">
            {engineer.status === "active" ? (
              <QbitButton
                variant="outline"
                size="sm"
                icon="person_off"
                onClick={() => onToggle("deactivate")}
              >
                Deactivate
              </QbitButton>
            ) : (
              <QbitButton
                variant="primary"
                size="sm"
                icon="person_add"
                onClick={() => onToggle("activate")}
              >
                Activate
              </QbitButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InstallationCard({ installation }: { installation: InstallationItem }) {
  const scheduled = new Date(installation.scheduledDate);
  const now = new Date();
  const isToday =
    scheduled.getDate() === now.getDate() &&
    scheduled.getMonth() === now.getMonth() &&
    scheduled.getFullYear() === now.getFullYear();

  return (
    <div className="rounded-xl border border-qbit-outline-variant/50 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
          <Icon name="build_circle" className="text-[20px]" filled />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm font-semibold text-qbit-primary">{installation.jobNumber}</span>
            <div className="flex items-center gap-2">
              {installation.isDelayed && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                  <Icon name="warning" className="text-[10px]" filled />
                  Delayed
                </span>
              )}
              <StatusBadge variant={STATUS_BADGE_VARIANT[installation.status] ?? "neutral"} dot>
                {STATUS_LABEL[installation.status] ?? installation.status}
              </StatusBadge>
            </div>
          </div>
          <p className="mt-0.5 text-sm font-semibold text-qbit-on-surface">{installation.customerName}</p>
          {installation.companyName && (
            <p className="text-xs text-qbit-on-surface-variant">{installation.companyName}</p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-qbit-on-surface-variant">
            <span className="inline-flex items-center gap-1">
              <Icon name="schedule" className="text-[12px]" />
              {isToday ? "Today" : scheduled.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
              {installation.scheduledTime ? ` · ${installation.scheduledTime}` : ""}
            </span>
            {installation.productName && (
              <span className="inline-flex items-center gap-1">
                <Icon name="inventory_2" className="text-[12px]" />
                {installation.model ?? installation.productName}
              </span>
            )}
            {installation.assignedEngineerName && (
              <span className="inline-flex items-center gap-1">
                <Icon name="engineering" className="text-[12px]" />
                {installation.assignedEngineerName}
              </span>
            )}
            <StatusBadge variant={PRIORITY_BADGE[installation.priority] ?? "neutral"}>
              {PRIORITY_LABEL[installation.priority] ?? installation.priority}
            </StatusBadge>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="w-28 shrink-0 text-qbit-on-surface-variant">{label}</span>
      <span className="font-medium text-qbit-on-surface">{value}</span>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-qbit-outline-variant px-6 py-16 text-center">
      <Icon name={icon} className="mx-auto text-[48px] text-qbit-on-surface-variant/40" />
      <p className="mt-3 text-base font-semibold text-qbit-on-surface">{title}</p>
      <p className="mt-1 text-sm text-qbit-on-surface-variant">{description}</p>
    </div>
  );
}
