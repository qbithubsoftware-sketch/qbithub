"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * PublicDrQbitClient — interactive two-option card for the public /dr-qbit page.
 *
 * Option 1: Auto Detect Hardware — links to the WebUSB scanner (the existing
 *   WebUsbScanner component is mounted inside /portal; for the public portal
 *   we offer a "Launch Scanner" button that opens /portal in a new tab where
 *   the Zustand app shell handles WebUSB).
 *
 * Option 2: Manual Model Search — text input that navigates to
 *   /products?search=<model> on submit.
 */

const EXAMPLE_MODELS_DEFAULT = ["T800", "BS550", "LD300", "CD200"];

export function PublicDrQbitClient({ exampleModels = EXAMPLE_MODELS_DEFAULT }: { exampleModels?: string[] }) {
  const router = useRouter();
  const [modelInput, setModelInput] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (modelInput.trim()) {
      router.push(`/products?search=${encodeURIComponent(modelInput.trim())}`);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Option 1: Auto Detect */}
      <div className="rounded-2xl border border-qbit-outline-variant bg-white p-6 shadow-sm md:p-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-qbit-primary/10 text-qbit-primary">
            <span className="material-symbols-outlined text-[28px]">memory</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-qbit-on-surface">Auto Detect Hardware</h2>
            <p className="text-xs text-qbit-on-surface-variant">Via Desktop Agent / WebUSB</p>
          </div>
        </div>
        <p className="text-sm text-qbit-on-surface-variant mb-6">
          Connect your QBIT device via USB and let Dr. QBIT scan it automatically.
          Identifies the model, fetches the right driver + firmware + manual, and
          checks warranty status.
        </p>
        <ul className="mb-6 space-y-2 text-xs text-qbit-on-surface-variant">
          {[
            "Detects USB VID/PID automatically",
            "Reads serial number for warranty lookup",
            "One-click driver + firmware install",
            "Works in Chrome / Edge browsers",
          ].map((feat) => (
            <li key={feat} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-qbit-success">check_circle</span>
              {feat}
            </li>
          ))}
        </ul>
        <a
          href="/portal"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-qbit-primary px-5 py-3 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">play_arrow</span>
          Launch Scanner
        </a>
      </div>

      {/* Option 2: Manual Search */}
      <div className="rounded-2xl border border-qbit-outline-variant bg-white p-6 shadow-sm md:p-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-qbit-secondary/10 text-qbit-secondary">
            <span className="material-symbols-outlined text-[28px]">search</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-qbit-on-surface">Enter Model Number</h2>
            <p className="text-xs text-qbit-on-surface-variant">Manual search</p>
          </div>
        </div>
        <p className="text-sm text-qbit-on-surface-variant mb-4">
          Know your model number? Type it below to jump straight to the product
          page with all drivers, firmware, and manuals.
        </p>
        <form onSubmit={handleSearch} className="relative mb-4">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-qbit-on-surface-variant">search</span>
          <input
            type="text"
            value={modelInput}
            onChange={(e) => setModelInput(e.target.value)}
            placeholder="e.g. T800, BS550, LD300…"
            className="w-full rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-lowest py-3 pl-12 pr-4 text-sm text-qbit-on-surface focus:border-qbit-primary focus:outline-none focus:ring-2 focus:ring-qbit-primary/30"
            autoFocus
          />
        </form>
        <div className="mb-6">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Try:</p>
          <div className="flex flex-wrap gap-2">
            {exampleModels.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModelInput(m)}
                className="rounded-md border border-dashed border-qbit-outline-variant px-3 py-1 text-xs font-mono text-qbit-on-surface-variant hover:border-qbit-primary hover:text-qbit-primary transition-colors"
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={handleSearch as never}
          disabled={!modelInput.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-qbit-outline-variant px-5 py-3 text-sm font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          Search Products
        </button>
      </div>
    </div>
  );
}
