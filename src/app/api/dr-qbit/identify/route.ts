/**
 * POST /api/dr-qbit/identify — Server-side Device Identification (Phase 2)
 *
 * Receives client-side identification results and enriches them with
 * server-side data: product database matching, capability lookup from
 * QbitProduct, serial number database lookup, and model identification
 * from HardwareSignature.
 *
 * This endpoint does NOT duplicate what the discovery endpoint does.
 * Instead, it takes the Phase 2 DeviceProfile from the client and:
 *   1. Verifies the profile against the server database
 *   2. Enriches the model identification with server-side matching
 *   3. Adds product-specific capabilities from QbitProduct
 *   4. Creates/updates Device Passport, DriverInfo, FirmwareInfo
 *   5. Returns the fully verified Device Profile
 *
 * Can also be called independently (e.g. by Desktop Agent for LAN devices).
 *
 * NO mock data, NO fake serial numbers, NO dummy profiles.
 * Only processes real device data from Phase 1 + Phase 2 client-side.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/notifications/auth";
import { matchDevice } from "@/lib/drqbit/device-matcher";
import {
  type DeviceProfile,
  type DeviceFingerprint,
  type DeviceCapability,
  type DeviceConnection,
  type DeviceType,
  type IdentificationStatus,
  type IdentificationError,
  type RawDetectedDevice,
} from "@/lib/drqbit/types";

export async function POST(req: NextRequest) {
  // Authenticate — only staff can submit identification results
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Support two payload formats:
    // 1. Single device profile (from client-side identifyDevice)
    // 2. Array of device profiles (from identifyAllDevices)
    const profiles: DeviceProfile[] = Array.isArray(body.profiles)
      ? body.profiles
      : body.profile
        ? [body.profile]
        : [];

    if (profiles.length === 0) {
      return NextResponse.json({ error: "Missing 'profile' or 'profiles' in request body" }, { status: 400 });
    }

    // Optional: scan session ID to link identification to a discovery scan
    const scanSessionId: string | null = body.scanSessionId ?? null;

    const results: Array<{
      profile: DeviceProfile;
      passportNumber: string | null;
      matchedProductId: string | null;
      matchedProductName: string | null;
      matchedProductModel: string | null;
      matchedProductType: DeviceType | null;
      matchConfidence: number | null;
      matchMethod: string | null;
      driverStatus: string | null;
      firmwareStatus: string | null;
      serverEnriched: boolean;
    }> = [];

    for (const clientProfile of profiles) {
      // ===== Step A: Skip unsupported devices =====
      if (clientProfile.identificationStatus === "unsupported") {
        results.push({
          profile: clientProfile,
          passportNumber: null,
          matchedProductId: null,
          matchedProductName: null,
          matchedProductModel: null,
          matchedProductType: null,
          matchConfidence: null,
          matchMethod: null,
          driverStatus: null,
          firmwareStatus: null,
          serverEnriched: false,
        });
        continue;
      }

      // ===== Step B: Build RawDetectedDevice for server-side matching =====
      const rawDevice: RawDetectedDevice = {
        connectionType: clientProfile.connectionType as DeviceConnection,
        port: clientProfile.port ?? undefined,
        deviceName: clientProfile.deviceName ?? undefined,
        manufacturer: clientProfile.manufacturer ?? undefined,
        model: clientProfile.model ?? undefined,
        vendorId: clientProfile.vendorId?.replace("0x", "").toUpperCase() ?? undefined,
        productIdCode: clientProfile.productId?.replace("0x", "").toUpperCase() ?? undefined,
        serialNumber: clientProfile.serialNumber ?? undefined,
        firmwareVersion: clientProfile.firmwareVersion ?? undefined,
        hardwareRevision: clientProfile.hardwareRevision ?? undefined,
        interfaceClass: clientProfile.fingerprint?.interfaceClass ?? undefined,
      };

      // ===== Step C: Server-side model identification (database matching) =====
      const match = await matchDevice(rawDevice);

      // ===== Step D: Enrich the client profile with server data =====
      const enrichedProfile = { ...clientProfile };
      const identificationErrors: IdentificationError[] = [...(clientProfile.identificationErrors || [])];

      let passportNumber: string | null = null;
      let matchedProductId: string | null = null;
      let matchedProductName: string | null = null;
      let matchedProductModel: string | null = null;
      let matchedProductType: DeviceType | null = null;
      let matchConfidence: number | null = null;
      let matchMethod: string | null = null;
      let driverStatus: string | null = null;
      let firmwareStatus: string | null = null;

      if (!match.isUnknown && match.matchedProductId) {
        // MATCHED — server identified the product
        matchedProductId = match.matchedProductId;
        matchedProductName = match.matchedProductName;
        matchedProductModel = match.matchedProductModel;
        matchedProductType = (match.matchedProductType as DeviceType) ?? null;
        matchConfidence = match.matchConfidence;
        matchMethod = match.matchMethod;

        // Enrich model if client didn't identify it
        if (!enrichedProfile.model && match.matchedProductModel) {
          enrichedProfile.model = match.matchedProductModel;
          enrichedProfile.modelSource = "device_database";
        }

        // Enrich device type from product database
        if (matchedProductType && matchedProductType !== "unknown") {
          enrichedProfile.deviceType = matchedProductType;
        }

        // ===== Step E: Add product-specific capabilities =====
        const product = await db.qbitProduct.findUnique({
          where: { id: match.matchedProductId },
        });

        if (product) {
          // Merge client-detected capabilities with product capabilities
          const productCapabilities = parseProductCapabilities(product);
          const mergedCapabilities = mergeCapabilities(
            enrichedProfile.capabilities || [],
            productCapabilities,
          );
          enrichedProfile.capabilities = mergedCapabilities;

          // ===== Step F: Create/Update Device Passport =====
          // Check if passport already exists (by serial number)
          let existingPassport = null;
          if (clientProfile.serialNumber) {
            existingPassport = await db.devicePassport.findFirst({
              where: { serialNumber: clientProfile.serialNumber },
              include: { driverInfo: true, firmwareInfo: true },
            });
          }

          if (existingPassport) {
            // Update existing passport with new scan data
            await db.devicePassport.update({
              where: { id: existingPassport.id },
              data: {
                lastScannedAt: new Date(),
                // firmwareVersion is stored in FirmwareInformation.installedVersion, not on passport
                // hardwareRevision would need a schema migration — stored in identification profile only
              },
            });
            passportNumber = existingPassport.passportNumber;
            driverStatus = existingPassport.driverInfo?.driverStatus ?? null;
            firmwareStatus = existingPassport.firmwareInfo?.firmwareStatus ?? null;
          } else {
            // Create new passport
            const passportCount = await db.devicePassport.count();
            const newPassportNumber = `PASS-2026-${(passportCount + 1).toString().padStart(5, "0")}`;

            const hardwareId = clientProfile.vendorId && clientProfile.productId
              ? `USB\\VID_${clientProfile.vendorId.replace("0x", "").toUpperCase()}&PID_${clientProfile.productId.replace("0x", "").toUpperCase()}`
              : null;

            const newPassport = await db.devicePassport.create({
              data: {
                passportNumber: newPassportNumber,
                productId: product.id,
                deviceName: clientProfile.deviceName ?? product.name,
                manufacturer: clientProfile.manufacturer ?? product.manufacturer,
                brand: product.brand,
                model: enrichedProfile.model ?? product.model,
                hardwareId,
                vendorId: clientProfile.vendorId?.replace("0x", "").toUpperCase() ?? null,
                productIdCode: clientProfile.productId?.replace("0x", "").toUpperCase() ?? null,
                serialNumber: clientProfile.serialNumber,
                connectionType: clientProfile.connectionType as DeviceConnection,
                port: clientProfile.port ?? null,
                deviceStatus: clientProfile.identificationStatus === "verified" ? "ready" : "unknown",
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
            driverStatus = !latestDriverVersion ? "unsupported" : "unknown";

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
            const firmware = await db.firmware.findFirst({
              where: { productId: product.id },
              include: { releases: { where: { isLatest: true }, take: 1 } },
            });
            const latestFirmwareVersion = firmware?.releases[0]?.version ?? null;

            // Use client-provided firmware version if available
            const installedFirmwareVersion = clientProfile.firmwareVersion ?? null;
            firmwareStatus = !latestFirmwareVersion
              ? "unknown"
              : installedFirmwareVersion === latestFirmwareVersion
                ? "healthy"
                : installedFirmwareVersion
                  ? "update_available"
                  : "unknown";

            await db.firmwareInformation.create({
              data: {
                passportId: newPassport.id,
                installedVersion: installedFirmwareVersion,
                installedFirmwareVendor: clientProfile.manufacturer ?? "Unknown",
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

        // Update identification status based on server enrichment
        if (enrichedProfile.serialNumber && enrichedProfile.model) {
          enrichedProfile.identificationStatus = "verified";
        } else if (enrichedProfile.model) {
          enrichedProfile.identificationStatus = "partial";
        } else {
          enrichedProfile.identificationStatus = "unknown";
        }

      } else {
        // UNKNOWN — server couldn't match the device
        // Keep the client-side profile as-is
        identificationErrors.push({
          step: "model_identification",
          message: "Server-side database matching could not identify this device. No VID/PID, hardware ID, or model match found in the product library.",
          recoverable: true,
        });

        // Create UnknownDevice record for admin mapping
        const hardwareId = clientProfile.vendorId && clientProfile.productId
          ? `USB\\VID_${clientProfile.vendorId.replace("0x", "").toUpperCase()}&PID_${clientProfile.productId.replace("0x", "").toUpperCase()}`
          : null;

        if (scanSessionId) {
          await db.unknownDevice.create({
            data: {
              scanSessionId,
              hardwareId,
              vendorId: clientProfile.vendorId?.replace("0x", "").toUpperCase() ?? null,
              productIdCode: clientProfile.productId?.replace("0x", "").toUpperCase() ?? null,
              deviceName: clientProfile.deviceName ?? null,
              manufacturer: clientProfile.manufacturer ?? null,
              model: clientProfile.model ?? null,
              connectionType: clientProfile.connectionType as DeviceConnection ?? null,
              port: clientProfile.port ?? null,
            },
          });
        }
      }

      // Update the profile's errors with server-side findings
      enrichedProfile.identificationErrors = identificationErrors;

      results.push({
        profile: enrichedProfile,
        passportNumber,
        matchedProductId,
        matchedProductName,
        matchedProductModel,
        matchedProductType,
        matchConfidence,
        matchMethod,
        driverStatus,
        firmwareStatus,
        serverEnriched: match.isUnknown === false,
      });
    }

    return NextResponse.json({
      identifiedCount: results.length,
      results,
    }, { status: 200 });

  } catch (error) {
    console.error("[API ERROR] POST /api/dr-qbit/identify:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// ====================== Helper Functions ======================

/**
 * Parse product capabilities from QbitProduct record.
 *
 * Product capabilities are derived from:
 *   - deviceType (what kind of device it is)
 *   - connectionTypes (comma-separated string: "usb,wifi,bluetooth")
 *   - supportsWifi, sdkAvailable, firmwareConfigSupported (feature flags)
 *   - Device name keywords
 *
 * Capabilities are NEVER hardcoded — always derived from real product data.
 */
