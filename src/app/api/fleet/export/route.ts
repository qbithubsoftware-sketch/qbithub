/**
 * GET /api/fleet/export — export fleet inventory as CSV
 * Query params: format=csv (only CSV supported in this version)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/notifications/auth";
import { getFleetDevices } from "@/lib/fleet/queries";
import type { FleetFilters } from "@/lib/fleet/types";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "csv";

  const filters: FleetFilters = {
    customerId: url.searchParams.get("customerId") ?? undefined,
    branchId: url.searchParams.get("branchId") ?? undefined,
    deviceType: url.searchParams.get("deviceType") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
  };

  const devices = await getFleetDevices(filters, 10000);

  if (format === "csv") {
    const headers = [
      "Passport Number", "Device Name", "Brand", "Model", "Serial Number",
      "Device Type", "Connection Type", "Fleet Status", "Device Status",
      "Customer", "Company", "Branch", "City", "State",
      "Driver Status", "Firmware Status", "Warranty Status", "Warranty Days Remaining",
      "Last Scanned", "Last Tested", "Warranty Expiry",
    ];

    const rows = devices.map((d) => [
      d.passportNumber,
      d.deviceName ?? "",
      d.brand ?? "",
      d.model ?? "",
      d.serialNumber ?? "",
      d.deviceType ?? "",
      d.connectionType ?? "",
      d.fleetStatus,
      d.deviceStatus,
      d.customerName ?? "",
      d.companyName ?? "",
      d.branchName ?? "",
      d.branchCity ?? "",
      d.branchState ?? "",
      d.driverStatus ?? "",
      d.firmwareStatus ?? "",
      d.warrantyStatus ?? "",
      d.warrantyDaysRemaining?.toString() ?? "",
      d.lastScannedAt ?? "",
      d.lastTestedAt ?? "",
      d.warrantyExpiry ?? "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="fleet-inventory-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: `Unsupported format: ${format}. Use format=csv.` }, { status: 400 });
}
