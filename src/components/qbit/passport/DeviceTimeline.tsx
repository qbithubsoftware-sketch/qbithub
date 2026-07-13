"use client";

/**
 * DeviceTimeline — passport timeline (first detected, last scanned, driver updates, etc.)
 *
 * Reuses TimelineStep primitive.
 */

import { TimelineStep } from "@/components/qbit/primitives/TimelineStep";
import { type PassportDTO } from "@/lib/passport/types";

interface DeviceTimelineProps {
  passport: PassportDTO;
}

export function DeviceTimeline({ passport }: DeviceTimelineProps) {
  const events: Array<{
    icon: string;
    title: string;
    description: string | null;
    meta: string | null;
    status: "completed" | "active" | "pending";
  }> = [];

  // First detected
  events.push({
    icon: "qr_code_scanner",
    title: "First Detected",
    description: `Device passport created as ${passport.passportNumber}`,
    meta: new Date(passport.firstDetectedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    status: "completed",
  });

  // Last scanned
  if (passport.lastScannedAt) {
    events.push({
      icon: "radar",
      title: "Last Scanned",
      description: "Dr. QBIT device scan completed",
      meta: new Date(passport.lastScannedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      status: "completed",
    });
  }

  // Last driver update
  if (passport.lastDriverUpdateAt) {
    events.push({
      icon: "settings_input_component",
      title: "Last Driver Update",
      description: passport.driverInfo?.installedDriverVersion
        ? `Driver v${passport.driverInfo.installedDriverVersion} installed`
        : "Driver updated",
      meta: new Date(passport.lastDriverUpdateAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      status: "completed",
    });
  }

  // Last firmware update
  if (passport.lastFirmwareUpdateAt) {
    events.push({
      icon: "system_update",
      title: "Last Firmware Update",
      description: "Firmware updated on this device",
      meta: new Date(passport.lastFirmwareUpdateAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      status: "completed",
    });
  }

  // Last installation
  if (passport.lastInstallationAt) {
    events.push({
      icon: "build_circle",
      title: "Last Installation",
      description: "Device installed at customer site",
      meta: new Date(passport.lastInstallationAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      status: "completed",
    });
  }

  // Last service
  if (passport.lastServiceAt) {
    events.push({
      icon: "home_repair_service",
      title: "Last Service",
      description: "Service visit performed",
      meta: new Date(passport.lastServiceAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      status: "completed",
    });
  }

  // Driver history events
  for (const h of passport.driverHistory.slice(0, 5)) {
    events.push({
      icon: h.eventType === "install" ? "download" : h.eventType === "update" ? "upgrade" : h.eventType === "rollback" ? "undo" : "history",
      title: h.eventType.charAt(0).toUpperCase() + h.eventType.slice(1),
      description: h.notes ?? (h.newVersion ? `Version ${h.newVersion}` : null),
      meta: new Date(h.occurredAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      status: "completed",
    });
  }

  // Mark last event as isLast
  if (events.length > 0) {
    return (
      <div>
        {events.map((e, idx) => (
          <TimelineStep
            key={idx}
            icon={e.icon}
            title={e.title}
            description={e.description ?? undefined}
            meta={e.meta ?? undefined}
            status={e.status}
            isLast={idx === events.length - 1}
          />
        ))}
      </div>
    );
  }

  return <p className="text-sm text-qbit-on-surface-variant">No timeline events yet.</p>;
}
