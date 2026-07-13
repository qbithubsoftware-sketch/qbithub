/**
 * Compatibility checker — validates that a firmware release is safe to
 * install on a specific device.
 *
 * SAFETY: This is the gatekeeper. If compatibility check fails, the firmware
 * download/update is BLOCKED. Never bypass this check.
 *
 * Checks:
 *   1. Device model must be in release.supportedModels
 *   2. Hardware ID must match release.supportedHardwareIds (if specified)
 *   3. VID + PID must match FirmwareCompatibility record (if exists)
 *   4. Product must match (if release is product-specific)
 */

import { db } from "@/lib/db";
import type { CompatibilityResult } from "./types";

interface CompatibilityCheckArgs {
  passportId: string;
  firmwareReleaseId: string;
}

/**
 * Checks whether a firmware release is compatible with a device passport.
 * Returns a detailed result with reasons + warnings.
 */
export async function checkCompatibility(args: CompatibilityCheckArgs): Promise<CompatibilityResult> {
  const passport = await db.devicePassport.findUnique({
    where: { id: args.passportId },
    include: { product: true },
  });

  if (!passport) {
    return {
      isCompatible: false,
      reasons: ["Device passport not found"],
      warnings: [],
      blocked: true,
    };
  }

  const release = await db.firmwareRelease.findUnique({
    where: { id: args.firmwareReleaseId },
    include: {
      firmware: true,
      compatibility: true,
    },
  });

  if (!release) {
    return {
      isCompatible: false,
      reasons: ["Firmware release not found"],
      warnings: [],
      blocked: true,
    };
  }

  const reasons: string[] = [];
  const warnings: string[] = [];

  // 1. Check device model is in supportedModels
  const supportedModels = release.supportedModels
    ? (JSON.parse(release.supportedModels) as string[])
    : [];
  if (supportedModels.length > 0 && passport.model) {
    if (!supportedModels.includes(passport.model)) {
      reasons.push(
        `Device model "${passport.model}" is not in supported models: ${supportedModels.join(", ")}`,
      );
    }
  }

  // 2. Check hardware ID pattern (if specified)
  if (release.supportedHardwareIds && passport.hardwareId) {
    const patterns = JSON.parse(release.supportedHardwareIds) as string[];
    const matches = patterns.some((pattern) => {
      try {
        const regex = new RegExp(pattern, "i");
        return regex.test(passport.hardwareId!);
      } catch {
        // If pattern is not a valid regex, do glob match
        return passport.hardwareId!.toLowerCase().includes(pattern.toLowerCase());
      }
    });
    if (!matches) {
      reasons.push(
        `Hardware ID "${passport.hardwareId}" does not match any supported pattern`,
      );
    }
  }

  // 3. Check FirmwareCompatibility records (VID/PID constraint)
  if (passport.vendorId && passport.productIdCode) {
    const compatRecord = release.compatibility.find(
      (c) =>
        c.vendorId?.toUpperCase() === passport.vendorId?.toUpperCase() &&
        c.productIdCode?.toUpperCase() === passport.productIdCode?.toUpperCase(),
    );
    if (compatRecord && !compatRecord.isCompatible) {
      reasons.push(
        `VID ${passport.vendorId} + PID ${passport.productIdCode} is explicitly marked incompatible`,
      );
    }
    if (compatRecord?.notes) {
      warnings.push(compatRecord.notes);
    }
  }

  // 4. Check product match (if release is product-specific)
  if (passport.product && release.firmware.productId) {
    if (release.firmware.productId !== passport.productId) {
      reasons.push(
        `Firmware is for product ID ${release.firmware.productId}, but device is linked to product ID ${passport.productId ?? "none"}`,
      );
    }
  }

  // 5. Check minimum OS version (if specified)
  if (release.minOsVersion && passport.osInfo) {
    warnings.push(
      `Requires minimum OS version ${release.minOsVersion}. Device OS: ${passport.osInfo}. Please verify compatibility manually.`,
    );
  }

  // 6. Warning for beta/unstable releases
  if (!release.isStable) {
    warnings.push("This is a beta/unstable firmware release. Install with caution.");
  }

  // 7. Warning for critical updates
  if (release.isCritical) {
    warnings.push("This is a critical firmware update. Please install as soon as possible.");
  }

  const isCompatible = reasons.length === 0;
  const blocked = !isCompatible;

  return {
    isCompatible,
    reasons,
    warnings,
    blocked,
  };
}
