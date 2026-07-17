/**
 * POST /api/admin/upload-image
 *
 * Real image upload endpoint — stores files in /public/uploads/products/
 * and returns the public URL for immediate preview + persistence.
 *
 * Accepts: multipart/form-data with field "file" (single image)
 * Returns: { url: "/uploads/products/<filename>", filename, size, mimeType }
 *
 * SUPPORTED FORMATS: JPG, PNG, WEBP
 * MAX SIZE: 5MB
 *
 * SECURITY: requireAdmin (super_administrator or administrator only).
 *
 * STORAGE:
 *   Files are written to /public/uploads/products/ on the server.
 *   In production (Vercel), this writes to the ephemeral filesystem which
 *   is fine for demo purposes. For production persistence, swap to Vercel
 *   Blob / S3 / Cloudinary by replacing the fs.writeFile call.
 *
 *   The returned URL is a RELATIVE path ("/uploads/products/...") so it
 *   works on any deployment domain (localhost:3000, qbithub.vercel.app,
 *   custom domain). No remote-pattern config needed since it's same-origin.
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/notifications/auth";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
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

    // ===== Validate MIME type =====
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type}. Allowed: JPG, PNG, WEBP.`,
        },
        { status: 400 },
      );
    }

    // ===== Validate file size =====
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: 5MB.`,
        },
        { status: 400 },
      );
    }

    // ===== Generate unique filename =====
    // Format: <timestamp>-<random>-<sanitized-original-name>.<ext>
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const sanitizedName = file.name
      .replace(/\.[^.]+$/, "") // strip extension
      .replace(/[^a-zA-Z0-9-_]/g, "-") // sanitize
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    const filename = `${timestamp}-${random}-${sanitizedName || "image"}.${ext}`;

    // ===== Write to /public/uploads/products/ =====
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // directory may already exist — ignore
    }

    const filePath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // ===== Return public URL (relative path — works on any domain) =====
    const url = `/uploads/products/${filename}`;

    return NextResponse.json({
      success: true,
      url,
      filename,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error("[API ERROR] POST /api/admin/upload-image:", error);
    return NextResponse.json(
      { error: "Internal server error during image upload." },
      { status: 500 },
    );
  }
}
