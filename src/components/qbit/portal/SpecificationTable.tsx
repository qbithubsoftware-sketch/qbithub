"use client";

import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";

/**
 * SpecificationTable — reusable specifications table with print button.
 */
export function SpecificationTable({
  specifications,
  title = "Technical Specifications",
}: {
  specifications: { property: string; value: string }[];
  title?: string;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-qbit-on-surface">{title}</h2>
        <QbitButton size="sm" variant="outline" icon="print" onClick={() => window.print()}>
          Print Spec Sheet
        </QbitButton>
      </div>
      <SurfaceCard className="overflow-hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-qbit-outline-variant/40">
            {specifications.map((spec, idx) => (
              <tr key={idx} className="hover:bg-qbit-surface-container-low transition-colors">
                <td className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant whitespace-nowrap w-1/3">
                  {spec.property}
                </td>
                <td className="px-4 py-3 text-qbit-on-surface">{spec.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SurfaceCard>
    </section>
  );
}
