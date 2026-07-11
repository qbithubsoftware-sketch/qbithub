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
    <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-gradient-to-br from-qbit-surface-container-low to-qbit-surface border border-qbit-outline-variant rounded-2xl overflow-hidden p-6 md:p-8 relative">
      <div className="md:col-span-7 z-10">
        <span className="inline-block px-3 py-1 bg-qbit-primary/10 text-qbit-primary rounded-full text-xs font-semibold mb-4">
          System Online • 99.9% Uptime
        </span>
        <h2 className="text-[36px] leading-[44px] font-bold text-qbit-on-surface mb-1">
          {greeting}, {userName}.
        </h2>
        <h3 className="text-[24px] leading-[32px] font-semibold text-qbit-on-surface-variant mb-8 opacity-80">
          Welcome back to QBIT Hub
        </h3>
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-widest text-qbit-outline">
              Current Session
            </span>
            <span className="text-lg font-semibold text-qbit-on-surface">
              {dateStr}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-widest text-qbit-outline">
              Active Alerts
            </span>
            <span className="text-lg font-semibold text-qbit-error flex items-center gap-1.5">
              <Icon name="warning" className="text-[18px]" filled />
              2 Critical Updates
            </span>
          </div>
        </div>
      </div>
      <div className="md:col-span-5 relative h-48 md:h-full flex items-center justify-center">
        <img
          src={heroImage}
          alt="Enterprise portal hero illustration"
          className="object-contain max-h-72 w-full drop-shadow-2xl transition-transform hover:scale-105 duration-700"
        />
      </div>
    </section>
  );
}
