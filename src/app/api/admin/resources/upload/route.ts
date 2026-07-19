/**
 * POST /api/admin/resources/upload
 *
 * Uploads a file to the Storage Service and returns the storage metadata.
 * This endpoint is called by the GlobalResourceLibrary's file upload handler.
 *
 * Accepts: multipart/form-data with field "file"
 * Returns: { storageKey, fileName, originalFileName, mimeType, fileSize }
 *
 * The frontend then uses this metadata when creating/updating a Resource
 * via POST/PUT /api/admin/resources.
 *
 * Security: requireSuperAdminOrAdmin
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { StorageService } from "@/lib/storage/storage";

export async function POST(req: NextRequest) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json(
      { error: "Administrator access required" },
      { status: 403 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Use multipart/form-data with field 'file'." },
        { status: 400 },
      );
    }

    // ===== Read file into buffer =====
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ===== Upload via Storage Service =====
    const result = await StorageService.upload(
      buffer,
      file.name,
      file.type || "application/octet-stream",
    );

    console.log(`[ResourceUpload] ${file.name} → ${result.storageKey} (${result.fileSize} bytes)`);

    return NextResponse.json({
      success: true,
      storageKey: result.storageKey,
      fileName: result.fileName,
      originalFileName: result.originalFileName,
      mimeType: result.mimeType,
      fileSize: result.fileSize,
    });
  } catch (error) {
    console.error("[API ERROR] POST /api/admin/resources/upload:", error);
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}
