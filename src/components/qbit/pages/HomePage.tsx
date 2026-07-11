"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { KpiCard } from "@/components/qbit/primitives/KpiCard";
import { GlassCard, SurfaceCard, Pill } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useNavigation } from "@/lib/navigation/store";
import { ADMIN_NAV } from "@/lib/navigation/nav-config";

export function HomePage() {
  const navigate = useNavigation((s) => s.navigate);
  const [now, setNow] = useState(new Date());
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // ⌘K / Ctrl+K handler — focus the universal search input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const el = document.getElementById("home-universal-search");
        el?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Control Center", icon: "bolt" }}
      navItems={ADMIN_NAV}
      activeScreen="home"
      user={{ name: "Alex Rivera", role: "Admin Access", initials: "AR" }}
      topBar={{
        title: "QBIT Hub Admin",
        searchPlaceholder: "Global search...",
        user: { name: "Alex Rivera", role: "Admin Access", initials: "AR" },
      }}
    >
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-qbit-primary-container via-qbit-primary to-qbit-secondary p-6 md:p-10 mb-6">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{ backgroundImage: "url(/qbit-hero-illustration.png)", backgroundSize: "cover", backgroundPosition: "right center" }}
        />
        <div className="relative grid md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              System Online • 99.9% Uptime
            </div>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold text-white">Good Morning, Alex.</h2>
            <h3 className="mt-1 text-lg md:text-xl font-semibold text-qbit-on-primary-container/90">Welcome back to QBIT Hub</h3>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-qbit-on-primary-container/85">
              <span className="flex items-center gap-1.5">
                <Icon name="schedule" className="text-[16px]" />
                Current Session: {dateStr} • {timeStr}
              </span>
              <span className="flex items-center gap-1.5 text-amber-200 font-medium">
                <Icon name="warning" className="text-[16px]" filled />
                Active Alerts: 2 Critical Updates
              </span>
            </div>
          </div>
          <div className="hidden md:flex justify-end">
            <div className="relative h-48 w-48">
              <img
                src="/qbit-hero-illustration.png"
                alt="Enterprise portal hero illustration"
                className="h-full w-full object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Universal Search Center */}
      <section className="mb-8 max-w-4xl mx-auto">
        <GlassCard className="p-2">
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[24px] text-qbit-on-surface-variant" />
            <input
              id="home-universal-search"
              type="text"
              placeholder="Search products, drivers, manuals, installation guides, videos or ask AI..."
              className="w-full rounded-xl border-0 bg-transparent py-4 pl-12 pr-24 text-base text-qbit-on-surface placeholder:text-qbit-on-surface-variant/70 focus:outline-none"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <kbd className="rounded border border-qbit-outline-variant bg-qbit-surface-container-low px-2 py-1 text-[10px] font-bold text-qbit-on-surface-variant">⌘K</kbd>
              <QbitButton size="sm" icon="auto_awesome">Ask AI</QbitButton>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* System Status KPIs */}
      <section className="mb-8">
        <h3 className="mb-4 text-base font-semibold text-qbit-on-surface">System Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Products" value="1,284" icon="inventory_2" delta="+4% this month" deltaVariant="up" />
          <KpiCard label="Drivers Active" value="342" icon="download_for_offline" delta="+12% this week" deltaVariant="up" iconBg="bg-emerald-100 text-emerald-700" />
          <KpiCard label="Guides & Manuals" value="891" icon="menu_book" delta="Stable" deltaVariant="neutral" iconBg="bg-amber-100 text-amber-700" />
          <KpiCard label="Training Videos" value="156" icon="videocam" delta="-2% this week" deltaVariant="down" iconBg="bg-red-100 text-red-700" />
        </div>
      </section>

      {/* Quick Access */}
      <section className="mb-8">
        <h3 className="mb-4 text-base font-semibold text-qbit-on-surface">Quick Access</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Products", sub: "Browse Catalog", icon: "inventory_2", screen: "product-management" as const },
            { label: "Drivers", sub: "Latest Firmware", icon: "download", screen: "driver-download-center" as const },
            { label: "Install Guides", sub: "Setup Workflows", icon: "menu_book", screen: "installation-center" as const },
            { label: "Manuals", sub: "Documentation", icon: "library_books", screen: "installation-center" as const },
            { label: "Troubleshooting", sub: "Error Codes", icon: "build", screen: "ai-support-center" as const },
            { label: "Knowledge Base", sub: "Article Wiki", icon: "school", screen: "ai-support-center" as const },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.screen)}
              className="group flex items-center gap-3 rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-lowest p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-qbit-primary/10 text-qbit-primary transition-transform group-hover:scale-110">
                <Icon name={item.icon} className="text-[22px]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-qbit-on-surface">{item.label}</p>
                <p className="text-xs text-qbit-on-surface-variant">{item.sub}</p>
              </div>
              <Icon name="arrow_forward" className="text-[18px] text-qbit-on-surface-variant transition-transform group-hover:translate-x-1" />
            </button>
          ))}
        </div>
      </section>

      {/* New Releases + Continue Working */}
      <section className="mb-8 grid lg:grid-cols-3 gap-6">
        {/* New Releases - takes 2 cols */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-qbit-on-surface">New Releases</h3>
            <button className="text-xs font-semibold text-qbit-primary hover:underline">View all</button>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {[
              { name: "QBIT Nexus X1", desc: "Enterprise Hub Controller v2.0", badge: "New", badgeVariant: "primary" as const, color: "from-qbit-primary to-qbit-secondary" },
              { name: "Aura Terminal G3", desc: "Advanced POS Interface System", badge: "Updated", badgeVariant: "neutral" as const, color: "from-purple-500 to-pink-500" },
              { name: "Optic Pro Scan", desc: "Precision Inventory Scanner", badge: "Featured", badgeVariant: "primary" as const, color: "from-amber-500 to-orange-500" },
            ].map((p) => (
              <div key={p.name} className="min-w-[260px] max-w-[260px] rounded-2xl border border-qbit-outline-variant bg-qbit-surface-container-lowest overflow-hidden card-hover-lift">
                <div className={`relative h-32 bg-gradient-to-br ${p.color} flex items-center justify-center`}>
                  <Icon name="devices" className="text-[56px] text-white/90" />
                  <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface">
                    {p.badge}
                  </span>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-sm text-qbit-on-surface">{p.name}</p>
                  <p className="mt-1 text-xs text-qbit-on-surface-variant">{p.desc}</p>
                  <QbitButton size="sm" variant="outline" className="mt-3" icon="visibility">View Specs</QbitButton>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Continue Working */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-qbit-on-surface">Continue Working</h3>
            <button className="text-xs font-semibold text-qbit-primary hover:underline">View Full History</button>
          </div>
          <SurfaceCard className="p-4 space-y-3">
            {[
              { name: "X1_Firmware_v4.2.bin", type: "Driver", time: "2 hours ago", icon: "settings_input_component" },
              { name: "Setup_Manual_Terminal_G3", type: "Manual", time: "5 hours ago", icon: "menu_book" },
              { name: "Troubleshooting_Optic_Pro", type: "Video", time: "Yesterday", icon: "play_circle" },
            ].map((item) => (
              <button key={item.name} className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-qbit-surface-container-low transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
                  <Icon name={item.icon} className="text-[18px]" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="truncate text-xs font-semibold text-qbit-on-surface">{item.name}</p>
                  <p className="text-[11px] text-qbit-on-surface-variant">{item.type} • {item.time}</p>
                </div>
                <Icon name="open_in_new" className="text-[14px] text-qbit-on-surface-variant" />
              </button>
            ))}
          </SurfaceCard>
        </div>
      </section>

      {/* System Updates */}
      <section className="mb-8">
        <h3 className="mb-4 text-base font-semibold text-qbit-on-surface">System Updates</h3>
        <SurfaceCard className="p-5">
          <ol className="relative border-l-2 border-qbit-primary/30 ml-2">
            {[
              { title: "Critical Driver Update: Nexus X1 security patch", meta: "TODAY • 08:30 AM", color: "bg-qbit-error", desc: "Patch addressing CVE-2023-5421 authentication bypass." },
              { title: "New Manual Added: Aura Terminal G3", meta: "OCT 21", color: "bg-qbit-primary", desc: "Complete installation and operations manual now available." },
              { title: "Server Maintenance: API optimization", meta: "OCT 20", color: "bg-qbit-on-surface-variant", desc: "Improved response times for product and driver endpoints." },
            ].map((u) => (
              <li key={u.title} className="mb-5 ml-6 last:mb-0">
                <span className={`absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full ${u.color} ring-4 ring-white`} />
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-qbit-on-surface">{u.title}</p>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant">{u.meta}</span>
                </div>
                <p className="mt-1 text-xs text-qbit-on-surface-variant">{u.desc}</p>
              </li>
            ))}
          </ol>
        </SurfaceCard>
      </section>

      {/* Floating AI Assistant */}
      <div className="fixed bottom-6 right-6 z-50">
        {aiOpen ? (
          <div className="w-80 rounded-2xl border border-qbit-outline-variant bg-qbit-surface-container-lowest shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-qbit-outline-variant bg-qbit-primary-container p-3 text-qbit-on-primary-container">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                  <Icon name="smart_toy" className="text-[18px]" filled />
                </div>
                <div>
                  <p className="text-sm font-semibold">QBIT AI Assistant</p>
                  <p className="text-[10px] opacity-80">Online • Powered by CoreAI</p>
                </div>
              </div>
              <button onClick={() => setAiOpen(false)} className="rounded-lg p-1 hover:bg-white/15">
                <Icon name="close" className="text-[18px]" />
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
              <div className="rounded-xl rounded-tl-sm bg-qbit-surface-container-low p-3 text-xs text-qbit-on-surface">
                Hi Alex! I&apos;m your QBIT AI Assistant. How can I help you with installation, drivers, or troubleshooting today?
              </div>
              <div className="flex flex-wrap gap-2">
                {["How do I install T-800?", "Driver compatibility", "Latest firmware"].map((s) => (
                  <button key={s} className="rounded-full border border-qbit-outline-variant bg-white px-3 py-1 text-[11px] font-medium text-qbit-primary hover:bg-qbit-surface-container-low">
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-qbit-outline-variant p-3 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type your question..."
                className="flex-1 rounded-full border border-qbit-outline-variant bg-qbit-surface-container-low px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-qbit-primary/40"
              />
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-qbit-primary text-qbit-on-primary">
                <Icon name="send" className="text-[14px]" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAiOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-qbit-primary text-qbit-on-primary shadow-xl hover:scale-110 active:scale-95 transition-transform"
            title="Open AI Assistant"
          >
            <Icon name="chat" className="text-[24px]" filled />
          </button>
        )}
      </div>
    </AppShell>
  );
}
