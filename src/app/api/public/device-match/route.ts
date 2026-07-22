/**
 * GET /api/public/device-match?vendorId=0x04B8&productId=0x0202
 *
 * Public VID/PID matching endpoint — checks if a detected USB device
 * matches a known QBIT product in the HardwareSignature database.
 *
 * SECURITY MODEL:
 *   This is a PUBLIC endpoint (no auth required) because it only returns
 *   product name, model, and brand — no internal IDs, no admin info.
 *   It's used by the Customer Portal when a USB device is detected but
 *   doesn't expose a serial number (so serial-lookup can't be used).
 *
 * RATE LIMITING:
 *   Simple in-memory rate limit: max 20 requests per minute per IP.
 *   Prevents abuse while allowing normal discovery usage.
 *
 * RESPONSE:
 *   { matched: true, product: { name, model, brand, deviceType } }
 *   { matched: false }  — no known product found for this VID/PID
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Simple in-memory rate limit (resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_PER_MINUTE = 20;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= RATE_LIMIT_PER_MINUTE) {
    return false;
  }
  entry.count++;
  return true;
}

export async function GET(req: NextRequest) {
  // Rate limit
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
  }

  const vendorId = req.nextUrl.searchParams.get("vendorId")?.trim();
  const productId = req.nextUrl.searchParams.get("productId")?.trim();
  const manufacturer = req.nextUrl.searchParams.get("manufacturer")?.trim();

  // Need at least VID+PID or manufacturer for matching
  if (!vendorId && !productId && !manufacturer) {
    return NextResponse.json(
      { error: "Provide at least vendorId + productId, or manufacturer parameter" },
      { status: 400 }
    );
  }

  try {
    // Try matching against HardwareSignature table
    // Priority: VID+PID match (highest confidence)
    const whereConditions: Array<Record<string, unknown>> = [];

    if (vendorId && productId) {
      // Normalize: strip "0x" prefix, uppercase
      const normalizedVid = vendorId.toUpperCase().replace(/^0X/, "");
      const normalizedPid = productId.toUpperCase().replace(/^0X/, "");

      // Construct hardwareId pattern for matching
      const hardwareId = `USB\\VID_${normalizedVid}&PID_${normalizedPid}`;

      whereConditions.push(
        { vendorId: normalizedVid, productIdCode: normalizedPid },
        { hardwareId: { contains: `VID_${normalizedVid}&PID_${normalizedPid}` } },
      );
    }

    if (manufacturer) {
      whereConditions.push({ manufacturer: { contains: manufacturer, mode: "insensitive" } });
    }

    const signature = await db.hardwareSignature.findFirst({
      where: { OR: whereConditions },
      include: { product: true },
    });

    if (signature?.product && signature.product.isActive) {
      return NextResponse.json({
        matched: true,
        matchMethod: signature.vendorId && signature.productIdCode ? "vid_pid" : "manufacturer",
        matchConfidence: signature.vendorId && signature.productIdCode ? 1.0 : 0.8,
        product: {
          name: signature.product.name,
          model: signature.product.model,
          brand: signature.product.brand,
          deviceType: signature.product.deviceType,
          slug: signature.product.slug,
        },
      });
    }

    // No match found — this VID/PID is not in our product library
    return NextResponse.json({
      matched: false,
      message: "This device is not recognized as a known QBIT product. An administrator can map it in the Device Detection page.",
    });
  } catch (error) {
    console.error("[API ERROR] GET /api/public/device-match:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
