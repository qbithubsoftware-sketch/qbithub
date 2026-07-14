#!/usr/bin/env python3
"""Generate Enterprise Analytics Readiness Report PDF."""

import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

try:
    pdfmetrics.registerFont(TTFont("NotoSerifSC", "/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf"))
    pdfmetrics.registerFont(TTFont("NotoSerifSC-Bold", "/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf"))
    BODY_FONT = "NotoSerifSC"; BOLD_FONT = "NotoSerifSC-Bold"
except: BODY_FONT = "Helvetica"; BOLD_FONT = "Helvetica-Bold"

QBIT_PRIMARY = colors.HexColor("#00639B"); QBIT_ON_PRIMARY = colors.HexColor("#FFFFFF")
QBIT_TERTIARY = colors.HexColor("#6B5779"); QBIT_SURFACE = colors.HexColor("#FCFBFF")
QBIT_SURFACE_CONTAINER = colors.HexColor("#F1EFFC"); QBIT_OUTLINE = colors.HexColor("#747680")
QBIT_ON_SURFACE = colors.HexColor("#1B1B1F"); QBIT_ON_SURFACE_VARIANT = colors.HexColor("#49454F")
QBIT_SUCCESS = colors.HexColor("#2E7D32")

OUTPUT_PATH = "/home/z/my-project/download/qbit-enterprise-analytics-readiness-report.pdf"

ss = getSampleStyleSheet()
style_h1 = ParagraphStyle("H1", parent=ss["Heading1"], fontName=BOLD_FONT, fontSize=22, leading=28, textColor=QBIT_PRIMARY, alignment=TA_LEFT, spaceBefore=18, spaceAfter=8)
style_h2 = ParagraphStyle("H2", parent=ss["Heading2"], fontName=BOLD_FONT, fontSize=16, leading=22, textColor=QBIT_ON_SURFACE, alignment=TA_LEFT, spaceBefore=14, spaceAfter=6)
style_body = ParagraphStyle("Body", parent=ss["Normal"], fontName=BODY_FONT, fontSize=10.5, leading=16, textColor=QBIT_ON_SURFACE, alignment=TA_JUSTIFY, spaceAfter=8)
style_bullet = ParagraphStyle("Bullet", parent=style_body, leftIndent=16, bulletIndent=4, spaceAfter=4, alignment=TA_LEFT)
style_table_header = ParagraphStyle("TH", parent=ss["Normal"], fontName=BOLD_FONT, fontSize=9.5, leading=12, textColor=QBIT_ON_PRIMARY, alignment=TA_LEFT)
style_table_cell = ParagraphStyle("TC", parent=ss["Normal"], fontName=BODY_FONT, fontSize=9.5, leading=13, textColor=QBIT_ON_SURFACE, alignment=TA_LEFT)

def draw_cover(canv, doc):
    canv.saveState(); W, H = A4
    canv.setFillColor(QBIT_SURFACE); canv.rect(0, 0, W, H, fill=1, stroke=0)
    canv.setFillColor(QBIT_PRIMARY); canv.rect(0, H - 12*cm, 5*cm, 12*cm, fill=1, stroke=0)
    canv.setFillColor(QBIT_ON_PRIMARY); canv.setFont(BOLD_FONT, 18)
    canv.drawString(1.5*cm, H - 2.5*cm, "QBIT Hub"); canv.setFont(BODY_FONT, 10)
    canv.drawString(1.5*cm, H - 3.2*cm, "Enterprise SaaS Portal")
    canv.setStrokeColor(QBIT_TERTIARY); canv.setLineWidth(2)
    for x in [6.5, 6.9, 7.3]: canv.line(x*cm, H - 8*cm, x*cm, H - 11*cm)
    canv.setFillColor(QBIT_PRIMARY); canv.setFont(BOLD_FONT, 36)
    canv.drawString(2*cm, H - 14*cm, "Enterprise Analytics")
    canv.drawString(2*cm, H - 15.6*cm, "Readiness Report")
    canv.setFillColor(QBIT_ON_SURFACE_VARIANT); canv.setFont(BODY_FONT, 13)
    canv.drawString(2*cm, H - 17*cm, "Business Intelligence & Operations Dashboard — Version 2")
    canv.drawString(2*cm, H - 17.7*cm, "Module Verification & Deployment Audit")
    tags = ["Real Data Only", "10 Analytics Tabs", "Evidence-Based Insights", "CSV Export"]
    x = 2*cm; y = H - 20*cm; canv.setFont(BODY_FONT, 9)
    for tag in tags:
        w = canv.stringWidth(tag, BODY_FONT, 9) + 14
        canv.setFillColor(QBIT_SURFACE_CONTAINER); canv.roundRect(x, y - 8, w, 18, 9, fill=1, stroke=0)
        canv.setFillColor(QBIT_ON_SURFACE_VARIANT); canv.drawString(x + 7, y - 2, tag); x += w + 6
    canv.setFillColor(QBIT_ON_SURFACE_VARIANT); canv.setFont(BODY_FONT, 10)
    canv.drawString(2*cm, 4*cm + 1.2*cm, "Document")
    canv.setFillColor(QBIT_ON_SURFACE); canv.setFont(BOLD_FONT, 11)
    canv.drawString(2*cm, 4*cm + 0.4*cm, "Enterprise Analytics Readiness Report")
    canv.setFillColor(QBIT_ON_SURFACE_VARIANT); canv.setFont(BODY_FONT, 9)
    canv.drawString(2*cm, 4*cm - 0.3*cm, "Module Version: 2.0  |  Date: 14 July 2026")
    canv.drawString(2*cm, 4*cm - 1*cm, "Audience: Administrators")
    canv.setStrokeColor(QBIT_PRIMARY); canv.setLineWidth(2); canv.line(2*cm, 2.2*cm, W - 2*cm, 2.2*cm)
    canv.setFillColor(QBIT_ON_SURFACE_VARIANT); canv.setFont(BODY_FONT, 8)
    canv.drawRightString(W - 2*cm, 1.5*cm, "Page 1 — Cover")
    canv.drawString(2*cm, 1.5*cm, "QBIT Hub • Enterprise Portal"); canv.restoreState()

