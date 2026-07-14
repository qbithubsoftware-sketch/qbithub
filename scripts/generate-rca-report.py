#!/usr/bin/env python3
"""
Generate Root Cause Analysis Report PDF.
Output: /home/z/my-project/download/qbit-root-cause-analysis-report.pdf
"""

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
QBIT_ERROR = colors.HexColor("#BA1A1A"); QBIT_WARNING = colors.HexColor("#ED6C02")
QBIT_SURFACE = colors.HexColor("#FCFBFF"); QBIT_SURFACE_CONTAINER = colors.HexColor("#F1EFFC")
QBIT_OUTLINE = colors.HexColor("#747680"); QBIT_ON_SURFACE = colors.HexColor("#1B1B1F")
QBIT_ON_SURFACE_VARIANT = colors.HexColor("#49454F")

OUTPUT_PATH = "/home/z/my-project/download/qbit-root-cause-analysis-report.pdf"

ss = getSampleStyleSheet()
style_h1 = ParagraphStyle("H1", parent=ss["Heading1"], fontName=BOLD_FONT, fontSize=22, leading=28, textColor=QBIT_PRIMARY, alignment=TA_LEFT, spaceBefore=18, spaceAfter=8)
style_h2 = ParagraphStyle("H2", parent=ss["Heading2"], fontName=BOLD_FONT, fontSize=16, leading=22, textColor=QBIT_ON_SURFACE, alignment=TA_LEFT, spaceBefore=14, spaceAfter=6)
style_body = ParagraphStyle("Body", parent=ss["Normal"], fontName=BODY_FONT, fontSize=10.5, leading=16, textColor=QBIT_ON_SURFACE, alignment=TA_JUSTIFY, spaceAfter=8)
style_bullet = ParagraphStyle("Bullet", parent=style_body, leftIndent=16, bulletIndent=4, spaceAfter=4, alignment=TA_LEFT)
style_table_header = ParagraphStyle("TH", parent=ss["Normal"], fontName=BOLD_FONT, fontSize=8, leading=10, textColor=QBIT_ON_PRIMARY, alignment=TA_LEFT)
style_table_cell = ParagraphStyle("TC", parent=ss["Normal"], fontName=BODY_FONT, fontSize=8, leading=10, textColor=QBIT_ON_SURFACE, alignment=TA_LEFT)

def draw_cover(canv, doc):
    canv.saveState(); W, H = A4
    canv.setFillColor(QBIT_SURFACE); canv.rect(0, 0, W, H, fill=1, stroke=0)
    canv.setFillColor(QBIT_ERROR); canv.rect(0, H - 12*cm, 5*cm, 12*cm, fill=1, stroke=0)
    canv.setFillColor(QBIT_ON_PRIMARY); canv.setFont(BOLD_FONT, 18)
    canv.drawString(1.5*cm, H - 2.5*cm, "QBIT Hub"); canv.setFont(BODY_FONT, 10)
    canv.drawString(1.5*cm, H - 3.2*cm, "Enterprise SaaS Portal")
    canv.setStrokeColor(colors.HexColor("#6B5779")); canv.setLineWidth(2)
    for x in [6.5, 6.9, 7.3]: canv.line(x*cm, H - 8*cm, x*cm, H - 11*cm)
    canv.setFillColor(QBIT_ERROR); canv.setFont(BOLD_FONT, 36)
    canv.drawString(2*cm, H - 14*cm, "Root Cause")
    canv.drawString(2*cm, H - 15.6*cm, "Analysis Report")
    canv.setFillColor(QBIT_ON_SURFACE_VARIANT); canv.setFont(BODY_FONT, 13)
    canv.drawString(2*cm, H - 17*cm, "Complete Project Audit — UI to Database Trace")
    canv.drawString(2*cm, H - 17.7*cm, "QBIT Hub Enterprise Portal — Version 2.0")
    tags = ["22 Issues Found", "8 Critical", "9 High", "5 Medium"]
    x = 2*cm; y = H - 20*cm; canv.setFont(BODY_FONT, 9)
    for tag in tags:
        w = canv.stringWidth(tag, BODY_FONT, 9) + 14
        canv.setFillColor(QBIT_SURFACE_CONTAINER); canv.roundRect(x, y - 8, w, 18, 9, fill=1, stroke=0)
        canv.setFillColor(QBIT_ON_SURFACE_VARIANT); canv.drawString(x + 7, y - 2, tag); x += w + 6
    canv.setFillColor(QBIT_ON_SURFACE_VARIANT); canv.setFont(BODY_FONT, 10)
    canv.drawString(2*cm, 4*cm + 1.2*cm, "Document")
    canv.setFillColor(QBIT_ON_SURFACE); canv.setFont(BOLD_FONT, 11)
    canv.drawString(2*cm, 4*cm + 0.4*cm, "Root Cause Analysis Report")
    canv.setFillColor(QBIT_ON_SURFACE_VARIANT); canv.setFont(BODY_FONT, 9)
    canv.drawString(2*cm, 4*cm - 0.3*cm, "Version: 2.0  |  Date: 14 July 2026")
    canv.drawString(2*cm, 4*cm - 1*cm, "Classification: Internal — Architect Review")
    canv.setStrokeColor(QBIT_PRIMARY); canv.setLineWidth(2); canv.line(2*cm, 2.2*cm, W - 2*cm, 2.2*cm)
    canv.setFillColor(QBIT_ON_SURFACE_VARIANT); canv.setFont(BODY_FONT, 8)
    canv.drawRightString(W - 2*cm, 1.5*cm, "Page 1 — Cover")
    canv.drawString(2*cm, 1.5*cm, "QBIT Hub - Enterprise Portal"); canv.restoreState()

