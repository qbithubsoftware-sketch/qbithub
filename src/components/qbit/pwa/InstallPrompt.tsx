"use client";

/**
 * InstallPrompt — PWA install banner shown when beforeinstallprompt fires.
 *
 * Reuses Icon + QbitButton + useInstallPrompt hook.
 */

import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useInstallPrompt } from "@/lib/pwa/hooks";

export function InstallPrompt() {
  const { canInstall, promptInstall, installed } = useInstallPrompt();

  if (installed || !canInstall) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-qbit-primary/30 bg-qbit-primary-fixed/30 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Icon name="install_mobile" className="text-[20px] text-qbit-primary" filled />
        <div>
          <p className="text-xs font-semibold text-qbit-on-surface">Install QBIT Engineer App</p>
          <p className="text-[10px] text-qbit-on-surface-variant">
            Add to home screen for full-screen mobile experience
          </p>
        </div>
      </div>
      <QbitButton
        variant="primary"
        size="sm"
        icon="download"
        onClick={() => void promptInstall()}
      >
        Install
      </QbitButton>
    </div>
  );
}
