/**
 * API Route: POST /api/dr-qbit/fingerprint/lookup
 *
 * Lookup a device in the database by its Universal Hardware Fingerprint.
 *
 * This endpoint performs a priority-based search using ALL available
 * identifiers (Chip UID, Factory UUID, MACs, Serial, Device Instance ID,
 * Container ID, Fingerprint hash).
 *
 * Request body: { identity: UniversalHardwareIdentity }
 * Response: { lookupResult: FingerprintLookupResult, passportSummary (if found) }
 *
 * The lookup NEVER depends only on Serial Number. If serial is duplicated,
 * it uses the Hardware Fingerprint to resolve which physical device this is.
 */

import { NextResponse } from "next/server";
import {
  generateHardwareFingerprint,
  lookupByFingerprint,
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

    // Generate fingerprint hash
    const fingerprintResult = await generateHardwareFingerprint(identity);

    // Priority-based lookup
    const lookupResult = await lookupByFingerprint(identity, fingerprintResult.fingerprintHash);

    // If found, get passport summary
    let passportSummary: Record<string, unknown> | null = null;
    if (lookupResult.found && lookupResult.passportId) {
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
          product: {
            select: { id: true, name: true, model: true, deviceType: true, imageUrl: true },
          },
          warranty: {
            select: { id: true, warrantyStartDate: true, warrantyExpiryDate: true, warrantyStatus: true },
          },
        },
      });
      passportSummary = passport;
    }

    return NextResponse.json({
      fingerprint: {
        hash: fingerprintResult.fingerprintHash,
        deviceUuid: fingerprintResult.deviceUuid,
        quality: fingerprintResult.quality,
        primaryIdentifier: fingerprintResult.primaryIdentifier,
        duplicateSerialDetected: fingerprintResult.duplicateSerialDetected,
        identifierCount: fingerprintResult.identifierCount,
        usedIdentifiers: fingerprintResult.usedIdentifiers,
      },
      lookupResult,
      passport: passportSummary,
    });
  } catch (error) {
    console.error("[DrQBIT Fingerprint Lookup API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fingerprint lookup failed" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/dr-qbit/fingerprint/lookup
 *
 * Quick lookup by a single identifier (e.g. serial number, chip UID, MAC address).
 *
 * Query params:
 *   - serial: serial number
 *   - chipUid: chip UID
 *   - mac: MAC address (ethernet or bluetooth)
 *   - fingerprint: fingerprint hash
 *   - deviceInstanceId: USB Device Instance ID
 *   - containerId: USB Container ID
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const serial = searchParams.get("serial");
    const chipUid = searchParams.get("chipUid");
    const mac = searchParams.get("mac");
    const fingerprint = searchParams.get("fingerprint");
    const deviceInstanceId = searchParams.get("deviceInstanceId");
    const containerId = searchParams.get("containerId");

    // Priority-based single-key lookup
    let passport: Record<string, unknown> | null = null;

    // 1. Chip UID (highest priority)
    if (chipUid) {
      passport = await db.devicePassport.findFirst({
        where: { chipUid },
        select: PASSPORT_LOOKUP_SELECT,
      });
    }

    // 2. Fingerprint hash
    if (!passport && fingerprint) {
      passport = await db.devicePassport.findFirst({
        where: { hardwareFingerprint: fingerprint },
        select: PASSPORT_LOOKUP_SELECT,
      });
    }

    // 3. MAC address (check ethernet and bluetooth)
    if (!passport && mac) {
      passport = await db.devicePassport.findFirst({
        where: {
          OR: [
            { ethernetMacAddress: mac },
            { bluetoothMacAddress: mac },
            { wifiMacAddress: mac },
          ],
        },
        select: PASSPORT_LOOKUP_SELECT,
      });
    }

    // 4. USB Device Instance ID
    if (!passport && deviceInstanceId) {
      passport = await db.devicePassport.findFirst({
        where: { usbDeviceInstanceId: deviceInstanceId },
        select: PASSPORT_LOOKUP_SELECT,
      });
    }

    // 5. Container ID
    if (!passport && containerId) {
      passport = await db.devicePassport.findFirst({
        where: { usbContainerId: containerId },
        select: PASSPORT_LOOKUP_SELECT,
      });
    }

    // 6. Serial Number (lowest priority — check duplicates!)
    if (!passport && serial) {
      const passports = await db.devicePassport.findMany({
        where: { serialNumber: serial },
        select: PASSPORT_LOOKUP_SELECT,
      });

      if (passports.length === 1) {
        passport = passports[0];
      } else if (passports.length > 1) {
        // Duplicate serial — return conflict info
        return NextResponse.json({
          found: true,
          duplicateSerial: true,
          conflictCount: passports.length,
          passports: passports,
          message: "Multiple devices share this serial number. Use Hardware Fingerprint for unique identification.",
        });
      }
    }

    if (!passport) {
      return NextResponse.json({
        found: false,
        isNewDevice: true,
        message: "No matching device found. This device may need registration.",
      });
    }

    return NextResponse.json({
      found: true,
      duplicateSerial: false,
      passport,
    });
  } catch (error) {
    console.error("[DrQBIT Fingerprint Lookup API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lookup failed" },
      { status: 500 },
    );
  }
}

const PASSPORT_LOOKUP_SELECT = {
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
  chipUid: true,
  factoryDeviceUuid: true,
  ethernetMacAddress: true,
  bluetoothMacAddress: true,
  usbDeviceInstanceId: true,
  usbContainerId: true,
  product: {
    select: { id: true, name: true, model: true, deviceType: true, imageUrl: true },
  },
  warranty: {
    select: { id: true, startDate: true, endDate: true, status: true },
  },
};
