"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import type { InstallationFAQEntry } from "@/lib/installation/types";

/**
 * InstallationFAQ — accordion of frequently asked questions for an
 * installation guide.  Uses native <details> for accessibility.
 */
export function InstallationFAQ({ faqs }: { faqs: InstallationFAQEntry[] }) {
  if (faqs.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Frequently Asked Questions" accentDot />
      <SurfaceCard className="divide-y divide-qbit-outline-variant/40">
        {faqs.map((faq) => (
          <FAQItem key={faq.id} faq={faq} />
        ))}
      </SurfaceCard>
    </section>
  );
}

function FAQItem({ faq }: { faq: InstallationFAQEntry }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-qbit-surface-container-low transition-colors"
      >
        <span className="text-sm font-semibold text-qbit-on-surface">{faq.question}</span>
        <Icon
          name="expand_more"
          className={cn(
            "text-[20px] text-qbit-on-surface-variant transition-transform shrink-0",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm text-qbit-on-surface-variant leading-relaxed pl-1">
            {faq.answer}
          </p>
        </div>
      )}
    </div>
  );
}
