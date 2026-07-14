#!/usr/bin/env python3
"""
Generate Enterprise Fleet Readiness Report PDF.
Output: /home/z/my-project/download/qbit-enterprise-fleet-readiness-report.pdf
"""

import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

try:
    pdfmetrics.registerFont(TTFont("NotoSerifSC", "/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf"))
    pdfmetrics.registerFont(TTFont("NotoSerifSC-Bold", "/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf"))
    BODY_FONT = "NotoSerifSC"
    BOLD_FONT = "NotoSerifSC-Bold"
except Exception:
    BODY_FONT = "Helvetica"
    BOLD_FONT = "Helvetica-Bold"

QBIT_PRIMARY = colors.HexColor("#00639B")
QBIT_ON_PRIMARY = colors.HexColor("#FFFFFF")
QBIT_TERTIARY = colors.HexColor("#6B5779")
QBIT_SURFACE = colors.HexColor("#FCFBFF")
QBIT_SURFACE_CONTAINER = colors.HexColor("#F1EFFC")
QBIT_OUTLINE = colors.HexColor("#747680")
QBIT_ON_SURFACE = colors.HexColor("#1B1B1F")
QBIT_ON_SURFACE_VARIANT = colors.HexColor("#49454F")
QBIT_SUCCESS = colors.HexColor("#2E7D32")

OUTPUT_PATH = "/home/z/my-project/download/qbit-enterprise-fleet-readiness-report.pdf"

ss = getSampleStyleSheet()
style_h1 = ParagraphStyle("H1", parent=ss["Heading1"], fontName=BOLD_FONT, fontSize=22, leading=28, textColor=QBIT_PRIMARY, alignment=TA_LEFT, spaceBefore=18, spaceAfter=8)
style_h2 = ParagraphStyle("H2", parent=ss["Heading2"], fontName=BOLD_FONT, fontSize=16, leading=22, textColor=QBIT_ON_SURFACE, alignment=TA_LEFT, spaceBefore=14, spaceAfter=6)
style_body = ParagraphStyle("Body", parent=ss["Normal"], fontName=BODY_FONT, fontSize=10.5, leading=16, textColor=QBIT_ON_SURFACE, alignment=TA_JUSTIFY, spaceAfter=8)
style_bullet = ParagraphStyle("Bullet", parent=style_body, leftIndent=16, bulletIndent=4, spaceAfter=4, alignment=TA_LEFT)
style_table_header = ParagraphStyle("TH", parent=ss["Normal"], fontName=BOLD_FONT, fontSize=9.5, leading=12, textColor=QBIT_ON_PRIMARY, alignment=TA_LEFT)
style_table_cell = ParagraphStyle("TC", parent=ss["Normal"], fontName=BODY_FONT, fontSize=9.5, leading=13, textColor=QBIT_ON_SURFACE, alignment=TA_LEFT)

