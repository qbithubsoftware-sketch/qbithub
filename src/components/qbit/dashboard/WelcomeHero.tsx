"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/qbit/primitives/Icon";

/**
 * Welcome Hero — the first banner users see after login.
 *
 * Matches the Stitch `home_qbit_hub` hero exactly: light gradient from
 * surface-container-low to surface, system-online pill, greeting,
 * welcome subtitle, and two-column meta (Current Session + Active Alerts).
 */
export function WelcomeHero({
  userName = "Alex",
  greeting = "Good Morning",
  heroImage = "/qbit-hero-illustration.png",
}: {
  userName?: string;
  greeting?: string;
  heroImage?: string;
}) {
  // Start with null so SSR and first client render agree; the interval
  // populates the value after mount without triggering the
  // react-hooks/set-state-in-effect lint rule.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now
    ? now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-gradient-to-br from-qbit-surface-container-low to-qbit-surface border border-qbit-outline-variant/50 rounded-2xl overflow-hidden p-6 md:p-8 relative">
      <div className="md:col-span-7 z-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-qbit-primary/10 text-qbit-primary rounded-full text-xs font-semibold mb-4">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          System Online • 99.9% Uptime
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-qbit-on-surface mb-1">
          {greeting}, {userName}.
        </h2>
        <h3 className="text-lg md:text-xl font-semibold text-qbit-on-surface-variant mb-6 opacity-80">
          Welcome back to QBIT Hub
        </h3>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-qbit-on-surface-variant/60">
              Current Session
            </span>
            <span className="text-lg font-semibold text-qbit-on-surface">
              {dateStr}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-qbit-on-surface-variant/60">
              Active Alerts
            </span>
            <span className="text-base font-semibold text-qbit-error flex items-center gap-1.5">
              <Icon name="warning" className="text-[16px]" filled />
              2 Critical Updates
            </span>
          </div>
        </div>
      </div>
      <div className="md:col-span-5 relative h-40 md:h-full flex items-center justify-center">
        <img
          src={heroImage}
          alt="Enterprise portal hero illustration"
          loading="lazy"
          className="object-contain max-h-64 w-full drop-shadow-xl transition-transform hover:scale-105 duration-700"
        />
      </div>
    </section>
  );
}
