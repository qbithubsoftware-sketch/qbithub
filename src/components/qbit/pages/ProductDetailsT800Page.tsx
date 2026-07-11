"use client";

import { useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { TimelineStep } from "@/components/qbit/primitives/TimelineStep";
import { ENGINEER_NAV, ENGINEER_FOOTER } from "@/lib/navigation/nav-config";
import { useNavigation } from "@/lib/navigation/store";
import { useToast } from "@/hooks/use-toast";

const TECH_SPECS: ReadonlyArray<{ property: string; value: string }> = [
  { property: "Processor (CPU)", value: "Intel\u00ae Core\u2122 i5-1135G7 (8M Cache, up to 4.20 GHz)" },
  { property: "Memory (RAM)", value: "16GB DDR4 3200MHz (Expandable to 32GB)" },
  { property: "Storage", value: "512GB NVMe M.2 SSD" },
  { property: "Display", value: '15.6" IPS Panel, Full HD (1920x1080), 10-point Multi-touch' },
  { property: "Connectivity", value: "Dual-band Wi-Fi 6, Bluetooth 5.1, 1Gbps Ethernet" },
  { property: "Ports", value: "6x USB 3.0, 2x COM (RS232), 1x HDMI, 1x Cash Drawer Port (RJ11)" },
  { property: "Power Supply", value: "External 12V / 5A Adapter, Energy Star 8.0 Certified" },
];

const FEATURES: ReadonlyArray<{
  icon: string;
  title: string;
  description: string;
}> = [
  {
    icon: "shield",
    title: "Industrial Build",
    description: "Durable IP54-rated aluminum chassis for harsh retail environments.",
  },
  {
    icon: "hub",
    title: "Multi-Port Support",
    description: "Extensive legacy and modern connectivity for peripherals.",
  },
  {
    icon: "eco",
    title: "Energy Efficient",
    description: "Consumes 40% less power than standard desktop POS systems.",
  },
];

const DEPLOYMENT_STEPS: ReadonlyArray<{
  index: string;
  title: string;
  description: string;
}> = [
  {
    index: "1",
    title: "Unbox & Inspect",
    description: "Remove protective films and check contents. (5 min)",
  },
  {
    index: "2",
    title: "Mount & Cable",
    description: "Secure to counter and connect peripherals. (15 min)",
  },
  {
    index: "3",
    title: "OS Boot & Setup",
    description: "Initialize Windows and configure network. (10 min)",
  },
  {
    index: "4",
    title: "Driver Sync",
    description: "Install QBIT Universal Driver pack. (5 min)",
  },
  {
    index: "5",
    title: "Test Print",
    description: "Verify receipt and cash drawer function. (2 min)",
  },
];

const DOCUMENTS: ReadonlyArray<{
  icon: string;
  iconBg: string;
  title: string;
  description: string;
}> = [
  {
    icon: "picture_as_pdf",
    iconBg: "bg-red-50 text-red-600",
    title: "User Manual v4.0",
    description: "Detailed setup and configuration guide.",
  },
  {
    icon: "description",
    iconBg: "bg-blue-50 text-blue-600",
    title: "Datasheet & Specs",
    description: "Official technical specification document.",
  },
  {
    icon: "verified_user",
    iconBg: "bg-green-50 text-green-600",
    title: "Warranty Terms",
    description: "3-Year Standard Enterprise Warranty info.",
  },
];

const RELATED_PRODUCTS: ReadonlyArray<{
  name: string;
  category: string;
  icon: string;
  gradient: string;
}> = [
  {
    name: "QBIT Duo X-200",
    category: "Dual-Screen Terminal",
    icon: "desktop_windows",
    gradient: "from-qbit-primary to-qbit-secondary",
  },
  {
    name: "QBIT Go M-50",
    category: "Mobile POS",
    icon: "phone_android",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    name: "QBIT Print P-80",
    category: "Peripherals",
    icon: "print",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    name: "QBIT Tab Rugged 10",
    category: "Industrial Tablet",
    icon: "tablet_mac",
    gradient: "from-slate-600 to-slate-800",
  },
];

const OS_SUPPORT: ReadonlyArray<{ icon: string; label: string }> = [
  { icon: "desktop_windows", label: "Windows" },
  { icon: "phone_android", label: "Android" },
  { icon: "terminal", label: "Linux" },
];

const QUICK_LINKS: ReadonlyArray<{ icon: string; label: string }> = [
  { icon: "share", label: "Share" },
  { icon: "mail", label: "Email" },
  { icon: "chat", label: "WhatsApp" },
  { icon: "picture_as_pdf", label: "PDF" },
];

const KEY_SPECS: ReadonlyArray<{ icon: string; label: string; value: string }> = [
  { icon: "memory", label: "CPU", value: "Intel i5-11th Gen" },
  { icon: "tv", label: "Display", value: '15.6" FHD Touch' },
];

const THUMBNAIL_COUNT = 8;

/**
 * ProductDetailsT800Page
 *
 * Pixel-faithful recreation of the Stitch design
 * `product_details_qbit_t_800` screen. Renders inside the Engineer
 * AppShell variant. Active sidebar item: Products -> product-library.
 */
export function ProductDetailsT800Page() {
  const navigate = useNavigation((s) => s.navigate);
  const { toast } = useToast();
  const [activeThumb, setActiveThumb] = useState(0);

  const handleDriverDownload = () => {
    toast({
      title: "Download Started",
      description: "Universal_Driver_v2.4.1.msi",
    });
  };

  return (
    <AppShell
      variant="engineer"
      brand={{ title: "QBIT Hub", tagline: "Enterprise SaaS", icon: "dataset" }}
      navItems={ENGINEER_NAV}
      footerItems={ENGINEER_FOOTER}
      activeScreen="product-library"
      user={{ name: "Alex Chen", role: "Installation Engineer", initials: "AC" }}
      topBar={{
        searchPlaceholder: "Search components, documentation, or drivers...",
        user: { name: "Alex Chen", role: "Installation Engineer", initials: "AC" },
      }}
    >
      <div className="space-y-8">
        {/* Section 1: Hero - Gallery & Product Info */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left: Product Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-qbit-outline-variant bg-white shadow-sm"
            >
              {/* Placeholder gradient cover */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-qbit-surface-container-low via-white to-qbit-surface-container-high">
                <div className="flex flex-col items-center gap-3 text-qbit-primary/70 transition-transform duration-500 group-hover:scale-105">
                  <Icon name="devices" className="text-[120px]" filled />
                  <span className="text-sm font-medium text-qbit-on-surface-variant">
                    QBIT T-800
                  </span>
                </div>
              </div>
              {/* Hover to zoom overlay */}
              <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-lg border border-qbit-outline-variant bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur">
                <Icon name="zoom_in" className="text-[14px] text-qbit-on-surface-variant" />
                <span className="text-xs font-semibold tracking-wide text-qbit-on-surface-variant">
                  Hover to zoom
                </span>
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="hide-scrollbar flex gap-4 overflow-x-auto pb-2">
              {Array.from({ length: THUMBNAIL_COUNT }).map((_, i) => {
                const isActive = i === activeThumb;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveThumb(i)}
                    aria-label={`View product image ${i + 1}`}
                    aria-pressed={isActive}
                    className={`h-20 min-w-[80px] overflow-hidden rounded-lg bg-white shadow-sm transition-colors ${
                      isActive
                        ? "border-2 border-qbit-primary"
                        : "border border-qbit-outline-variant hover:border-qbit-primary/50"
                    }`}
                  >
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-qbit-surface-container-low to-qbit-surface-container">
                      <Icon
                        name={i === 0 ? "devices" : "memory"}
                        className="text-[24px] text-qbit-primary/60"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Product Information & Quick Actions */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <div className="space-y-4">
              {/* Status chips */}
              <div className="flex items-center gap-4">
                <StatusBadge variant="success" icon="check_circle">
                  In Stock
                </StatusBadge>
                <StatusBadge variant="info">Latest Firmware v4.2.1</StatusBadge>
              </div>

              {/* Title block */}
              <div>
                <p className="mb-1 text-sm font-medium uppercase tracking-wider text-qbit-outline">
                  Windows POS
                </p>
                <h2 className="mb-1 text-4xl font-bold tracking-tight text-qbit-on-surface">
                  QBIT T-800
                </h2>
                <p className="text-base italic text-qbit-on-surface-variant">
                  Model: T800-ENT
                </p>
              </div>

              {/* OS Support icons */}
              <div className="flex items-center gap-6 pt-2">
                {OS_SUPPORT.map((os) => (
                  <div key={os.label} className="flex flex-col items-center gap-1">
                    <Icon
                      name={os.icon}
                      className="text-[24px] text-qbit-on-surface-variant opacity-60 transition-all hover:opacity-100"
                    />
                    <span className="text-[10px] font-semibold tracking-wide text-qbit-outline">
                      {os.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4 border-t border-qbit-outline-variant/30 pt-6">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-qbit-outline">
                Quick Support Actions
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <QbitButton
                  size="lg"
                  variant="primary"
                  icon="download"
                  fullWidth
                  onClick={handleDriverDownload}
                >
                  Download Driver
                </QbitButton>
                <div className="grid grid-cols-2 gap-4">
                  <QbitButton variant="surface" icon="menu_book">
                    User Manual
                  </QbitButton>
                  <QbitButton variant="surface" icon="play_circle">
                    Installation Video
                  </QbitButton>
                </div>
              </div>

              {/* Share/Email/WhatsApp/PDF quick links */}
              <div className="flex items-center justify-between gap-2 pt-2">
                {QUICK_LINKS.map((link) => (
                  <button
                    key={link.label}
                    type="button"
                    className="flex flex-1 items-center justify-center gap-1.5 py-2 text-qbit-outline transition-colors hover:text-qbit-primary"
                  >
                    <Icon name={link.icon} className="text-[18px]" />
                    <span className="text-xs font-semibold tracking-wide">
                      {link.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Key Specifications mini-card */}
            <SurfaceCard className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-qbit-on-surface">
                  Key Specifications
                </h4>
                <button
                  type="button"
                  className="text-xs font-semibold text-qbit-primary hover:underline"
                >
                  See All
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {KEY_SPECS.map((spec) => (
                  <div key={spec.label} className="flex gap-2">
                    <Icon name={spec.icon} className="text-[20px] text-qbit-primary/60" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-qbit-outline">
                        {spec.label}
                      </p>
                      <p className="text-sm text-qbit-on-surface">{spec.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          </div>
        </section>

        {/* Section 2: Detailed Specifications & Features */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left: Specs Table + Driver Section */}
          <div className="lg:col-span-8 space-y-8">
            {/* Specifications Table */}
            <SurfaceCard className="overflow-hidden rounded-2xl" id="full-specs">
              <div className="flex items-center justify-between border-b border-qbit-outline-variant/30 px-6 py-5">
                <h3 className="text-xl font-semibold text-qbit-on-surface">
                  Technical Specifications
                </h3>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-qbit-primary transition-colors hover:bg-qbit-primary/5"
                >
                  <Icon name="print" className="text-[18px]" />
                  <span className="text-xs font-semibold tracking-wide">
                    Print Spec Sheet
                  </span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <tbody>
                    {TECH_SPECS.map((row, i) => (
                      <tr
                        key={row.property}
                        className={
                          i === TECH_SPECS.length - 1
                            ? "hover:bg-qbit-surface-container-lowest"
                            : "border-b border-qbit-surface-container-low hover:bg-qbit-surface-container-lowest"
                        }
                      >
                        <td className="w-1/3 px-6 py-4 font-semibold text-qbit-on-surface-variant">
                          {row.property}
                        </td>
                        <td className="px-6 py-4 text-qbit-on-surface">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>

            {/* Driver Section */}
            <div className="relative flex items-center gap-6 overflow-hidden rounded-2xl border border-qbit-primary/20 bg-qbit-surface-container-lowest p-6 shadow-lg shadow-qbit-primary/5 lg:p-8 lg:gap-8">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-qbit-primary/5 blur-3xl" />
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-qbit-primary-container/10 text-qbit-primary">
                <Icon name="terminal" className="text-[36px]" filled />
              </div>
              <div className="flex-grow">
                <div className="mb-1 flex items-center gap-4">
                  <h4 className="text-xl font-semibold text-qbit-on-surface">
                    Universal Driver Package
                  </h4>
                  <TagBadge variant="primary">STABLE</TagBadge>
                </div>
                <p className="mb-4 text-sm text-qbit-on-surface-variant">
                  Version 2.4.1 Stable &bull; Released Oct 12, 2023 &bull; 45.2 MB
                </p>
                <div className="flex flex-wrap gap-4">
                  <QbitButton
                    variant="primary"
                    icon="download"
                    onClick={handleDriverDownload}
                  >
                    Download Now
                  </QbitButton>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-qbit-primary hover:underline"
                  >
                    Release Notes
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Feature Cards + Deployment Timeline */}
          <div className="lg:col-span-4 space-y-8">
            {/* Feature Cards */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-qbit-outline">
                Key Advantages
              </h3>
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="group flex gap-4 rounded-xl border border-qbit-outline-variant bg-white p-6 transition-colors hover:border-qbit-primary/40"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-qbit-surface-container-low text-qbit-primary transition-transform group-hover:scale-110">
                    <Icon name={feature.icon} className="text-[20px]" />
                  </div>
                  <div>
                    <h5 className="mb-1 text-sm font-semibold text-qbit-on-surface">
                      {feature.title}
                    </h5>
                    <p className="text-sm text-qbit-on-surface-variant">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Deployment Guide Timeline */}
            <SurfaceCard className="rounded-2xl p-6 lg:p-8">
              <h3 className="mb-6 text-xs font-semibold uppercase tracking-widest text-qbit-outline">
                Deployment Guide
              </h3>
              <div className="space-y-0">
                {DEPLOYMENT_STEPS.map((step, i) => (
                  <TimelineStep
                    key={step.index}
                    index={step.index}
                    title={step.title}
                    description={step.description}
                    status={i === 0 ? "active" : "pending"}
                    isLast={i === DEPLOYMENT_STEPS.length - 1}
                  />
                ))}
              </div>
            </SurfaceCard>
          </div>
        </section>

        {/* Section 3: Document Library */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-qbit-on-surface">Document Library</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DOCUMENTS.map((doc) => (
              <button
                key={doc.title}
                type="button"
                className="group flex items-start gap-4 rounded-xl border border-qbit-outline-variant bg-white p-6 text-left transition-shadow hover:shadow-md"
              >
                <div
                  className={`shrink-0 rounded-lg p-3 ${doc.iconBg}`}
                >
                  <Icon name={doc.icon} className="text-[24px]" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-qbit-on-surface group-hover:text-qbit-primary">
                    {doc.title}
                  </h5>
                  <p className="mb-4 text-sm text-qbit-outline">{doc.description}</p>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-qbit-primary">
                    Download <Icon name="download" className="text-[14px]" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Section 4: Related POS Hardware */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-qbit-on-surface">
              Related POS Hardware
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Previous"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-qbit-outline-variant transition-colors hover:bg-qbit-surface-container-low"
              >
                <Icon name="chevron_left" className="text-[20px]" />
              </button>
              <button
                type="button"
                aria-label="Next"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-qbit-outline-variant transition-colors hover:bg-qbit-surface-container-low"
              >
                <Icon name="chevron_right" className="text-[20px]" />
              </button>
            </div>
          </div>
          <div className="hide-scrollbar flex gap-6 overflow-x-auto pb-4">
            {RELATED_PRODUCTS.map((product) => (
              <div
                key={product.name}
                className="group min-w-[300px] overflow-hidden rounded-2xl border border-qbit-outline-variant bg-white transition-all hover:shadow-lg"
              >
                <div
                  className={`flex h-48 items-center justify-center bg-gradient-to-br ${product.gradient}`}
                >
                  <Icon
                    name={product.icon}
                    className="text-[80px] text-white/90 transition-transform group-hover:scale-110"
                    filled
                  />
                </div>
                <div className="p-4">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-qbit-outline">
                    {product.category}
                  </p>
                  <h5 className="mb-4 text-sm font-bold text-qbit-on-surface">
                    {product.name}
                  </h5>
                  <button
                    type="button"
                    onClick={() => navigate("product-library")}
                    className="w-full rounded-lg border border-qbit-primary py-2 text-xs font-semibold text-qbit-primary transition-colors hover:bg-qbit-primary/5"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
