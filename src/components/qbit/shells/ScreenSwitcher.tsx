"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "../primitives/Icon";
import { useNavigation, type ScreenId } from "@/lib/navigation/store";
import { permittedRolesForScreen, type Role } from "@/lib/rbac/roles";

interface ScreenEntry {
  id: ScreenId;
  label: string;
  group: string;
  icon: string;
}

const SCREENS: ScreenEntry[] = [
  // Auth & marketing
  { id: "login", label: "Login", group: "Auth", icon: "login" },
  { id: "home", label: "Home (Admin)", group: "Admin", icon: "home" },
  { id: "product-overview", label: "T-800 Marketing Page", group: "Marketing", icon: "campaign" },
  // Engineer portal
  { id: "engineer-dashboard", label: "Engineer Dashboard", group: "Engineer", icon: "dashboard" },
  { id: "product-library", label: "Product Library", group: "Engineer", icon: "inventory_2" },
  { id: "product-details-t800", label: "Product Details: T-800", group: "Engineer", icon: "devices" },
  { id: "driver-download-center", label: "Driver Download Center", group: "Engineer", icon: "settings_input_component" },
  { id: "installation-center", label: "Installation Center", group: "Engineer", icon: "menu_book" },
  { id: "customer-handover-report", label: "Customer Handover Report", group: "Engineer", icon: "fact_check" },
  { id: "video-training-center", label: "Video Training Center", group: "Engineer", icon: "play_circle" },
  { id: "t800-installation-guide", label: "T-800 Installation Guide", group: "Engineer", icon: "build" },
  { id: "ai-support-center", label: "AI Support Center", group: "Engineer", icon: "smart_toy" },
  // Field engineer
  { id: "field-engineer-workspace", label: "Field Engineer Workspace", group: "Field Ops", icon: "engineering" },
  { id: "job-details-inst-550-a", label: "Job Details: INST-550-A", group: "Field Ops", icon: "task_alt" },
  { id: "job-completion-handover", label: "Job Completion Handover", group: "Field Ops", icon: "assignment_turned_in" },
  // Admin
  { id: "admin-dashboard", label: "Admin Dashboard", group: "Admin", icon: "monitoring" },
  { id: "user-role-management", label: "User Role Management", group: "Admin", icon: "group" },
  { id: "product-management", label: "Product Management", group: "Admin", icon: "inventory" },
  { id: "system-settings", label: "System Settings", group: "Admin", icon: "settings" },
  // Search
  { id: "universal-search-command-center", label: "Universal Search (Desktop)", group: "Search", icon: "search" },
  { id: "universal-search-mobile", label: "Universal Search (Mobile)", group: "Search", icon: "smartphone" },
];

const GROUPS = Array.from(new Set(SCREENS.map((s) => s.group)));

export function ScreenSwitcher() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigation((s) => s.navigate);
  const current = useNavigation((s) => s.current);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Switch screen"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-qbit-surface-container transition-colors",
          open && "bg-qbit-surface-container text-qbit-primary",
        )}
      >
        <Icon name="apps" className="text-[20px]" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 max-h-[70vh] overflow-y-auto custom-scrollbar rounded-2xl border border-qbit-outline-variant bg-qbit-surface-container-lowest p-3 shadow-2xl">
          <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-qbit-outline-variant/60">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-qbit-on-surface">All Screens</p>
              <p className="text-[10px] text-qbit-on-surface-variant">21 design pages</p>
            </div>
            <span className="rounded-full bg-qbit-primary/10 px-2 py-0.5 text-[10px] font-bold text-qbit-primary">
              v2.4
            </span>
          </div>
          {GROUPS.map((group) => (
            <div key={group} className="mb-2">
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant">
                {group}
              </p>
              <ul>
                {SCREENS.filter((s) => s.group === group).map((s) => {
                  const active = s.id === current;
                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => {
                          navigate(s.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors",
                          active
                            ? "bg-qbit-primary/10 text-qbit-primary font-semibold"
                            : "text-qbit-on-surface hover:bg-qbit-surface-container-low",
                        )}
                      >
                        <Icon name={s.icon} className="text-[18px] shrink-0" filled={active} />
                        <span className="flex-1 text-left">{s.label}</span>
                        {active && <Icon name="check" className="text-[14px]" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
