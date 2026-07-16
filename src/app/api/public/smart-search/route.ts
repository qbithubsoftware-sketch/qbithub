/**
 * GET /api/public/smart-search?q=XXX&limit=8
 *
 * Universal smart-search endpoint for the homepage's Smart Search Bar.
 *
 * Returns categorized suggestions based on the query:
 *   - serial    : when input matches a serial-number pattern
 *   - product   : products matching name / model / slug
 *   - driver    : "Drivers for <product>" suggestion when product mentioned
 *   - manual    : "Manual for <product>" suggestion when product mentioned
 *   - firmware  : "Firmware for <product>" suggestion when product mentioned
 *   - video     : "Installation Video for <product>" suggestion
 *   - kb        : Knowledge Base articles matching title
 *   - error     : Common errors matching code or meaning
 *   - category  : product categories matching name
 *   - faq       : FAQ questions matching
 *
 * Each suggestion has: { type, label, sublabel, icon, url, productSlug? }
 * The frontend uses these to:
 *   - Render an autocomplete dropdown within ~150ms
 *   - Route to the correct page on selection
 *   - For products → render a Product Preview Card below the search bar
 *     (don't immediately redirect)
 *   - For serials → trigger the existing /api/public/serial-lookup flow
 *
 * Performance: indexed lookups, limit 8 total results, 200ms debounce on
 * the client side keeps this snappy.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Serial-number patterns:
//   - SNQBT000001         → starts with SNQBT + digits
//   - DEMO-T800-001       → DEMO- prefix
//   - W55-250700152       → short prefix + dash + long digit run
//   - SN-XXX-12345        → SN prefix
//   - SE-XXXX             → SE prefix
const SERIAL_PATTERNS = [
  /^SNQBT\d+/i,
  /^DEMO[-_]/i,
  /^SN[-_]/i,
  /^SE[-_]/i,
  /^[A-Z]{1,5}[-_]?\d{6,}/i, // generic: prefix + 6+ digits
];

function looksLikeSerial(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.length < 4) return false;
  return SERIAL_PATTERNS.some((re) => re.test(trimmed));
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "8", 10), 12);

    if (!q || q.length < 2) {
      return NextResponse.json({ suggestions: [], serial: false });
    }

    const suggestions: Array<{
      type: "serial" | "product" | "driver" | "manual" | "firmware" | "video" | "kb" | "error" | "category" | "faq";
      label: string;
      sublabel: string;
      icon: string;
      url: string;
      productSlug?: string;
      productId?: string;
    }> = [];

    const isSerial = looksLikeSerial(q);

    // ===== 1. Serial suggestion (if input matches serial pattern) =====
    if (isSerial) {
      suggestions.push({
        type: "serial",
        label: `Search Serial: ${q}`,
        sublabel: "Open Device Lookup Portal",
        icon: "fingerprint",
        url: `/dr-qbit?serial=${encodeURIComponent(q)}`,
      });
    }

    // ===== 2. Products (search by name, model, slug) =====
    // Run multiple OR clauses in parallel-safe single query
    const products = await db.qbitProduct.findMany({
      where: {
        AND: [
          { isActive: true, status: "active" },
          {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { model: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
              { brand: { contains: q, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true, name: true, model: true, slug: true, brand: true,
        category: true, deviceType: true, imageUrl: true,
        description: true, latestDriverVersion: true, latestFirmwareVersion: true,
      },
      take: 5,
      orderBy: [{ isFeatured: "desc" }, { viewCount: "desc" }],
    });

    for (const p of products) {
      suggestions.push({
        type: "product",
        label: p.name,
        sublabel: `Product · ${p.brand} · ${p.model}`,
        icon: "inventory_2",
        url: `/products/${p.slug}`,
        productSlug: p.slug,
        productId: p.id,
      });

      // Per-product driver/manual/firmware/video suggestions (only show first
      // 2 products' resource links to keep total under limit)
      if (suggestions.filter((s) => s.type === "driver").length < 2) {
        suggestions.push({
          type: "driver",
          label: `Drivers for ${p.model}`,
          sublabel: `Driver Downloads · ${p.latestDriverVersion ?? "Latest"}`,
          icon: "memory",
          url: `/downloads?type=driver&product=${p.slug}`,
          productSlug: p.slug,
        });
      }
      if (suggestions.filter((s) => s.type === "manual").length < 2) {
        suggestions.push({
          type: "manual",
          label: `Manual for ${p.model}`,
          sublabel: "User Manual PDF",
          icon: "menu_book",
          url: `/downloads?type=manual&product=${p.slug}`,
          productSlug: p.slug,
        });
      }
      if (suggestions.filter((s) => s.type === "firmware").length < 1) {
        suggestions.push({
          type: "firmware",
          label: `Firmware for ${p.model}`,
          sublabel: `Latest Firmware · ${p.latestFirmwareVersion ?? "Latest"}`,
          icon: "upgrade",
          url: `/downloads?type=firmware&product=${p.slug}`,
          productSlug: p.slug,
        });
      }
      if (suggestions.filter((s) => s.type === "video").length < 1) {
        suggestions.push({
          type: "video",
          label: `Installation Video for ${p.model}`,
          sublabel: "Video Tutorial",
          icon: "videocam",
          url: `/videos?product=${p.slug}`,
          productSlug: p.slug,
        });
      }
    }

    // ===== 3. Knowledge Base articles =====
    try {
      const articles = await db.knowledgeArticle.findMany({
        where: {
          publishedAt: { lte: new Date() },
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { excerpt: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, title: true, slug: true, excerpt: true, readingTime: true },
        take: 3,
        orderBy: { viewCount: "desc" },
      });
      for (const a of articles) {
        suggestions.push({
          type: "kb",
          label: a.title,
          sublabel: `Knowledge Base · ${a.readingTime} min read`,
          icon: "menu_book",
          url: `/knowledge-base?article=${a.slug}`,
        });
      }
    } catch {
      // KnowledgeArticle table may not exist in some DBs — skip silently.
    }

    // ===== 4. Common Errors (error code search) =====
    try {
      const errors = await db.commonError.findMany({
        where: {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { meaning: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, code: true, meaning: true, severity: true },
        take: 3,
      });
      for (const e of errors) {
        suggestions.push({
          type: "error",
          label: `Error ${e.code}`,
          sublabel: e.meaning,
          icon: "error",
          url: `/knowledge-base?error=${e.code}`,
        });
      }
    } catch {
      // CommonError table may not exist — skip silently.
    }

    // ===== 5. Troubleshooting Issues =====
    try {
      const issues = await db.troubleshootingIssue.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { resolution: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, title: true, slug: true, difficulty: true },
        take: 2,
      });
      for (const i of issues) {
        suggestions.push({
          type: "kb",
          label: i.title,
          sublabel: `Troubleshooting · ${i.difficulty}`,
          icon: "build",
          url: `/knowledge-base?issue=${i.slug}`,
        });
      }
    } catch {
      // TroubleshootingIssue table may not exist — skip silently.
    }

    // ===== 6. FAQ =====
    try {
      const faqs = await db.fAQ.findMany({
        where: { question: { contains: q, mode: "insensitive" } },
        select: { id: true, question: true },
        take: 2,
      });
      for (const f of faqs) {
        suggestions.push({
          type: "faq",
          label: f.question,
          sublabel: "FAQ",
          icon: "help",
          url: `/knowledge-base?faq=${f.id}`,
        });
      }
    } catch {
      // FAQ table may not exist — skip silently.
    }

    // ===== 7. Categories (if query matches a category slug/name) =====
    const CATEGORIES = [
      { name: "Window POS", slug: "window-pos" },
      { name: "Android POS", slug: "android-pos" },
      { name: "Handy POS", slug: "handy-pos" },
      { name: "Thermal Printer", slug: "thermal-printer" },
      { name: "Portable Printer", slug: "portable-printer" },
      { name: "Barcode Printer", slug: "barcode-printer" },
      { name: "Barcode Scanner", slug: "barcode-scanner" },
      { name: "Cash Drawer", slug: "cash-drawer" },
      { name: "Customer Side Display", slug: "customer-side-display" },
      { name: "Self Ordering Kiosk", slug: "self-ordering-kiosk" },
      { name: "Digital Standee", slug: "digital-standee" },
    ];
    const lowerQ = q.toLowerCase();
    for (const c of CATEGORIES) {
      if (c.name.toLowerCase().includes(lowerQ) || c.slug.includes(lowerQ)) {
        suggestions.push({
          type: "category",
          label: c.name,
          sublabel: "Product Category",
          icon: "category",
          url: `/products?category=${c.slug}`,
        });
        break; // only one category suggestion
      }
    }

    // ===== Dedupe + limit =====
    const seen = new Set<string>();
    const deduped = suggestions.filter((s) => {
      const key = `${s.type}:${s.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Priority order (per spec):
    //   1. Serial   2. Product   3. Driver   4. Manual   5. Firmware
    //   6. Video    7. KB        8. Error    9. FAQ      10. Category
    const priority: Record<string, number> = {
      serial: 0, product: 1, driver: 2, manual: 3, firmware: 4,
      video: 5, kb: 6, error: 7, faq: 8, category: 9,
    };
    deduped.sort((a, b) => (priority[a.type] ?? 99) - (priority[b.type] ?? 99));

    return NextResponse.json({
      suggestions: deduped.slice(0, limit),
      serial: isSerial,
      totalFound: deduped.length,
    });
  } catch (error) {
    console.error("[API ERROR] GET /api/public/smart-search:", error);
    return NextResponse.json(
      { suggestions: [], serial: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
