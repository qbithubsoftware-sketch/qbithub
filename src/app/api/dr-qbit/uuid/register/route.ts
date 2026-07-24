/**
 * Device UUID Registration API — POST /api/dr-qbit/uuid/register
 *
 * Registers a new device with a QBIT Device UUID, or updates an existing device.
 *
 * This is the core endpoint for the Universal Device Identity Architecture.
 * It handles:
 *   1. New device registration with UUID generation
 *   2. Duplicate serial detection and marking
 *   3. QR Code generation (QBT://DEVICE/QBT-XXXX)
 *   4. Linking to customer, dealer, product, and warranty data
 *
 * CRITICAL RULES:
 *   - Device UUID is ALWAYS the primary identity — never serial number
 *   - UUID is immutable — cannot be changed once set
 *   - Serial number may be duplicated — system handles gracefully
 *   - QR Code contains only the Device UUID
 *   - All warranty, support, and CRM records link to Device UUID
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateDeviceUuid } from "@/lib/drqbit/fingerprint-engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // === Required fields ===
    const { fingerprintResult, identity } = body;

    if (!fingerprintResult && !identity) {
      return NextResponse.json(
        { error: "Either fingerprintResult or identity must be provided" },
        { status: 400 },
      );
    }

    // === Extract device UUID from fingerprint result ===
    const deviceUuid = fingerprintResult?.deviceUuid ?? generateDeviceUuid(
      identity?.chipUid ?? identity?.factoryDeviceUuid ?? identity?.ethernetMacAddress ?? identity?.bluetoothMacAddress ?? identity?.serialNumber ?? null
    );

    // === Check if device already exists by UUID ===
    const existingByUuid = await db.devicePassport.findUnique({
      where: { deviceUuid },
    });

    if (existingByUuid) {
      // Device already registered — update it with new scan data
      const updated = await db.devicePassport.update({
        where: { deviceUuid },
        data: {
          lastConnectedAt: new Date(),
          connectionCount: existingByUuid.connectionCount + 1,
          hardwareFingerprint: fingerprintResult?.fingerprintHash ?? existingByUuid.hardwareFingerprint,
          fingerprintQuality: fingerprintResult?.quality ?? existingByUuid.fingerprintQuality,
          primaryIdentifier: fingerprintResult?.primaryIdentifier ?? existingByUuid.primaryIdentifier,
          duplicateSerialFlag: fingerprintResult?.duplicateSerialDetected ?? existingByUuid.duplicateSerialFlag,
          ...(identity ? {
            vendorId: identity.vendorId ?? existingByUuid.vendorId,
            productIdCode: identity.productId ?? existingByUuid.productIdCode,
            serialNumber: identity.sdkSerialNumber ?? existingByUuid.serialNumber,
            deviceName: identity.productName ?? existingByUuid.deviceName,
            manufacturer: identity.manufacturer ?? existingByUuid.manufacturer,
            model: identity.model ?? existingByUuid.model,
            firmwareVersion: identity.firmwareVersion ?? existingByUuid.firmwareVersion,
            hardwareRevision: identity.hardwareRevision ?? existingByUuid.hardwareRevision,
            productCode: identity.productCode ?? existingByUuid.productCode,
            usbDeviceInstanceId: identity.usbDeviceInstanceId ?? existingByUuid.usbDeviceInstanceId,
            usbContainerId: identity.usbContainerId ?? existingByUuid.usbContainerId,
            chipUid: identity.chipUid ?? existingByUuid.chipUid,
            factoryDeviceUuid: identity.factoryDeviceUuid ?? existingByUuid.factoryDeviceUuid,
            ethernetMacAddress: identity.ethernetMacAddress ?? existingByUuid.ethernetMacAddress,
            bluetoothMacAddress: identity.bluetoothMacAddress ?? existingByUuid.bluetoothMacAddress,
          } : {}),
          ...(body.customerId ? { customerId: body.customerId } : {}),
          ...(body.dealerId ? { dealerId: body.dealerId } : {}),
          ...(body.invoiceNumber ? { invoiceNumber: body.invoiceNumber } : {}),
          ...(body.purchaseDate ? { purchaseDate: new Date(body.purchaseDate) } : {}),
          ...(body.warrantyStartDate ? { warrantyStartDate: new Date(body.warrantyStartDate) } : {}),
          ...(body.warrantyEndDate ? { warrantyEndDate: new Date(body.warrantyEndDate) } : {}),
          ...(body.productId ? { productId: body.productId } : {}),
          ...(body.productImage ? { productImage: body.productImage } : {}),
          ...(body.productCategory ? { productCategory: body.productCategory } : {}),
        },
      });

      return NextResponse.json({
        action: "updated",
        device: formatDeviceResponse(updated),
        message: "Device updated — UUID remains unchanged",
      });
    }

    // === New device registration ===
    const lastPassport = await db.devicePassport.findFirst({
      orderBy: { passportNumber: "desc" },
      select: { passportNumber: true },
    });
    const nextNumber = lastPassport
      ? parseInt(lastPassport.passportNumber.replace("PASS-", ""), 10) + 1
      : 1;
    const passportNumber = `PASS-${nextNumber.toString().padStart(6, "0")}`;

    // Generate QR Code content
    const qrCode = `QBT://DEVICE/${deviceUuid}`;

    // Detect duplicate serial
    let duplicateSerialDetected = false;
    if (identity?.sdkSerialNumber) {
      const sameSerialCount = await db.devicePassport.count({
        where: { serialNumber: identity.sdkSerialNumber },
      });
      duplicateSerialDetected = sameSerialCount > 0;

      if (duplicateSerialDetected) {
        await db.devicePassport.updateMany({
          where: { serialNumber: identity.sdkSerialNumber },
          data: { duplicateSerialFlag: true },
        });
      }
    }

    // Create the device passport
    const passport = await db.devicePassport.create({
      data: {
        passportNumber,
        deviceUuid,
        hardwareFingerprint: fingerprintResult?.fingerprintHash ?? null,
        duplicateSerialFlag: duplicateSerialDetected,
        fingerprintQuality: fingerprintResult?.quality ?? null,
        primaryIdentifier: fingerprintResult?.primaryIdentifier ?? null,
        qrCode,
        registrationDate: new Date(),
        deviceStatus: "registered",
        ...(identity ? {
          vendorId: identity.vendorId,
          productIdCode: identity.productId,
          serialNumber: identity.sdkSerialNumber,
          deviceName: identity.productName,
          manufacturer: identity.manufacturer,
          brand: identity.manufacturer,
          model: identity.model,
          productCode: identity.productCode,
          firmwareVersion: identity.firmwareVersion,
          hardwareRevision: identity.hardwareRevision,
          connectionType: "usb",
          usbDeviceInstanceId: identity.usbDeviceInstanceId,
          usbContainerId: identity.usbContainerId,
          chipUid: identity.chipUid,
          factoryDeviceUuid: identity.factoryDeviceUuid,
          ethernetMacAddress: identity.ethernetMacAddress,
          bluetoothMacAddress: identity.bluetoothMacAddress,
          macAddress: identity.ethernetMacAddress ?? identity.bluetoothMacAddress,
        } : {}),
        ...(body.customerId ? { customerId: body.customerId } : {}),
        ...(body.dealerId ? { dealerId: body.dealerId } : {}),
        ...(body.invoiceNumber ? { invoiceNumber: body.invoiceNumber } : {}),
        ...(body.purchaseDate ? { purchaseDate: new Date(body.purchaseDate) } : {}),
        ...(body.warrantyStartDate ? { warrantyStartDate: new Date(body.warrantyStartDate) } : {}),
        ...(body.warrantyEndDate ? { warrantyEndDate: new Date(body.warrantyEndDate) } : {}),
        ...(body.productId ? { productId: body.productId } : {}),
        ...(body.productImage ? { productImage: body.productImage } : {}),
        ...(body.productCategory ? { productCategory: body.productCategory } : {}),
        ...(body.activationDate ? { activationDate: new Date(body.activationDate) } : {}),
        firstConnectedAt: new Date(),
        lastConnectedAt: new Date(),
        connectionCount: 1,
        firstDetectedAt: new Date(),
      },
    });

    // Create warranty record if warranty dates provided
    if (body.warrantyStartDate || body.warrantyEndDate) {
      await db.deviceWarranty.create({
        data: {
          passportId: passport.id,
          purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
          warrantyStartDate: body.warrantyStartDate ? new Date(body.warrantyStartDate) : null,
          warrantyExpiryDate: body.warrantyEndDate ? new Date(body.warrantyEndDate) : null,
          warrantyStatus: computeWarrantyStatus(body.warrantyEndDate),
        },
      });
    }

    return NextResponse.json({
      action: "registered",
      device: formatDeviceResponse(passport),
      message: duplicateSerialDetected
        ? "Device registered. Duplicate Serial Number detected — device identified using QBIT Device UUID."
        : "Device registered successfully with QBIT Device UUID.",
      duplicateSerialDetected,
    });
  } catch (error) {
    console.error("[DrQBIT UUID Register] Error:", error);
    return NextResponse.json(
      { error: "Device registration failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

function computeWarrantyStatus(warrantyEndDate?: string): string {
  if (!warrantyEndDate) return "unknown";
  const end = new Date(warrantyEndDate);
  const now = new Date();
  return end > now ? "active" : "expired";
}

function formatDeviceResponse(passport: Record<string, unknown>) {
  return {
    id: passport.id,
    passportNumber: passport.passportNumber,
    deviceUuid: passport.deviceUuid,
    qrCode: passport.qrCode,
    serialNumber: passport.serialNumber,
    deviceName: passport.deviceName,
    manufacturer: passport.manufacturer,
    brand: passport.brand,
    model: passport.model,
    productCode: passport.productCode,
    firmwareVersion: passport.firmwareVersion,
    hardwareRevision: passport.hardwareRevision,
    vendorId: passport.vendorId,
    productIdCode: passport.productIdCode,
    hardwareFingerprint: passport.hardwareFingerprint,
    fingerprintQuality: passport.fingerprintQuality,
    primaryIdentifier: passport.primaryIdentifier,
    duplicateSerialFlag: passport.duplicateSerialFlag,
    deviceStatus: passport.deviceStatus,
    customerId: passport.customerId,
    dealerId: passport.dealerId,
    invoiceNumber: passport.invoiceNumber,
    purchaseDate: passport.purchaseDate,
    warrantyStartDate: passport.warrantyStartDate,
    warrantyEndDate: passport.warrantyEndDate,
    registrationDate: passport.registrationDate,
    activationDate: passport.activationDate,
    productImage: passport.productImage,
    productCategory: passport.productCategory,
    productId: passport.productId,
    connectionType: passport.connectionType,
    chipUid: passport.chipUid,
    factoryDeviceUuid: passport.factoryDeviceUuid,
    ethernetMacAddress: passport.ethernetMacAddress,
    bluetoothMacAddress: passport.bluetoothMacAddress,
    usbDeviceInstanceId: passport.usbDeviceInstanceId,
    usbContainerId: passport.usbContainerId,
    firstConnectedAt: passport.firstConnectedAt,
    lastConnectedAt: passport.lastConnectedAt,
    createdAt: passport.createdAt,
    updatedAt: passport.updatedAt,
  };
}
