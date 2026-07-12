"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { ScreenSwitcher } from "@/components/qbit/shells/ScreenSwitcher";
import { ContactForm } from "@/components/qbit/portal/ContactForm";
import { PublicDownloadGrid } from "@/components/qbit/portal/PublicDownloadCard";
import { PublicProductLayout } from "@/components/qbit/portal/PublicProductLayout";
import {
  PUBLIC_DOWNLOADS,
  T800_PUBLIC_DETAIL,
  T800_FAQS,
  T800_TROUBLESHOOTING,
  T800_ACCESSORIES,
  T800_SUPPORT_CARDS,
  T800_VIDEOS,
  getRelatedProducts,
} from "@/lib/portal/placeholder-data";
import { useNavigation } from "@/lib/navigation/store";

type DownloadCard = {
  title: string;
  icon: string;
  version: string;
  release: string;
  size: string;
  actionLabel: string;
  actionIcon: string;
};

type SpecRow = {
  label: string;
  value: string;
};

type TimelineStep = {
  title: string;
  description: string;
};

type SupportCard = {
  title: string;
  icon: string;
  meta: string;
  href: string;
};

const DOWNLOAD_CARDS: DownloadCard[] = [
  {
    title: "Windows Driver",
    icon: "terminal",
    version: "v4.2",
    release: "24 Oct 2023",
    size: "42.5 MB",
    actionLabel: "Download",
    actionIcon: "download",
  },
  {
    title: "Linux SDK",
    icon: "code",
    version: "v3.8",
    release: "12 Nov 2023",
    size: "128.0 MB",
    actionLabel: "Download",
    actionIcon: "download",
  },
  {
    title: "BIOS Firmware",
    icon: "memory",
    version: "v4.5",
    release: "05 Jan 2024",
    size: "12.2 MB",
    actionLabel: "Download",
    actionIcon: "download",
  },
  {
    title: "User Manual",
    icon: "auto_stories",
    version: "PDF",
    release: "Latest",
    size: "5.8 MB",
    actionLabel: "View Online",
    actionIcon: "visibility",
  },
];

const SPEC_ROWS: SpecRow[] = [
  { label: "Processor", value: "Octa-Core Q-Silicon X2 @ 3.4GHz" },
  { label: "Memory", value: "16GB LPDDR5x RAM" },
  { label: "Storage", value: "256GB / 512GB NVMe Gen4 SSD" },
  { label: "Display", value: '15.6" Ultra-Bright Retina (450 nits)' },
  { label: "Dimensions", value: "360mm x 240mm x 18mm" },
  { label: "I/O Ports", value: "2x USB-C 4.0, 1x RJ45, 1x HDMI 2.1, MicroSD" },
];

const TIMELINE_STEPS: TimelineStep[] = [
  {
    title: "Unbox & Inspect",
    description: "Verify all components are present in the secure enterprise packaging.",
  },
  {
    title: "Connect Hardware",
    description: "Attach the Q-Link cable and power supply to the secure docking port.",
  },
  {
    title: "Configure OS",
    description: "Select your environment (Win/Linux/Droid) via the setup assistant.",
  },
  {
    title: "Diagnostics Test",
    description: "Run the built-in system check to ensure peak operational readiness.",
  },
];

const SUPPORT_CARDS: SupportCard[] = [
  {
    title: "WhatsApp Support",
    icon: "chat",
    meta: "24/7 Priority Chat",
    href: "#",
  },
  {
    title: "Call Technical Team",
    icon: "call",
    meta: "Mon-Fri, 9am - 6pm",
    href: "tel:1800-QBIT",
  },
  {
    title: "Email Assistance",
    icon: "mail",
    meta: "1-Hour Response Time",
    href: "mailto:support@qbit.tech",
  },
];

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "What is the expected lifespan of the T-800 touch screen?",
    answer:
      "The QBIT T-800 features an industrial-grade capacitive touch panel rated for 50 million touches per point, ensuring long-term reliability in high-traffic retail environments.",
  },
  {
    question: "Can I upgrade the memory or storage?",
    answer:
      "Storage is field-upgradeable via an easy-access M.2 NVMe slot. Memory is soldered for thermal efficiency and stability but is offered in 16GB and 32GB configurations.",
  },
  {
    question: "Is global on-site support available?",
    answer:
      "Yes, QBIT offers Enterprise Care packages that include next-business-day on-site service in over 45 countries for our corporate partners.",
  },
];