def draw_chrome(canv, doc):
    if doc.page == 1: return
    canv.saveState(); W, H = A4
    canv.setFillColor(QBIT_ERROR); canv.rect(0, H - 1.2*cm, W, 1.2*cm, fill=1, stroke=0)
    canv.setFillColor(QBIT_ON_PRIMARY); canv.setFont(BOLD_FONT, 9)
    canv.drawString(2*cm, H - 0.75*cm, "QBIT Hub - Root Cause Analysis Report")
    canv.setFont(BODY_FONT, 8); canv.drawRightString(W - 2*cm, H - 0.75*cm, "Version 2.0  |  14 July 2026")
    canv.setStrokeColor(QBIT_OUTLINE); canv.setLineWidth(0.5); canv.line(2*cm, 1.5*cm, W - 2*cm, 1.5*cm)
    canv.setFillColor(QBIT_ON_SURFACE_VARIANT); canv.setFont(BODY_FONT, 8)
    canv.drawString(2*cm, 1*cm, "QBIT Hub - Enterprise Portal")
    canv.drawRightString(W - 2*cm, 1*cm, f"Page {doc.page}"); canv.restoreState()

def make_table(data, col_widths=None, header_bg=QBIT_ERROR):
    rows = []
    for r_idx, row in enumerate(data):
        cells = [Paragraph(str(cell), style_table_header if r_idx == 0 else style_table_cell) for cell in row]
        rows.append(cells)
    t = Table(rows, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), header_bg), ("TEXTCOLOR", (0, 0), (-1, 0), QBIT_ON_PRIMARY),
        ("FONTNAME", (0, 0), (-1, 0), BOLD_FONT), ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, QBIT_SURFACE_CONTAINER]),
        ("GRID", (0, 0), (-1, -1), 0.4, QBIT_OUTLINE),
    ]))
    return t

def bullet(text): return Paragraph("- " + text, style_bullet)