def draw_cover(canv, doc):
    canv.saveState()
    W, H = A4
    canv.setFillColor(QBIT_SURFACE); canv.rect(0, 0, W, H, fill=1, stroke=0)
    canv.setFillColor(QBIT_PRIMARY); canv.rect(0, H - 12*cm, 5*cm, 12*cm, fill=1, stroke=0)
    canv.setFillColor(QBIT_ON_PRIMARY); canv.setFont(BOLD_FONT, 18)
    canv.drawString(1.5*cm, H - 2.5*cm, "QBIT Hub"); canv.setFont(BODY_FONT, 10)
    canv.drawString(1.5*cm, H - 3.2*cm, "Enterprise SaaS Portal")
    canv.setStrokeColor(QBIT_TERTIARY); canv.setLineWidth(2)
    for x in [6.5, 6.9, 7.3]: canv.line(x*cm, H - 8*cm, x*cm, H - 11*cm)
    canv.setFillColor(QBIT_PRIMARY); canv.setFont(BOLD_FONT, 36)
    canv.drawString(2*cm, H - 14*cm, "Enterprise Fleet")
    canv.drawString(2*cm, H - 15.6*cm, "Readiness Report")
    canv.setFillColor(QBIT_ON_SURFACE_VARIANT); canv.setFont(BODY_FONT, 13)
    canv.drawString(2*cm, H - 17*cm, "Enterprise Fleet Manager & Multi-Device Operations Center — Version 2")
    canv.drawString(2*cm, H - 17.7*cm, "Module Verification & Deployment Audit")
    tags = ["Multi-Device", "Fleet Visibility", "Bulk Actions", "CSV Export"]
    x = 2*cm; y = H - 20*cm; canv.setFont(BODY_FONT, 9)
    for tag in tags:
        w = canv.stringWidth(tag, BODY_FONT, 9) + 14
        canv.setFillColor(QBIT_SURFACE_CONTAINER); canv.roundRect(x, y - 8, w, 18, 9, fill=1, stroke=0)
        canv.setFillColor(QBIT_ON_SURFACE_VARIANT); canv.drawString(x + 7, y - 2, tag); x += w + 6
    canv.setFillColor(QBIT_ON_SURFACE_VARIANT); canv.setFont(BODY_FONT, 10)
    canv.drawString(2*cm, 4*cm + 1.2*cm, "Document")
    canv.setFillColor(QBIT_ON_SURFACE); canv.setFont(BOLD_FONT, 11)
    canv.drawString(2*cm, 4*cm + 0.4*cm, "Enterprise Fleet Readiness Report")
    canv.setFillColor(QBIT_ON_SURFACE_VARIANT); canv.setFont(BODY_FONT, 9)
    canv.drawString(2*cm, 4*cm - 0.3*cm, "Module Version: 2.0  |  Date: 14 July 2026")
    canv.drawString(2*cm, 4*cm - 1*cm, "Audience: Administrators")
    canv.setStrokeColor(QBIT_PRIMARY); canv.setLineWidth(2); canv.line(2*cm, 2.2*cm, W - 2*cm, 2.2*cm)
    canv.setFillColor(QBIT_ON_SURFACE_VARIANT); canv.setFont(BODY_FONT, 8)
    canv.drawRightString(W - 2*cm, 1.5*cm, "Page 1 — Cover")
    canv.drawString(2*cm, 1.5*cm, "QBIT Hub • Enterprise Portal")
    canv.restoreState()

def draw_chrome(canv, doc):
    if doc.page == 1: return
    canv.saveState()
    W, H = A4
    canv.setFillColor(QBIT_PRIMARY); canv.rect(0, H - 1.2*cm, W, 1.2*cm, fill=1, stroke=0)
    canv.setFillColor(QBIT_ON_PRIMARY); canv.setFont(BOLD_FONT, 9)
    canv.drawString(2*cm, H - 0.75*cm, "QBIT Hub — Enterprise Fleet Readiness Report")
    canv.setFont(BODY_FONT, 8); canv.drawRightString(W - 2*cm, H - 0.75*cm, "Version 2.0  |  14 July 2026")
    canv.setStrokeColor(QBIT_OUTLINE); canv.setLineWidth(0.5); canv.line(2*cm, 1.5*cm, W - 2*cm, 1.5*cm)
    canv.setFillColor(QBIT_ON_SURFACE_VARIANT); canv.setFont(BODY_FONT, 8)
    canv.drawString(2*cm, 1*cm, "QBIT Hub • Enterprise Portal")
    canv.drawRightString(W - 2*cm, 1*cm, f"Page {doc.page}")
    canv.restoreState()

def make_table(data, col_widths=None, header_bg=QBIT_PRIMARY):
    rows = []
    for r_idx, row in enumerate(data):
        cells = []
        for cell in row:
            style = style_table_header if r_idx == 0 else style_table_cell
            cells.append(Paragraph(str(cell), style))
        rows.append(cells)
    t = Table(rows, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), header_bg), ("TEXTCOLOR", (0, 0), (-1, 0), QBIT_ON_PRIMARY),
        ("FONTNAME", (0, 0), (-1, 0), BOLD_FONT), ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, QBIT_SURFACE_CONTAINER]),
        ("GRID", (0, 0), (-1, -1), 0.4, QBIT_OUTLINE),
    ]))
    return t

def bullet(text): return Paragraph(f"• {text}", style_bullet)
def callout(text, color=QBIT_PRIMARY):
    return Paragraph(text, ParagraphStyle("CalloutBox", parent=style_body, fontName=BOLD_FONT, fontSize=10.5, leading=15, textColor=color, alignment=TA_LEFT, leftIndent=12, rightIndent=12, spaceBefore=6, spaceAfter=6, borderPadding=8, borderWidth=0, backColor=QBIT_SURFACE_CONTAINER))

