/**
 * GET   /api/admin/notifications/templates/[id]  — fetch one template
 * PATCH /api/admin/notifications/templates/[id]  — update template (including toggle isActive)
 * DELETE /api/admin/notifications/templates/[id] — soft-delete (set isActive=false)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/notifications/auth";
import { sanitizeText } from "@/lib/security/validation";
import { extractVariables, KNOWN_VARIABLES } from "@/lib/notifications/template-engine";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const { id } = await params;
  const template = await db.notificationTemplate.findUnique({ where: { id } });
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...template,
    variables: extractVariables(template.body),
    unknownVariables: extractVariables(template.body).filter((v) => !KNOWN_VARIABLES.includes(v)),
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const existing = await db.notificationTemplate.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // Validate variables if body is being updated
  if (body.body) {
    const unknownVars = extractVariables(body.body).filter((v) => !KNOWN_VARIABLES.includes(v));
    if (unknownVars.length > 0) {
      return NextResponse.json(
        { error: `Unknown template variables: ${unknownVars.join(", ")}` },
        { status: 400 },
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = sanitizeText(body.name, 200);
  if (body.subject !== undefined) updateData.subject = body.subject ? sanitizeText(body.subject, 200) : null;
  if (body.body !== undefined) updateData.body = sanitizeText(body.body, 5000);
  if (body.htmlBody !== undefined) updateData.htmlBody = body.htmlBody ? sanitizeText(body.htmlBody, 20000) : null;
  if (body.isActive !== undefined) updateData.isActive = !!body.isActive;

  const updated = await db.notificationTemplate.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ template: updated });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await db.notificationTemplate.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // Soft delete — set isActive=false (preserves audit trail)
  await db.notificationTemplate.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ id, deactivated: true });
}
