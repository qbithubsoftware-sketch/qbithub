/**
 * GET /api/account/devices — list the authenticated user's registered devices.
 *
 * Returns: { devices: [{ id, productName, model, serialNumber, purchaseDate,
 *   warrantyStatus, warrantyExpiry, firmwareVersion, driverVersion, qrCode }] }
 *
 * Data source: joins the existing FSMCustomerAsset (customer-owned device
 * record) with DeviceWarranty (warranty details). The user's email from the
 * NextAuth session is matched against FSMCustomer.email.
 *
 * If the user has no FSMCustomer row yet (i.e. a brand-new public_customer
 * who has never had a work order), returns an empty array — the UI shows
 * an empty-state CTA.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
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