def draw_chrome(canv, doc):
    if doc.page == 1: return
    canv.saveState(); W, H = A4
    canv.setFillColor(QBIT_PRIMARY); canv.rect(0, H - 1.2*cm, W, 1.2*cm, fill=1, stroke=0)
    canv.setFillColor(QBIT_ON_PRIMARY); canv.setFont(BOLD_FONT, 9)
    canv.drawString(2*cm, H - 0.75*cm, "QBIT Hub — Enterprise Analytics Readiness Report")
    canv.setFont(BODY_FONT, 8); canv.drawRightString(W - 2*cm, H - 0.75*cm, "Version 2.0  |  14 July 2026")
    canv.setStrokeColor(QBIT_OUTLINE); canv.setLineWidth(0.5); canv.line(2*cm, 1.5*cm, W - 2*cm, 1.5*cm)
    canv.setFillColor(QBIT_ON_SURFACE_VARIANT); canv.setFont(BODY_FONT, 8)
    canv.drawString(2*cm, 1*cm, "QBIT Hub • Enterprise Portal")
    canv.drawRightString(W - 2*cm, 1*cm, f"Page {doc.page}"); canv.restoreState()

def make_table(data, col_widths=None):
    rows = []
    for r_idx, row in enumerate(data):
        cells = [Paragraph(str(cell), style_table_header if r_idx == 0 else style_table_cell) for cell in row]
        rows.append(cells)
    t = Table(rows, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), QBIT_PRIMARY), ("TEXTCOLOR", (0, 0), (-1, 0), QBIT_ON_PRIMARY),
        ("FONTNAME", (0, 0), (-1, 0), BOLD_FONT), ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, QBIT_SURFACE_CONTAINER]),
        ("GRID", (0, 0), (-1, -1), 0.4, QBIT_OUTLINE),
    ]))
    return t

def bullet(text): return Paragraph(f"• {text}", style_bullet)
def callout(text):
    return Paragraph(text, ParagraphStyle("CalloutBox", parent=style_body, fontName=BOLD_FONT, fontSize=10.5, leading=15, textColor=QBIT_PRIMARY, alignment=TA_LEFT, leftIndent=12, rightIndent=12, spaceBefore=6, spaceAfter=6, borderPadding=8, borderWidth=0, backColor=QBIT_SURFACE_CONTAINER))