def build_story():
    story = []

    story.append(Paragraph("1. Executive Summary", style_h1))
    story.append(Paragraph(
        "This report presents the complete root cause analysis of the QBIT Hub Enterprise Portal v2.0. "
        "Every broken button, non-functional feature, and incomplete workflow was traced from UI component "
        "through click handler, API route, backend service, database query, and response. The analysis "
        "identified 22 issues across 6 categories. The root causes are: (1) Stitch UI pages using hardcoded "
        "placeholder data instead of API calls, (2) buttons without onClick handlers, (3) Desktop Agent not "
        "implemented for hardware scanning, (4) download API returning placeholder URLs, (5) product CRUD "
        "API missing PUT/PATCH/DELETE, and (6) upload functionality showing 'coming soon' toasts.",
        style_body))

    story.append(Paragraph("2. Issue Summary", style_h1))
    summary_data = [
        ["Severity", "Count", "Root Cause Category"],
        ["CRITICAL", "8", "No onClick handlers, Desktop Agent missing, Download file endpoint missing"],
        ["HIGH", "9", "Hardcoded placeholder data (22 pages), Product CRUD incomplete, Upload 'coming soon'"],
        ["MEDIUM", "5", "QR generation stub, Import wizard stub, Settings save stub"],
        ["TOTAL", "22", ""],
    ]
    story.append(make_table(summary_data, col_widths=[2.5*cm, 1.5*cm, 13*cm]))

    story.append(PageBreak())

    # ============ CRITICAL ISSUES ============
    story.append(Paragraph("3. CRITICAL Issues (8)", style_h1))

    crit_data = [
        ["ID", "Feature", "Root Cause", "Affected Files", "Required Fix", "Est. Time"],
        ["RCA-001", "Product Management: Add Product button", "Button exists but has NO onClick handler. Renders as static QbitButton with no event binding.",
         "ProductManagementPage.tsx line 181", "Add onClick handler that opens a product create dialog/form. Create POST /api/admin/products endpoint.", "4h"],
        ["RCA-002", "Product Management: Edit button", "Button exists (line 396) but has NO onClick handler. No edit form/dialog exists.",
         "ProductManagementPage.tsx line 396", "Add onClick handler. Create edit dialog. Add PUT /api/admin/products/[id] endpoint.", "4h"],
        ["RCA-003", "Product Management: Delete button", "Button exists (line 403) but has NO onClick handler. No delete confirmation dialog.",
         "ProductManagementPage.tsx line 403", "Add onClick with confirmation dialog. Add DELETE /api/admin/products/[id] endpoint.", "3h"],
        ["RCA-004", "Dr. QBIT: Scan Hardware button", "ScanButton component exists but handleScan() only shows a toast + setTimeout. Does NOT call any API. No Desktop Agent exists.",
         "ScanButton.tsx, desktop-agent-auth.ts", "Desktop Agent (.exe/Electron app) must be built separately. Browser CANNOT access USB/COM hardware. API contract exists (POST /api/dr-qbit/scan) but no agent sends data to it.", "40h+"],
        ["RCA-005", "Downloads: Download button", "API /api/downloads/[id] returns placeholder URL '/api/downloads/[id]/file?token=...' but /file endpoint does NOT exist.",
         "api/downloads/[id]/route.ts", "Create /api/downloads/[id]/file/route.ts that serves the actual file (or redirects to cloud storage signed URL).", "4h"],
        ["RCA-006", "Product Management: Save/Update", "No save/update handler exists. No form state management. No PATCH/PUT API for products.",
         "ProductManagementPage.tsx, dr-qbit/products/route.ts", "Product CRUD API only has GET + POST (create). Missing PUT (update) and DELETE. Need /api/admin/products/[id] with PUT+DELETE.", "6h"],
        ["RCA-007", "Dr. QBIT: Device Passport not opening", "Passport page works for Dr. QBIT-created passports. But ProductManagementPage products are hardcoded ADMIN_ASSETS — not linked to QbitProduct/DevicePassport models.",
         "ProductManagementPage.tsx imports ADMIN_ASSETS (placeholder data)", "Replace hardcoded ADMIN_ASSETS with fetch from /api/dr-qbit/products. Link product management to QbitProduct model.", "8h"],
        ["RCA-008", "Dr. QBIT: Driver Detection missing", "No driver detection UI or API. DriverInformation is populated by passport generator (simulated). No real driver detection from Windows API.",
         "engine.ts (passport generator simulates driver data)", "Desktop Agent must report installed driver version via Windows DriverStore API. Browser cannot access this.", "Part of RCA-004"],
    ]
    story.append(make_table(crit_data, col_widths=[1.2*cm, 3*cm, 4*cm, 3*cm, 4*cm, 1.3*cm]))

    story.append(PageBreak())

    # ============ HIGH ISSUES ============
    story.append(Paragraph("4. HIGH Issues (9)", style_h1))

    high_data = [
        ["ID", "Feature", "Root Cause", "Affected Files", "Required Fix", "Est. Time"],
        ["RCA-009", "22 pages use hardcoded data (no API calls)", "Original Stitch UI pages were implemented as static designs with placeholder data. They were never connected to APIs.",
         "AISupportCenterPage, AdminDashboardPage, CustomerHandoverReportPage, EngineerDashboardPage, FieldEngineerWorkspacePage, HomePage, InstallationCenterPage, JobCompletionHandoverPage, JobDetailsInst550APage, ProductDetailsT800Page, ProductLibraryPage, ProductManagementPage, PublicSearchPage, QbitT800ProductOverviewPage, SystemSettingsPage, T800InstallationGuidePage, UniversalSearchCommandCenterPage, UniversalSearchMobilePage, UserRoleManagementPage, VideoTrainingCenterPage, FSMCustomerTrackingPage, LoginPage",
         "Each page needs: fetch() calls to appropriate API, useState for data, loading states, error handling. This is the LARGEST issue in the project.", "80h+"],
        ["RCA-010", "AssetManager: Upload Asset button", "Button calls onUpload ?? notifyComingSoon(). onUpload is undefined (optional prop never passed). Shows 'coming soon' toast.",
         "AssetManager.tsx line 71", "Pass onUpload handler from parent. Create /api/admin/media/upload endpoint with multipart file upload.", "6h"],
        ["RCA-011", "MediaManager: Upload Media button", "Button has NO onClick handler at all. Renders as static QbitButton.",
         "MediaManager.tsx line 48", "Add onClick handler. Create file upload dialog. Wire to /api/admin/media POST endpoint (exists but only accepts metadata, not file).", "4h"],
        ["RCA-012", "AssetManager: Edit Asset", "Calls onEdit ?? notifyComingSoon(). onEdit is never passed. Shows 'coming soon'.",
         "AssetManager.tsx line 160", "Pass onEdit handler. Create edit dialog. Add PUT /api/admin/media/[id] endpoint.", "4h"],
        ["RCA-013", "AssetManager: Replace Version", "Directly calls notifyComingSoon(). No handler, no API.",
         "AssetManager.tsx line 163", "Create version replacement workflow. Add POST /api/admin/media/[id]/version endpoint.", "6h"],
        ["RCA-014", "AssetManager: Toggle Visibility", "Directly calls notifyComingSoon(). No handler, no API.",
         "AssetManager.tsx line 166", "Add PATCH /api/admin/media/[id] endpoint with visibility field. Pass handler from parent.", "2h"],
        ["RCA-015", "Product Management: Bulk Delete", "QbitButton has NO onClick handler. No bulk delete API.",
         "ProductManagementPage.tsx line 245", "Add onClick. Create DELETE /api/admin/products/bulk endpoint.", "3h"],
        ["RCA-016", "Product Management: Export CSV", "QbitButton has NO onClick handler. No export API for products.",
         "ProductManagementPage.tsx line 253", "Add onClick. Create GET /api/admin/products/export?format=csv endpoint.", "2h"],
        ["RCA-017", "ImportWizard: Import flow", "Uses static IMPORT_PREVIEW data. No real file upload or API call.",
         "ImportWizard.tsx, cms/placeholder-data.ts", "Wire to /api/admin/import endpoint (exists but returns mock data). Add real file parsing.", "8h"],
    ]
    story.append(make_table(high_data, col_widths=[1.2*cm, 3*cm, 4*cm, 3*cm, 4*cm, 1.3*cm]))

    story.append(PageBreak())

    # ============ MEDIUM ISSUES ============
    story.append(Paragraph("5. MEDIUM Issues (5)", style_h1))

    med_data = [
        ["ID", "Feature", "Root Cause", "Affected Files", "Required Fix", "Est. Time"],
        ["RCA-018", "QR Code generation", "QRManager component exists in admin/ but has no visible implementation. /api/admin/qr route exists but returns static data.",
         "QRManager.tsx, api/admin/qr/route.ts", "Implement QR code generation using qrcode library. Wire to product/asset records.", "4h"],
        ["RCA-019", "SystemSettings: Save button", "Theme toggle works (setTheme). But other settings (notifications, backups, etc.) have no save handler.",
         "SystemSettingsPage.tsx", "Add save handlers for each setting section. Wire to PUT /api/admin/settings (exists).", "4h"],
        ["RCA-020", "UserRoleManagement: Add/Edit/Delete user", "Page has tab navigation (users/roles) but no add/edit/delete buttons or forms for users.",
         "UserRoleManagementPage.tsx", "Add user CRUD UI. Create /api/admin/users endpoints (GET/POST/PUT/DELETE).", "8h"],
        ["RCA-021", "Product Management: Product images", "No image upload UI. No image display from DB. Products show placeholder icons.",
         "ProductManagementPage.tsx", "Add image upload to product create/edit form. Wire to MediaFile model + /api/admin/media.", "4h"],
        ["RCA-022", "Product Management: Category mapping", "No category CRUD. Categories are hardcoded in placeholder data.",
         "ProductManagementPage.tsx, admin/placeholder-data.ts", "Create Category model + /api/admin/categories endpoints. Replace hardcoded data.", "6h"],
    ]
    story.append(make_table(med_data, col_widths=[1.2*cm, 3*cm, 4*cm, 3*cm, 4*cm, 1.3*cm]))

    story.append(PageBreak())

    # ============ ROOT CAUSE ANALYSIS ============
    story.append(Paragraph("6. Root Cause Analysis", style_h1))

    story.append(Paragraph("6.1 Why are buttons not working?", style_h2))
    story.append(Paragraph(
        "The original Stitch UI design files were implemented as pixel-perfect static HTML/CSS replicas. "
        "The design included buttons, forms, tables, and navigation — but they were visual only. When "
        "converted to React components, the visual elements were preserved but the interactivity was not "
        "added. Specifically:", style_body))
    story.append(bullet("<b>Buttons without onClick:</b> 15+ buttons across ProductManagementPage, MediaManager, and other admin pages render as visual elements with no event handlers."))
    story.append(bullet("<b>Forms without onSubmit:</b> No create/edit forms exist for products, users, or categories."))
    story.append(bullet("<b>Tables without data binding:</b> ProductManagementPage uses ADMIN_ASSETS (hardcoded array from placeholder-data.ts) instead of fetching from API."))
    story.append(bullet("<b>'Coming soon' pattern:</b> AssetManager uses a notifyComingSoon() fallback when onUpload/onEdit handlers are not passed. The parent never passes them."))

    story.append(Paragraph("6.2 Why is Dr. QBIT scanning not working?", style_h2))
    story.append(Paragraph(
        "Hardware scanning (USB, COM, LAN, WiFi) requires operating system-level access that browsers "
        "cannot provide. The architecture was designed correctly: Device -> Desktop Agent -> Secure "
        "Local API -> QBIT Hub. However:", style_body))
    story.append(bullet("<b>Desktop Agent NOT implemented:</b> No .exe, Electron app, or local service exists. The API contract (POST /api/dr-qbit/scan with agentSecret) is ready, but nothing sends data to it."))
    story.append(bullet("<b>ScanButton is a simulation:</b> handleScan() shows a toast notification and uses setTimeout(3000ms) to simulate a scan. It does NOT call any API."))
    story.append(bullet("<b>What works without Desktop Agent:</b> Device Passport, Driver Intelligence, Firmware Intelligence, AI Diagnostics, and Test Center all work because they use pre-seeded data from the database. The scan data was seeded via scripts/seed-dr-qbit.ts."))
    story.append(bullet("<b>What requires Desktop Agent:</b> Real-time hardware discovery, real driver version detection, real firmware version reading, real test execution (test print, scan input, drawer open)."))

    story.append(Paragraph("6.3 Why do downloads not work?", style_h2))
    story.append(bullet("<b>API returns placeholder URL:</b> /api/downloads/[id] returns { secureUrl: '/api/downloads/[id]/file?token=...' } but the /file endpoint does not exist."))
    story.append(bullet("<b>No cloud storage configured:</b> The Download model has a storagePath field, but no actual files are stored. No S3/Supabase/UploadThing integration."))
    story.append(bullet("<b>Download count still increments:</b> The API does increment downloadCount and create DownloadHistory — so analytics work. But the actual file download fails."))

    story.append(Paragraph("6.4 Why is Product Management not working?", style_h2))
    story.append(bullet("<b>UI Complete, Backend Missing:</b> The ProductManagementPage renders a full table with products, but uses hardcoded ADMIN_ASSETS data."))
    story.append(bullet("<b>API Missing:</b> No /api/admin/products endpoint exists. The only product API is /api/dr-qbit/products (GET + POST for Dr. QBIT device matching, not admin CRUD)."))
    story.append(bullet("<b>CRUD Status:</b> Create (POST exists on dr-qbit/products but not wired to UI). Read (GET exists but UI doesn't call it). Update (NO PUT/PATCH). Delete (NO DELETE)."))

    story.append(Paragraph("6.5 Why do 22 pages have no API calls?", style_h2))
    story.append(Paragraph(
        "These 22 pages were the original Stitch design screens. They were built as visual prototypes "
        "with hardcoded data to match the approved design. When the Version 2 modules (FSM, Notifications, "
        "Dr. QBIT, Fleet, Analytics) were built, they were implemented with proper API calls. But the "
        "original 22 design screens were never upgraded to use real APIs. They still display static data.",
        style_body))

    story.append(PageBreak())

    # ============ CRUD Matrix ============
    story.append(Paragraph("7. CRUD Matrix — All Modules", style_h1))
    crud_data = [
        ["Module", "Create", "Read", "Update", "Delete", "Notes"],
        ["Products (Admin)", "MISSING", "MISSING (hardcoded)", "MISSING", "MISSING", "UI buttons exist but no handlers. No /api/admin/products endpoint."],
        ["Products (Dr. QBIT)", "POST /api/dr-qbit/products", "GET /api/dr-qbit/products", "PATCH /api/dr-qbit/products/[id]", "DELETE /api/dr-qbit/products/[id]", "Works for Dr. QBIT. NOT wired to ProductManagementPage."],
        ["Drivers", "MISSING", "MISSING (hardcoded)", "MISSING", "MISSING", "Driver model exists. No admin CRUD API. AssetManager shows 'coming soon'."],
        ["Firmware", "MISSING", "GET /api/dr-qbit/firmware/releases", "MISSING", "MISSING", "FirmwareRelease model exists. No admin CRUD API."],
        ["Knowledge Base", "MISSING", "MISSING (hardcoded)", "MISSING", "MISSING", "KnowledgeArticle model exists. AISupportCenterPage uses hardcoded articles."],
        ["Downloads", "POST /api/admin/media (metadata only)", "GET /api/public/downloads", "MISSING", "MISSING", "No file upload. No /file endpoint for actual download."],
        ["Customers (FSM)", "MISSING", "GET /api/fsm/work-orders", "PATCH /api/fsm/work-orders/[id]", "MISSING", "FSM customers accessible via work orders. No direct customer CRUD."],
        ["Work Orders", "POST /api/fsm/work-orders", "GET /api/fsm/work-orders", "PATCH /api/fsm/work-orders/[id]", "MISSING", "Create + Read + Update work. No Delete."],
        ["Notifications", "POST /api/admin/notifications/dispatch", "GET /api/notifications", "PATCH /api/notifications/[id]", "MISSING", "In-app CRUD works. No delete (archive instead)."],
        ["Device Passports", "POST /api/dr-qbit/passports/generate", "GET /api/dr-qbit/passports", "MISSING", "MISSING", "Auto-generated from scans. No manual edit/delete."],
        ["Users", "MISSING", "MISSING (hardcoded)", "MISSING", "MISSING", "User model exists. UserRoleManagementPage has no CRUD. No /api/admin/users."],
        ["Branches", "MISSING", "GET /api/fleet/devices (via branch)", "MISSING", "MISSING", "Branch model exists. No admin CRUD API."],
    ]
    story.append(make_table(crud_data, col_widths=[2.5*cm, 3*cm, 3*cm, 3*cm, 2.5*cm, 3*cm]))

    story.append(PageBreak())

    # ============ Desktop Agent ============
    story.append(Paragraph("8. Desktop Agent — Required for Hardware Scanning", style_h1))
    story.append(Paragraph(
        "The browser CANNOT access USB devices, COM ports, or LAN network discovery. This is a "
        "fundamental browser security restriction. The QBIT Hub architecture correctly isolates "
        "hardware access behind a Desktop Companion Agent, but this agent has not been built.",
        style_body))

    agent_data = [
        ["Component", "Status", "What Exists", "What's Missing"],
        ["Desktop Agent (.exe/Electron)", "NOT IMPLEMENTED", "API contract: POST /api/dr-qbit/scan with agentSecret. Auth: desktop-agent-auth.ts", "Windows app that scans USB/COM/LAN/WiFi and POSTs results to the API"],
        ["Scan Button (UI)", "SIMULATION ONLY", "ScanButton.tsx shows animation + toast", "WebSocket connection to Desktop Agent, real scan trigger"],
        ["Device Detection", "WORKS (with seed data)", "DetectedDevice model, /api/dr-qbit/scan, /api/dr-qbit/devices", "Real-time detection from Desktop Agent (currently uses seed-dr-qbit.ts)"],
        ["Driver Detection", "SIMULATED", "DriverInformation populated by passport generator (simulated version)", "Desktop Agent reads Windows DriverStore, reports real installed driver version"],
        ["Firmware Detection", "SIMULATED", "FirmwareInformation populated by passport generator", "Desktop Agent queries device via ESC/P or SNMP, reports real firmware version"],
        ["Test Execution", "SIMULATED", "Test runner simulates test results based on device state", "Desktop Agent sends actual test commands (test print, scan input, drawer open)"],
    ]
    story.append(make_table(agent_data, col_widths=[3.5*cm, 2.5*cm, 5.5*cm, 5.5*cm]))

    story.append(Paragraph("8.1 What works WITHOUT Desktop Agent?", style_h2))
    story.append(bullet("Device Passport view (display + driver/firmware comparison) - uses pre-seeded data"))
    story.append(bullet("Driver Intelligence (installed vs latest comparison) - uses simulated installed version"))
    story.append(bullet("Firmware Intelligence (installed vs latest + compatibility check) - uses simulated installed version"))
    story.append(bullet("AI Diagnostics (health score + findings + recommendations) - analyzes pre-seeded data"))
    story.append(bullet("Test Center (test suite execution + results) - simulates test results"))
    story.append(bullet("Fleet Manager (device inventory + analytics) - aggregates pre-seeded data"))
    story.append(bullet("All of these modules work correctly with seeded data — they just can't detect real hardware."))

    story.append(PageBreak())

    # ============ Summary + Recommendations ============
    story.append(Paragraph("9. Implementation Status Summary", style_h1))

    status_data = [
        ["Module", "UI", "API", "Database", "Desktop Agent", "Overall"],
        ["FSM (Work Orders)", "COMPLETE", "COMPLETE", "COMPLETE", "N/A", "PRODUCTION READY"],
        ["Notification Engine", "COMPLETE", "COMPLETE", "COMPLETE", "N/A", "PRODUCTION READY"],
        ["Customer Tracking", "COMPLETE", "COMPLETE", "COMPLETE", "N/A", "PRODUCTION READY"],
        ["Engineer Mobile (PWA)", "COMPLETE", "COMPLETE", "COMPLETE", "N/A", "PRODUCTION READY"],
        ["Dr. QBIT Detection", "COMPLETE", "COMPLETE", "COMPLETE", "REQUIRED", "PARTIAL (needs agent)"],
        ["Dr. QBIT Passport", "COMPLETE", "COMPLETE", "COMPLETE", "N/A", "PRODUCTION READY"],
        ["Dr. QBIT Driver Intel", "COMPLETE", "COMPLETE", "COMPLETE", "REQUIRED (for real data)", "PARTIAL"],
        ["Dr. QBIT Firmware Intel", "COMPLETE", "COMPLETE", "COMPLETE", "REQUIRED (for real data)", "PARTIAL"],
        ["Dr. QBIT Diagnostics", "COMPLETE", "COMPLETE", "COMPLETE", "REQUIRED (for real data)", "PARTIAL"],
        ["Dr. QBIT Test Center", "COMPLETE", "COMPLETE", "COMPLETE", "REQUIRED (for real tests)", "PARTIAL"],
        ["Fleet Manager", "COMPLETE", "COMPLETE", "COMPLETE", "N/A", "PRODUCTION READY"],
        ["Analytics", "COMPLETE", "COMPLETE", "COMPLETE", "N/A", "PRODUCTION READY"],
        ["Product Management", "UI ONLY", "MISSING", "MODEL EXISTS", "N/A", "NOT READY"],
        ["User Management", "UI ONLY", "MISSING", "MODEL EXISTS", "N/A", "NOT READY"],
        ["Download Center", "COMPLETE", "PARTIAL (placeholder URL)", "COMPLETE", "N/A", "PARTIAL"],
        ["Knowledge Base", "UI ONLY", "MISSING", "MODEL EXISTS", "N/A", "NOT READY"],
        ["Admin CMS", "UI ONLY", "PARTIAL", "MODEL EXISTS", "N/A", "NOT READY"],
    ]
    story.append(make_table(status_data, col_widths=[3*cm, 1.8*cm, 1.8*cm, 1.8*cm, 2.5*cm, 3*cm]))

    story.append(Spacer(1, 20))
    story.append(Paragraph("10. Recommended Fix Priority", style_h1))
    story.append(bullet("<b>Phase 1 (Critical):</b> Fix Product Management CRUD (RCA-001 to RCA-003, RCA-006). Create /api/admin/products with GET/POST/PUT/DELETE. Wire ProductManagementPage to API. Est: 20h"))
    story.append(bullet("<b>Phase 2 (High):</b> Fix Download file endpoint (RCA-005). Create /api/downloads/[id]/file/route.ts. Est: 4h"))
    story.append(bullet("<b>Phase 3 (High):</b> Fix Upload functionality (RCA-010 to RCA-014). Wire AssetManager/MediaManager handlers. Est: 20h"))
    story.append(bullet("<b>Phase 4 (High):</b> Connect 22 static pages to APIs (RCA-009). Largest effort. Est: 80h+"))
    story.append(bullet("<b>Phase 5 (Medium):</b> Fix QR generation, settings save, user management (RCA-018 to RCA-022). Est: 26h"))
    story.append(bullet("<b>Phase 6 (Separate project):</b> Build Desktop Companion Agent (RCA-004, RCA-008). Est: 40h+"))

    story.append(Spacer(1, 20))
    story.append(Paragraph(
        "<b>Waiting for approval before making any fixes.</b>", style_body))

    return story

def main():
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    doc = SimpleDocTemplate(OUTPUT_PATH, pagesize=A4,
        leftMargin=1.5*cm, rightMargin=1.5*cm, topMargin=2*cm, bottomMargin=2*cm,
        title="QBIT Hub Root Cause Analysis Report",
        author="Senior Full Stack Software Architect",
        subject="Complete Project Audit - UI to Database Trace",
        creator="QBIT Hub")
    story = build_story()
    doc.build(story, onFirstPage=draw_cover, onLaterPages=draw_chrome)
    print(f"PDF generated: {OUTPUT_PATH}")
    print(f"  Size: {os.path.getsize(OUTPUT_PATH) / 1024:.1f} KB")

if __name__ == "__main__":
    main()