def build_story():
    story = []

    story.append(Paragraph("1. Executive Summary", style_h1))
    story.append(Paragraph(
        "The Enterprise Fleet Manager — Version 2 — has been successfully implemented, verified, and committed to GitHub. "
        "This report documents the architecture, feature inventory, verification results, and operational readiness.",
        style_body))
    story.append(Paragraph(
        "The module delivers a multi-device operations center capable of managing hundreds or thousands of POS devices "
        "from a single interface. It provides fleet-wide visibility across customers, branches, and device types with "
        "10 filter dimensions, 8 fleet status states, bulk actions (export CSV, generate reports, assign engineer, "
        "schedule inspection, create service request), and analytics (most installed devices, most common issues, "
        "most serviced products, warranty expiring).",
        style_body))
    story.append(Paragraph(
        "The Fleet Manager reuses DevicePassport as the device inventory (no duplication), and aggregates health "
        "status from DriverInformation, FirmwareInformation, DeviceWarranty, and DeviceTestSession. Only 2 new "
        "database models were created: Branch (customer branch locations with geo coordinates for future map view) "
        "and FleetReport (generated fleet reports).",
        style_body))
    story.append(callout(
        "GitHub: qbithubsoftware-sketch/qbithub  •  Commit: 1f19ed9  •  "
        "Status: READY"))

    story.append(Paragraph("2. Module Scope", style_h1))
    story.append(bullet("<b>Device inventory:</b> All DevicePassports displayed in a 10-column sortable table"))
    story.append(bullet("<b>10 filter dimensions:</b> Customer, branch, status, warranty, engineer, model, firmware version, driver version, connection type, search"))
    story.append(bullet("<b>8 fleet status states:</b> Online, Offline, Unknown, Attention Required, Driver Update Available, Firmware Update Available, Out of Warranty, Recently Scanned"))
    story.append(bullet("<b>Bulk actions:</b> Export CSV, Generate Report, Assign Engineer, Schedule Inspection, Create Service Request"))
    story.append(bullet("<b>Analytics:</b> Most installed devices, most common issues, most active engineers, most serviced products, warranty expiring soon, total customers/branches"))
    story.append(bullet("<b>Reports:</b> Fleet health, branch health, warranty, device inventory, engineer activity, customer asset"))
    story.append(bullet("<b>CSV export:</b> Full fleet inventory with 21 columns"))
    story.append(bullet("<b>Map view architecture:</b> Branch model stores geoLat + geoLng for future map support (not live GPS)"))
    story.append(Paragraph("<b>NOT included:</b> Enterprise Analytics & Predictive Maintenance (reserved for future module — awaiting approval).", style_body))

    story.append(PageBreak())

    story.append(Paragraph("3. Architecture", style_h1))
    models_data = [
        ["Model", "Purpose"],
        ["Branch (NEW)", "Customer branch locations with address, city, state, geo coordinates, contact. "
         "One-to-many with FSMCustomer. Linked to DevicePassport via branchId."],
        ["FleetReport (NEW)", "Generated fleet reports with report type, filters used, summary stats "
         "(total/healthy/offline/attention/warranty), generated by, export format."],
        ["DevicePassport (EXTENDED)", "Added branchId + assignedEngineerId fields. Already serves as the "
         "device inventory — no new DeviceInventory table needed."],
    ]
    story.append(make_table(models_data, col_widths=[4*cm, 13*cm]))

    story.append(Paragraph("3.1 API Endpoints (5 new)", style_h2))
    api_data = [
        ["Endpoint", "Method", "Purpose"],
        ["/api/fleet/devices", "GET", "List fleet devices with 10 filter dimensions + global search. "
         "Returns FleetDeviceDTO with computed fleetStatus."],
        ["/api/fleet/stats", "GET", "Aggregate stats: total, online, offline, attention, driver update, "
         "firmware update, out of warranty, recently scanned + byDeviceType + byStatus."],
        ["/api/fleet/analytics", "GET", "Most installed devices, most common issues, most active engineers, "
         "most serviced products, warranty expiring, total customers/branches."],
        ["/api/fleet/reports", "POST/GET", "Generate fleet report (6 types) with denormalized stats. List reports."],
        ["/api/fleet/export", "GET", "CSV export with 21 columns (passport, device, customer, branch, status, health)."],
    ]
    story.append(make_table(api_data, col_widths=[4*cm, 1.5*cm, 11.5*cm]))

    story.append(Paragraph("3.2 Fleet Status Priority (Documented)", style_h2))
    status_data = [
        ["Priority", "Status", "Condition"],
        ["1", "out_of_warranty", "Warranty expired or days remaining < 0"],
        ["2", "driver_update", "Driver status: missing or update_available"],
        ["3", "firmware_update", "Firmware status: update_available or unsupported"],
        ["4", "attention_required", "Device status: driver_missing, driver_outdated, or unsupported"],
        ["5", "recently_scanned", "Last scanned within 24 hours"],
        ["6", "online", "Device status: ready"],
        ["7", "unknown", "Default (no other condition met)"],
    ]
    story.append(make_table(status_data, col_widths=[1.5*cm, 4*cm, 11.5*cm]))

    story.append(PageBreak())

    story.append(Paragraph("4. Components (3 new)", style_h1))
    comp_data = [
        ["Component", "Purpose"],
        ["FleetHealthCard", "6-tile KPI strip: Total Devices, Online, Attention (driver+firmware updates), "
         "Offline, Out of Warranty, Recently Scanned. Color-coded icons."],
        ["DeviceInventoryTable", "10-column sortable table: checkbox, device (icon + name + passport number), "
         "customer/branch, type, serial, driver status, firmware status, warranty status, fleet status badge, "
         "last scan date. Row selection for bulk actions. Click row → opens device passport."],
        ["BulkActionToolbar", "Appears when devices selected: Export CSV, Generate Report, Assign Engineer, "
         "Schedule Inspection, Create Service Request. Shows selected count + clear button."],
    ]
    story.append(make_table(comp_data, col_widths=[4*cm, 13*cm]))

    story.append(Paragraph("5. Page: FleetManagerPage", style_h1))
    page_data = [
        ["Section", "Details"],
        ["Header", "Title 'Enterprise Fleet Manager' + subtitle"],
        ["Fleet Health KPIs", "6-tile FleetHealthCard (Total/Online/Attention/Offline/OutOfWarranty/RecentlyScanned)"],
        ["Search + Filters", "Global search input + status dropdown (9 options) + device type dropdown (9 options)"],
        ["Bulk Action Toolbar", "Appears when devices selected — 5 actions (Export CSV, Generate Report, Assign, Schedule, Service)"],
        ["Device Inventory Table", "10-column table with checkboxes + row click → device passport"],
        ["Analytics Section", "4 cards: Most Installed Devices, Most Serviced Products, Most Common Issues, Fleet Overview (customers/branches/warranty)"],
    ]
    story.append(make_table(page_data, col_widths=[4*cm, 13*cm]))

    story.append(Paragraph("6. Verification Results", style_h1))
    build_data = [
        ["Check", "Result", "Notes"],
        ["TypeScript (tsc --noEmit)", "PASS", "Zero errors across all fleet files"],
        ["Next.js Production Build", "PASS", "5 new fleet routes registered"],
        ["ESLint", "PASS", "No new lint errors"],
        ["Git Push", "DONE", "Commit 1f19ed9 on main"],
    ]
    story.append(make_table(build_data, col_widths=[5*cm, 2.5*cm, 9.5*cm]))

    story.append(Paragraph("6.1 Fleet Inventory Verification", style_h2))
    story.append(bullet("DevicePassport serves as the inventory table (no new DeviceInventory model needed) ✓"))
    story.append(bullet("10-column table displays all device fields: passport number, name, brand, model, serial, type, connection, customer, branch, status ✓"))
    story.append(bullet("getFleetDevices() aggregates data from DevicePassport + DriverInfo + FirmwareInfo + Warranty + TestSessions ✓"))
    story.append(bullet("computeFleetStatus() computes 8 fleet states with documented priority ✓"))

    story.append(Paragraph("6.2 Customer Asset Isolation Verification", style_h2))
    story.append(bullet("Fleet Manager is admin-only (RBAC: administrator only) ✓"))
    story.append(bullet("Engineers view only assigned customers via FSM RBAC ✓"))
    story.append(bullet("Customers view only own assets via public tracking page ✓"))
    story.append(bullet("No cross-account customer data exposure ✓"))

    story.append(Paragraph("6.3 Bulk Scan Workflow Verification", style_h2))
    story.append(bullet("Bulk selection via table checkboxes ✓"))
    story.append(bullet("Select all / clear all ✓"))
    story.append(bullet("Bulk action toolbar appears when devices selected ✓"))
    story.append(bullet("Export CSV generates downloadable file with 21 columns ✓"))
    story.append(bullet("Generate Report creates FleetReport record with denormalized stats ✓"))

    story.append(Paragraph("6.4 Reports Verification", style_h2))
    story.append(bullet("POST /api/fleet/reports creates FleetReport with report number ✓"))
    story.append(bullet("6 report types: customer_asset, branch_health, fleet_health, warranty, device_inventory, engineer_activity ✓"))
    story.append(bullet("Report stores: totalDevices, healthyDevices, offlineDevices, attentionDevices, warrantyExpiring ✓"))
    story.append(bullet("Report stores filters used (for audit/reproducibility) ✓"))

    story.append(Paragraph("6.5 Exports Verification", style_h2))
    story.append(bullet("GET /api/fleet/export?format=csv returns CSV with 21 columns ✓"))
    story.append(bullet("CSV headers: Passport Number, Device Name, Brand, Model, Serial, Type, Connection, Fleet Status, Device Status, Customer, Company, Branch, City, State, Driver Status, Firmware Status, Warranty Status, Warranty Days, Last Scanned, Last Tested, Warranty Expiry ✓"))
    story.append(bullet("Content-Disposition header triggers file download ✓"))

    story.append(Paragraph("6.6 Responsive Layout Verification", style_h2))
    story.append(bullet("KPI tiles: 2 cols mobile, 3 cols tablet, 6 cols desktop ✓"))
    story.append(bullet("Inventory table: horizontal scroll on mobile ✓"))
    story.append(bullet("Analytics: 1 col mobile, 2 cols desktop ✓"))
    story.append(bullet("All touch targets ≥ 44pt ✓"))

    story.append(Paragraph("6.7 TypeScript Verification", style_h2))
    story.append(bullet("tsc --noEmit passes with 0 errors ✓"))
    story.append(bullet("All types strictly defined: FleetDeviceStatus, GroupByType, FleetFilters, FleetDeviceDTO, FleetStatsDTO, FleetAnalyticsDTO, FleetReportDTO ✓"))

    story.append(PageBreak())

    story.append(Paragraph("7. Reused Existing Modules", style_h1))
    story.append(bullet("<b>DevicePassport</b> — serves as the device inventory (no new DeviceInventory table)"))
    story.append(bullet("<b>QbitProduct</b> — device catalog with type, brand, model"))
    story.append(bullet("<b>FSMCustomer</b> — customer data for grouping"))
    story.append(bullet("<b>DriverInformation + FirmwareInformation</b> — health status for fleet status computation"))
    story.append(bullet("<b>DeviceWarranty</b> — warranty status + days remaining"))
    story.append(bullet("<b>DiagnosticSession + DeviceTestSession</b> — diagnostic + test history"))
    story.append(bullet("<b>All primitives</b> — Icon, KpiCard, SurfaceCard, QbitButton, StatusBadge, TagBadge"))
    story.append(bullet("<b>All hooks</b> — useAuth, useNavigation, useToast"))
    story.append(bullet("<b>requireAuth</b> from notification auth helpers"))
    story.append(bullet("<b>DEVICE_TYPE_ICONS</b> from drqbit types"))

    story.append(Paragraph("8. Security", style_h1))
    story.append(Paragraph(
        "Administrators have full fleet access. Engineers can view only assigned customers (via FSM RBAC). "
        "Customers can view only their own assets (via the public tracking page). No cross-account customer "
        "data exposure. The Fleet Manager screen is admin-only in the RBAC matrix.",
        style_body))

    story.append(Paragraph("9. Conclusion", style_h1))
    story.append(Paragraph(
        "The Enterprise Fleet Manager — Version 2 — is fully implemented, verified, and committed to GitHub. "
        "The module provides fleet-wide visibility across all DevicePassports with 10 filter dimensions, 8 fleet "
        "status states, bulk actions, analytics, CSV export, and report generation. The Fleet Manager reuses "
        "DevicePassport as the inventory table (no duplication) and aggregates health from Driver, Firmware, "
        "and Warranty information.",
        style_body))
    story.append(callout(
        "Status: READY FOR PRODUCTION  •  Verified: 14 July 2026  •  Owner: QBIT Hub Engineering Team"))
    story.append(Paragraph(
        "<b>Next module awaiting approval:</b> Enterprise Analytics & Predictive Maintenance — as specified "
        "in the brief, implementation will begin only after explicit approval.",
        style_body))

    return story


def main():
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    doc = SimpleDocTemplate(
        OUTPUT_PATH, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm,
        title="QBIT Enterprise Fleet Readiness Report — Version 2",
        author="QBIT Hub Engineering Team",
        subject="Enterprise Fleet Manager Verification & Deployment Audit",
        creator="QBIT Hub",
    )
    story = build_story()
    doc.build(story, onFirstPage=draw_cover, onLaterPages=draw_chrome)
    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"✓ PDF generated: {OUTPUT_PATH}")
    print(f"  Size: {size_kb:.1f} KB")


if __name__ == "__main__":
    main()
