"use client";

/**
 * Engineer Knowledge Base — Unified page merging
 * Manuals, Installation Guides, Videos, FAQs, and Training.
 *
 * Tabs for category, search, and grid of resources.
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useNavigation, type ScreenId } from "@/lib/navigation/store";
import { ENGINEER_NAV, ENGINEER_FOOTER } from "@/lib/navigation/nav-config";

type KbTab = "all" | "manuals" | "guides" | "videos" | "faqs" | "training";

interface KbItem {
  id: string;
  title: string;
  type: string;
  category: string;
  description: string | null;
  url: string | null;
  createdAt: string;
}

const TAB_CONFIG: { value: KbTab; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "folder" },
  { value: "manuals", label: "Manuals", icon: "description" },
  { value: "guides", label: "Installation Guides", icon: "menu_book" },
  { value: "videos", label: "Videos", icon: "play_circle" },
  { value: "faqs", label: "FAQs", icon: "quiz" },
  { value: "training", label: "Training", icon: "school" },
];

function KbCard({ item }: { item: KbItem }) {
  const typeIcons: Record<string, string> = {
    manual: "description", guide: "menu_book", video: "play_circle",
    faq: "quiz", article: "article", training: "school",
  };
  const typeColors: Record<string, string> = {
    manual: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    guide: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    video: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
    faq: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    training: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    article: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400",
  };
  const icon = typeIcons[item.type] ?? "article";
  const color = typeColors[item.type] ?? typeColors.article;

  return (
    <div className="group rounded-xl border border-border bg-card p-4 lg:p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
          <Icon name={icon} className="text-[20px]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2">{item.title}</h3>
          {item.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="capitalize">{item.type}</span>
            {item.category && <span>· {item.category}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EngineerKnowledgeBasePage() {
  const { data: session } = useSession();
  const navigate = useNavigation((s) => s.navigate);
  const [tab, setTab] = useState<KbTab>("all");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<KbItem[]>([]);
  const [loading, setLoading] = useState(true);

  const userName = session?.user?.name ?? "Engineer";
  const userInitials = userName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
  const userRole = session?.user?.role as string | undefined;
  const displayRole = userRole === "support_engineer" ? "Support" : "Installation Engineer";

  const fetchKb = useCallback(async () => {
    try {
      // Fetch resources from the global resource library
      const res = await fetch("/api/admin/resources?limit=100");
      if (res.ok) {
        const data = await res.json();
        const resources: KbItem[] = (data.items ?? []).map((r: Record<string, unknown>) => ({
          id: String(r.id),
          title: String(r.name ?? "Untitled"),
          type: String(r.type ?? "article"),
          category: String(r.category ?? ""),
          description: String(r.description ?? ""),
          url: String(r.url ?? ""),
          createdAt: String(r.createdAt ?? new Date().toISOString()),
        }));
        setItems(resources);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchKb(); }, [fetchKb]);

  const typeMap: Record<KbTab, string[]> = {
    all: [],
    manuals: ["manual", "user_manual", "quick_start"],
    guides: ["installation_guide", "guide", "installation_video"],
    videos: ["video", "training_video", "installation_video"],
    faqs: ["faq", "troubleshooting", "common_error"],
    training: ["training", "training_video", "video"],
  };

  const filtered = items.filter(item => {
    if (tab !== "all" && !typeMap[tab].some(t => item.type.toLowerCase().includes(t))) return false;
    if (search) {
      const q = search.toLowerCase();
      return item.title.toLowerCase().includes(q) || (item.description?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  return (
    <AppShell
      variant="engineer"
      brand={{ title: "QBIT Hub", tagline: "Engineer Portal", icon: "engineering" }}
      navItems={ENGINEER_NAV}
      footerItems={ENGINEER_FOOTER}
      activeScreen="engineer-knowledge"
      user={{ name: userName, role: displayRole, initials: userInitials }}
      topBar={{
        searchPlaceholder: "Search knowledge base...",
        user: { name: userName, role: displayRole, initials: userInitials },
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Knowledge Base</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manuals, installation guides, videos, FAQs, and training materials — all in one place.</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search manuals, guides, videos..."
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
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Icon name="menu_book" className="text-[48px] text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">No resources found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(item => <KbCard key={item.id} item={item} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}
