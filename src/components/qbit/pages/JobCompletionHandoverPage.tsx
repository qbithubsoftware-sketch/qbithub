"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { GlassCard } from "@/components/qbit/primitives/GlassCard";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FIELD_NAV } from "@/lib/navigation/nav-config";
import { useNavigation } from "@/lib/navigation/store";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface TestRow {
  id: string;
  icon: string;
  name: string;
  value: string;
}

interface ToolbarButton {
  icon: string;
  label: string;
}

/* ------------------------------------------------------------------ */
/* Static data (verbatim from design)                                  */
/* ------------------------------------------------------------------ */

const TEST_ROWS: TestRow[] = [
  {
    id: "signal",
    icon: "signal_cellular_alt",
    name: "Signal Calibration",
    value: "-14.2 dBm (Target: -15.0)",
  },
  {
    id: "gateway",
    icon: "router",
    name: "Gateway Response",
    value: "8ms Latency (Target: <20ms)",
  },
  {
    id: "power",
    icon: "bolt",
    name: "Power Consumption",
    value: "Idle: 4.2W / Peak: 12.1W",
  },
];

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { icon: "format_bold", label: "Bold" },
  { icon: "format_italic", label: "Italic" },
  { icon: "format_list_bulleted", label: "Bulleted list" },
  { icon: "link", label: "Insert link" },
  { icon: "image", label: "Insert image" },
];

const MAX_RATING = 5;
const INITIAL_RATING = 4;
const GENERATE_DURATION_MS = 1500;

/* ------------------------------------------------------------------ */
/* SignaturePad — canvas-based signature input with mouse + touch      */
/* ------------------------------------------------------------------ */

interface SignaturePadProps {
  label: string;
  watermarkIcon: string;
  ariaLabel: string;
}

