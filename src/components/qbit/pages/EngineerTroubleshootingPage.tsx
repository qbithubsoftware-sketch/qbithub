"use client";

/**
 * Engineer Troubleshooting Page
 *
 * Unified troubleshooting hub: error codes, common issues,
 * diagnostic tools, and AI support chat.
 */

import { useState } from "react";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useNavigation, type ScreenId } from "@/lib/navigation/store";
import { ENGINEER_NAV, ENGINEER_FOOTER } from "@/lib/navigation/nav-config";

const TROUBLESHOOT_CATEGORIES = [
  {
    id: "printer",
    label: "Printer Issues",
    icon: "print",
    color: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    items: [
      { title: "Printer not responding", desc: "Check USB/LAN connection, driver version, and power cycle the device." },
      { title: "Poor print quality", desc: "Clean print head, check paper type, and verify thermal head alignment." },
      { title: "Paper jam", desc: "Open cover, remove stuck paper carefully, check paper path sensors." },
      { title: "Cutter not working", desc: "Inspect cutter mechanism, clean debris, check autocutter settings in driver." },
    ],
  },
  {
    id: "scanner",
    label: "Barcode Scanner",
    icon: "barcode_scanner",
    color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    items: [
      { title: "Scanner not scanning", desc: "Check USB connection, scan mode configuration, and verify barcode type support." },
      { title: "Intermittent scans", desc: "Clean scanner window, check cable connection, verify scan angle." },
      { title: "Wrong barcode data", desc: "Check prefix/suffix settings, keyboard layout, and scanner configuration." },
    ],
  },
  {
    id: "pos",
    label: "POS Machine",
    icon: "point_of_sale",
    color: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    items: [
      { title: "POS won't boot", desc: "Check power supply, verify BIOS settings, run hardware diagnostics." },
      { title: "Touchscreen unresponsive", desc: "Calibrate touchscreen, check USB connection, update touch driver." },
      { title: "Cash drawer not opening", desc: "Check RJ12 connection, verify driver settings, test drawer kick code." },
    ],
  },
  {
    id: "network",
    label: "Network Issues",
    icon: "wifi",
    color: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    items: [
      { title: "No network connection", desc: "Check LAN cable, verify IP settings, ping gateway, check DHCP." },
      { title: "Slow connection", desc: "Run speed test, check for network congestion, verify duplex settings." },
      { title: "Printer offline on network", desc: "Check printer IP, restart print spooler, verify port settings." },
    ],
  },
  {
    id: "firmware",
    label: "Firmware Recovery",
    icon: "upgrade",
    color: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
    items: [
      { title: "Firmware update failed", desc: "Do not power off. Try recovery mode: hold reset button during boot." },
      { title: "Device bricked after update", desc: "Connect via USB, use factory recovery tool, flash stock firmware." },
      { title: "Version mismatch error", desc: "Verify compatible firmware version, check hardware revision number." },
    ],
  },
];

function ExpandableIssue({ title, desc }: { title: string; desc: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 py-3 text-left"
      >
        <span className="text-sm font-medium text-foreground">{title}</span>
        <Icon name={open ? "expand_less" : "expand_more"} className="text-[18px] text-muted-foreground shrink-0" />
      </button>
      {open && (
        <div className="pb-3 pl-0">
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      )}
    </div>
  );
}

export function EngineerTroubleshootingPage() {
  const { data: session } = useSession();
  const navigate = useNavigation((s) => s.navigate);

  const userName = session?.user?.name ?? "Engineer";
  const userInitials = userName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();

  return (
    <AppShell
      variant="engineer"
      brand={{ title: "QBIT Hub", tagline: "Engineer Portal", icon: "engineering" }}
      navItems={ENGINEER_NAV}
      footerItems={ENGINEER_FOOTER}
      activeScreen="engineer-troubleshooting"
      user={{ name: userName, role: "Installation Engineer", initials: userInitials }}
      topBar={{
        searchPlaceholder: "Search troubleshooting...",
        user: { name: userName, role: "Installation Engineer", initials: userInitials },
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Troubleshooting</h1>
            <p className="mt-1 text-sm text-muted-foreground">Common issues, error codes, and diagnostic tools for field engineers.</p>
          </div>
          <div className="flex gap-2">
            <QbitButton variant="primary" icon="smart_toy" onClick={() => navigate("dr-qbit-detection")}>
              Dr. QBIT Diagnose
            </QbitButton>
            <QbitButton variant="outline" icon="support_agent" onClick={() => navigate("ai-support-center")}>
              AI Support
            </QbitButton>
          </div>
        </div>

        {/* Quick diagnostic tools */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Dr. QBIT Scan", icon: "smart_toy", screen: "dr-qbit-detection" as ScreenId, desc: "Auto-detect hardware" },
            { label: "Device Passport", icon: "badge", screen: "dr-qbit-passport" as ScreenId, desc: "Warranty & driver info" },
            { label: "Firmware Check", icon: "upgrade", screen: "dr-qbit-firmware" as ScreenId, desc: "Update firmware" },
            { label: "Run Diagnostics", icon: "health_and_safety", screen: "dr-qbit-diagnostics" as ScreenId, desc: "Health check" },
          ].map(tool => (
            <button
              key={tool.label}
              type="button"
              onClick={() => navigate(tool.screen)}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon name={tool.icon} className="text-[20px]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{tool.label}</p>
                <p className="text-xs text-muted-foreground">{tool.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Troubleshooting categories */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {TROUBLESHOOT_CATEGORIES.map(cat => (
            <div key={cat.id} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${cat.color}`}>
                  <Icon name={cat.icon} className="text-[18px]" />
                </div>
                <h2 className="text-base font-semibold text-foreground">{cat.label}</h2>
              </div>
              <div>
                {cat.items.map(item => (
                  <ExpandableIssue key={item.title} title={item.title} desc={item.desc} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Support CTA */}
        <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-6 text-center">
          <h3 className="text-lg font-semibold text-foreground">Still having issues?</h3>
          <p className="mt-1 text-sm text-muted-foreground">Our AI support center can help diagnose and resolve complex problems.</p>
          <div className="mt-4 flex justify-center gap-3">
            <QbitButton variant="primary" icon="smart_toy" onClick={() => navigate("ai-support-center")}>
              AI Support Chat
            </QbitButton>
            <QbitButton variant="outline" icon="contact_support" onClick={() => navigate("ai-support-center")}>
              Contact Support
            </QbitButton>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
