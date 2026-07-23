/**
 * Serial Number Search API — GET /api/dr-qbit/uuid/serial-search
 *
 * Handles the Manual Search Workflow from the Master Prompt:
 *   1. Customer enters Serial Number
 *   2. Search Database by serial number
 *   3. If only one record exists → open device profile directly
 *   4. If multiple devices share same Serial Number → display resolution options
 *   5. Resolution options: Invoice Number, Purchase Date, Dealer Name, Mobile, Customer Name, QR Code
 *
 * CRITICAL: Never fail, never reject, never overwrite records when duplicate serial exists.
 * Always use Device UUID as the master identity.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const serialNumber = searchParams.get("serial");
  const invoiceNumber = searchParams.get("invoice");
  const purchaseDate = searchParams.get("purchaseDate");
  const dealerName = searchParams.get("dealerName");
  const mobileNumber = searchParams.get("mobile");
  const customerName = searchParams.get("customerName");

  if (!serialNumber) {
    return NextResponse.json(
      { error: "Serial number is required" },
      { status: 400 },
    );
  }

  // === Search by serial number ===
  const devices = await db.devicePassport.findMany({
    where: { serialNumber },
    include: {
      product: { select: { id: true, name: true, brand: true, model: true, imageUrl: true, deviceType: true } },
      customer: { select: { id: true, name: true, companyName: true, mobileNumber: true, email: true } },
      dealer: { select: { id: true, name: true } },
      warranty: { select: { warrantyStatus: true, warrantyStartDate: true, warrantyExpiryDate: true, warrantyDaysRemaining: true } },
      driverInfo: { select: { driverStatus: true, installedDriverVersion: true, latestDriverVersion: true } },
    },
  });

  if (devices.length === 0) {
    return NextResponse.json({
      found: false,
      count: 0,
      message: "Device not registered. Please register your device or contact support.",
      serialNumber,
    });
  }

  // === Single device found → open directly ===
  if (devices.length === 1) {
    const device = devices[0];
    return NextResponse.json({
      found: true,
      count: 1,
      duplicateSerial: false,
      device: formatDeviceProfile(device),
      message: "Device found.",
    });
  }

  // === Multiple devices with same serial → resolution required ===
  // If additional filters are provided, try to resolve
  if (invoiceNumber || purchaseDate || dealerName || mobileNumber || customerName) {
    const resolved = await resolveDuplicate(devices, {
      invoiceNumber,
      purchaseDate,
      dealerName,
      mobileNumber,
      customerName,
    });

    if (resolved) {
      return NextResponse.json({
        found: true,
        count: devices.length,
        duplicateSerial: true,
        resolved: true,
        device: formatDeviceProfile(resolved),
        resolutionMethod: "filter_match",
        message: "Duplicate Serial Number detected. Device identified using additional verification.",
      });
    }
  }

  // Return all matching devices for manual resolution
  return NextResponse.json({
    found: true,
    count: devices.length,
    duplicateSerial: true,
    resolved: false,
    devices: devices.map(formatDeviceProfile),
    resolutionOptions: [
      { field: "invoiceNumber", label: "Invoice Number", description: "Enter the invoice number from your purchase receipt" },
      { field: "purchaseDate", label: "Purchase Date", description: "Enter the date when you purchased the device" },
      { field: "dealerName", label: "Dealer Name", description: "Enter the name of the dealer who sold the device" },
      { field: "mobileNumber", label: "Registered Mobile Number", description: "Enter the mobile number used during registration" },
      { field: "customerName", label: "Customer Name", description: "Enter the name of the registered customer" },
    ],
    message: "Multiple devices found with this Serial Number. Please verify using one of the following options to identify your specific device.",
  });
}

async function resolveDuplicate(
  devices: Array<Record<string, unknown>>,
  filters: { invoiceNumber?: string | null; purchaseDate?: string | null; dealerName?: string | null; mobileNumber?: string | null; customerName?: string | null },
) {
  for (const device of devices) {
    let match = true;

    if (filters.invoiceNumber && device.invoiceNumber !== filters.invoiceNumber) match = false;
    if (filters.purchaseDate) {
      const deviceDate = device.purchaseDate ? new Date(device.purchaseDate as string).toISOString().split("T")[0] : null;
      if (deviceDate !== filters.purchaseDate) match = false;
    }
    if (filters.dealerName) {
      const dealer = device.dealer as Record<string, unknown> | null;
      if (dealer?.name !== filters.dealerName) match = false;
    }
    if (filters.mobileNumber) {
      const customer = device.customer as Record<string, unknown> | null;
      if (customer?.mobileNumber !== filters.mobileNumber) match = false;
    }
    if (filters.customerName) {
      const customer = device.customer as Record<string, unknown> | null;
      if (!customer?.name?.toString().toLowerCase().includes(filters.customerName.toLowerCase())) match = false;
    }

    if (match) return device;
  }
  return null;
}

function formatDeviceProfile(device: Record<string, unknown>) {
  const product = device.product as Record<string, unknown> | null;
  const customer = device.customer as Record<string, unknown> | null;
  const dealer = device.dealer as Record<string, unknown> | null;
  const warranty = device.warranty as Record<string, unknown> | null;
  const driverInfo = device.driverInfo as Record<string, unknown> | null;

  return {
    id: device.id,
    deviceUuid: device.deviceUuid,
    passportNumber: device.passportNumber,
    qrCode: device.qrCode,
    serialNumber: device.serialNumber,
    deviceName: device.deviceName,
    manufacturer: device.manufacturer,
    brand: device.brand ?? product?.brand,
    model: device.model ?? product?.model,
    productCode: device.productCode,
    firmwareVersion: device.firmwareVersion,
    hardwareRevision: device.hardwareRevision,
    productImage: device.productImage ?? product?.imageUrl,
    deviceStatus: device.deviceStatus,
    duplicateSerialFlag: device.duplicateSerialFlag,
    fingerprintQuality: device.fingerprintQuality,
    primaryIdentifier: device.primaryIdentifier,
    // Product info
    productName: product?.name ?? device.deviceName,
    productType: product?.deviceType ?? device.productCategory,
    // Customer info
    customerName: customer?.name,
    customerCompany: customer?.companyName,
    customerMobile: customer?.mobileNumber,
    customerEmail: customer?.email,
    // Dealer info
    dealerName: dealer?.name,
    // Business fields
    invoiceNumber: device.invoiceNumber,
    purchaseDate: device.purchaseDate,
    warrantyStartDate: device.warrantyStartDate ?? warranty?.warrantyStartDate,
    warrantyEndDate: device.warrantyEndDate ?? warranty?.warrantyExpiryDate,
    warrantyStatus: warranty?.warrantyStatus ?? "unknown",
    warrantyDaysRemaining: warranty?.warrantyDaysRemaining,
    registrationDate: device.registrationDate,
    activationDate: device.activationDate,
    // Driver info
    driverStatus: driverInfo?.driverStatus ?? "unknown",
    installedDriverVersion: driverInfo?.installedDriverVersion,
    latestDriverVersion: driverInfo?.latestDriverVersion,
    // Hardware identifiers (Developer Mode only)
    hardwareFingerprint: device.hardwareFingerprint,
    chipUid: device.chipUid,
    factoryDeviceUuid: device.factoryDeviceUuid,
    ethernetMacAddress: device.ethernetMacAddress,
    bluetoothMacAddress: device.bluetoothMacAddress,
    usbDeviceInstanceId: device.usbDeviceInstanceId,
    vendorId: device.vendorId,
    productIdCode: device.productIdCode,
  };
}
