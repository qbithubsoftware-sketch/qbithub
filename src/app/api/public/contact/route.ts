/**
 * Public Contact API — `/api/public/contact`.
 *
 * POST: submit a customer inquiry / contact message.
 * No authentication required — this is a public form.
 *
 * Validates required fields, stores the inquiry, and (in production)
 * would trigger an email notification to the support team.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {

  const body = await req.json();
  const { name, email, phone, company, subject, message, productId, productName, category } = body;

  // Validate required fields
  if (!name || !email || !subject || !message) {
    return NextResponse.json(
      { error: "Missing required fields: name, email, subject, message" },
      { status: 400 },
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  // Get IP address for spam tracking
  const ipAddress = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null;

  // Store the inquiry
  const inquiry = await db.customerInquiry.create({
    data: {
      name: String(name).slice(0, 200),
      email: String(email).slice(0, 200),
      phone: phone ? String(phone).slice(0, 50) : null,
      company: company ? String(company).slice(0, 200) : null,
      subject: String(subject).slice(0, 500),
      message: String(message).slice(0, 5000),
      productId: productId ? String(productId) : null,
      productName: productName ? String(productName) : null,
      status: "new",
      priority: "normal",
      ipAddress,
    },
  });

  // In production, trigger email notification to support team here.

  return NextResponse.json(
    { id: inquiry.id, message: "Inquiry received — we'll respond within 1 business hour." },
    { status: 201 },
  );

  } catch (error) {
    console.error("[API ERROR] POST src/app/api/public/contact/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
