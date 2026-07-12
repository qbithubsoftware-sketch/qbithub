"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useTour } from "@/lib/tour/tour-context";

/**
 * WelcomeScreen — shown to first-time users after login.
 *
 * Offers three options:
 * 1. Start Tour — begins the guided walkthrough
 * 2. Skip Tour — dismisses and marks as completed
 * 3. Watch Overview Video — opens a YouTube onboarding video
 */
export function WelcomeScreen() {
  const { showWelcome, startTour, skipTour } = useTour();

  if (!showWelcome) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-qbit-fade-in p-4">
      <div className="bg-qbit-surface-container-lowest rounded-2xl shadow-2xl border border-qbit-outline-variant/50 w-full max-w-lg overflow-hidden animate-qbit-scale-in">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-qbit-primary to-qbit-primary-container p-8 text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm mb-4">
            <Icon name="bolt" className="text-[32px] text-white" filled />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to QBIT Hub</h2>
          <p className="text-sm text-qbit-on-primary-container/85 max-w-sm mx-auto leading-relaxed">
            Your enterprise control center for installation workflows, driver management, knowledge base, and AI-powered support.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-qbit-on-surface-variant text-center">
            Take a quick 10-minute tour to learn the key features, or skip and explore on your own.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <QbitButton variant="primary" size="lg" fullWidth icon="play_circle" onClick={startTour}>
              Start Guided Tour
            </QbitButton>
            <div className="flex gap-2">
              <QbitButton
                variant="outline"
                size="md"
                fullWidth
                icon="videocam"
                onClick={() => window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "_blank", "noopener,noreferrer")}
              >
                Watch Overview Video
              </QbitButton>
              <QbitButton variant="ghost" size="md" fullWidth icon="skip_next" onClick={skipTour}>
                Skip for Now
              </QbitButton>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-qbit-outline-variant/40">
            {[
              { icon: "inventory_2", label: "Products" },
              { icon: "download", label: "Downloads" },
              { icon: "smart_toy", label: "AI Assistant" },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-1 text-center">
                <Icon name={f.icon} className="text-[20px] text-qbit-primary" />
                <span className="text-[10px] font-medium text-qbit-on-surface-variant">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
