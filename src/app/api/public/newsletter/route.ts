/**
 * Public Newsletter API — `/api/public/newsletter`.
 *
 * POST: subscribe to the newsletter.
 * No authentication required.
 *
 * Validates email, generates an unsubscribe token, and stores the
 * subscription.  If the email already exists and is unsubscribed,
 * re-activates it.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, name } = body;

  // Validate email
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  // Check if already subscribed
  const existing = await db.customerNewsletter.findUnique({
    where: { email: String(email).toLowerCase() },
  });

  if (existing) {
    if (existing.active) {
      return NextResponse.json({ message: "You're already subscribed!" });
    }
    // Re-activate
    await db.customerNewsletter.update({
      where: { id: existing.id },
      data: { active: true, name: name ?? existing.name },
    });
    return NextResponse.json({ message: "Subscription re-activated!" });
  }

  // Generate unsubscribe token
  const unsubscribeToken = crypto.randomBytes(32).toString("hex");

  // Create subscription
  const subscription = await db.customerNewsletter.create({
    data: {
      email: String(email).toLowerCase(),
      name: name ?? null,
      unsubscribeToken,
      active: true,
    },
  });

  // In production, send a welcome email with the unsubscribe link here.

  return NextResponse.json(
    { id: subscription.id, message: "Successfully subscribed!" },
    { status: 201 },
  );
}
