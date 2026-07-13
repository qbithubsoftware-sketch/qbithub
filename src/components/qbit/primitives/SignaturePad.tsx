"use client";

/**
 * SignaturePad — reusable digital signature canvas.
 *
 * Lifted from JobCompletionHandoverPage.tsx to make it available to every
 * FSM completion flow. Supports mouse + touch input, DPR-aware rendering,
 * clear button, and exposes a ref to read the PNG data URL.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

export interface SignaturePadHandle {
  /** Returns the signature as a PNG data URL, or null if empty. */
  toDataURL: () => string | null;
  /** Clears the canvas. */
  clear: () => void;
  /** Returns true if the canvas has any strokes. */
  isEmpty: () => boolean;
}

interface SignaturePadProps {
  className?: string;
  /** Watermark icon shown faded behind the signature. */
  watermarkIcon?: string;
  /** Pen colour. */
  penColor?: string;
  /** Background colour. */
  backgroundColor?: string;
  /** Disabled state — pointer events ignored. */
  disabled?: boolean;
  /** Fires when the user starts/strokes/clears. */
  onChange?: (hasInk: boolean) => void;
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad(
    {
      className,
      watermarkIcon = "signature",
      penColor = "#141b2b",
      backgroundColor = "#ffffff",
      disabled = false,
      onChange,
    },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);
    const hasInk = useRef(false);
    const [isEmpty, setIsEmpty] = useState(true);

    const getCtx = () => canvasRef.current?.getContext("2d") ?? null;

    // DPR-aware canvas sizing
    const resizeCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = getCtx();
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2;
      ctx.strokeStyle = penColor;
    }, [backgroundColor, penColor]);

    useEffect(() => {
      resizeCanvas();
      const onResize = () => resizeCanvas();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, [resizeCanvas]);

    const getPoint = (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handlePointerDown = (e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);
      drawing.current = true;
      lastPoint.current = getPoint(e);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
      if (!drawing.current || disabled) return;
      e.preventDefault();
      const ctx = getCtx();
      const last = lastPoint.current;
      if (!ctx || !last) return;
      const pt = getPoint(e);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      lastPoint.current = pt;
      if (!hasInk.current) {
        hasInk.current = true;
        setIsEmpty(false);
        onChange?.(true);
      }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
      if (!drawing.current) return;
      drawing.current = false;
      lastPoint.current = null;
      const canvas = canvasRef.current;
      if (canvas) {
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
    };

    const clear = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = getCtx();
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, rect.width, rect.height);
      hasInk.current = false;
      setIsEmpty(true);
      onChange?.(false);
    }, [backgroundColor, onChange]);

    const toDataURL = useCallback(() => {
      if (!hasInk.current) return null;
      return canvasRef.current?.toDataURL("image/png") ?? null;
    }, []);

    const checkEmpty = useCallback(() => !hasInk.current, []);

    useImperativeHandle(
      ref,
      () => ({
        toDataURL,
        clear,
        isEmpty: checkEmpty,
      }),
      [toDataURL, clear, checkEmpty],
    );

    return (
      <div className={cn("relative", className)}>
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="h-full w-full touch-none rounded-lg border border-qbit-outline-variant bg-white"
          style={{ cursor: disabled ? "not-allowed" : "crosshair" }}
          aria-label="Signature input canvas"
        />
        {/* Watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {isEmpty && (
            <div className="flex flex-col items-center gap-1 text-qbit-on-surface-variant/30">
              <Icon name={watermarkIcon} className="text-[64px]" />
              <span className="text-xs font-medium">Sign here</span>
            </div>
          )}
        </div>
        {/* Clear button */}
        <button
          type="button"
          onClick={clear}
          disabled={disabled || isEmpty}
          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-qbit-on-surface-variant shadow-sm transition-colors hover:bg-white hover:text-qbit-error disabled:opacity-30"
          aria-label="Clear signature"
        >
          <Icon name="close" className="text-[16px]" />
        </button>
      </div>
    );
  },
);