function SignaturePad({
  label,
  watermarkIcon,
  ariaLabel,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  // Initialise the canvas backing store at device-pixel resolution.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#141b2b";
      ctxRef.current = ctx;
    };

    setup();

    // Re-initialise on viewport resize (drawing is reset).
    const onResize = () => {
      setHasInk(false);
      setup();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const getPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (clientX: number, clientY: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    drawingRef.current = true;
    const pos = getPos(clientX, clientY);
    if (!pos) return;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    if (!hasInk) setHasInk(true);
  };

  const moveDraw = (clientX: number, clientY: number) => {
    if (!drawingRef.current) return;
    const ctx = ctxRef.current;
    const pos = getPos(clientX, clientY);
    if (!ctx || !pos) return;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const endDraw = () => {
    drawingRef.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-qbit-on-surface-variant">
        {label}
      </label>
      <div
        className="signature-pad relative flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-qbit-outline-variant"
        aria-hidden={false}
      >
        <Icon
          name={watermarkIcon}
          className="pointer-events-none select-none text-[48px] text-qbit-outline"
          style={{
            opacity: hasInk ? 0.05 : 0.3,
            transition: "opacity 0.2s ease",
          }}
        />
        <canvas
          ref={canvasRef}
          aria-label={ariaLabel}
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
          onMouseDown={(e) => startDraw(e.clientX, e.clientY)}
          onMouseMove={(e) => moveDraw(e.clientX, e.clientY)}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={(e) => {
            const t = e.touches[0];
            if (t) startDraw(t.clientX, t.clientY);
          }}
          onTouchMove={(e) => {
            const t = e.touches[0];
            if (t) {
              e.preventDefault();
              moveDraw(t.clientX, t.clientY);
            }
          }}
          onTouchEnd={endDraw}
        />
        <button
          type="button"
          onClick={clear}
          aria-label="Clear signature"
          title="Clear"
          className="absolute bottom-1 right-1 p-1 text-qbit-outline transition-colors hover:text-qbit-error"
        >
          <Icon name="delete" className="text-[18px]" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* StarRating — clickable 5-star customer rating                       */
/* ------------------------------------------------------------------ */

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div
      className="mb-6 flex justify-center gap-2"
      role="radiogroup"
      aria-label="Customer rating"
    >
      {Array.from({ length: MAX_RATING }, (_, i) => {
        const idx = i + 1;
        const filled = idx <= value;
        return (
          <button
            key={idx}
            type="button"
            role="radio"
            aria-checked={idx === value}
            aria-label={`${idx} star${idx > 1 ? "s" : ""}`}
            onClick={() => onChange(idx)}
            className="transition-transform hover:scale-110"
          >
            <Icon
              name={filled ? "star" : "star_border"}
              filled={filled}
              className={
                filled
                  ? "text-[32px] text-qbit-secondary"
                  : "text-[32px] text-qbit-outline-variant"
              }
            />
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function JobCompletionHandoverPage() {
  const navigate = useNavigation((s) => s.navigate);
  const [rating, setRating] = useState(INITIAL_RATING);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Cleanup pending timeout on unmount.
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleGenerate = useCallback(() => {
    if (isGenerating || isGenerated) return;
    setIsGenerating(true);
    timeoutRef.current = window.setTimeout(() => {
      setIsGenerating(false);
      setIsGenerated(true);
      setShowModal(true);
    }, GENERATE_DURATION_MS);
  }, [isGenerating, isGenerated]);

  const handleDone = useCallback(() => {
    setShowModal(false);
    navigate("field-engineer-workspace");
  }, [navigate]);

  return (
    <AppShell
      variant="field"
      brand={{ title: "QBIT Hub", tagline: "Field Ops v2.4", icon: "engineering" }}
      navItems={FIELD_NAV}
      activeScreen="job-completion-handover"
      user={{ name: "Alex Rivera", role: "Senior Engineer", initials: "AR" }}
      topBar={{
        searchPlaceholder: "Search tasks, assets, or records...",
        user: { name: "Alex Rivera", role: "Senior Engineer", initials: "AR" },
        showMobileMenu: true,
        rightText: "Alex Rivera",
      }}
    >
      <div className="space-y-8 pb-12">
        {/* ============================================================ */}
        {/* Page Header                                                  */}
        {/* ============================================================ */}
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <nav
              aria-label="Breadcrumb"
              className="mb-1 flex items-center gap-1 text-sm font-medium text-qbit-outline"
            >
              <span>Work Orders</span>
              <Icon name="chevron_right" className="text-[14px]" />
              <span>WO-94281</span>
            </nav>
            <h2 className="text-[36px] font-bold leading-[44px] tracking-[-0.02em] text-qbit-on-surface">
              Installation Handover
            </h2>
            <p className="mt-2 max-w-2xl text-base text-qbit-on-surface-variant">
              Finalize the installation by verifying test results, documenting
              notes, and collecting authorized signatures from both parties.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-qbit-secondary-container/20 bg-qbit-secondary-container/10 px-3 py-1 text-sm font-medium text-qbit-secondary">
              <Icon name="verified" className="text-[18px]" filled />
              Status: Quality Check
            </span>
          </div>
        </header>

        {/* ============================================================ */}
        {/* Bento Grid (12-col, 7/5 split)                              */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ----- Left Column (col-span-7) ----- */}
          <div className="space-y-6 lg:col-span-7">
            {/* Test Results Verification */}
            <GlassCard className="p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xl font-semibold text-qbit-on-surface">
                  <Icon name="analytics" className="text-[24px] text-qbit-primary" />
                  Test Results Verification
                </h3>
                <span className="text-xs font-bold uppercase tracking-wider text-qbit-outline">
                  AUTO-VERIFIED
                </span>
              </div>
              <div className="space-y-4">
                {TEST_ROWS.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between rounded-lg border border-qbit-outline-variant/30 bg-qbit-surface-container-low p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-qbit-primary/10 text-qbit-primary">
                        <Icon name={row.icon} className="text-[22px]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-qbit-on-surface">
                          {row.name}
                        </p>
                        <p className="text-xs text-qbit-on-surface-variant">
                          {row.value}
                        </p>
                      </div>
                    </div>
                    <Icon
                      name="check_circle"
                      filled
                      className="text-[24px] text-qbit-secondary"
                    />
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Installation Notes & Recommendations */}
            <GlassCard className="p-6 md:p-8">
              <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold text-qbit-on-surface">
                <Icon name="edit_note" className="text-[24px] text-qbit-primary" />
                Installation Notes &amp; Recommendations
              </h3>
              <div className="overflow-hidden rounded-lg border border-qbit-outline-variant">
                {/* Toolbar */}
                <div className="flex items-center gap-1 border-b border-qbit-outline-variant bg-qbit-surface-container-low p-2">
                  {TOOLBAR_BUTTONS.slice(0, 3).map((btn) => (
                    <button
                      key={btn.icon}
                      type="button"
                      aria-label={btn.label}
                      title={btn.label}
                      className="rounded p-1 transition-colors hover:bg-qbit-surface-container-high"
                    >
                      <Icon
                        name={btn.icon}
                        className="text-[20px] text-qbit-on-surface-variant"
                      />
                    </button>
                  ))}
                  <div className="mx-1 h-5 w-px bg-qbit-outline-variant" />
                  {TOOLBAR_BUTTONS.slice(3).map((btn) => (
                    <button
                      key={btn.icon}
                      type="button"
                      aria-label={btn.label}
                      title={btn.label}
                      className="rounded p-1 transition-colors hover:bg-qbit-surface-container-high"
                    >
                      <Icon
                        name={btn.icon}
                        className="text-[20px] text-qbit-on-surface-variant"
                      />
                    </button>
                  ))}
                </div>
                {/* Editor */}
                <Textarea
                  rows={6}
                  placeholder="Describe the deployment environment, any specific challenges encountered, and maintenance recommendations for the client..."
                  className="resize-none rounded-none border-0 bg-transparent text-base text-qbit-on-surface shadow-none placeholder:text-qbit-outline/50 focus-visible:ring-0"
                />
              </div>
            </GlassCard>
          </div>

          {/* ----- Right Column (col-span-5) ----- */}
          <div className="space-y-6 lg:col-span-5">
            {/* Customer Feedback */}
            <GlassCard className="border-l-4 border-l-qbit-secondary p-6 md:p-8">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-qbit-on-surface">
                <Icon name="thumb_up" className="text-[24px] text-qbit-secondary" />
                Customer Feedback
              </h3>
              <p className="mb-6 text-sm text-qbit-on-surface-variant">
                Ask the client to rate the installation experience and
                professionalism of the engineering team.
              </p>
              <StarRating value={rating} onChange={setRating} />
              <Textarea
                rows={4}
                placeholder="Client comments (Optional)..."
                className="h-24 rounded-lg border-qbit-outline-variant bg-qbit-surface-container-lowest text-sm text-qbit-on-surface placeholder:text-qbit-outline/50 focus-visible:ring-1 focus-visible:ring-qbit-primary"
              />
            </GlassCard>

            {/* Digital Authorization */}
            <GlassCard className="p-6 md:p-8">
              <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold text-qbit-on-surface">
                <Icon name="draw" className="text-[24px] text-qbit-primary" />
                Digital Authorization
              </h3>
              <div className="grid grid-cols-1 gap-8">
                <SignaturePad
                  label="Engineer Signature (Alex Rivera)"
                  watermarkIcon="gesture"
                  ariaLabel="Engineer signature pad"
                />
                <SignaturePad
                  label="Customer Signature (James P. Harrison)"
                  watermarkIcon="signature"
                  ariaLabel="Customer signature pad"
                />
              </div>
            </GlassCard>

            {/* Final Action */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || isGenerated}
                className="flex w-full items-center justify-center gap-4 rounded-xl bg-qbit-primary-container py-6 text-xl font-semibold text-qbit-on-primary-container shadow-lg shadow-qbit-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isGenerating ? (
                  <>
                    <Icon
                      name="progress_activity"
                      className="animate-spin text-[24px]"
                    />
                    Generating...
                  </>
                ) : isGenerated ? (
                  <>
                    <Icon name="check_circle" className="text-[24px]" filled />
                    Report Generated
                  </>
                ) : (
                  <>
                    <Icon name="picture_as_pdf" className="text-[24px]" />
                    Generate Installation Report
                  </>
                )}
              </button>
              <p className="mt-4 text-center text-xs text-qbit-outline">
                Final report will be emailed to all stakeholders immediately upon
                generation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Success Modal                                                */}
      {/* ============================================================ */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent
          showCloseButton={false}
          className="glass-card max-w-md rounded-2xl border-qbit-outline-variant bg-white/95 p-8 shadow-2xl backdrop-blur-md"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-qbit-secondary-container/20 text-qbit-secondary">
              <Icon name="task_alt" filled className="text-[48px]" />
            </div>
            <DialogTitle className="mb-2 text-2xl font-semibold text-qbit-on-surface">
              Handover Complete
            </DialogTitle>
            <DialogDescription className="mb-8 text-base text-qbit-on-surface-variant">
              The installation report for WO-94281 has been generated and
              successfully uploaded to the central vault.
            </DialogDescription>
            <div className="flex w-full gap-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-qbit-outline-variant px-4 py-2 text-sm font-medium text-qbit-on-surface transition-colors hover:bg-qbit-surface-container-high"
              >
                View Report
              </button>
              <button
                type="button"
                onClick={handleDone}
                className="flex-1 rounded-lg bg-qbit-primary px-4 py-2 text-sm font-medium text-qbit-on-primary transition-opacity hover:opacity-90"
              >
                Done
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
