"use client";

/**
 * ReportGenerator — completion report builder.
 *
 * Lets the engineer add tests performed, parts replaced (if any), and a
 * summary, then submits to POST /api/fsm/work-orders/[id]/report.
 *
 * On success, calls onSuccess with the report payload — the parent page
 * can then route to the printable report view.
 */

import { useState } from "react";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface ReportGeneratorProps {
  workOrderId: string;
  workOrderType: string;
  onSuccess?: (report: { reportNumber: string }) => void;
}

interface TestRow {
  name: string;
  result: "pass" | "fail" | "skipped";
  notes: string;
}

const DEFAULT_TESTS: TestRow[] = [
  { name: "Power on self-test", result: "pass", notes: "" },
  { name: "Print quality test", result: "pass", notes: "" },
  { name: "Connectivity (USB/Ethernet)", result: "pass", notes: "" },
  { name: "Driver installation", result: "pass", notes: "" },
];

export function ReportGenerator({
  workOrderId,
  workOrderType,
  onSuccess,
}: ReportGeneratorProps) {
  const { toast } = useToast();
  const [summary, setSummary] = useState("");
  const [tests, setTests] = useState<TestRow[]>(DEFAULT_TESTS);
  const [partsReplaced, setPartsReplaced] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateTest = (idx: number, patch: Partial<TestRow>) => {
    setTests((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  };

  const handleSubmit = async () => {
    if (!summary.trim()) {
      toast({
        title: "Summary required",
        description: "Please write a brief summary of the work performed.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/fsm/work-orders/${workOrderId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          testsPerformed: tests,
          partsReplaced: partsReplaced.trim()
            ? partsReplaced.split("\n").map((s) => s.trim()).filter(Boolean)
            : null,
          recommendations: recommendations.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to generate report");
      }
      const { report } = await res.json();
      toast({
        title: "Report generated",
        description: `Report ${report.reportNumber} has been created.`,
      });
      onSuccess?.(report);
    } catch (e) {
      toast({
        title: "Report generation failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-qbit-on-surface">
          Work Summary <span className="text-qbit-error">*</span>
        </label>
        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          placeholder={`Describe the ${workOrderType.replace(/_/g, " ")} work performed…`}
          className="resize-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-qbit-on-surface">
          Tests Performed
        </label>
        <div className="space-y-2">
          {tests.map((t, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-2 rounded-lg border border-qbit-outline-variant bg-white p-2"
            >
              <Input
                type="text"
                value={t.name}
                onChange={(e) => updateTest(idx, { name: e.target.value })}
                className="col-span-12 sm:col-span-5 h-9"
                placeholder="Test name"
              />
              <select
                value={t.result}
                onChange={(e) => updateTest(idx, { result: e.target.value as TestRow["result"] })}
                className="col-span-6 sm:col-span-2 h-9 rounded-md border border-qbit-outline-variant bg-white px-2 text-sm"
              >
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
                <option value="skipped">Skipped</option>
              </select>
              <Input
                type="text"
                value={t.notes}
                onChange={(e) => updateTest(idx, { notes: e.target.value })}
                className="col-span-6 sm:col-span-5 h-9"
                placeholder="Notes"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-qbit-on-surface">
          Parts Replaced <span className="text-qbit-on-surface-variant">(one per line, optional)</span>
        </label>
        <Textarea
          value={partsReplaced}
          onChange={(e) => setPartsReplaced(e.target.value)}
          rows={2}
          placeholder={"e.g. Power adapter (12V, 2A)\nUSB-B cable, 1.5m"}
          className="resize-none font-mono text-xs"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-qbit-on-surface">
          Recommendations
        </label>
        <Textarea
          value={recommendations}
          onChange={(e) => setRecommendations(e.target.value)}
          rows={2}
          placeholder="Optional follow-up actions for the customer…"
          className="resize-none"
        />
      </div>

      <QbitButton
        variant="primary"
        icon={submitting ? "progress_activity" : "picture_as_pdf"}
        disabled={submitting}
        onClick={handleSubmit}
      >
        {submitting ? "Generating Report…" : "Generate Completion Report"}
      </QbitButton>
    </div>
  );
}

export { Icon };
