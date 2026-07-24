/**
 * Device UUID Lookup API — GET /api/dr-qbit/uuid/lookup
 *
 * Lookup a device by its QBIT Device UUID.
 * Used by the Customer Scan Workflow and QR Code Workflow.
 *
 * GET /api/dr-qbit/uuid/lookup?uuid=QBT-7F31B5D4-9A81-4D2E
 * → Returns complete device profile linked to that UUID
 *
 * The UUID is the permanent internal identity. Customer never needs to know it.
 * But the system uses it to resolve to the exact device profile.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const uuid = searchParams.get("uuid");

  if (!uuid) {
    return NextResponse.json(
      { error: "Device UUID is required" },
      { status: 400 },
    );
  }

  // Validate QBIT UUID format
  if (!uuid.startsWith("QBT-")) {
    return NextResponse.json(
      { error: "Invalid QBIT Device UUID format. Expected format: QBT-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" },
      { status: 400 },
    );
  }

  const device = await db.devicePassport.findUnique({
    where: { deviceUuid: uuid },
    include: {
      product: { select: { id: true, name: true, brand: true, model: true, imageUrl: true, deviceType: true, slug: true, description: true, category: true } },
      customer: { select: { id: true, name: true, companyName: true, mobileNumber: true, email: true, city: true, state: true } },
      dealer: { select: { id: true, name: true } },
      warranty: { select: { warrantyStatus: true, warrantyStartDate: true, warrantyExpiryDate: true, warrantyDaysRemaining: true, extendedWarranty: true } },
      driverInfo: { select: { driverStatus: true, installedDriverVersion: true, latestDriverVersion: true, latestDriverDownloadUrl: true } },
      firmwareInfo: { select: { installedVersion: true, latestVersion: true, firmwareStatus: true } },
      configuration: { select: { activeConnectionType: true, configurationStatus: true } },
    },
  });

  if (!device) {
    return NextResponse.json({
      found: false,
      message: "Device not found. This UUID may not be registered in our system.",
      uuid,
    });
  }

  // Compute warranty days remaining if warranty end date exists
  const warrantyDaysRemaining = device.warrantyEndDate
    ? Math.ceil((new Date(device.warrantyEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return NextResponse.json({
    found: true,
    device: {
      id: device.id,
      deviceUuid: device.deviceUuid,
      passportNumber: device.passportNumber,
      qrCode: device.qrCode,
      // Product info
      productName: device.product?.name ?? device.deviceName,
      productBrand: device.product?.brand ?? device.brand,
      productModel: device.product?.model ?? device.model,
      productImage: device.product?.imageUrl ?? device.productImage,
      productType: device.product?.deviceType ?? device.productCategory,
      productSlug: device.product?.slug,
      productDescription: device.product?.description,
      // Customer-visible fields
      serialNumber: device.serialNumber,
      manufacturer: device.manufacturer,
      firmwareVersion: device.firmwareVersion,
      hardwareRevision: device.hardwareRevision,
      productCode: device.productCode,
      deviceStatus: device.deviceStatus,
      // Warranty
      warrantyStatus: device.warranty?.warrantyStatus ?? "unknown",
      warrantyStartDate: device.warrantyStartDate ?? device.warranty?.warrantyStartDate,
      warrantyEndDate: device.warrantyEndDate ?? device.warranty?.warrantyExpiryDate,
      warrantyDaysRemaining: warrantyDaysRemaining ?? device.warranty?.warrantyDaysRemaining,
      extendedWarranty: device.warranty?.extendedWarranty ?? false,
      // Customer info
      customerName: device.customer?.name,
      customerCompany: device.customer?.companyName,
      customerMobile: device.customer?.mobileNumber,
      // Dealer info
      dealerName: device.dealer?.name,
      // Business
      invoiceNumber: device.invoiceNumber,
      purchaseDate: device.purchaseDate,
      registrationDate: device.registrationDate,
      activationDate: device.activationDate,
      // Driver
      driverStatus: device.driverInfo?.driverStatus ?? "unknown",
      installedDriverVersion: device.driverInfo?.installedDriverVersion,
      latestDriverVersion: device.driverInfo?.latestDriverVersion,
      latestDriverDownloadUrl: device.driverInfo?.latestDriverDownloadUrl,
      // Firmware
      firmwareStatus: device.firmwareInfo?.firmwareStatus ?? "unknown",
      installedFirmwareVersion: device.firmwareInfo?.installedVersion,
      latestFirmwareVersion: device.firmwareInfo?.latestVersion,
      // Duplicate serial flag
      duplicateSerialFlag: device.duplicateSerialFlag,
      fingerprintQuality: device.fingerprintQuality,
      // Timestamps
      firstDetectedAt: device.firstDetectedAt,
      lastConnectedAt: device.lastConnectedAt,
    },
  });
}
