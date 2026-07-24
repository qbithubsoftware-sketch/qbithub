/**
 * QR Code Lookup API — GET /api/dr-qbit/uuid/qr-lookup
 *
 * Resolves a QR Code scan to a device profile.
 *
 * QR Code format: QBT://DEVICE/QBT-7F31B5D4-9A81-4D2E
 * The backend reads the UUID from the QR code and opens the exact device profile.
 *
 * Workflow:
 *   1. Customer scans QR code on product
 *   2. QR contains only: QBT://DEVICE/{deviceUuid}
 *   3. Backend parses UUID from QR content
 *   4. Backend searches database by UUID
 *   5. Opens exact Device Profile instantly
 *   6. No Serial Number typing required
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const qrContent = searchParams.get("qr");

  if (!qrContent) {
    return NextResponse.json(
      { error: "QR code content is required" },
      { status: 400 },
    );
  }

  // Parse the UUID from QR content
  // Format: QBT://DEVICE/QBT-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
  let deviceUuid: string;

  if (qrContent.startsWith("QBT://DEVICE/")) {
    deviceUuid = qrContent.replace("QBT://DEVICE/", "");
  } else if (qrContent.startsWith("QBT-")) {
    // Direct UUID format
    deviceUuid = qrContent;
  } else {
    return NextResponse.json(
      { error: "Invalid QR code format. Expected: QBT://DEVICE/QBT-XXXX-XXXX" },
      { status: 400 },
    );
  }

  // Lookup by UUID
  const device = await db.devicePassport.findUnique({
    where: { deviceUuid },
    include: {
      product: { select: { id: true, name: true, brand: true, model: true, imageUrl: true, deviceType: true, slug: true, description: true } },
      customer: { select: { id: true, name: true, companyName: true, mobileNumber: true } },
      dealer: { select: { id: true, name: true } },
      warranty: { select: { warrantyStatus: true, warrantyStartDate: true, warrantyExpiryDate: true, warrantyDaysRemaining: true } },
      driverInfo: { select: { driverStatus: true, installedDriverVersion: true, latestDriverVersion: true, latestDriverDownloadUrl: true } },
    },
  });

  if (!device) {
    return NextResponse.json({
      found: false,
      uuid: deviceUuid,
      message: "Device not found. This QR code may not be registered in our system.",
    });
  }

  const warrantyDaysRemaining = device.warrantyEndDate
    ? Math.ceil((new Date(device.warrantyEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return NextResponse.json({
    found: true,
    uuid: deviceUuid,
    device: {
      id: device.id,
      deviceUuid: device.deviceUuid,
      passportNumber: device.passportNumber,
      productName: device.product?.name ?? device.deviceName,
      productBrand: device.product?.brand ?? device.brand,
      productModel: device.product?.model ?? device.model,
      productImage: device.product?.imageUrl ?? device.productImage,
      productSlug: device.product?.slug,
      serialNumber: device.serialNumber,
      manufacturer: device.manufacturer,
      firmwareVersion: device.firmwareVersion,
      hardwareRevision: device.hardwareRevision,
      productCode: device.productCode,
      deviceStatus: device.deviceStatus,
      warrantyStatus: device.warranty?.warrantyStatus ?? "unknown",
      warrantyStartDate: device.warrantyStartDate ?? device.warranty?.warrantyStartDate,
      warrantyEndDate: device.warrantyEndDate ?? device.warranty?.warrantyExpiryDate,
      warrantyDaysRemaining: warrantyDaysRemaining ?? device.warranty?.warrantyDaysRemaining,
      customerName: device.customer?.name,
      dealerName: device.dealer?.name,
      invoiceNumber: device.invoiceNumber,
      purchaseDate: device.purchaseDate,
      registrationDate: device.registrationDate,
      activationDate: device.activationDate,
      driverStatus: device.driverInfo?.driverStatus ?? "unknown",
      latestDriverVersion: device.driverInfo?.latestDriverVersion,
      latestDriverDownloadUrl: device.driverInfo?.latestDriverDownloadUrl,
      duplicateSerialFlag: device.duplicateSerialFlag,
      fingerprintQuality: device.fingerprintQuality,
    },
  });
}
