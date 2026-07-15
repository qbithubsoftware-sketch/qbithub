"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import {
  Command as CommandPrimitive,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useNavigation, type ScreenId } from "@/lib/navigation/store";

interface CommandEntry {
  id: string;
  label: string;
  icon: string;
  group: string;
  screen?: ScreenId;
  keywords?: string;
}

const COMMANDS: CommandEntry[] = [
  // Navigation
  { id: "nav-home", label: "Home Dashboard", icon: "home", group: "Navigation", screen: "home", keywords: "dashboard admin" },
  { id: "nav-eng-dash", label: "Engineer Dashboard", icon: "dashboard", group: "Navigation", screen: "engineer-dashboard", keywords: "engineer installation" },
  { id: "nav-admin-dash", label: "Admin Dashboard", icon: "monitoring", group: "Navigation", screen: "admin-dashboard", keywords: "admin analytics" },
  { id: "nav-field", label: "Field Engineer Workspace", icon: "engineering", group: "Navigation", screen: "field-engineer-workspace", keywords: "field jobs" },

  // Products
  { id: "prod-library", label: "Product Library", icon: "inventory_2", group: "Products", screen: "product-library", keywords: "browse catalog hardware" },
  { id: "prod-details", label: "Product Details: T-800", icon: "devices", group: "Products", screen: "product-details-t800", keywords: "t800 specifications" },
  { id: "prod-mgmt", label: "Product Master", icon: "inventory", group: "Products", screen: "product-master", keywords: "manage admin" },
  { id: "prod-overview", label: "T-800 Marketing Page", icon: "campaign", group: "Products", screen: "product-overview", keywords: "public marketing" },

  // Downloads
  { id: "dl-center", label: "Driver Download Center", icon: "settings_input_component", group: "Downloads", screen: "driver-download-center", keywords: "driver firmware sdk utility" },
  { id: "dl-search", label: "Public Product Search", icon: "manage_search", group: "Downloads", screen: "public-search", keywords: "public search catalog" },

  // Knowledge
  { id: "kb-ai", label: "AI Support Center", icon: "smart_toy", group: "Knowledge", screen: "ai-support-center", keywords: "ai assistant chat support" },
  { id: "kb-install", label: "Installation Center", icon: "menu_book", group: "Knowledge", screen: "installation-center", keywords: "guide setup wiring" },
  { id: "kb-t800-guide", label: "T-800 Installation Guide", icon: "build", group: "Knowledge", screen: "t800-installation-guide", keywords: "step by step" },
  { id: "kb-videos", label: "Video Training Center", icon: "play_circle", group: "Knowledge", screen: "video-training-center", keywords: "video training youtube" },
  { id: "kb-search", label: "Universal Search", icon: "search", group: "Knowledge", screen: "universal-search-command-center", keywords: "command palette search" },

  // Admin
  { id: "adm-users", label: "User Role Management", icon: "group", group: "Admin", screen: "user-role-management", keywords: "users roles permissions" },
  { id: "adm-settings", label: "System Settings", icon: "settings", group: "Admin", screen: "system-settings", keywords: "settings configuration" },
  { id: "adm-handover", label: "Customer Handover Report", icon: "fact_check", group: "Admin", screen: "customer-handover-report", keywords: "handover report" },

  // Field
  { id: "fld-job", label: "Job Details: INST-550-A", icon: "task_alt", group: "Field", screen: "job-details-inst-550-a", keywords: "job installation" },
  { id: "fld-completion", label: "Job Completion Handover", icon: "assignment_turned_in", group: "Field", screen: "job-completion-handover", keywords: "completion handover signature" },
];

const RECENT_PAGES_KEY = "qbit-recent-pages";
const MAX_RECENT = 5;

/**
 * PremiumCommandPalette — Ctrl+K / Cmd+K command palette.
 *
 * Features:
 * - Search across all screens with keyword matching
 * - Grouped results (Navigation, Products, Downloads, Knowledge, Admin, Field)
 * - Recent pages tracking (localStorage)
 * - Keyboard navigation (up/down/enter)
 * - Smooth open/close animation via Dialog
 */
export function PremiumCommandPalette() {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<CommandEntry[]>([]);
  const navigate = useNavigation((s) => s.navigate);

  // Global Ctrl+K / Cmd+K shortcut — uses a ref to always read latest open state
  const openRef = useRef(false);
  useEffect(() => { openRef.current = open; }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!openRef.current);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Load recent pages from localStorage
  useEffect(() => {
    const loadRecent = () => {
      try {
        const stored = localStorage.getItem(RECENT_PAGES_KEY);
        if (stored) {
          const ids: string[] = JSON.parse(stored);
          const entries = ids
            .map((id) => COMMANDS.find((c) => c.id === id))
            .filter(Boolean) as CommandEntry[];
          setRecent(entries);
        }
      } catch {
        // localStorage may not be available
      }
    };
    loadRecent();
  }, []);

  const handleSelect = useCallback(
    (entry: CommandEntry) => {
      if (entry.screen) navigate(entry.screen);
      setOpen(false);

      // Update recent pages
      setRecent((prev) => {
        const filtered = prev.filter((p) => p.id !== entry.id);
        const next = [entry, ...filtered].slice(0, MAX_RECENT);
        try {
          localStorage.setItem(RECENT_PAGES_KEY, JSON.stringify(next.map((e) => e.id)));
        } catch {
          // Ignore localStorage errors
        }
        return next;
      });
    },
    [navigate],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search products, drivers, guides, settings..." />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>
          <div className="flex flex-col items-center py-6 text-center">
            <Icon name="search_off" className="text-[32px] text-qbit-on-surface-variant/40 mb-2" />
            <p className="text-sm font-medium text-qbit-on-surface-variant">No results found</p>
            <p className="text-xs text-qbit-on-surface-variant/60 mt-0.5">Try a different search term</p>
          </div>
        </CommandEmpty>

        {/* Recent */}
        {recent.length > 0 && (
          <CommandGroup heading="Recent">
            {recent.map((entry) => (
              <CommandItem
                key={`recent-${entry.id}`}
                value={`${entry.label} ${entry.keywords ?? ""}`}
                onSelect={() => handleSelect(entry)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors"
              >
                <Icon name="history" className="text-[16px] text-qbit-on-surface-variant/50" />
                <span className="flex-1 text-sm">{entry.label}</span>
                <Icon name="north_west" className="text-[12px] text-qbit-on-surface-variant/30" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* All commands grouped */}
        {["Navigation", "Products", "Downloads", "Knowledge", "Admin", "Field"].map((group) => {
          const items = COMMANDS.filter((c) => c.group === group);
          if (items.length === 0) return null;
          return (
            <CommandGroup key={group} heading={group}>
              {items.map((entry) => (
                <CommandItem
                  key={entry.id}
                  value={`${entry.label} ${entry.keywords ?? ""}`}
                  onSelect={() => handleSelect(entry)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  <Icon name={entry.icon} className="text-[16px] text-qbit-primary" />
                  <span className="flex-1 text-sm">{entry.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}

        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem
            value="login sign out"
            onSelect={() => { navigate("login"); setOpen(false); }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors"
          >
            <Icon name="logout" className="text-[16px] text-qbit-on-surface-variant" />
            <span className="flex-1 text-sm">Sign Out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
