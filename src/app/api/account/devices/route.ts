/**
 * GET /api/account/devices — list the authenticated user's registered devices.
 *
 * SECURITY: Customer-scoped. Uses requireCustomer() to ensure only
 * public_customer role can call this. The session user's email is matched
 * against FSMCustomer.email — Customer A can never see Customer B's devices.
 *
 * Returns: { devices: [{ id, productName, model, serialNumber, purchaseDate,
 *   warrantyStatus, warrantyExpiry, firmwareVersion, driverVersion, qrCode }] }
 *
 * If the customer has never purchased a QBIT product (no FSMCustomer row +
 * no FSMCustomerAsset rows), returns an empty array — the UI shows the
 * "No registered QBIT products found" empty-state CTA.
 */

import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/notifications/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await requireCustomer();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Customer authentication required" }, { status: 401 });
  }

  // Find the FSMCustomer by email — this is the customer-asset owner.
  // (V3 note: a dedicated `Customer` model doesn't exist yet; FSMCustomer
  //  is the closest existing equivalent. Reusing it preserves all existing
  //  service-order history and warranty data.)
  const customer = await db.fSMCustomer.findFirst({
    where: { email: session.user.email },
    include: {
      assets: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) {
    // Brand-new customer with no FSM history — return empty list.
    return NextResponse.json({ devices: [] });
  }

  // For each asset, also try to look up warranty info from DeviceWarranty
  // via DevicePassport (matched by serial number).
  const devices = await Promise.all(
    customer.assets.map(async (asset) => {
      // Try to find a DevicePassport with the same serial number.
      const passport = await db.devicePassport.findFirst({
        where: { serialNumber: asset.serialNumber },
        include: { warranty: true },
      });
      return {
        id: asset.id,
        productName: asset.productName,
        model: asset.model,
        serialNumber: asset.serialNumber,
        purchaseDate: asset.purchaseDate?.toISOString() ?? null,
        warrantyStatus: passport?.warranty?.warrantyStatus ?? asset.warrantyStatus ?? "unknown",
        warrantyExpiry:
          passport?.warranty?.warrantyExpiryDate?.toISOString() ??
          asset.warrantyExpiry?.toISOString() ??
          null,
        firmwareVersion: asset.firmwareVersion ?? null,
        driverVersion: asset.driverVersion ?? null,
        qrCode: asset.qrCode ?? passport?.passportNumber ?? null,
      };
    }),
  );

  return NextResponse.json({ devices });
}
