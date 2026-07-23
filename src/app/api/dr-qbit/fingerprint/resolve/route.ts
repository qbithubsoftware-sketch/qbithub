/**
 * API Route: POST /api/dr-qbit/fingerprint/resolve
 *
 * Universal Hardware Fingerprint resolution endpoint.
 *
 * This endpoint receives ALL collected hardware identifiers from a device scan,
 * generates a Hardware Fingerprint (SHA-256), detects duplicate serials,
 * and resolves the device identity using priority-based lookup.
 *
 * Request body: { identity: UniversalHardwareIdentity }
 * Response: { fingerprintResult, lookupResult, passport, action }
 *
 * Priority-based detection (NEVER depends only on Serial Number):
 *   1. Chip UID → 2. Factory UUID → 3. Ethernet MAC → 4. Bluetooth MAC
 *   5. USB Serial (check duplicates!) → 6. Device Instance ID → 7. Container ID
 *   8. Fingerprint hash (last resort)
 */

import { NextResponse } from "next/server";
import {
  generateHardwareFingerprint,
  lookupByFingerprint,
  updatePassportFingerprint,
  createPassportFromFingerprint,
  markDuplicateSerials,
} from "@/lib/drqbit/fingerprint-engine";
import type { UniversalHardwareIdentity } from "@/lib/drqbit/fingerprint-types";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identity: UniversalHardwareIdentity = body.identity ?? body;

    if (!identity) {
      return NextResponse.json(
        { error: "Missing hardware identity data" },
        { status: 400 },
      );
    }

    console.log("[DrQBIT Fingerprint API] Received identity with",
      Object.values(identity).filter((v) => v !== null && v !== "").length, "non-null fields");

    // Step 1: Generate Hardware Fingerprint
    const fingerprintResult = await generateHardwareFingerprint(identity);

    // Step 2: Lookup in database (priority-based)
    const lookupResult = await lookupByFingerprint(identity, fingerprintResult.fingerprintHash);

    // Step 3: Determine action
    let action: "open_profile" | "register_new" | "resolve_duplicate" = "register_new";
    let passportSummary: Record<string, unknown> | null = null;

    if (lookupResult.found && lookupResult.passportId) {
      // Device found — update fingerprint data on existing passport
      await updatePassportFingerprint(lookupResult.passportId, identity, fingerprintResult);

      // Get passport summary
      const passport = await db.devicePassport.findUnique({
        where: { id: lookupResult.passportId },
        select: {
          id: true,
          passportNumber: true,
          deviceUuid: true,
          hardwareFingerprint: true,
          fingerprintQuality: true,
          primaryIdentifier: true,
          duplicateSerialFlag: true,
          serialNumber: true,
          deviceName: true,
          manufacturer: true,
          model: true,
          vendorId: true,
          productIdCode: true,
          productCode: true,
          firmwareVersion: true,
          connectionType: true,
          deviceStatus: true,
          firstConnectedAt: true,
          lastConnectedAt: true,
          connectionCount: true,
          productId: true,
          customerAssetId: true,
          branchId: true,
          assignedEngineerId: true,
          product: {
            select: { id: true, name: true, model: true, deviceType: true, imageUrl: true },
          },
          warranty: {
            select: { id: true, warrantyStartDate: true, warrantyExpiryDate: true, warrantyStatus: true },
          },
        },
      });

      if (passport) {
        passportSummary = passport;
        action = "open_profile";

        if (lookupResult.duplicateSerialInfo && !lookupResult.duplicateSerialInfo.resolved) {
          action = "resolve_duplicate";
        }
      }
    } else if (lookupResult.duplicateSerialInfo && !lookupResult.duplicateSerialInfo.resolved) {
      action = "resolve_duplicate";
    } else {
      // New device — create passport from fingerprint data
      let matchedProductId: string | undefined;
      if (identity.vendorId && identity.productId) {
        const sig = await db.hardwareSignature.findFirst({
          where: {
            vendorId: identity.vendorId.toUpperCase(),
            productIdCode: identity.productId.toUpperCase(),
          },
          select: { productId: true },
        });
        matchedProductId = sig?.productId;
      }

      const createdPassport = await createPassportFromFingerprint(
        identity,
        fingerprintResult,
        matchedProductId,
      );

      passportSummary = {
        id: createdPassport.id,
        passportNumber: createdPassport.passportNumber,
        deviceUuid: createdPassport.deviceUuid,
        isNew: true,
      };
      action = "register_new";
    }

    // Mark duplicate serials if detected
    if (fingerprintResult.duplicateSerialDetected && identity.sdkSerialNumber) {
      await markDuplicateSerials(identity.sdkSerialNumber);
    }

    return NextResponse.json({
      fingerprintResult,
      lookupResult,
      passport: passportSummary,
      action,
    });
  } catch (error) {
    console.error("[DrQBIT Fingerprint API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fingerprint resolution failed" },
      { status: 500 },
    );
  }
}
