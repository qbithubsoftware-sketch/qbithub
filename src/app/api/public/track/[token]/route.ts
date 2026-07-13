/**
 * GET /api/public/track/[token] — public tracking lookup (no auth required)
 *
 * Returns the full PublicTrackingView for the work order associated with
 * the token. Token is validated + view count incremented server-side.
 *
 * Security:
 *   - Token must be 16-64 chars URL-safe
 *   - Token must be active (not revoked)
 *   - Token must not be expired
 *   - No admin PII, no pricing, no internal notes returned
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateTrackingToken } from "@/lib/tracking/tokens";
import {
  type WorkOrderStatus,
  PROGRESS_STATUSES,
  WORK_ORDER_TYPE_LABELS,
  WORK_ORDER_STATUS_LABELS,
  customerLabelForStatus,
} from "@/lib/fsm/types";
import {
  computeProgressPercent,
  maskPhone,
  getInitials,
  type PublicTrackingView,
} from "@/lib/tracking/types";

interface Params {
  params: Promise<{ token: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { token } = await params;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  const tokenInfo = await validateTrackingToken(token, { ip, userAgent });
  if (!tokenInfo) {
    return NextResponse.json(
      {
        error: "Invalid or expired tracking link",
        message: "This tracking link is no longer valid. Please check your email or WhatsApp for the latest link, or contact support.",
        supportPhone: "1800-123-4567",
      },
      { status: 404 },
    );
  }

  const wo = await db.workOrder.findUnique({
    where: { id: tokenInfo.workOrderId },
    include: {
      customer: true,
      asset: true,
      assignedEngineer: true,
      timeline: { orderBy: { occurredAt: "asc" } },
      report: true,
      feedback: true,
      trackingTokens: {
        where: { id: tokenInfo.tokenId },
        select: { createdAt: true, viewCount: true },
        take: 1,
      },
    },
  });

  if (!wo) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  // Build customer-safe timeline (only forward-progress events)
  const progressSet = new Set<WorkOrderStatus>(PROGRESS_STATUSES);
  const currentStatusIdx = PROGRESS_STATUSES.indexOf(wo.status as WorkOrderStatus);

  const milestones = PROGRESS_STATUSES.map((status, idx) => {
    const timelineEntry = wo.timeline.find((t) => t.status === status);
    const done = idx <= currentStatusIdx && currentStatusIdx >= 0;
    const isCurrent = idx === currentStatusIdx;
    return {
      status,
      label: customerLabelForStatus(status),
      description: timelineEntry?.description ?? null,
      occurredAt: timelineEntry?.occurredAt.toISOString() ?? null,
      done,
      isCurrent,
    };
  });

  const timeline = wo.timeline
    .filter((t) => progressSet.has(t.status as WorkOrderStatus))
    .map((t) => ({
      label: t.label,
      description: t.description,
      occurredAt: t.occurredAt.toISOString(),
    }));

  // Completion block (only if status === 'completed')
  const completion = wo.status === "completed" && wo.completedAt
    ? {
        completedAt: wo.completedAt.toISOString(),
        reportAvailable: !!wo.report,
        feedbackSubmitted: !!wo.feedback,
      }
    : null;

  // Resource URLs (placeholder — in production these would resolve to actual
  // guides/manuals/drivers from the existing Product module)
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://qbithub.vercel.app";
  const installationGuideUrl = wo.asset
    ? `${baseUrl}/?screen=installation-center&model=${encodeURIComponent(wo.asset.model)}`
    : null;
  const manualUrl = wo.asset
    ? `${baseUrl}/?screen=driver-download-center&category=manual&model=${encodeURIComponent(wo.asset.model)}`
    : null;
  const driverDownloadUrl = wo.asset
    ? `${baseUrl}/?screen=driver-download-center&category=driver&model=${encodeURIComponent(wo.asset.model)}`
    : null;
  const firmwareDownloadUrl = wo.asset
    ? `${baseUrl}/?screen=driver-download-center&category=firmware&model=${encodeURIComponent(wo.asset.model)}`
    : null;
  const videoUrl = `${baseUrl}/?screen=video-training-center`;

  const tokenMeta = wo.trackingTokens[0];

  const payload: PublicTrackingView = {
    jobNumber: wo.jobNumber,
    workType: wo.type as never,
    workTypeLabel: WORK_ORDER_TYPE_LABELS[wo.type as keyof typeof WORK_ORDER_TYPE_LABELS] ?? wo.type,
    status: wo.status as WorkOrderStatus,
    statusLabel: WORK_ORDER_STATUS_LABELS[wo.status as WorkOrderStatus] ?? wo.status,

    customerName: wo.customer.name,
    companyName: wo.customer.companyName,

    productName: wo.asset?.productName ?? null,
    model: wo.asset?.model ?? null,
    serialNumber: wo.asset?.serialNumber ?? null,
    warrantyStatus: wo.asset?.warrantyStatus ?? null,
    warrantyExpiry: wo.asset?.warrantyExpiry?.toISOString() ?? null,
    firmwareVersion: wo.asset?.firmwareVersion ?? null,
    driverVersion: wo.asset?.driverVersion ?? null,

    scheduledDate: wo.scheduledDate.toISOString(),
    scheduledTime: wo.scheduledTime,
    estimatedMinutes: wo.estimatedMinutes,

    engineerName: wo.assignedEngineer?.name ?? null,
    engineerPhone: wo.assignedEngineer ? maskPhone(wo.assignedEngineer.email ? "+91 90000 00000" : "") : null,
    engineerInitials: getInitials(wo.assignedEngineer?.name ?? null),
    engineerPhotoUrl: wo.assignedEngineer?.image ?? null,

    supportPhone: "1800-123-4567",
    supportEmail: "support@qbithub.com",

    progressPercent: computeProgressPercent(wo.status as WorkOrderStatus),
    milestones,
    timeline,

    completion,

    installationGuideUrl,
    manualUrl,
    driverDownloadUrl,
    firmwareDownloadUrl,
    videoUrl,

    tokenCreatedAt: tokenMeta?.createdAt.toISOString() ?? new Date().toISOString(),
    tokenViewCount: tokenMeta?.viewCount ?? 0,
  };

  // Masked engineer phone — never expose actual engineer contact details
  if (wo.assignedEngineer) {
    payload.engineerPhone = "+91 90000 00000"; // masked engineer line
  }

  return NextResponse.json(payload);
}
