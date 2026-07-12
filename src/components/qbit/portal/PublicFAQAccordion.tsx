"use client";

import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import { FAQAccordion } from "@/components/qbit/knowledge/FAQAccordion";
import type { PublicFAQEntry } from "@/lib/portal/types";

/**
 * PublicFAQAccordion — FAQ section for the public product page.
 *
 * REUSES the existing FAQAccordion component from the knowledge module.
 * Maps PublicFAQEntry → the FAQEntry type expected by FAQAccordion.
 */
export function PublicFAQAccordion({ faqs }: { faqs: PublicFAQEntry[] }) {
  if (faqs.length === 0) return null;

  const mappedFaqs = faqs.map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
  }));

  return (
    <section className="space-y-4">
      <SectionHeader title="Frequently Asked Questions" accentDot />
      <FAQAccordion faqs={mappedFaqs} searchable />
    </section>
  );
}
