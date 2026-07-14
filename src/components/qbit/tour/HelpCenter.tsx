"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KEYBOARD_SHORTCUTS, QUICK_START_GUIDE } from "@/lib/tour/tour-steps";
import { useTour } from "@/lib/tour/tour-context";

/**
 * HelpCenter — a floating help button that opens a dialog with:
 * - Quick Start Guide
 * - Keyboard Shortcuts
 * - Restart Tour
 * - Contact Support
 */
export function HelpCenter() {
  const [open, setOpen] = useState(false);
  const { restartTour, hasCompleted } = useTour();

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Help & Support"
        title="Help & Support"
        className="fixed bottom-6 left-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-qbit-surface-container-lowest border border-qbit-outline-variant/50 text-qbit-on-surface-variant shadow-lg hover:shadow-xl hover:text-qbit-primary hover:border-qbit-primary/30 transition-all duration-200 active:scale-95"
      >
        <Icon name="help" className="text-[22px]" />
      </button>

      {/* Help Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="p-5 border-b border-qbit-outline-variant/40">
            <DialogTitle className="text-base font-semibold text-qbit-on-surface flex items-center gap-2">
              <Icon name="help" className="text-[20px] text-qbit-primary" />
              Help & Support
            </DialogTitle>
          </DialogHeader>

          <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {/* Restart Tour */}
            {hasCompleted && (
              <div className="rounded-xl bg-qbit-primary/5 border border-qbit-primary/20 p-4">
                <div className="flex items-start gap-3">
                  <Icon name="school" className="text-[20px] text-qbit-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-qbit-on-surface">New here? Take the tour.</p>
                    <p className="text-xs text-qbit-on-surface-variant mt-0.5">
                      Learn every module in 10 minutes with our guided walkthrough.
                    </p>
                  </div>
                  <QbitButton size="sm" variant="primary" icon="play_circle" onClick={() => { restartTour(); setOpen(false); }}>
                    Start
                  </QbitButton>
                </div>
              </div>
            )}

            {/* Quick Start Guide */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant mb-2">Quick Start</h4>
              <div className="space-y-2">
                {QUICK_START_GUIDE.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
                      <Icon name={item.icon} className="text-[16px]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-qbit-on-surface">{item.title}</p>
                      <p className="text-[11px] text-qbit-on-surface-variant">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant mb-2">Keyboard Shortcuts</h4>
              <div className="space-y-1.5">
                {KEYBOARD_SHORTCUTS.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-qbit-on-surface-variant">{s.description}</span>
                    <kbd className="rounded border border-qbit-outline-variant bg-qbit-surface-container-low px-2 py-0.5 text-[10px] font-bold text-qbit-on-surface-variant">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Support */}
            <div className="pt-3 border-t border-qbit-outline-variant/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant mb-2">Contact Support</h4>
              <div className="flex flex-wrap gap-2">
                <a href="mailto:support@qbithub.io" className="inline-flex items-center gap-1.5 text-xs font-semibold text-qbit-primary hover:underline">
                  <Icon name="mail" className="text-[14px]" /> support@qbithub.io
                </a>
                <a href="https://wa.me/15551002000" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-qbit-primary hover:underline">
                  <Icon name="chat" className="text-[14px]" /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
