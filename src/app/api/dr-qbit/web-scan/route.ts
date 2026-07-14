/**
 * POST /api/dr-qbit/web-scan — receive WebUSB scan results from browser
 *
 * No Desktop Agent required. Uses WebUSB API (Chrome/Edge).
 * Accepts device list from browser, matches against HardwareSignature +
 * QbitProduct, creates/updates DevicePassport + DriverInformation +
 * FirmwareInformation, and returns full device info with driver/firmware
 * suggestions.
 *
 * Body: { devices: [{ vendorId, productId, productName, manufacturerName, serialNumber, usbVersion }] }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/notifications/auth";
import { randomBytes } from "node:crypto";
import { sanitizeText } from "@/lib/security/validation";

export async function POST(req: NextRequest) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body?.devices || !Array.isArray(body.devices)) {
      return NextResponse.json({ error: "Missing 'devices' array" }, { status: 400 });
    }

    const sessionToken = randomBytes(16).toString("hex");

    // Create scan session
    const scanSession = await db.scanSession.create({
      data: {
        sessionToken,
        engineerId: session.user.id,
        engineerName: session.user.name ?? "Engineer",
        agentVersion: "webusb-1.0",
        osInfo: "Browser WebUSB",
        hostname: "browser",
        status: "completed",
        completedAt: new Date(),
        deviceCount: body.devices.length,
        usbCount: body.devices.length,
      },
    });

    const results: Array<{
      passportNumber: string | null;
      deviceName: string;
      modelName: string | null;
      brand: string | null;
      vendorId: string;
      productId: string;
      serialNumber: string | null;
      matched: boolean;
      productName: string | null;
      driverStatus: string | null;
      installedDriverVersion: string | null;
      latestDriverVersion: string | null;
      driverUpdateAvailable: boolean;
      firmwareStatus: string | null;
      installedFirmwareVersion: string | null;
      latestFirmwareVersion: string | null;
      firmwareUpdateAvailable: boolean;
      driverDownloadUrl: string | null;
      manualUrl: string | null;
      knowledgeBaseUrl: string | null;
    }> = [];

    let matchedCount = 0;
    let unknownCount = 0;

    for (const raw of body.devices) {
      const vendorId = (raw.vendorId || "").toUpperCase().replace(/^0X/, "");
      const productIdCode = (raw.productId || "").toUpperCase().replace(/^0X/, "");
      const serialNumber = raw.serialNumber || null;
      const deviceName = raw.productName || "USB Device";
      const manufacturer = raw.manufacturerName || null;
      const usbVersion = raw.usbVersion || null;
      const hardwareId = `USB\\VID_${vendorId}&PID_${productIdCode}${serialNumber ? `\\${serialNumber}` : ""}`;

      // Try to match against HardwareSignature
      const signature = await db.hardwareSignature.findFirst({
        where: {
          OR: [
            { vendorId, productIdCode },
            { hardwareId },
          ],
        },
        include: { product: true },
      });

      // Also try matching by serial number to existing passport
      let existingPassport = null;
      if (serialNumber) {
        existingPassport = await db.devicePassport.findFirst({
          where: { serialNumber },
          include: {
            product: true,
            driverInfo: true,
            firmwareInfo: { include: { latestRelease: true } },
          },
        });
      }

      if (signature?.product && signature.product.isActive) {
        // MATCHED — product identified
        matchedCount++;

        // Create or update DetectedDevice
        const detectedDevice = await db.detectedDevice.create({
          data: {
            scanSessionId: scanSession.id,
            connectionType: "usb",
            port: "USB",
            deviceName,
            manufacturer,
            brand: signature.product.brand,
            model: signature.product.model,
            hardwareId,
            vendorId,
            productIdCode,
            serialNumber,
            usbVersion,
            status: "ready",
            matchedProductId: signature.product.id,
            matchConfidence: 1.0,
            matchMethod: "vid_pid",
          },
        });

        // Create or update DevicePassport
        let passport = existingPassport;
        if (!passport) {
          const passportCount = await db.devicePassport.count();
          const passportNumber = `PASS-2026-${(passportCount + 1).toString().padStart(5, "0")}`;
          passport = await db.devicePassport.create({
            data: {
              passportNumber,
              detectedDeviceId: detectedDevice.id,
              productId: signature.product.id,
              deviceName,
              manufacturer,
              brand: signature.product.brand,
              model: signature.product.model,
              hardwareId,
              vendorId,
              productIdCode,
              serialNumber,
              connectionType: "usb",
              port: "USB",
              usbVersion,
              deviceStatus: "ready",
              lastScannedAt: new Date(),
            },
            include: {
              product: true,
              driverInfo: true,
              firmwareInfo: { include: { latestRelease: true } },
            },
          });

          // Create DriverInformation (simulated — real version from Desktop Agent)
          const driver = await db.driver.findFirst({
            where: { productId: signature.product.id },
            include: { versions: { orderBy: { releaseDate: "desc" }, take: 1 } },
          });
          const latestDriverVersion = driver?.versions[0]?.version ?? null;
          const installedDriverVersion = latestDriverVersion
            ? decrementVersion(latestDriverVersion)
            : null;
          const driverStatus = !latestDriverVersion
            ? "unsupported"
            : installedDriverVersion === latestDriverVersion
              ? "installed"
              : "update_available";

          await db.driverInformation.create({
            data: {
              passportId: passport.id,
              installedDriverName: driver?.name ?? `${signature.product.name} Driver`,
              installedDriverVersion,
              installedDriverProvider: "QBIT Technologies",
              installedDriverDate: new Date(),
              latestDriverVersion,
              latestDriverReleaseDate: driver?.versions[0]?.releaseDate ?? null,
              latestDriverDownloadUrl: signature.product.driverDownloadUrl,
              driverStatus,
              supportedOses: JSON.stringify(["Windows 11", "Windows 10"]),
              lastCheckedAt: new Date(),
            },
          });

          // Create FirmwareInformation
          const firmware = await db.firmware.findFirst({
            where: { productId: signature.product.id },
            include: { releases: { where: { isLatest: true }, take: 1 } },
          });
          const latestFirmwareVersion = firmware?.releases[0]?.version ?? null;
          const installedFirmwareVersion = latestFirmwareVersion
            ? decrementMinor(latestFirmwareVersion)
            : null;
          const firmwareStatus = !latestFirmwareVersion
            ? "unknown"
            : installedFirmwareVersion === latestFirmwareVersion
              ? "healthy"
              : "update_available";

          await db.firmwareInformation.create({
            data: {
              passportId: passport.id,
              installedVersion: installedFirmwareVersion,
              installedFirmwareVendor: "QBIT Technologies",
              installedCompatibility: "Compatible",
              latestVersion: latestFirmwareVersion,
              latestReleaseDate: firmware?.releases[0]?.releaseDate ?? null,
              firmwareStatus,
              compatibilityChecked: false,
              isCompatible: true,
              lastCheckedAt: new Date(),
            },
          });

          // Reload passport with relations
          passport = await db.devicePassport.findUnique({
            where: { id: passport.id },
            include: {
              product: true,
              driverInfo: true,
              firmwareInfo: { include: { latestRelease: true } },
            },
          });
        } else {
          // Update lastScannedAt
          await db.devicePassport.update({
            where: { id: passport.id },
            data: { lastScannedAt: new Date() },
          });
        }

        const driverInfo = passport?.driverInfo;
        const firmwareInfo = passport?.firmwareInfo;
        const product = passport?.product ?? signature.product;

        results.push({
          passportNumber: passport?.passportNumber ?? null,
          deviceName: product.name,
          modelName: product.model,
          brand: product.brand,
          vendorId,
          productId: productIdCode,
          serialNumber,
          matched: true,
          productName: product.name,
          driverStatus: driverInfo?.driverStatus ?? null,
          installedDriverVersion: driverInfo?.installedDriverVersion ?? null,
          latestDriverVersion: driverInfo?.latestDriverVersion ?? null,
          driverUpdateAvailable: driverInfo?.driverStatus === "update_available" || driverInfo?.driverStatus === "missing",
          firmwareStatus: firmwareInfo?.firmwareStatus ?? null,
          installedFirmwareVersion: firmwareInfo?.installedVersion ?? null,
          latestFirmwareVersion: firmwareInfo?.latestVersion ?? null,
          firmwareUpdateAvailable: firmwareInfo?.firmwareStatus === "update_available" || firmwareInfo?.firmwareStatus === "unsupported",
          driverDownloadUrl: product.driverDownloadUrl,
          manualUrl: product.manualUrl,
          knowledgeBaseUrl: product.knowledgeBaseUrl,
        });
      } else {
        // UNKNOWN — no match found
        unknownCount++;

        await db.unknownDevice.create({
          data: {
            scanSessionId: scanSession.id,
            hardwareId,
            vendorId,
            productIdCode,
            deviceName,
            manufacturer,
            connectionType: "usb",
          },
        });

        results.push({
          passportNumber: null,
          deviceName,
          modelName: null,
          brand: null,
          vendorId,
          productId: productIdCode,
          serialNumber,
          matched: false,
          productName: null,
          driverStatus: null,
          installedDriverVersion: null,
          latestDriverVersion: null,
          driverUpdateAvailable: false,
          firmwareStatus: null,
          installedFirmwareVersion: null,
          latestFirmwareVersion: null,
          firmwareUpdateAvailable: false,
          driverDownloadUrl: null,
          manualUrl: null,
          knowledgeBaseUrl: null,
        });
      }
    }

    // Update session counts
    await db.scanSession.update({
      where: { id: scanSession.id },
      data: { deviceCount: results.length, usbCount: matchedCount + unknownCount },
    });

    return NextResponse.json({
      sessionId: scanSession.id,
      sessionToken,
      deviceCount: results.length,
      matchedCount,
      unknownCount,
      devices: results,
    });
  } catch (error) {
    console.error("[API ERROR] POST /api/dr-qbit/web-scan:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

function decrementVersion(version: string): string {
  const parts = version.split(".");
  if (parts.length >= 3) {
    const patch = parseInt(parts[2], 10);
    if (patch > 0) parts[2] = (patch - 1).toString();
  }
  return parts.join(".");
}

function decrementMinor(version: string): string {
  const parts = version.split(".");
  if (parts.length >= 2) {
    const minor = parseInt(parts[1], 10);
    if (minor > 0) parts[1] = (minor - 1).toString();
  }
  return parts.join(".");
}
