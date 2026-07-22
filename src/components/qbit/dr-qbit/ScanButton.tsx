"use client";

/**
 * ScanButton — triggers a device scan via the Desktop Companion Agent.
 *
 * PRODUCTION BEHAVIOR:
 *   - Attempts to connect to the QBIT Desktop Agent (local HTTP endpoint)
 *   - If agent is running: sends scan command, waits for real results
 *   - If agent is NOT running: shows clear message to download/install the agent
 *   - NO simulation, NO fake delay, NO dummy devices
 *
 * Architecture:
 *   The Desktop Agent runs as a local HTTP server on the user's Windows machine.
 *   It listens on http://localhost:53742 (configurable via DESKTOP_AGENT_PORT).
 *   When this button is clicked:
 *     1. Send POST to http://localhost:53742/scan (via fetch)
 *     2. Agent scans USB, COM, LAN, WiFi ports on the actual machine
 *     3. Agent sends results back as JSON
 *     4. This component forwards results to the QBIT Hub server
 *
 * If the agent is not available (fetch fails), show a clear message:
 *   "QBIT Desktop Agent is not running. Please install and start the agent to scan hardware."
 *
 * Reuses QbitButton + Icon.
 */

import { useState } from "react";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useToast } from "@/hooks/use-toast";

/** Desktop Agent local API port (default) */
const DESKTOP_AGENT_PORT = 53742;
const DESKTOP_AGENT_BASE = `http://localhost:${DESKTOP_AGENT_PORT}`;

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
      title: "Connecting to Desktop Agent…",
      description: "Attempting to reach the QBIT Desktop Agent on your machine.",
    });

    try {
      // Step 1: Check if Desktop Agent is available
      const healthCheck = await fetch(`${DESKTOP_AGENT_BASE}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(3000), // 3-second timeout
      }).catch(() => null);

      if (!healthCheck?.ok) {
        // Desktop Agent is not running
        toast({
          title: "Desktop Agent not available",
          description: "The QBIT Desktop Agent is not running on this machine. Please install and start the agent to scan USB, COM, LAN, and WiFi devices.",
          variant: "destructive",
          duration: 10000,
        });
        setScanning(false);
        return;
      }

      // Step 2: Send scan command to Desktop Agent
      toast({
        title: "Scanning hardware…",
        description: "Desktop Agent is scanning USB, COM, LAN, and WiFi ports.",
      });

      const scanRes = await fetch(`${DESKTOP_AGENT_BASE}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workOrderId: workOrderId ?? null,
          // The agent authenticates with the server using its shared secret
          // The browser just triggers the scan; the agent posts results directly
          // to /api/dr-qbit/scan on its own
        }),
        signal: AbortSignal.timeout(60000), // 60-second timeout for full scan
      });

      if (!scanRes.ok) {
        const err = await scanRes.json().catch(() => ({ error: "Scan failed" }));
        toast({
          title: "Agent scan failed",
          description: err.error ?? "The Desktop Agent encountered an error during scanning.",
          variant: "destructive",
        });
        setScanning(false);
        return;
      }

      const result = await scanRes.json();

      // Step 3: Agent has completed the scan and sent results to the server
      toast({
        title: "Scan complete",
        description: `Desktop Agent found ${result.deviceCount ?? 0} device(s). Refresh the device list to see results.`,
      });

      onScanComplete?.();
    } catch (e) {
      // Network error — agent not reachable
      if (e instanceof TypeError && e.message.includes("fetch")) {
        toast({
          title: "Desktop Agent not available",
          description: "Cannot reach the QBIT Desktop Agent. Please ensure it is installed and running on this machine. Download it from the QBIT Hub portal.",
          variant: "destructive",
          duration: 10000,
        });
      } else {
        toast({
          title: "Scan failed",
          description: e instanceof Error ? e.message : "An unexpected error occurred during scanning.",
          variant: "destructive",
        });
      }
    } finally {
      setScanning(false);
    }
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
          {scanning ? "Scanning…" : "Scan via Desktop Agent"}
        </p>
        <p className="text-xs text-qbit-on-surface-variant">
          {scanning ? "Connecting to local Desktop Agent…" : "Requires QBIT Desktop Agent (.exe)"}
        </p>
      </div>
    </div>
  );
}
