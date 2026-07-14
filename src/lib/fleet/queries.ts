/**
 * Fleet queries — builds Prisma where clauses + computes fleet status
 * from DevicePassport + DriverInformation + FirmwareInformation.
 */

import { db } from "@/lib/db";
import type { FleetFilters, FleetDeviceDTO, FleetDeviceStatus, FleetStatsDTO } from "./types";

/**
 * Builds a Prisma where clause from FleetFilters.
 */
export function buildWhereClause(filters: FleetFilters): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  if (filters.customerId) {
    where.branch = { customerId: filters.customerId };
  }
  if (filters.branchId) where.branchId = filters.branchId;
  if (filters.deviceType) {
    where.product = { deviceType: filters.deviceType };
  }
  if (filters.brand) where.brand = { contains: filters.brand, mode: "insensitive" };
  if (filters.model) where.model = { contains: filters.model, mode: "insensitive" };
  if (filters.engineerId) where.assignedEngineerId = filters.engineerId;
  if (filters.connectionType) where.connectionType = filters.connectionType;
  if (filters.search) {
    where.OR = [
      { serialNumber: { contains: filters.search, mode: "insensitive" } },
      { deviceName: { contains: filters.search, mode: "insensitive" } },
      { model: { contains: filters.search, mode: "insensitive" } },
      { hardwareId: { contains: filters.search, mode: "insensitive" } },
      { passportNumber: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return where;
}

/**
 * Computes fleet status from device passport + driver info + firmware info.
 */
export function computeFleetStatus(passport: {
  deviceStatus: string;
  lastScannedAt: Date | null;
  driverInfo: { driverStatus: string } | null;
  firmwareInfo: { firmwareStatus: string; isCompatible: boolean } | null;
  warranty: { warrantyStatus: string; warrantyDaysRemaining: number | null } | null;
}): FleetDeviceStatus {
  // Check warranty first (highest priority alert)
  if (passport.warranty?.warrantyStatus === "expired" || (passport.warranty?.warrantyDaysRemaining != null && passport.warranty.warrantyDaysRemaining < 0)) {
    return "out_of_warranty";
  }

  // Check driver update
  if (passport.driverInfo?.driverStatus === "update_available" || passport.driverInfo?.driverStatus === "missing") {
    return "driver_update";
  }

  // Check firmware update
  if (passport.firmwareInfo?.firmwareStatus === "update_available" || passport.firmwareInfo?.firmwareStatus === "unsupported") {
    return "firmware_update";
  }

  // Check device status
  if (passport.deviceStatus === "driver_missing" || passport.deviceStatus === "driver_outdated" || passport.deviceStatus === "unsupported") {
    return "attention_required";
  }

  // Check recently scanned (within 24 hours)
  if (passport.lastScannedAt) {
    const hoursSinceScan = (Date.now() - passport.lastScannedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceScan < 24) return "recently_scanned";
  }

  // If device status is ready → online
  if (passport.deviceStatus === "ready") return "online";

  return "unknown";
}

/**
 * Fetches fleet devices with all related data + computes fleet status.
 */
export async function getFleetDevices(
  filters: FleetFilters,
  limit = 200,
): Promise<FleetDeviceDTO[]> {
  const where = buildWhereClause(filters);

  const passports = await db.devicePassport.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      product: true,
      branch: { include: { customer: true } },
      driverInfo: true,
      firmwareInfo: true,
      warranty: true,
      testSessions: { orderBy: { startedAt: "desc" }, take: 1, select: { startedAt: true } },
    },
  });

  return passports.map((p) => {
    const fleetStatus = computeFleetStatus({
      deviceStatus: p.deviceStatus,
      lastScannedAt: p.lastScannedAt,
      driverInfo: p.driverInfo ? { driverStatus: p.driverInfo.driverStatus } : null,
      firmwareInfo: p.firmwareInfo ? { firmwareStatus: p.firmwareInfo.firmwareStatus, isCompatible: p.firmwareInfo.isCompatible ?? false } : null,
      warranty: p.warranty ? { warrantyStatus: p.warranty.warrantyStatus, warrantyDaysRemaining: p.warranty.warrantyDaysRemaining } : null,
    });

    return {
      id: p.id,
      passportNumber: p.passportNumber,
      deviceName: p.deviceName ?? p.product?.name ?? null,
      model: p.model ?? p.product?.model ?? null,
      brand: p.brand ?? p.product?.brand ?? null,
      serialNumber: p.serialNumber,
      deviceType: p.product?.deviceType ?? null,
      connectionType: p.connectionType,
      deviceStatus: p.deviceStatus,
      fleetStatus,
      customerName: p.branch?.customer?.name ?? null,
      companyName: p.branch?.customer?.companyName ?? null,
      branchName: p.branch?.name ?? null,
      branchCity: p.branch?.city ?? null,
      branchState: p.branch?.state ?? null,
      assignedEngineerName: null, // would need User join
      driverStatus: p.driverInfo?.driverStatus ?? null,
      firmwareStatus: p.firmwareInfo?.firmwareStatus ?? null,
      warrantyStatus: p.warranty?.warrantyStatus ?? null,
      warrantyDaysRemaining: p.warranty?.warrantyDaysRemaining ?? null,
      overallHealthScore: null, // would need latest diagnostic session
      lastScannedAt: p.lastScannedAt?.toISOString() ?? null,
      lastTestedAt: p.testSessions[0]?.startedAt?.toISOString() ?? null,
      warrantyExpiry: p.warranty?.warrantyExpiryDate?.toISOString() ?? null,
    } satisfies FleetDeviceDTO;
  });
}

/**
 * Computes aggregate fleet stats.
 */
export async function getFleetStats(filters: FleetFilters): Promise<FleetStatsDTO> {
  const devices = await getFleetDevices(filters, 10000);

  const stats: FleetStatsDTO = {
    totalDevices: devices.length,
    online: 0,
    offline: 0,
    unknown: 0,
    attentionRequired: 0,
    driverUpdateAvailable: 0,
    firmwareUpdateAvailable: 0,
    outOfWarranty: 0,
    recentlyScanned: 0,
    byDeviceType: {},
    byStatus: {},
  };

  for (const d of devices) {
    stats.byStatus[d.fleetStatus] = (stats.byStatus[d.fleetStatus] ?? 0) + 1;
    if (d.deviceType) stats.byDeviceType[d.deviceType] = (stats.byDeviceType[d.deviceType] ?? 0) + 1;

    switch (d.fleetStatus) {
      case "online": stats.online++; break;
      case "offline": stats.offline++; break;
      case "unknown": stats.unknown++; break;
      case "attention_required": stats.attentionRequired++; break;
      case "driver_update": stats.driverUpdateAvailable++; break;
      case "firmware_update": stats.firmwareUpdateAvailable++; break;
      case "out_of_warranty": stats.outOfWarranty++; break;
      case "recently_scanned": stats.recentlyScanned++; break;
    }
  }

  return stats;
}