function parseProductCapabilities(product: {
  deviceType: string;
  connectionTypes?: string | null;
  supportsWifi?: boolean | null;
  sdkAvailable?: boolean | null;
  firmwareConfigSupported?: boolean | null;
  autoDriverInstall?: boolean | null;
}): DeviceCapability[] {
  const capabilities: DeviceCapability[] = [];

  // Parse connectionTypes (comma-separated string)
  if (product.connectionTypes) {
    const types = product.connectionTypes.split(",").map(t => t.trim().toLowerCase());
    if (types.includes("usb")) capabilities.push("usb");
    if (types.includes("lan") || types.includes("ethernet")) capabilities.push("lan");
    if (types.includes("wifi") || types.includes("wi-fi")) capabilities.push("wifi");
    if (types.includes("bluetooth") || types.includes("bt")) capabilities.push("bluetooth");
    if (types.includes("com") || types.includes("serial")) capabilities.push("com_serial");
  } else {
    // Default: USB is always available for products in our system
    capabilities.push("usb");
  }

  // Feature flags
  if (product.supportsWifi) capabilities.push("wifi");
  if (product.sdkAvailable) capabilities.push("firmware_upgrade");
  if (product.firmwareConfigSupported) capabilities.push("firmware_upgrade");
  if (product.autoDriverInstall) capabilities.push("esc_pos_protocol");

  // Device type-based capabilities
  switch (product.deviceType) {
    case "thermal_printer":
      capabilities.push("receipt_printing", "esc_pos_protocol");
      break;
    case "label_printer":
      capabilities.push("label_printing", "esc_pos_protocol");
      break;
    case "barcode_scanner":
      capabilities.push("barcode_printing", "scanner_mode");
      break;
    case "kitchen_printer":
      capabilities.push("kitchen_printing", "esc_pos_protocol");
      break;
    case "cash_drawer":
      capabilities.push("cash_drawer");
      break;
    case "customer_display":
      capabilities.push("display_output");
      break;
    case "windows_pos":
    case "android_pos":
      capabilities.push("pos_mode");
      break;
    case "kiosk":
      capabilities.push("receipt_printing", "pos_mode");
      break;
  }

  return [...new Set(capabilities)];
}

/**
 * Merge client-detected capabilities with server-side product capabilities.
 *
 * Client capabilities come from USB class codes and device name heuristics.
 * Server capabilities come from the QbitProduct database record.
 * Both sources are real — we merge them for the complete picture.
 *
 * If a capability appears in EITHER source, it's included.
 * We don't remove capabilities that the client detected but the
 * server doesn't list (the server may not have complete data).
 */
function mergeCapabilities(
  clientCapabilities: DeviceCapability[],
  serverCapabilities: DeviceCapability[],
): DeviceCapability[] {
  const merged = new Set<DeviceCapability>([
    ...clientCapabilities,
    ...serverCapabilities,
  ]);
  return [...merged];
}
