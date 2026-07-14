"use client";

/**
 * ScanButton — triggers a device scan (via Desktop Agent) with animation.
 *
 * In production, this button sends a message to the Desktop Companion Agent
 * (via WebSocket or postMessage to the agent's local API). For demo purposes,
 * it shows a scanning animation and allows manual scan result entry.
 *
 * Reuses QbitButton + Icon.
 */

import { useState } from "react";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useToast } from "@/hooks/use-toast";

interface ScanButtonProps {
  onScanComplete?: () => void;
  /** Optional: workOrderId to associate with the scan. */
  workOrderId?: string;
}

export function ScanButton({ onScanComplete, workOrderId }: ScanButtonProps) {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);

  const handleScan = async () => {
    setScanning(true);
    toast({
      title: "Scanning for devices…",
      description: "Desktop Agent is scanning USB, COM, LAN, and WiFi ports.",
    });

    // In production: send a message to the Desktop Agent (WebSocket/local API)
    // For demo: simulate a scan delay, then notify
    setTimeout(() => {
      setScanning(false);
      toast({
        title: "Scan complete",
        description: "Refresh the device list to see newly detected devices.",
      });
      onScanComplete?.();
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {scanning ? (
        <div className="relative flex h-24 w-24 items-center justify-center">
          {/* Pulsing radar animation */}
          <div className="absolute inset-0 animate-ping rounded-full bg-qbit-primary/20" />
          <div className="absolute inset-2 animate-pulse rounded-full bg-qbit-primary/30" />
          <Icon name="radar" className="relative text-[40px] text-qbit-primary animate-spin" style={{ animationDuration: "2s" }} filled />
        </div>
      ) : (
        <button
          type="button"
          onClick={handleScan}
          className="group flex h-24 w-24 items-center justify-center rounded-full bg-qbit-primary text-qbit-on-primary shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
        >
          <Icon name="qr_code_scanner" className="text-[40px] transition-transform group-hover:scale-110" filled />
        </button>
      )}
      <div className="text-center">
        <p className="text-sm font-semibold text-qbit-on-surface">
          {scanning ? "Scanning…" : "Scan Devices"}
        </p>
        <p className="text-xs text-qbit-on-surface-variant">
          {scanning ? "Discovering USB, COM, LAN, WiFi" : "Tap to detect connected hardware"}
        </p>
      </div>
    </div>
  );
}