def build_story():
    story = []
    story.append(Paragraph("1. Executive Summary", style_h1))
    story.append(Paragraph(
        "The Enterprise Analytics module — Version 2 — has been successfully implemented, verified, and committed to GitHub. "
        "This report documents the architecture, feature inventory, verification results, and operational readiness.", style_body))
    story.append(Paragraph(
        "The module delivers a business intelligence platform that transforms operational data into actionable insights. "
        "It aggregates real data from work orders, diagnostic sessions, device passports, downloads, warranty records, "
        "and knowledge base articles — across 10 analytics tabs (executive, device, engineer, service, customer, warranty, "
        "Dr. QBIT, download, branch, insights). The module NEVER fabricates predictions and only generates insights "
        "supported by collected data.", style_body))
    story.append(callout("GitHub: qbithubsoftware-sketch/qbithub  •  Commit: 713d717  •  Status: READY"))

    story.append(Paragraph("2. Analytics Tabs (10 sections)", style_h1))
    tabs_data = [
        ["Tab", "Metrics Computed"],
        ["Executive Dashboard", "Total customers, installed devices, active devices, installations, relocations, service visits, open/completed work orders"],
        ["Device Analytics", "Most installed products/models/categories, most active/serviced devices, driver/firmware update stats"],
        ["Engineer Performance", "Jobs assigned/completed/pending, average completion hours, ratings, photo compliance, report submission rate"],
        ["Service Analytics", "Most common service requests, installation problems, driver/firmware issues, most viewed KB articles"],
        ["Customer Analytics", "Customer-level aggregation (from existing customer + work order data)"],
        ["Warranty Analytics", "Active, expired, expiring in 30/60/90 days"],
        ["Dr. QBIT Analytics", "Total/successful/failed scans, unknown devices, driver/firmware mismatches, common findings"],
        ["Download Analytics", "Most downloaded drivers/manuals/firmware, most opened KB articles"],
        ["Branch Analytics", "Branch comparison: devices, completed jobs, open jobs by branch/city/state"],
        ["Insights", "Evidence-based insights: highest service frequency, fastest engineer, warranty expiring, driver updates needed"],
    ]
    story.append(make_table(tabs_data, col_widths=[4*cm, 13*cm]))

    story.append(PageBreak())
    story.append(Paragraph("3. Architecture", style_h1))
    models_data = [
        ["Model", "Purpose"],
        ["AnalyticsSnapshot", "Periodic snapshot of key metrics (JSON blob per type). For trend analysis."],
        ["BusinessMetric", "Individual KPI with trend tracking (current vs previous value)."],
        ["EngineerMetric", "Per-engineer performance: jobs, ratings, completion time, compliance."],
        ["DeviceMetric", "Per-device health/activity: scans, tests, diagnostics, failures."],
    ]
    story.append(make_table(models_data, col_widths=[4*cm, 13*cm]))

    story.append(Paragraph("3.1 API Endpoints (11 new)", style_h2))
    api_data = [
        ["Endpoint", "Purpose"],
        ["GET /api/analytics/executive", "8 executive KPIs (customers, devices, work orders)"],
        ["GET /api/analytics/device", "Device analytics (8 metrics + top lists)"],
        ["GET /api/analytics/engineer", "Per-engineer performance metrics"],
        ["GET /api/analytics/service", "Common issues by category + KB views"],
        ["GET /api/analytics/warranty", "Warranty distribution (active/expired/expiring)"],
        ["GET /api/analytics/dr-qbit", "Scan stats + diagnostic findings"],
        ["GET /api/analytics/download", "Most downloaded/viewed"],
        ["GET /api/analytics/branch", "Branch comparison table"],
        ["GET /api/analytics/insights", "Evidence-based insights"],
        ["POST/GET /api/analytics/reports", "Generate + list analytics reports"],
    ]
    story.append(make_table(api_data, col_widths=[5.5*cm, 11.5*cm]))

    story.append(Paragraph("4. Verification Results", style_h1))
    build_data = [
        ["Check", "Result", "Notes"],
        ["TypeScript (tsc --noEmit)", "PASS", "Zero errors across all analytics files"],
        ["Next.js Production Build", "PASS", "10 new analytics routes registered"],
        ["ESLint", "PASS", "No new lint errors"],
        ["Git Push", "DONE", "Commit 713d717 on main"],
    ]
    story.append(make_table(build_data, col_widths=[5*cm, 2.5*cm, 9.5*cm]))

    story.append(Paragraph("4.1 Analytics Accuracy Verification", style_h2))
    story.append(bullet("All metrics computed from real Prisma queries on existing tables ✓"))
    story.append(bullet("No fabricated predictions or placeholder statistics ✓"))
    story.append(bullet("Executive KPIs: direct count() queries on WorkOrder, FSMCustomer, DevicePassport ✓"))
    story.append(bullet("Device analytics: aggregation from DevicePassport + DriverInfo + FirmwareInfo ✓"))
    story.append(bullet("Engineer performance: from WorkOrder + InstallationRating + completedAt timestamps ✓"))
    story.append(bullet("Warranty: from DeviceWarranty with date range queries ✓"))
    story.append(bullet("Dr. QBIT: from ScanSession + DiagnosticFinding counts ✓"))
    story.append(bullet("Download: from Download.downloadCount + KnowledgeArticle.viewCount ✓"))

    story.append(Paragraph("4.2 RBAC Verification", style_h2))
    story.append(bullet("Analytics screen is admin-only (RBAC: administrator only) ✓"))
    story.append(bullet("All API endpoints use requireAuth() ✓"))
    story.append(bullet("Customers view only their own info (via public tracking page) ✓"))
    story.append(bullet("Engineers view only assigned info (via FSM RBAC) ✓"))

    story.append(Paragraph("4.3 Insights Verification (Evidence-Based)", style_h2))
    story.append(bullet("Insight 1: Product with highest service frequency — from WorkOrder groupBy assetId ✓"))
    story.append(bullet("Insight 2: Engineer with fastest completion — from completed WO durations ✓"))
    story.append(bullet("Insight 3: Warranty expiring within 90 days — from DeviceWarranty date queries ✓"))
    story.append(bullet("Insight 4: Driver updates needed — from DriverInformation count ✓"))
    story.append(bullet("Every insight includes evidence string (query description) ✓"))

    story.append(Paragraph("4.4 Responsive Layout Verification", style_h2))
    story.append(bullet("Tab navigation: horizontal scroll on mobile ✓"))
    story.append(bullet("KPI cards: 2 cols mobile, 4 cols desktop ✓"))
    story.append(bullet("Top lists: 1 col mobile, 2 cols desktop ✓"))
    story.append(bullet("Engineer table: horizontal scroll on mobile ✓"))

    story.append(Paragraph("4.5 TypeScript Verification", style_h2))
    story.append(bullet("tsc --noEmit passes with 0 errors ✓"))
    story.append(bullet("All types strictly defined: AnalyticsTab, ExecutiveDashboardDTO, DeviceAnalyticsDTO, EngineerAnalyticsDTO, etc. ✓"))

    story.append(PageBreak())
    story.append(Paragraph("5. Reused Existing Modules", style_h1))
    story.append(bullet("<b>WorkOrder + FSMCustomer + FSMCustomerAsset</b> — service/customer data"))
    story.append(bullet("<b>DevicePassport + QbitProduct</b> — device data"))
    story.append(bullet("<b>DriverInformation + FirmwareInformation + DeviceWarranty</b> — health data"))
    story.append(bullet("<b>DiagnosticSession + DiagnosticFinding</b> — diagnostics data"))
    story.append(bullet("<b>ScanSession + DetectedDevice + UnknownDevice</b> — detection data"))
    story.append(bullet("<b>Download + DownloadHistory + KnowledgeArticle</b> — download/view data"))
    story.append(bullet("<b>Branch</b> — branch locations (from Fleet module)"))
    story.append(bullet("<b>InstallationRating</b> — engineer ratings"))
    story.append(bullet("<b>All primitives</b> — Icon, SurfaceCard, QbitButton, StatusBadge, TagBadge"))

    story.append(Paragraph("6. Security", style_h1))
    story.append(Paragraph(
        "Analytics visibility respects RBAC. Customers view only their own information. Engineers view only assigned "
        "information. Administrators have complete analytics. The analytics screen is admin-only in the RBAC matrix. "
        "All API endpoints use requireAuth() which returns 401 for unauthenticated requests.", style_body))

    story.append(Paragraph("7. Conclusion", style_h1))
    story.append(Paragraph(
        "The Enterprise Analytics module — Version 2 — is fully implemented, verified, and committed to GitHub. "
        "The module provides 10 analytics tabs with real data aggregated from all existing modules — no fabricated "
        "predictions. Evidence-based insights are generated only from collected data, with transparent evidence "
        "strings showing exactly which queries produced each insight.", style_body))
    story.append(callout("Status: READY FOR PRODUCTION  •  Verified: 14 July 2026  •  Owner: QBIT Hub Engineering Team"))
    story.append(Paragraph(
        "<b>Next module awaiting approval:</b> Final Production Readiness Audit — as specified in the brief, "
        "implementation will begin only after explicit approval.", style_body))

    return story

def main():
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    doc = SimpleDocTemplate(OUTPUT_PATH, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm,
        title="QBIT Enterprise Analytics Readiness Report — Version 2", author="QBIT Hub Engineering Team",
        subject="Enterprise Analytics Verification & Deployment Audit", creator="QBIT Hub")
    story = build_story()
    doc.build(story, onFirstPage=draw_cover, onLaterPages=draw_chrome)
    print(f"✓ PDF generated: {OUTPUT_PATH}")
    print(f"  Size: {os.path.getsize(OUTPUT_PATH) / 1024:.1f} KB")

if __name__ == "__main__":
    main()
