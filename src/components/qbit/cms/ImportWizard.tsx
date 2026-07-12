"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import { useToast } from "@/hooks/use-toast";
import { IMPORT_TYPES, IMPORT_PREVIEW } from "@/lib/cms/placeholder-data";
import type { ImportStep, ImportType } from "@/lib/cms/types";

const STEPS: { id: ImportStep; label: string; icon: string }[] = [
  { id: "upload", label: "Upload", icon: "upload" },
  { id: "preview", label: "Preview", icon: "preview" },
  { id: "validate", label: "Validate", icon: "fact_check" },
  { id: "importing", label: "Importing", icon: "sync" },
  { id: "complete", label: "Complete", icon: "task_alt" },
];

/**
 * ImportWizard — step-by-step import flow:
 * 1. Upload file (drag-drop or file picker)
 * 2. Preview parsed data (table with validation status)
 * 3. Validate (check for errors/duplicates)
 * 4. Importing (progress bar)
 * 5. Complete (summary with success/error counts)
 */
export function ImportWizard() {
  const { toast } = useToast();
  const [step, setStep] = useState<ImportStep>("upload");
  const [importType, setImportType] = useState<ImportType>("product");
  const [fileName, setFileName] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    toast({ title: "File uploaded", description: `${file.name} (${(file.size / 1024).toFixed(1)} KB)` });
    setStep("preview");
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  function startImport() {
    setStep("importing");
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setStep("complete");
          return 100;
        }
        return p + 10;
      });
    }, 300);
  }

  const currentStepIdx = STEPS.findIndex((s) => s.id === step);

  return (
    <section className="space-y-4">
      <SectionHeader title="Import Wizard" accentDot />

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
              idx < currentStepIdx ? "bg-emerald-500 text-white" :
              idx === currentStepIdx ? "bg-qbit-primary text-white ring-4 ring-qbit-primary/20" :
              "bg-qbit-surface-container-high text-qbit-outline",
            )}>
              {idx < currentStepIdx ? <Icon name="check" className="text-[16px]" /> : idx + 1}
            </div>
            {idx < STEPS.length - 1 && (
              <div className={cn("w-8 sm:w-16 h-0.5 mx-0.5", idx < currentStepIdx ? "bg-emerald-500" : "bg-qbit-surface-container-high")} />
            )}
          </div>
        ))}
      </div>

      <SurfaceCard className="p-6">
        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            {/* Import type selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant mb-2">Import Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {IMPORT_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setImportType(t.id as ImportType)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all",
                      importType === t.id ? "border-qbit-primary bg-qbit-primary/5 text-qbit-primary" : "border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container",
                    )}
                  >
                    <Icon name={t.icon} className="text-[20px]" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-qbit-on-surface-variant text-center">
              {IMPORT_TYPES.find((t) => t.id === importType)?.description}
            </p>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              className={cn(
                "border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer",
                dragOver ? "border-qbit-primary bg-qbit-primary/5" : "border-qbit-outline-variant hover:border-qbit-primary/50",
              )}
              onClick={() => document.getElementById("import-file-input")?.click()}
            >
              <Icon name="cloud_upload" className="text-[48px] text-qbit-on-surface-variant mx-auto mb-2" />
              <p className="text-sm font-semibold text-qbit-on-surface">Drop file here or click to browse</p>
              <p className="text-xs text-qbit-on-surface-variant mt-1">
                Supports: {IMPORT_TYPES.find((t) => t.id === importType)?.accept}
              </p>
              <input
                id="import-file-input"
                type="file"
                className="hidden"
                accept={IMPORT_TYPES.find((t) => t.id === importType)?.accept}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Icon name="description" className="text-[18px] text-qbit-primary" />
              <span className="font-semibold text-qbit-on-surface">{fileName}</span>
              <span className="text-xs text-qbit-on-surface-variant">({IMPORT_PREVIEW.length} rows detected)</span>
            </div>

            {/* Preview table */}
            <div className="overflow-x-auto rounded-lg border border-qbit-outline-variant">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-qbit-surface-container-low border-b border-qbit-outline-variant">
                    <th className="px-3 py-2 text-left font-bold uppercase text-qbit-on-surface-variant">Row</th>
                    <th className="px-3 py-2 text-left font-bold uppercase text-qbit-on-surface-variant">Status</th>
                    {Object.keys(IMPORT_PREVIEW[0]?.data ?? {}).map((key) => (
                      <th key={key} className="px-3 py-2 text-left font-bold uppercase text-qbit-on-surface-variant">{key}</th>
                    ))}
                    <th className="px-3 py-2 text-left font-bold uppercase text-qbit-on-surface-variant">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-qbit-outline-variant/40">
                  {IMPORT_PREVIEW.map((row) => (
                    <tr key={row.rowNumber} className="hover:bg-qbit-surface-container-low">
                      <td className="px-3 py-2 text-qbit-on-surface-variant">{row.rowNumber}</td>
                      <td className="px-3 py-2">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                          row.status === "valid" ? "bg-emerald-100 text-emerald-700" :
                          row.status === "warning" ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700",
                        )}>
                          <Icon name={row.status === "valid" ? "check_circle" : row.status === "warning" ? "warning" : "error"} className="text-[12px]" />
                          {row.status}
                        </span>
                      </td>
                      {Object.values(row.data).map((val, i) => (
                        <td key={i} className="px-3 py-2 text-qbit-on-surface-variant max-w-[120px] truncate">{val || "—"}</td>
                      ))}
                      <td className="px-3 py-2 text-qbit-on-surface-variant text-[10px]">{row.message ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="flex items-center gap-4 text-xs">
              <span className="text-emerald-600 font-semibold">✓ {IMPORT_PREVIEW.filter((r) => r.status === "valid").length} valid</span>
              <span className="text-amber-600 font-semibold">⚠ {IMPORT_PREVIEW.filter((r) => r.status === "warning").length} warnings</span>
              <span className="text-red-600 font-semibold">✗ {IMPORT_PREVIEW.filter((r) => r.status === "error").length} errors</span>
            </div>

            <div className="flex justify-between gap-2">
              <QbitButton variant="outline" size="md" icon="arrow_back" onClick={() => setStep("upload")}>Back</QbitButton>
              <QbitButton variant="primary" size="md" iconRight="arrow_forward" onClick={() => setStep("validate")}>Validate</QbitButton>
            </div>
          </div>
        )}

        {/* Step 3: Validate */}
        {step === "validate" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-qbit-primary/5 border border-qbit-primary/20 p-4">
              <h4 className="text-sm font-semibold text-qbit-on-surface flex items-center gap-2 mb-2">
                <Icon name="fact_check" className="text-[18px] text-qbit-primary" />
                Validation Results
              </h4>
              <ul className="space-y-1.5 text-xs text-qbit-on-surface-variant">
                <li className="flex items-center gap-2"><Icon name="check_circle" className="text-[14px] text-emerald-500" /> Required fields: All present (except row 4)</li>
                <li className="flex items-center gap-2"><Icon name="check_circle" className="text-[14px] text-emerald-500" /> Duplicate check: No duplicates found</li>
                <li className="flex items-center gap-2"><Icon name="check_circle" className="text-[14px] text-emerald-500" /> Category validation: 1 new category will be created</li>
                <li className="flex items-center gap-2"><Icon name="warning" className="text-[14px] text-amber-500" /> 1 row has errors and will be skipped</li>
                <li className="flex items-center gap-2"><Icon name="info" className="text-[14px] text-qbit-primary" /> 4 of 5 rows will be imported</li>
              </ul>
            </div>

            <div className="flex items-center gap-3 text-xs text-qbit-on-surface-variant">
              <Icon name="info" className="text-[16px] text-qbit-primary" />
              If the import fails, it will automatically rollback. No partial data will be left.
            </div>

            <div className="flex justify-between gap-2">
              <QbitButton variant="outline" size="md" icon="arrow_back" onClick={() => setStep("preview")}>Back</QbitButton>
              <QbitButton variant="primary" size="md" icon="rocket_launch" onClick={startImport}>Start Import</QbitButton>
            </div>
          </div>
        )}

        {/* Step 4: Importing */}
        {step === "importing" && (
          <div className="space-y-4 text-center py-8">
            <div className="relative inline-flex">
              <Icon name="sync" className="text-[48px] text-qbit-primary animate-spin" />
            </div>
            <div>
              <p className="text-sm font-semibold text-qbit-on-surface">Importing {importType}s...</p>
              <p className="text-xs text-qbit-on-surface-variant mt-1">{progress}% complete</p>
            </div>
            <div className="w-full max-w-md mx-auto h-2 rounded-full bg-qbit-surface-container-high overflow-hidden">
              <div className="h-full bg-qbit-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === "complete" && (
          <div className="space-y-4 text-center py-8">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Icon name="task_alt" className="text-[32px]" filled />
            </div>
            <div>
              <p className="text-lg font-semibold text-qbit-on-surface">Import Complete</p>
              <p className="text-sm text-qbit-on-surface-variant mt-1">
                4 items imported successfully, 1 skipped (error), 0 rolled back
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <QbitButton variant="outline" size="md" icon="history" onClick={() => { setStep("upload"); setFileName(""); setProgress(0); }}>New Import</QbitButton>
              <QbitButton variant="primary" size="md" icon="visibility" onClick={() => toast({ title: "Viewing imported items" })}>View Results</QbitButton>
            </div>
          </div>
        )}
      </SurfaceCard>
    </section>
  );
}
