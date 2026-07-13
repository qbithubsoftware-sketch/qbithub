/**
 * POST /api/fsm/sync — receive an offline mutation from the client's
 * IndexedDB queue (server-side audit copy).
 *
 * This endpoint receives mutations that the client queued while offline.
 * It replays them server-side and records the result in OfflineSyncQueue
 * for audit. The actual mutation (e.g. PATCH work order status) is performed
 * by this endpoint.
 *
 * Body: {
 *   clientQueueId: string,
 *   method: "PATCH" | "POST",
 *   url: string,
 *   body: string (JSON),
 *   workOrderId?: string,
 *   description?: string,
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireEngineerOrAdmin } from "@/lib/notifications/auth";
import { sanitizeText } from "@/lib/security/validation";

export async function POST(req: NextRequest) {
  const session = await requireEngineerOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Engineer access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.clientQueueId || !body.method || !body.url) {
    return NextResponse.json(
      { error: "Missing required fields: clientQueueId, method, url" },
      { status: 400 },
    );
  }

  // Check for duplicate (idempotent — if already synced, return cached result)
  const existing = await db.offlineSyncQueue.findFirst({
    where: { clientQueueId: body.clientQueueId, engineerId: session.user.id },
  });
  if (existing && existing.status === "synced") {
    return NextResponse.json({
      queueId: existing.id,
      status: "synced",
      responseStatus: existing.responseStatus,
      responseBody: existing.responseBody,
      message: "Already synced (idempotent)",
    });
  }

  // Create/update the server-side queue record
  const queueItem = await db.offlineSyncQueue.upsert({
    where: {
      id: existing?.id ?? "nonexistent",
    },
    update: {
      status: "syncing",
      lastAttemptAt: new Date(),
    },
    create: {
      engineerId: session.user.id,
      method: sanitizeText(body.method, 10),
      url: sanitizeText(body.url, 500),
      body: typeof body.body === "string" ? body.body : JSON.stringify(body.body ?? {}),
      status: "syncing",
      clientQueueId: body.clientQueueId,
      lastAttemptAt: new Date(),
    },
  });

  // Replay the mutation
  try {
    const replayResponse = await replayMutation(body.method, body.url, body.body, session.user.id);

    await db.offlineSyncQueue.update({
      where: { id: queueItem.id },
      data: {
        status: "synced",
        syncedAt: new Date(),
        responseStatus: replayResponse.status,
        responseBody: replayResponse.body,
        attempts: { increment: 1 },
      },
    });

    return NextResponse.json({
      queueId: queueItem.id,
      status: "synced",
      responseStatus: replayResponse.status,
      responseBody: replayResponse.body,
    });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await db.offlineSyncQueue.update({
      where: { id: queueItem.id },
      data: {
        status: "failed",
        error,
        attempts: { increment: 1 },
      },
    });

    return NextResponse.json(
      { queueId: queueItem.id, status: "failed", error },
      { status: 500 },
    );
  }
}

/**
 * Replays a mutation by calling the corresponding API route internally.
 * Since we can't do a sub-request easily in serverless, we directly perform
 * the FSM operations here based on the URL pattern.
 */
async function replayMutation(
  method: string,
  url: string,
  body: string,
  engineerId: string,
): Promise<{ status: number; body: string }> {
  // Parse the URL to determine what mutation to replay
  // Example: "/api/fsm/work-orders/wo_94281" with PATCH body { action: "arrived" }

  const urlMatch = url.match(/\/api\/fsm\/work-orders\/([^/]+)$/);
  if (urlMatch && method === "PATCH") {
    const workOrderId = urlMatch[1];
    const parsed = JSON.parse(body) as { action: string; rescheduledTo?: string; reason?: string };

    const wo = await db.workOrder.findUnique({ where: { id: workOrderId } });
    if (!wo) {
      return { status: 404, body: JSON.stringify({ error: "Work order not found" }) };
    }

    if (wo.assignedEngineerId !== engineerId) {
      return { status: 403, body: JSON.stringify({ error: "Not assigned to you" }) };
    }

    const ACTION_TO_STATUS: Record<string, string> = {
      accept: "accepted",
      reject: "cancelled",
      on_the_way: "on_the_way",
      arrived: "arrived",
      start: "installing",
      testing: "testing",
      complete: "completed",
      cancel: "cancelled",
    };

    const action = parsed.action;
    const newStatus = ACTION_TO_STATUS[action];
    if (!newStatus) {
      return { status: 400, body: JSON.stringify({ error: `Unknown action: ${action}` }) };
    }

    const updateData: Record<string, unknown> = { status: newStatus };
    const now = new Date();
    if (action === "arrived") updateData.arrivedAt = now;
    if (action === "start") updateData.startedAt = now;
    if (action === "complete") updateData.completedAt = now;

    await db.workOrder.update({ where: { id: workOrderId }, data: updateData });

    await db.jobTimeline.create({
      data: {
        workOrderId,
        status: newStatus,
        label: newStatus.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        actorId: engineerId,
        actorName: "Engineer (offline sync)",
      },
    });

    return {
      status: 200,
      body: JSON.stringify({ workOrder: { id: workOrderId, status: newStatus } }),
    };
  }

  return { status: 404, body: JSON.stringify({ error: `Cannot replay: ${method} ${url}` }) };
}

/**
 * GET /api/fsm/sync — list sync queue for the current engineer
 */
export async function GET(req: NextRequest) {
  const session = await requireEngineerOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Engineer access required" }, { status: 403 });
  }

  const items = await db.offlineSyncQueue.findMany({
    where: { engineerId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      clientQueueId: i.clientQueueId,
      method: i.method,
      url: i.url,
      status: i.status,
      attempts: i.attempts,
      responseStatus: i.responseStatus,
      error: i.error,
      createdAt: i.createdAt.toISOString(),
      syncedAt: i.syncedAt?.toISOString() ?? null,
    })),
    total: items.length,
  });
}
