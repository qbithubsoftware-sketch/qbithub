"use client";

/**
 * Engineer Downloads — Unified download center with tabbed filters.
 * Replaces separate Windows/Android/Linux/Firmware/SDK/Utility menus.
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useNavigation } from "@/lib/navigation/store";
import { ENGINEER_NAV, ENGINEER_FOOTER } from "@/lib/navigation/nav-config";

type DlTab = "all" | "drivers" | "firmware" | "sdk" | "utilities" | "tools";

interface ResourceItem {
  id: string;
  name: string;
  type: string;
  size: number | null;
  version: string | null;
  url: string | null;
  description: string | null;
  createdAt: string;
}

const TAB_CONFIG: { value: DlTab; label: string; icon: string; types: string[] }[] = [
  { value: "all", label: "All", icon: "folder", types: [] },
  { value: "drivers", label: "Drivers", icon: "settings_input_component", types: ["driver", "windows_driver", "opos", "javapos", "printer_driver", "scanner_driver"] },
  { value: "firmware", label: "Firmware", icon: "upgrade", types: ["firmware"] },
  { value: "sdk", label: "SDK", icon: "code", types: ["sdk"] },
  { value: "utilities", label: "Utilities", icon: "build", types: ["utility", "pos_utility", "tool", "apk", "android_software", "windows_software"] },
  { value: "tools", label: "Tools", icon: "construction", types: ["tool", "configuration_guide", "installation_guide", "troubleshooting"] },
];

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function DownloadCard({ item }: { item: ResourceItem }) {
  const typeIcons: Record<string, string> = {
    driver: "settings_input_component", firmware: "upgrade", sdk: "code",
    utility: "build", tool: "construction", video: "play_circle",
    manual: "description", apk: "phone_android",
    windows_driver: "desktop_windows", pos_utility: "point_of_sale",
  };
  const typeColors: Record<string, string> = {
    driver: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    firmware: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    sdk: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    utility: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400",
    tool: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  };

  const icon = typeIcons[item.type] ?? "insert_drive_file";
  const color = typeColors[item.type] ?? "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400";

  const handleDownload = () => {
    if (item.url) {
      window.open(item.url, "_blank");
    } else {
      window.open(`/api/admin/resources/${item.id}?download=true`, "_blank");
    }
  };

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 lg:p-5 transition-shadow hover:shadow-sm">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${color}`}>
        <Icon name={icon} className="text-[22px]" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground truncate">{item.name}</h3>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="capitalize">{item.type.replace(/_/g, " ")}</span>
          {item.version && <span>v{item.version}</span>}
          <span>{formatBytes(item.size)}</span>
        </div>
        {item.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{item.description}</p>
        )}
      </div>
      <QbitButton variant="outline" size="sm" icon="download" onClick={handleDownload}>
        Download
      </QbitButton>
    </div>
  );
}

export function EngineerDownloadsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<DlTab>("all");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const userName = session?.user?.name ?? "Engineer";
  const userInitials = userName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();

  const fetchResources = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/resources?limit=200");
      if (res.ok) {
        const data = await res.json();
        const resources: ResourceItem[] = (data.items ?? []).map((r: Record<string, unknown>) => ({
          id: String(r.id),
          name: String(r.name ?? "Untitled"),
          type: String(r.type ?? "utility"),
          size: (r.size as number) ?? null,
          version: String(r.version ?? ""),
          url: String(r.url ?? ""),
          description: String(r.description ?? ""),
          createdAt: String(r.createdAt ?? new Date().toISOString()),
        }));
        setItems(resources);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  const currentTab = TAB_CONFIG.find(t => t.value === tab) ?? TAB_CONFIG[0];
  const filtered = items.filter(item => {
    if (tab !== "all" && !currentTab.types.some(t => item.type.toLowerCase().includes(t))) return false;
    if (search) {
      const q = search.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.type.toLowerCase().includes(q);
    }
    return true;
  });

  const tabCounts: Record<DlTab, number> = { all: items.length, drivers: 0, firmware: 0, sdk: 0, utilities: 0, tools: 0 };
  for (const item of items) {
    for (const t of TAB_CONFIG) {
      if (t.value !== "all" && t.types.some(type => item.type.toLowerCase().includes(type))) {
        tabCounts[t.value]++;
      }
    }
  }

  return (
    <AppShell
      variant="engineer"
      brand={{ title: "QBIT Hub", tagline: "Engineer Portal", icon: "engineering" }}
      navItems={ENGINEER_NAV}
      footerItems={ENGINEER_FOOTER}
      activeScreen="engineer-downloads"
      user={{ name: userName, role: "Installation Engineer", initials: userInitials }}
      topBar={{
        searchPlaceholder: "Search drivers, firmware, tools...",
        user: { name: userName, role: "Installation Engineer", initials: userInitials },
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Downloads</h1>
          <p className="mt-1 text-sm text-muted-foreground">All drivers, firmware, SDKs, utilities, and tools — filter by category.</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search downloads..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {TAB_CONFIG.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Icon name={t.icon} className="text-[14px]" />
              {t.label}
              <span className="ml-1 text-xs opacity-70">{tabCounts[t.value]}</span>
            </button>
          ))}
        </div>

        {/* Download list */}
        {loading ? (
          <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Icon name="cloud_off" className="text-[48px] text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">No downloads found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => <DownloadCard key={item.id} item={item} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}
