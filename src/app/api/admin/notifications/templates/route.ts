/**
 * GET  /api/admin/notifications/templates          — list all templates
 * POST /api/admin/notifications/templates          — create a new template
 * PATCH /api/admin/notifications/templates/[id]    — update a template (separate route)
 *
 * Query params for GET:
 *   - event: filter by event
 *   - channel: filter by channel
 *   - recipientType: filter by recipient type
 *   - isActive: "true" | "false"
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/notifications/auth";
import { sanitizeText, validateRequired } from "@/lib/security/validation";
import { extractVariables, KNOWN_VARIABLES } from "@/lib/notifications/template-engine";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const url = new URL(req.url);
  const event = url.searchParams.get("event");
  const channel = url.searchParams.get("channel");
  const recipientType = url.searchParams.get("recipientType");
  const isActive = url.searchParams.get("isActive");

  const where: Record<string, unknown> = {};
  if (event) where.event = event;
  if (channel) where.channel = channel;
  if (recipientType) where.recipientType = recipientType;
  if (isActive !== null) {
    where.isActive = isActive === "true";
  }

  const templates = await db.notificationTemplate.findMany({
    where,
    orderBy: [{ event: "asc" }, { channel: "asc" }],
    take: 200,
  });

  return NextResponse.json({
    items: templates.map((t) => ({
      ...t,
      variables: extractVariables(t.body),
      unknownVariables: extractVariables(t.body).filter((v) => !KNOWN_VARIABLES.includes(v)),
    })),
    total: templates.length,
  });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const missing = validateRequired(body, ["code", "name", "event", "recipientType", "channel", "body"]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  // Check code uniqueness
  const existing = await db.notificationTemplate.findUnique({
    where: { code: body.code },
  });
  if (existing) {
    return NextResponse.json(
      { error: `Template with code "${body.code}" already exists` },
      { status: 409 },
    );
  }

  // Validate variables
  const unknownVars = extractVariables(body.body).filter((v) => !KNOWN_VARIABLES.includes(v));
  if (unknownVars.length > 0) {
    return NextResponse.json(
      { error: `Unknown template variables: ${unknownVars.join(", ")}` },
      { status: 400 },
    );
  }

  const template = await db.notificationTemplate.create({
    data: {
      code: sanitizeText(body.code, 100),
      name: sanitizeText(body.name, 200),
      event: sanitizeText(body.event, 80),
      recipientType: sanitizeText(body.recipientType, 20),
      channel: sanitizeText(body.channel, 20),
      subject: body.subject ? sanitizeText(body.subject, 200) : null,
      body: sanitizeText(body.body, 5000),
      htmlBody: body.htmlBody ? sanitizeText(body.htmlBody, 20000) : null,
      isActive: body.isActive ?? true,
    },
  });

  return NextResponse.json({ template }, { status: 201 });
}