export function QbitT800ProductOverviewPage() {
  const navigate = useNavigation((s) => s.navigate);
  const [scrolled, setScrolled] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScrollRef = useRef(0);

  // Collapse the sidebar-width CSS var so the top header spans the full viewport.
  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", "0px");
    return () => {
      document.documentElement.style.removeProperty("--sidebar-width");
    };
  }, []);

  // Sticky header hide/show + transparent->solid transition.
  useEffect(() => {
    const onScroll = () => {
      const currentScroll = window.pageYOffset;
      setScrolled(currentScroll > 10);
      if (currentScroll <= 72) {
        setHeaderHidden(false);
        lastScrollRef.current = currentScroll;
        return;
      }
      if (currentScroll > lastScrollRef.current && !headerHidden) {
        setHeaderHidden(true);
      } else if (currentScroll < lastScrollRef.current && headerHidden) {
        setHeaderHidden(false);
      }
      lastScrollRef.current = currentScroll;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headerHidden]);

  // IntersectionObserver scroll-reveal for sections and feature cards.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    const els = document.querySelectorAll<HTMLElement>(".scroll-reveal");
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handlePrintSpec = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handleToggleDark = () => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-qbit-on-surface">
      {/* Floating Screen Switcher — for design demo */}
      <div className="fixed top-4 right-4 z-[100]">
        <ScreenSwitcher />
      </div>
      {/* ============ Top Header ============ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex h-[72px] items-center px-4 transition-all duration-300 md:px-8 ${
          headerHidden ? "-translate-y-full" : "translate-y-0"
        } ${
          scrolled
            ? "border-b border-qbit-outline-variant/30 bg-white/95 shadow-md backdrop-blur-md"
            : "border-b border-qbit-outline-variant/30 bg-white/80 backdrop-blur-md"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-qbit-primary-container">
            <Icon name="terminal" className="text-white" filled />
          </div>
          <span className="text-headline-sm font-headline-sm tracking-tight text-qbit-on-surface">
            QBIT Hub
          </span>
        </div>

        {/* Center search (hidden on mobile) */}
        <div className="ml-8 hidden max-w-md flex-1 md:flex">
          <div className="relative w-full">
            <Icon
              name="search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-qbit-outline"
            />
            <input
              type="text"
              placeholder="Search Products"
              className="w-full rounded-full border-none bg-qbit-surface-container-low py-2 pl-12 pr-4 text-label-md focus:outline-none focus:ring-2 focus:ring-qbit-primary/20"
            />
          </div>
        </div>

        {/* Right nav */}
        <div className="ml-auto flex items-center gap-4">
          <nav className="hidden items-center gap-8 text-label-md font-label-md text-qbit-on-surface-variant lg:flex">
            <a href="#" className="transition-colors hover:text-qbit-primary">
              WhatsApp
            </a>
            <a href="#" className="transition-colors hover:text-qbit-primary">
              Contact
            </a>
            <div className="flex cursor-pointer items-center gap-1 transition-colors hover:text-qbit-primary">
              <Icon name="language" className="text-[20px]" />
              <span>English</span>
              <Icon name="expand_more" className="text-[16px]" />
            </div>
          </nav>
          <div className="flex items-center gap-2 border-l border-qbit-outline-variant/30 pl-4">
            <button
              type="button"
              onClick={handleToggleDark}
              aria-label="Toggle dark mode"
              className="rounded-full p-2 transition-colors hover:bg-qbit-surface-container"
            >
              <Icon name="dark_mode" />
            </button>
          </div>
        </div>
      </header>

      {/* ============ Main ============ */}
      <main className="flex-1 pt-[72px]">
        {/* ---------- Hero ---------- */}
        <section className="hero-gradient relative flex min-h-[600px] flex-col items-center overflow-hidden px-4 py-12 md:min-h-[920px] md:flex-row md:px-8 md:py-16">
          <div className="z-10 w-full space-y-4 md:w-1/2 md:space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-qbit-primary/20 bg-qbit-primary-container/10 px-3 py-1 text-qbit-primary">
              <span className="text-label-sm font-label-sm uppercase tracking-widest">
                Enterprise Series
              </span>
              <span className="h-1 w-1 rounded-full bg-qbit-primary" />
              <span className="text-label-sm font-label-sm">Model T8-X1</span>
            </div>

            <h1 className="text-headline-lg font-headline-lg leading-tight text-qbit-on-surface md:text-[64px] md:leading-[1.1]">
              QBIT T-800 <br />
              <span className="text-qbit-primary">Terminal</span>
            </h1>

            <p className="max-w-xl text-body-lg text-qbit-on-surface-variant">
              Engineered for high-volume retail and logistics. The T-800 combines
              military-grade durability with seamless enterprise integration across
              all major platforms.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <QbitButton variant="primary" size="lg" icon="download">
                Download Driver
              </QbitButton>
              <QbitButton
                variant="outline"
                size="lg"
                icon="description"
                className="bg-white"
              >
                User Manual
              </QbitButton>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-4 text-qbit-primary font-label-md hover:underline"
              >
                <Icon name="play_circle" className="text-[20px]" />
                Watch Video
              </button>
            </div>

            <div className="flex items-center gap-8 pt-8">
              <div className="flex flex-col">
                <span className="text-label-sm uppercase text-qbit-outline-variant">
                  OS Support
                </span>
                <div className="mt-2 flex gap-4 opacity-60">
                  <Icon name="desktop_windows" title="Windows" />
                  <Icon name="phone_android" title="Android" />
                  <Icon name="terminal" title="Linux" />
                </div>
              </div>
              <div className="h-10 w-[1px] bg-qbit-outline-variant/30" />
              <div className="flex flex-col">
                <span className="text-label-sm uppercase text-qbit-outline-variant">
                  Uptime
                </span>
                <span className="text-headline-sm font-headline-sm text-qbit-on-surface">
                  99.99%
                </span>
              </div>
              <div className="hidden h-10 w-[1px] bg-qbit-outline-variant/30 sm:block" />
              <div className="hidden flex-col sm:flex">
                <span className="text-label-sm uppercase text-qbit-outline-variant">
                  Verified
                </span>
                <span className="mt-2 flex items-center gap-1 text-headline-sm font-headline-sm text-qbit-on-surface">
                  <Icon
                    name="verified"
                    className="text-[20px] text-qbit-primary"
                    filled
                  />
                  Enterprise
                </span>
              </div>
            </div>
          </div>

          {/* Right: product image */}
          <div className="relative mt-12 flex w-full items-center justify-center md:mt-0 md:w-1/2">
            <div className="absolute h-[120%] w-[120%] rounded-full bg-qbit-primary/5 blur-3xl" />
            <img
              src="/qbit-hero-illustration.png"
              alt="QBIT T-800 enterprise terminal — sleek white device with subtle blue glowing accents on a pristine white desk"
              className="relative z-10 w-full max-w-xl object-contain drop-shadow-2xl transition-transform duration-700 hover:scale-105"
            />
          </div>
        </section>

        {/* ---------- Features Bento ---------- */}
        <section className="scroll-reveal bg-white px-4 py-16 md:px-8">
          <div className="mx-auto max-w-container-max">
            <div className="mb-12 text-center">
              <h2 className="mb-2 text-headline-lg font-headline-lg">
                Powering Enterprise Workflows
              </h2>
              <p className="mx-auto max-w-2xl text-body-md text-qbit-on-surface-variant">
                Designed to withstand the most demanding environments without
                compromising on precision or aesthetics.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Large Feature */}
              <div className="glass-card scroll-reveal relative flex flex-col justify-between overflow-hidden rounded-3xl p-8">
                <div className="relative z-10">
                  <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-qbit-primary">
                    <Icon name="bolt" className="text-[28px] text-white" filled />
                  </div>
                  <h3 className="mb-4 text-headline-md font-headline-md">
                    Nano-Performance Engine
                  </h3>
                  <p className="max-w-md text-body-md text-qbit-on-surface-variant">
                    Equipped with the latest octa-core processor architecture, the
                    T-800 handles complex transactional data with sub-millisecond
                    latency.
                  </p>
                </div>
                <div className="pointer-events-none absolute -right-12 -bottom-12 opacity-10">
                  <Icon name="memory" className="text-[300px] text-qbit-primary" />
                </div>
              </div>

              {/* Security Card */}
              <div className="glass-card scroll-reveal rounded-3xl p-8 transition-colors hover:border-qbit-primary/40">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-qbit-surface-container">
                  <Icon name="security" className="text-[28px] text-qbit-primary" />
                </div>
                <h3 className="mb-4 text-headline-sm font-headline-sm">
                  Krypton Encryption
                </h3>
                <p className="text-body-sm text-qbit-on-surface-variant">
                  Hardware-level security modules ensure your enterprise data remains
                  isolated and encrypted at rest.
                </p>
              </div>

              {/* Durability Card */}
              <div className="glass-card scroll-reveal rounded-3xl p-8 transition-colors hover:border-qbit-primary/40">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-qbit-surface-container">
                  <Icon name="shield" className="text-[28px] text-qbit-primary" />
                </div>
                <h3 className="mb-4 text-headline-sm font-headline-sm">
                  IP65 Certified
                </h3>
                <p className="text-body-sm text-qbit-on-surface-variant">
                  Dust-tight and protected against water jets, making it ideal for
                  warehouse and outdoor terminal use.
                </p>
              </div>

              {/* Connectivity Card */}
              <div className="glass-card scroll-reveal flex items-center gap-8 overflow-hidden rounded-3xl p-8 md:col-span-2">
                <div className="flex-1">
                  <h3 className="mb-4 text-headline-md font-headline-md">
                    Universal I/O Connectivity
                  </h3>
                  <p className="text-body-md text-qbit-on-surface-variant">
                    Features dual USB-C, Ethernet, and proprietary Q-Link ports for
                    seamless peripheral expansion.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-4">
                    {["USB 4.0", "Wi-Fi 6E", "Bluetooth 5.3"].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-qbit-surface-container px-4 py-1 text-label-sm font-label-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="hidden h-48 w-48 shrink-0 items-center justify-center rounded-full bg-qbit-surface-container md:flex">
                  <Icon name="hub" className="text-[64px] text-qbit-primary" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Technical Specifications ---------- */}
        <section className="scroll-reveal bg-qbit-surface-container-low px-4 py-16 md:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex items-center justify-between gap-4">
              <h2 className="text-headline-lg font-headline-lg">
                Technical Specifications
              </h2>
              <button
                type="button"
                onClick={handlePrintSpec}
                className="flex items-center gap-1 text-qbit-primary font-label-md"
              >
                <Icon name="print" className="text-[18px]" />
                <span className="hidden sm:inline">Print Spec Sheet</span>
                <span className="sm:hidden">Print</span>
              </button>
            </div>
            <div className="overflow-hidden rounded-3xl border border-qbit-outline-variant/30 bg-white shadow-sm">
              <table className="w-full border-collapse text-left">
                <tbody>
                  {SPEC_ROWS.map((row, idx) => (
                    <tr
                      key={row.label}
                      className={
                        idx < SPEC_ROWS.length - 1
                          ? "border-b border-qbit-surface-container-high"
                          : ""
                      }
                    >
                      <th className="w-1/3 py-4 px-8 text-label-sm font-label-sm uppercase text-qbit-outline-variant align-top">
                        {row.label}
                      </th>
                      <td className="py-4 px-8 text-body-md text-qbit-on-surface align-top">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ---------- Installation & Training ---------- */}
        <section className="scroll-reveal bg-white px-4 py-16 md:px-8">
          <div className="mx-auto grid max-w-container-max grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Video Section */}
            <div className="lg:col-span-8">
              <h2 className="mb-8 text-headline-lg font-headline-lg">
                Installation &amp; Training
              </h2>

              {/* Main video */}
              <div className="group relative aspect-video cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-br from-qbit-on-background via-qbit-inverse-surface to-qbit-primary-container shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-qbit-primary/20 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
                <Icon
                  name="smart_display"
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[180px] text-white/5"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-20 w-20 transform items-center justify-center rounded-full bg-qbit-primary text-white transition-transform group-hover:scale-110">
                    <Icon name="play_arrow" className="text-[40px]" filled />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-label-sm text-white backdrop-blur-sm">
                  <Icon name="schedule" className="text-[14px]" />
                  Full Walkthrough • 12:48
                </div>
              </div>

              {/* Thumbnails */}
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { title: "Hardware Setup Guide", duration: "2:45" },
                  { title: "Software Configuration", duration: "5:12" },
                  { title: "Maintenance Basics", duration: "1:30" },
                ].map((thumb) => (
                  <div key={thumb.title} className="space-y-2">
                    <div className="group relative aspect-video cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-qbit-surface-container-high to-qbit-surface-container">
                      <Icon
                        name="play_circle"
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[40px] text-qbit-primary/60 transition-transform group-hover:scale-110"
                        filled
                      />
                      <div className="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                        {thumb.duration}
                      </div>
                    </div>
                    <p className="line-clamp-1 text-label-sm font-medium">
                      {thumb.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-3xl bg-qbit-surface-container-low p-8 lg:col-span-4">
              <h3 className="mb-8 text-headline-sm font-headline-sm">
                4-Step Quick Setup
              </h3>
              <div className="relative space-y-8">
                <div className="absolute bottom-2 left-4 top-2 w-0.5 bg-qbit-outline-variant/30" />
                {TIMELINE_STEPS.map((step, idx) => (
                  <div key={step.title} className="relative flex gap-4">
                    <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-qbit-primary text-sm font-bold text-white">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-label-md font-bold text-qbit-on-surface">
                        {step.title}
                      </h4>
                      <p className="mt-1 text-body-sm text-qbit-on-surface-variant">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <QbitButton
                variant="outline"
                fullWidth
                className="mt-12 bg-white"
                iconRight="arrow_forward"
                onClick={() => navigate("t800-installation-guide")}
              >
                View Full Installation Guide
              </QbitButton>
            </div>
          </div>
        </section>

        {/* ---------- Download Center ---------- */}
        <section className="scroll-reveal bg-qbit-surface px-4 py-16 md:px-8">
          <div className="mx-auto max-w-container-max">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-headline-lg font-headline-lg">Download Center</h2>
                <p className="mt-2 text-body-md text-qbit-on-surface-variant">
                  Get the latest drivers, SDKs, firmware, and manuals.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-label-sm font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Stable v4.2.1
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {DOWNLOAD_CARDS.map((card) => (
                <div
                  key={card.title}
                  className="scroll-reveal rounded-2xl border border-qbit-outline-variant/30 bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <Icon name={card.icon} className="text-[28px] text-qbit-primary" />
                    <span className="text-label-sm text-qbit-outline">
                      {card.version}
                    </span>
                  </div>
                  <h4 className="mb-2 font-label-md font-bold">{card.title}</h4>
                  <div className="mb-8 flex flex-col gap-1 text-body-sm text-qbit-on-surface-variant">
                    <span className="flex justify-between">
                      Release:{" "}
                      <span className="text-qbit-on-surface">{card.release}</span>
                    </span>
                    <span className="flex justify-between">
                      Size: <span className="text-qbit-on-surface">{card.size}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-qbit-primary-container/10 py-2 text-label-sm font-label-sm text-qbit-primary transition-all hover:bg-qbit-primary hover:text-white"
                  >
                    <Icon name={card.actionIcon} className="text-[18px]" />
                    {card.actionLabel}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Public Downloads ---------- */}
        <section className="scroll-reveal bg-qbit-surface-container-low px-4 py-16 md:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-2 text-center text-headline-lg font-headline-lg">
              Public Downloads
            </h2>
            <p className="mb-8 text-center text-body-lg text-qbit-on-surface-variant">
              Free drivers, manuals, and datasheets for your QBIT hardware.
            </p>
            <PublicDownloadGrid downloads={PUBLIC_DOWNLOADS} />
          </div>
        </section>

        {/* ---------- Contact Form ---------- */}
        <section className="scroll-reveal bg-white px-4 py-16 md:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-2 text-center text-headline-lg font-headline-lg">
              Get in Touch
            </h2>
            <p className="mb-8 text-center text-body-lg text-qbit-on-surface-variant">
              Have a question about the QBIT T-800? Our team responds within 1 business hour.
            </p>
            <ContactForm productId="qbit-t800" productName="QBIT T-800" />
          </div>
        </section>

        {/* ---------- FAQ + Support ---------- */}
        <section className="scroll-reveal bg-white px-4 py-16 md:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-center text-headline-lg font-headline-lg">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              {FAQ_ITEMS.map((item) => (
                <details
                  key={item.question}
                  className="group overflow-hidden rounded-2xl border border-qbit-outline-variant/30"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between bg-white p-4 transition-colors group-open:bg-qbit-surface-container-low md:p-6">
                    <span className="font-label-md font-bold">{item.question}</span>
                    <Icon
                      name="expand_more"
                      className="transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <div className="border-t border-qbit-outline-variant/30 p-4 text-body-sm text-qbit-on-surface-variant md:p-6">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>

            {/* Support cards */}
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {SUPPORT_CARDS.map((card) => (
                <a
                  key={card.title}
                  href={card.href}
                  className="group flex flex-col items-center rounded-2xl bg-qbit-surface-container-low p-6 text-center transition-all hover:bg-qbit-primary/5"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                    <Icon name={card.icon} className="text-qbit-primary" />
                  </div>
                  <span className="font-label-md font-bold">{card.title}</span>
                  <span className="mt-1 text-body-sm text-qbit-on-surface-variant">
                    {card.meta}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ============ Full Product Detail Layout ============ */}
        {/* Composed from reusable portal components — gallery, specs, downloads, videos, FAQs, troubleshooting, accessories, support, contact, QR */}
        <PublicProductLayout
          product={T800_PUBLIC_DETAIL}
          downloads={PUBLIC_DOWNLOADS}
          faqs={T800_FAQS}
          troubleshooting={T800_TROUBLESHOOTING}
          accessories={T800_ACCESSORIES}
          supportCards={T800_SUPPORT_CARDS}
          videos={T800_VIDEOS}
          relatedProducts={getRelatedProducts(T800_PUBLIC_DETAIL.id)}
          publicUrl="https://hub.qbit.com/products/qbit-t-800"
        />
      </main>

      {/* ============ Footer ============ */}
      <footer className="bg-qbit-on-background px-4 py-12 text-white md:px-8">
        <div className="mx-auto max-w-container-max">
          <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
            {/* Brand col */}
            <div className="col-span-2">
              <div className="mb-8 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-qbit-primary">
                  <Icon name="terminal" className="text-[20px] text-white" filled />
                </div>
                <span className="text-headline-sm font-headline-sm tracking-tight">
                  QBIT
                </span>
              </div>
              <p className="max-w-xs text-body-sm text-qbit-outline-variant/60">
                Empowering the world&apos;s leading enterprises with
                precision-engineered hardware solutions for over two decades.
              </p>
            </div>

            {/* Products */}
            <div>
              <h5 className="mb-4 text-label-sm font-bold uppercase tracking-widest">
                Products
              </h5>
              <ul className="space-y-4 text-body-sm text-qbit-outline-variant">
                {["T-Series Terminals", "S-Series Scanners", "P-Series Printers", "Custom OEM"].map(
                  (link) => (
                    <li key={link}>
                      <a href="#" className="transition-colors hover:text-qbit-primary">
                        {link}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h5 className="mb-4 text-label-sm font-bold uppercase tracking-widest">
                Resources
              </h5>
              <ul className="space-y-4 text-body-sm text-qbit-outline-variant">
                {["Developer SDK", "Case Studies", "White Papers", "Documentation"].map(
                  (link) => (
                    <li key={link}>
                      <a href="#" className="transition-colors hover:text-qbit-primary">
                        {link}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="col-span-2">
              <h5 className="mb-4 text-label-sm font-bold uppercase tracking-widest">
                Newsletter
              </h5>
              <p className="mb-4 text-body-sm text-qbit-outline-variant">
                Get the latest firmware updates and tech news.
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex gap-2"
              >
                <input
                  type="email"
                  placeholder="Email Address"
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-label-md text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-qbit-primary"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-qbit-primary px-5 py-2 text-label-sm font-label-sm text-white"
                >
                  Join
                </button>
              </form>
            </div>
          </div>

          {/* Copyright row */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
            <span className="text-label-sm text-qbit-outline-variant/40">
              &copy; 2024 QBIT Hub Technology Group. All rights reserved.
            </span>
            <div className="flex gap-8 text-label-sm text-qbit-outline-variant/40">
              <a href="#" className="transition-colors hover:text-white">
                Privacy Policy
              </a>
              <a href="#" className="transition-colors hover:text-white">
                Terms of Service
              </a>
              <a href="#" className="transition-colors hover:text-white">
                Cookie Settings
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
