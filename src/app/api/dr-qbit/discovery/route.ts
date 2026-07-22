/**
 * POST /api/dr-qbit/discovery — Unified Discovery Endpoint (Phase 1 + Phase 2)
 *
 * Receives browser-discovered devices from the DiscoveryScanner component.
 * Handles ALL connection types: USB, Bluetooth, and LAN (via Desktop Agent).
 *
 * This endpoint:
 *   1. Creates a ScanSession record
 *   2. For each device, attempts matching against HardwareSignature + QbitProduct
 *   3. Creates DetectedDevice (matched) or UnknownDevice (unmatched) rows
 *   4. For matched devices, creates/updates DevicePassport + DriverInfo + FirmwareInfo
 *   5. Enriches device data with Phase 2 identification (firmware, hardware revision, capabilities)
 *   6. Returns full device info with match status, driver/firmware suggestions, + DeviceProfile
 *
 * NO dummy data, NO simulated devices, NO fake serial numbers.
 * Only processes real devices discovered by the browser/agent.
 *
 * Authentication: Requires staff session (engineer/admin).
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/notifications/auth";
import { matchDevice } from "@/lib/drqbit/device-matcher";
import {
  type RawDetectedDevice,
  type DeviceConnection,
  type DeviceType,
  type DeviceCapability,
  type IdentificationStatus,
} from "@/lib/drqbit/types";
import { randomBytes } from "node:crypto";

export async function POST(req: NextRequest) {
  // Authenticate — only staff can submit discovery results
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body?.devices || !Array.isArray(body.devices)) {
      return NextResponse.json({ error: "Missing 'devices' array" }, { status: 400 });
    }

    // Generate session token
    const sessionToken = randomBytes(16).toString("hex");

    // Create scan session
    const scanSession = await db.scanSession.create({
      data: {
        sessionToken,
        engineerId: session.user.id,
        engineerName: session.user.name ?? "Engineer",
        agentVersion: "web-discovery-1.0",
        osInfo: "Browser Discovery Engine",
        hostname: "browser",
        status: "completed",
        completedAt: new Date(),
      },
    });

    // Count devices per connection type
    let usbCount = 0;
    let comCount = 0;
    let lanCount = 0;
    let wifiCount = 0;
    let bluetoothCount = 0;

    // Process each discovered device
    const results: Array<{
      id: string;
      passportNumber: string | null;
      connectionType: string;
      port: string | null;
      deviceName: string;
      manufacturer: string | null;
      vendorId: string | null;
      productId: string | null;
      serialNumber: string | null;
      matched: boolean;
      matchedProductName: string | null;
      matchedProductModel: string | null;
      matchedProductBrand: string | null;
      matchConfidence: number | null;
      matchMethod: string | null;
      driverStatus: string | null;
      firmwareStatus: string | null;
      driverUpdateAvailable: boolean;
      firmwareUpdateAvailable: boolean;
      driverDownloadUrl: string | null;
      manualUrl: string | null;
      knowledgeBaseUrl: string | null;
      /** Phase 2: Device Profile with full identification data */
      deviceProfile: {
        deviceType: DeviceType | null;
        identificationStatus: IdentificationStatus;
        model: string | null;
        firmwareVersion: string | null;
        hardwareRevision: string | null;
        capabilities: DeviceCapability[];
        serialSource: string | null;
        modelSource: string | null;
        fingerprintHash: string | null;
        identificationErrors: Array<{ step: string; message: string; recoverable: boolean }>;
      } | null;
    }> = [];

    let matchedCount = 0;
    let unknownCount = 0;

    for (const raw of body.devices) {
      const connectionType = (raw.connectionType ?? "usb") as DeviceConnection;

      // Count per type
      if (connectionType === "usb") usbCount++;
      else if (connectionType === "com") comCount++;
      else if (connectionType === "lan") lanCount++;
      else if (connectionType === "wifi") wifiCount++;
      else if (connectionType === "bluetooth") bluetoothCount++;

      // Convert to RawDetectedDevice for matching
      // Note: RawDetectedDevice uses optional fields (string | undefined),
      // not nullable (string | null). Convert null → undefined.
      // Phase 2 enrichment fields (firmwareVersion, hardwareRevision, etc.)
      // come from the client-side Identification Engine.
      const rawDevice: RawDetectedDevice = {
        connectionType,
        port: raw.port ?? undefined,
        deviceName: raw.deviceName ?? "Unknown Device",
        manufacturer: raw.manufacturer ?? undefined,
        brand: undefined,
        model: undefined,
        hardwareId: raw.hardwareId ?? undefined,
        vendorId: raw.vendorId?.replace("0x", "").toUpperCase() ?? undefined,
        productIdCode: raw.productId?.replace("0x", "").toUpperCase() ?? undefined,
        serialNumber: raw.serialNumber ?? undefined,
        usbVersion: raw.usbVersion ?? undefined,
        ipAddress: raw.ipAddress ?? undefined,
        macAddress: raw.macAddress?.toUpperCase() ?? undefined,
        // Phase 2 enrichment fields from client
        firmwareVersion: raw.firmwareVersion ?? undefined,
        hardwareRevision: raw.hardwareRevision ?? undefined,
        softwareRevision: raw.softwareRevision ?? undefined,
        interfaceClass: raw.interfaceClass ?? undefined,
        interfaceClasses: raw.interfaceClasses ?? undefined,
        driverName: raw.driverName ?? undefined,
        productName: raw.productName ?? undefined,
      };

      // Phase 2 data from client-side identification (passed as deviceProfile in payload)
      const clientProfile = raw.deviceProfile as {
        deviceType?: string;
        identificationStatus?: string;
        model?: string | null;
        firmwareVersion?: string | null;
        hardwareRevision?: string | null;
        capabilities?: string[];
        serialSource?: string | null;
        modelSource?: string | null;
        fingerprintHash?: string | null;
        identificationErrors?: Array<{ step: string; message: string; recoverable: boolean }>;
      } | undefined;

      // Match against Product Library
      const match = await matchDevice(rawDevice);

      if (match.isUnknown) {
        // UNKNOWN — no match found in product library
        unknownCount++;

        const unknown = await db.unknownDevice.create({
          data: {
            scanSessionId: scanSession.id,
            hardwareId: rawDevice.hardwareId ?? null,
            vendorId: rawDevice.vendorId?.toUpperCase() ?? null,
            productIdCode: rawDevice.productIdCode?.toUpperCase() ?? null,
            deviceName: rawDevice.deviceName ?? null,
            manufacturer: rawDevice.manufacturer ?? null,
            model: rawDevice.model ?? null,
            connectionType: rawDevice.connectionType ?? null,
            port: rawDevice.port ?? null,
            macAddress: rawDevice.macAddress?.toUpperCase() ?? null,
            ipAddress: rawDevice.ipAddress ?? null,
          },
        });

        results.push({
          id: unknown.id,
          passportNumber: null,
          connectionType,
          port: raw.port ?? null,
          deviceName: raw.deviceName ?? "Unknown Device",
          manufacturer: raw.manufacturer ?? null,
          vendorId: raw.vendorId ?? null,
          productId: raw.productId ?? null,
          serialNumber: raw.serialNumber ?? null,
          matched: false,
          matchedProductName: null,
          matchedProductModel: null,
          matchedProductBrand: null,
          matchConfidence: null,
          matchMethod: null,
          driverStatus: null,
          firmwareStatus: null,
          driverUpdateAvailable: false,
          firmwareUpdateAvailable: false,
          driverDownloadUrl: null,
          manualUrl: null,
          knowledgeBaseUrl: null,
          // Phase 2: Device Profile from client-side identification
          deviceProfile: clientProfile ? {
            deviceType: (clientProfile.deviceType as DeviceType) ?? "unknown",
            identificationStatus: (clientProfile.identificationStatus as IdentificationStatus) ?? "unknown",
            model: clientProfile.model ?? null,
            firmwareVersion: clientProfile.firmwareVersion ?? null,
            hardwareRevision: clientProfile.hardwareRevision ?? null,
            capabilities: (clientProfile.capabilities as DeviceCapability[]) ?? [],
            serialSource: clientProfile.serialSource ?? null,
            modelSource: clientProfile.modelSource ?? null,
            fingerprintHash: clientProfile.fingerprintHash ?? null,
            identificationErrors: clientProfile.identificationErrors ?? [],
          } : null,
        });
      } else {
        // MATCHED — product identified
        matchedCount++;

        const detected = await db.detectedDevice.create({
          data: {
            scanSessionId: scanSession.id,
            connectionType: rawDevice.connectionType,
            port: rawDevice.port ?? null,
            deviceName: rawDevice.deviceName ?? null,
            manufacturer: rawDevice.manufacturer ?? null,
            brand: match.matchedProductModel ? null : null, // Will be set from product
            model: match.matchedProductModel ?? null,
            hardwareId: rawDevice.hardwareId ?? null,
            vendorId: rawDevice.vendorId?.toUpperCase() ?? null,
            productIdCode: rawDevice.productIdCode?.toUpperCase() ?? null,
            serialNumber: rawDevice.serialNumber ?? null,
            usbVersion: rawDevice.usbVersion ?? null,
            ipAddress: rawDevice.ipAddress ?? null,
            macAddress: rawDevice.macAddress?.toUpperCase() ?? null,
            status: "ready",
            matchedProductId: match.matchedProductId,
            matchConfidence: match.matchConfidence,
            matchMethod: match.matchMethod,
          },
        });

        // Get matched product details
        const product = await db.qbitProduct.findUnique({
          where: { id: match.matchedProductId! },
        });

        // Try to find/create a Device Passport for this device
        let passportNumber: string | null = null;
        let driverStatus: string | null = null;
        let firmwareStatus: string | null = null;
        let driverUpdateAvailable = false;
        let firmwareUpdateAvailable = false;

        if (product) {
          // Check if passport already exists (by serial number or detected device)
          let existingPassport = null;
          if (rawDevice.serialNumber) {
            existingPassport = await db.devicePassport.findFirst({
              where: { serialNumber: rawDevice.serialNumber },
              include: { driverInfo: true, firmwareInfo: true },
            });
          }

          if (existingPassport) {
            // Update lastScannedAt on existing passport
            await db.devicePassport.update({
              where: { id: existingPassport.id },
              data: {
                lastScannedAt: new Date(),
                detectedDeviceId: detected.id,
              },
            });
            passportNumber = existingPassport.passportNumber;
            driverStatus = existingPassport.driverInfo?.driverStatus ?? null;
            firmwareStatus = existingPassport.firmwareInfo?.firmwareStatus ?? null;
            driverUpdateAvailable = existingPassport.driverInfo?.driverStatus === "update_available" || existingPassport.driverInfo?.driverStatus === "missing";
            firmwareUpdateAvailable = existingPassport.firmwareInfo?.firmwareStatus === "update_available" || existingPassport.firmwareInfo?.firmwareStatus === "unsupported";
          } else {
            // Create new passport
            const passportCount = await db.devicePassport.count();
            const newPassportNumber = `PASS-2026-${(passportCount + 1).toString().padStart(5, "0")}`;

            const newPassport = await db.devicePassport.create({
              data: {
                passportNumber: newPassportNumber,
                detectedDeviceId: detected.id,
                productId: product.id,
                deviceName: rawDevice.deviceName ?? product.name,
                manufacturer: rawDevice.manufacturer ?? product.manufacturer,
                brand: product.brand,
                model: product.model,
                hardwareId: rawDevice.hardwareId ?? null,
                vendorId: rawDevice.vendorId ?? null,
                productIdCode: rawDevice.productIdCode ?? null,
                serialNumber: rawDevice.serialNumber ?? null,
                connectionType: rawDevice.connectionType,
                port: rawDevice.port ?? null,
                usbVersion: rawDevice.usbVersion ?? null,
                deviceStatus: "ready",
                lastScannedAt: new Date(),
              },
            });
            passportNumber = newPassportNumber;

            // Create DriverInformation
            const driver = await db.driver.findFirst({
              where: { productId: product.id },
              include: { versions: { orderBy: { releaseDate: "desc" }, take: 1 } },
            });
            const latestDriverVersion = driver?.versions[0]?.version ?? null;

            // For browser-discovered devices, we can't read installed driver version
            // so we set status to "unknown" until Desktop Agent provides real data
            driverStatus = !latestDriverVersion ? "unsupported" : "unknown";
            driverUpdateAvailable = driverStatus === "update_available";

            await db.driverInformation.create({
              data: {
                passportId: newPassport.id,
                installedDriverName: driver?.name ?? `${product.name} Driver`,
                installedDriverVersion: null, // Unknown until Desktop Agent reports
                installedDriverProvider: "Unknown",
                installedDriverDate: new Date(),
                latestDriverVersion,
                latestDriverReleaseDate: driver?.versions[0]?.releaseDate ?? null,
                latestDriverDownloadUrl: product.driverDownloadUrl,
                driverStatus,
                supportedOses: JSON.stringify(["Windows 11", "Windows 10"]),
                lastCheckedAt: new Date(),
              },
            });

            // Create FirmwareInformation
            // Phase 2: Use client-provided firmware version if available
            const firmware = await db.firmware.findFirst({
              where: { productId: product.id },
              include: { releases: { where: { isLatest: true }, take: 1 } },
            });
            const latestFirmwareVersion = firmware?.releases[0]?.version ?? null;

            // Use real firmware version from Phase 2 client data (Bluetooth GATT / USB)
            // If not available, leave as null — NO fake firmware version
            const installedFirmwareVersion = rawDevice.firmwareVersion ?? null;
            firmwareStatus = !latestFirmwareVersion
              ? "unknown"
              : installedFirmwareVersion
                ? (installedFirmwareVersion === latestFirmwareVersion ? "healthy" : "update_available")
                : "unknown";
            firmwareUpdateAvailable = installedFirmwareVersion
              ? installedFirmwareVersion !== latestFirmwareVersion
              : false;

            await db.firmwareInformation.create({
              data: {
                passportId: newPassport.id,
                installedVersion: installedFirmwareVersion, // Real firmware from Phase 2, null if unreadable
                installedFirmwareVendor: rawDevice.manufacturer ?? "Unknown",
                installedCompatibility: "Unknown",
                latestVersion: latestFirmwareVersion,
                latestReleaseDate: firmware?.releases[0]?.releaseDate ?? null,
                firmwareStatus,
                compatibilityChecked: false,
                isCompatible: true,
                lastCheckedAt: new Date(),
              },
            });
          }
        }

        results.push({
          id: detected.id,
          passportNumber,
          connectionType,
          port: raw.port ?? null,
          deviceName: raw.deviceName ?? match.matchedProductName ?? "Unknown Device",
          manufacturer: raw.manufacturer ?? null,
          vendorId: raw.vendorId ?? null,
          productId: raw.productId ?? null,
          serialNumber: raw.serialNumber ?? null,
          matched: true,
          matchedProductName: match.matchedProductName ?? product?.name ?? null,
          matchedProductModel: match.matchedProductModel ?? product?.model ?? null,
          matchedProductBrand: product?.brand ?? null,
          matchConfidence: match.matchConfidence,
          matchMethod: match.matchMethod,
          driverStatus,
          firmwareStatus,
          driverUpdateAvailable,
          firmwareUpdateAvailable,
          driverDownloadUrl: product?.driverDownloadUrl ?? null,
          manualUrl: product?.manualUrl ?? null,
          knowledgeBaseUrl: product?.knowledgeBaseUrl ?? null,
          // Phase 2: Device Profile from client-side identification, enriched with server match
          deviceProfile: {
            deviceType: (match.matchedProductType as DeviceType) ?? (clientProfile?.deviceType as DeviceType) ?? "unknown",
            identificationStatus: rawDevice.serialNumber && (match.matchedProductModel || clientProfile?.model)
              ? "verified"
              : match.matchedProductModel
                ? "partial"
                : (clientProfile?.identificationStatus as IdentificationStatus) ?? "unknown",
            model: match.matchedProductModel ?? clientProfile?.model ?? null,
            firmwareVersion: rawDevice.firmwareVersion ?? clientProfile?.firmwareVersion ?? null,
            hardwareRevision: rawDevice.hardwareRevision ?? clientProfile?.hardwareRevision ?? null,
            capabilities: (clientProfile?.capabilities as DeviceCapability[]) ?? [],
            serialSource: clientProfile?.serialSource ?? (rawDevice.serialNumber ? (connectionType === "usb" ? "usb_descriptor" : connectionType === "bluetooth" ? "bluetooth_gatt" : null) : null),
            modelSource: match.matchedProductModel ? "device_database" : (clientProfile?.modelSource ?? null),
            fingerprintHash: clientProfile?.fingerprintHash ?? null,
            identificationErrors: clientProfile?.identificationErrors ?? [],
          },
        });
      }
    }

    // Update session with counts
    await db.scanSession.update({
      where: { id: scanSession.id },
      data: {
        deviceCount: results.length,
        usbCount,
        comCount,
        lanCount,
        wifiCount,
        bluetoothCount,
      },
    });

    return NextResponse.json({
      sessionId: scanSession.id,
      sessionToken,
      deviceCount: results.length,
      matchedCount,
      unknownCount,
      scannersUsed: body.scannersUsed ?? [],
      scannersSkipped: body.scannersSkipped ?? [],
      devices: results,
    }, { status: 201 });
  } catch (error) {
    console.error("[API ERROR] POST /api/dr-qbit/discovery:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
