"use client";

/**
 * BulkActionToolbar — appears when devices are selected.
 *
 * Reuses SurfaceCard, Icon, QbitButton.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useToast } from "@/hooks/use-toast";

interface BulkActionToolbarProps {
  selectedCount: number;
  onClear: () => void;
  onExport: () => void;
  onGenerateReport: () => void;
}

export function BulkActionToolbar({
  selectedCount,
  onClear,
  onExport,
  onGenerateReport,
}: BulkActionToolbarProps) {
  const { toast } = useToast();

  if (selectedCount === 0) return null;

  return (
    <SurfaceCard className="flex flex-wrap items-center justify-between gap-3 border-qbit-primary/30 bg-qbit-primary/5 p-3">
      <div className="flex items-center gap-2">
        <Icon name="check_circle" className="text-[18px] text-qbit-primary" filled />
        <span className="text-sm font-semibold text-qbit-on-surface">
          {selectedCount} device{selectedCount === 1 ? "" : "s"} selected
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-qbit-on-surface-variant hover:text-qbit-error"
        >
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <QbitButton
          variant="outline"
          size="sm"
          icon="download"
          onClick={onExport}
        >
          Export CSV
        </QbitButton>
        <QbitButton
          variant="primary"
          size="sm"
          icon="picture_as_pdf"
          onClick={onGenerateReport}
        >
          Generate Report
        </QbitButton>
        <QbitButton
          variant="ghost"
          size="sm"
          icon="person_add"
          onClick={() => toast({ title: "Assign Engineer", description: "In production, this opens an engineer assignment dialog." })}
        >
          Assign Engineer
        </QbitButton>
        <QbitButton
          variant="ghost"
          size="sm"
          icon="schedule"
          onClick={() => toast({ title: "Schedule Inspection", description: "In production, this creates inspection work orders." })}
        >
          Schedule Inspection
        </QbitButton>
        <QbitButton
          variant="ghost"
          size="sm"
          icon="build"
          onClick={() => toast({ title: "Create Service Request", description: "In production, this creates FSM work orders for selected devices." })}
        >
          Service Request
        </QbitButton>
      </div>
    </SurfaceCard>
  );
}
