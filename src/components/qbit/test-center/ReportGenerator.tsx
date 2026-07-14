"use client";

/**
 * ReportGenerator — generates a printable test report.
 *
 * Reuses SurfaceCard, Icon, QbitButton.
 */

import { useState } from "react";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useToast } from "@/hooks/use-toast";
import type { TestSessionDTO } from "@/lib/test-center/types";

interface ReportGeneratorProps {
  session: TestSessionDTO;
}

export function ReportGenerator({ session }: ReportGeneratorProps) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/dr-qbit/tests/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to generate report");
      }
      const data = await res.json();
      toast({
        title: "Report Generated",
        description: `Report ${data.report.reportNumber} created. Click Print to save as PDF.`,
      });
    } catch (e) {
      toast({
        title: "Report Generation Failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <SurfaceCard className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon name="picture_as_pdf" className="text-[20px] text-qbit-primary" filled />
        <h3 className="text-sm font-semibold text-qbit-on-surface">Generate Test Report</h3>
      </div>

      {/* Report preview */}
      <div className="rounded-lg border border-qbit-outline-variant/50 bg-white p-4">
        <div className="border-b border-qbit-outline-variant/50 pb-2">
          <h4 className="text-base font-bold text-qbit-on-surface">QBIT Hub — Device Test Report</h4>
          <p className="text-xs text-qbit-on-surface-variant">
            Session: {session.sessionToken.slice(0, 16)} · {session.deviceName ?? "Unknown device"} · {session.model ?? "—"}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div><span className="text-qbit-on-surface-variant">Engineer:</span> <span className="font-medium">{session.engineerName ?? "—"}</span></div>
          <div><span className="text-qbit-on-surface-variant">Date:</span> <span className="font-medium">{new Date(session.startedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span></div>
          <div><span className="text-qbit-on-surface-variant">Overall Score:</span> <span className="font-bold text-qbit-primary">{session.overallScore}/100</span></div>
          <div><span className="text-qbit-on-surface-variant">Status:</span> <span className="font-medium">{session.overallStatus}</span></div>
          <div><span className="text-qbit-on-surface-variant">Passed:</span> <span className="font-medium text-qbit-success">{session.passedCount}</span></div>
          <div><span className="text-qbit-on-surface-variant">Failed:</span> <span className="font-medium text-qbit-error">{session.failedCount}</span></div>
          <div><span className="text-qbit-on-surface-variant">Warnings:</span> <span className="font-medium text-qbit-warning">{session.warningCount}</span></div>
          <div><span className="text-qbit-on-surface-variant">Total Tests:</span> <span className="font-medium">{session.totalTests}</span></div>
        </div>

        {/* Test results table */}
        <table className="mt-3 w-full text-xs">
          <thead>
            <tr className="border-b border-qbit-outline-variant text-left text-[10px] uppercase text-qbit-on-surface-variant">
              <th className="py-1">Test</th>
              <th className="py-1">Category</th>
              <th className="py-1">Result</th>
              <th className="py-1">Duration</th>
            </tr>
          </thead>
          <tbody>
            {session.testResults?.slice(0, 10).map((r) => (
              <tr key={r.id} className="border-b border-qbit-outline-variant/30">
                <td className="py-1">{r.testName}</td>
                <td className="py-1 capitalize">{r.testCategory}</td>
                <td className="py-1 font-medium">{r.status}</td>
                <td className="py-1">{r.duration ? `${r.duration}ms` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-3 border-t border-qbit-outline-variant/50 pt-2 text-[10px] text-qbit-on-surface-variant">
          QBIT Hub Enterprise Portal · Support: 1800-123-4567 · support@qbithub.com
        </p>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex gap-2">
        <QbitButton
          variant="primary"
          size="sm"
          icon={generating ? "progress_activity" : "picture_as_pdf"}
          disabled={generating}
          onClick={handleGenerate}
        >
          {generating ? "Generating…" : "Generate Report"}
        </QbitButton>
        <QbitButton
          variant="outline"
          size="sm"
          icon="print"
          onClick={handlePrint}
        >
          Print / Save PDF
        </QbitButton>
      </div>
    </SurfaceCard>
  );
}
