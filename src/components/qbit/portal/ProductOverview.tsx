"use client";

import { Icon } from "@/components/qbit/primitives/Icon";

/**
 * ProductOverview — description + key features section.
 */
export function ProductOverview({
  description,
  longDescription,
  features,
}: {
  description: string;
  longDescription: string;
  features: { icon: string; title: string; description: string }[];
}) {
  return (
    <section className="space-y-8">
      {/* Overview text */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-qbit-on-surface">Overview</h2>
        <p className="text-sm text-qbit-on-surface-variant leading-relaxed md:text-base">{description}</p>
        <p className="text-sm text-qbit-on-surface-variant leading-relaxed">{longDescription}</p>
      </div>

      {/* Key features grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-qbit-on-surface">Key Features</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-qbit-outline-variant bg-white p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary mb-3">
                <Icon name={feature.icon} className="text-[20px]" filled />
              </div>
              <h4 className="text-sm font-semibold text-qbit-on-surface mb-1">{feature.title}</h4>
              <p className="text-xs text-qbit-on-surface-variant leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
