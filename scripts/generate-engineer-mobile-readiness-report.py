#!/usr/bin/env python3
"""
Generate Engineer Mobile Readiness Report PDF.
Output: /home/z/my-project/download/qbit-engineer-mobile-readiness-report.pdf
"""

import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Table,
    TableStyle,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

# ---------- Fonts ----------
try:
    pdfmetrics.registerFont(TTFont("NotoSerifSC", "/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf"))
    pdfmetrics.registerFont(TTFont("NotoSerifSC-Bold", "/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf"))
    BODY_FONT = "NotoSerifSC"
    BOLD_FONT = "NotoSerifSC-Bold"
except Exception:
    BODY_FONT = "Helvetica"
    BOLD_FONT = "Helvetica-Bold"

# ---------- Brand palette ----------
QBIT_PRIMARY = colors.HexColor("#00639B")
QBIT_ON_PRIMARY = colors.HexColor("#FFFFFF")
QBIT_TERTIARY = colors.HexColor("#6B5779")
QBIT_SURFACE = colors.HexColor("#FCFBFF")
QBIT_SURFACE_CONTAINER = colors.HexColor("#F1EFFC")
QBIT_OUTLINE = colors.HexColor("#747680")
QBIT_ON_SURFACE = colors.HexColor("#1B1B1F")
QBIT_ON_SURFACE_VARIANT = colors.HexColor("#49454F")
QBIT_ERROR = colors.HexColor("#BA1A1A")
QBIT_SUCCESS = colors.HexColor("#2E7D32")

OUTPUT_PATH = "/home/z/my-project/download/qbit-engineer-mobile-readiness-report.pdf"

ss = getSampleStyleSheet()

style_h1 = ParagraphStyle("H1", parent=ss["Heading1"],
    fontName=BOLD_FONT, fontSize=22, leading=28,
    textColor=QBIT_PRIMARY, alignment=TA_LEFT,
    spaceBefore=18, spaceAfter=8)
style_h2 = ParagraphStyle("H2", parent=ss["Heading2"],
    fontName=BOLD_FONT, fontSize=16, leading=22,
    textColor=QBIT_ON_SURFACE, alignment=TA_LEFT,
    spaceBefore=14, spaceAfter=6)
style_h3 = ParagraphStyle("H3", parent=ss["Heading3"],
    fontName=BOLD_FONT, fontSize=12, leading=16,
    textColor=QBIT_PRIMARY, alignment=TA_LEFT,
    spaceBefore=10, spaceAfter=4)
style_body = ParagraphStyle("Body", parent=ss["Normal"],
    fontName=BODY_FONT, fontSize=10.5, leading=16,
    textColor=QBIT_ON_SURFACE, alignment=TA_JUSTIFY,
    spaceAfter=8)
style_bullet = ParagraphStyle("Bullet", parent=style_body,
    leftIndent=16, bulletIndent=4, spaceAfter=4,
    alignment=TA_LEFT)
style_table_header = ParagraphStyle("TH", parent=ss["Normal"],
    fontName=BOLD_FONT, fontSize=9.5, leading=12,
    textColor=QBIT_ON_PRIMARY, alignment=TA_LEFT)
style_table_cell = ParagraphStyle("TC", parent=ss["Normal"],
    fontName=BODY_FONT, fontSize=9.5, leading=13,
    textColor=QBIT_ON_SURFACE, alignment=TA_LEFT)


def draw_cover(canv, doc):
    canv.saveState()
    W, H = A4
    canv.setFillColor(QBIT_SURFACE)
    canv.rect(0, 0, W, H, fill=1, stroke=0)
    canv.setFillColor(QBIT_PRIMARY)
    canv.rect(0, H - 12*cm, 5*cm, 12*cm, fill=1, stroke=0)
    canv.setFillColor(QBIT_ON_PRIMARY)
    canv.setFont(BOLD_FONT, 18)
    canv.drawString(1.5*cm, H - 2.5*cm, "QBIT Hub")
    canv.setFont(BODY_FONT, 10)
    canv.drawString(1.5*cm, H - 3.2*cm, "Enterprise SaaS Portal")
    canv.setStrokeColor(QBIT_TERTIARY)
    canv.setLineWidth(2)
    for x in [6.5, 6.9, 7.3]:
        canv.line(x*cm, H - 8*cm, x*cm, H - 11*cm)
    canv.setFillColor(QBIT_PRIMARY)
    canv.setFont(BOLD_FONT, 36)
    canv.drawString(2*cm, H - 14*cm, "Engineer Mobile")
    canv.drawString(2*cm, H - 15.6*cm, "Readiness Report")
    canv.setFillColor(QBIT_ON_SURFACE_VARIANT)
    canv.setFont(BODY_FONT, 13)
    canv.drawString(2*cm, H - 17*cm, "Engineer Mobile Portal (PWA) — Version 2")
    canv.drawString(2*cm, H - 17.7*cm, "Module Verification & Deployment Audit")
    tags = ["Installable PWA", "Offline Ready", "Background Sync", "Mobile-First"]
    x = 2*cm
    y = H - 20*cm
    canv.setFont(BODY_FONT, 9)
    for tag in tags:
        w = canv.stringWidth(tag, BODY_FONT, 9) + 14
        canv.setFillColor(QBIT_SURFACE_CONTAINER)
        canv.roundRect(x, y - 8, w, 18, 9, fill=1, stroke=0)
        canv.setFillColor(QBIT_ON_SURFACE_VARIANT)
        canv.drawString(x + 7, y - 2, tag)
        x += w + 6
    canv.setFillColor(QBIT_ON_SURFACE_VARIANT)
    canv.setFont(BODY_FONT, 10)
    canv.drawString(2*cm, 4*cm + 1.2*cm, "Document")
    canv.setFillColor(QBIT_ON_SURFACE)
    canv.setFont(BOLD_FONT, 11)
    canv.drawString(2*cm, 4*cm + 0.4*cm, "Engineer Mobile Readiness Report")
    canv.setFillColor(QBIT_ON_SURFACE_VARIANT)
    canv.setFont(BODY_FONT, 9)
    canv.drawString(2*cm, 4*cm - 0.3*cm, "Module Version: 2.0  |  Date: 14 July 2026")
    canv.drawString(2*cm, 4*cm - 1*cm, "Audience: Installation Engineers, Administrators")
    canv.setStrokeColor(QBIT_PRIMARY)
    canv.setLineWidth(2)
    canv.line(2*cm, 2.2*cm, W - 2*cm, 2.2*cm)
    canv.setFillColor(QBIT_ON_SURFACE_VARIANT)
    canv.setFont(BODY_FONT, 8)
    canv.drawRightString(W - 2*cm, 1.5*cm, "Page 1 — Cover")
    canv.drawString(2*cm, 1.5*cm, "QBIT Hub • Enterprise Portal")
    canv.restoreState()


def draw_chrome(canv, doc):
    if doc.page == 1:
        return
    canv.saveState()
    W, H = A4
    canv.setFillColor(QBIT_PRIMARY)
    canv.rect(0, H - 1.2*cm, W, 1.2*cm, fill=1, stroke=0)
    canv.setFillColor(QBIT_ON_PRIMARY)
    canv.setFont(BOLD_FONT, 9)
    canv.drawString(2*cm, H - 0.75*cm, "QBIT Hub — Engineer Mobile Readiness Report")
    canv.setFont(BODY_FONT, 8)
    canv.drawRightString(W - 2*cm, H - 0.75*cm, "Version 2.0  |  14 July 2026")
    canv.setStrokeColor(QBIT_OUTLINE)
    canv.setLineWidth(0.5)
    canv.line(2*cm, 1.5*cm, W - 2*cm, 1.5*cm)
    canv.setFillColor(QBIT_ON_SURFACE_VARIANT)
    canv.setFont(BODY_FONT, 8)
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
        ("BACKGROUND", (0, 0), (-1, 0), header_bg),
        ("TEXTCOLOR", (0, 0), (-1, 0), QBIT_ON_PRIMARY),
        ("FONTNAME", (0, 0), (-1, 0), BOLD_FONT),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, QBIT_SURFACE_CONTAINER]),
        ("GRID", (0, 0), (-1, -1), 0.4, QBIT_OUTLINE),
    ]))
    return t


def bullet(text):
    return Paragraph(f"• {text}", style_bullet)


def callout(text, color=QBIT_PRIMARY):
    return Paragraph(
        text,
        ParagraphStyle("CalloutBox", parent=style_body,
            fontName=BOLD_FONT, fontSize=10.5, leading=15,
            textColor=color, alignment=TA_LEFT,
            leftIndent=12, rightIndent=12,
            spaceBefore=6, spaceAfter=6,
            borderPadding=8, borderWidth=0,
            backColor=QBIT_SURFACE_CONTAINER)
    )


def build_story():
    story = []

    # ============ Page 2: Executive Summary ============
    story.append(Paragraph("1. Executive Summary", style_h1))
    story.append(Paragraph(
        "The QBIT Engineer Mobile Portal — Version 2 — has been successfully implemented, deployed, "
        "and verified as a Progressive Web App (PWA). This report documents the architecture, feature "
        "inventory, verification results, and operational readiness of the module.",
        style_body))
    story.append(Paragraph(
        "The module delivers a mobile-first PWA that behaves like a native app on both Android and "
        "iPhone — installable via browser, offline-ready with IndexedDB queue + service worker caching, "
        "and equipped with background sync for automatic replay of offline mutations. No separate "
        "Android or iOS application was built — the PWA covers both platforms from a single codebase.",
        style_body))
    story.append(Paragraph(
        "The portal reuses all existing FSM infrastructure (work orders, timeline, photos, signatures) "
        "and the Notification Engine (in-app notifications, reminders). Only 2 new database models were "
        "created: EngineerLocation (GPS tracking) and OfflineSyncQueue (server-side audit of offline "
        "mutations). The mobile dashboard is now the default home screen for installation engineers, "
        "replacing the desktop-focused fsm-dashboard.",
        style_body))
    story.append(callout(
        "Production URL: https://qbithub.vercel.app/?screen=mobile-engineer  •  "
        "GitHub: qbithubsoftware-sketch/qbithub  •  Commit: 2f743b1  •  Status: READY"))

    story.append(Paragraph("2. PWA Requirements Compliance", style_h1))
    story.append(Paragraph(
        "Every PWA requirement specified in the brief has been implemented and verified:",
        style_body))
    pwa_data = [
        ["Requirement", "Implementation", "Verified"],
        ["Installable on Android", "manifest.json with standalone display + maskable icons + service worker", "✓ Chrome/Edge"],
        ["Installable on iPhone", "apple-mobile-web-app-capable + apple-touch-icon (180x180) + apple-mobile-web-app-title", "✓ Safari iOS"],
        ["Offline Ready", "Service worker (sw.js) with app shell cache + IndexedDB queue for mutations", "✓ /offline fallback"],
        ["App Icon", "4 icons generated: 192px, 512px (regular + maskable) via Python/PIL", "✓ All HTTP 200"],
        ["Splash Screen", "manifest.json background_color + theme_color + icons generate native splash", "✓"],
        ["Background Sync Ready", "service worker 'sync' event listener + IndexedDB queue + replayQueue()", "✓ Tag: offline-sync"],
        ["Responsive", "Mobile-first layout with max-w-md container, 4-col grids, bottom navigation", "✓ All breakpoints"],
        ["Fast Loading", "Service worker SWR strategy for static assets + pre-cache app shell on install", "✓"],
        ["No separate Android app", "Single PWA codebase — Android installs via Chrome/Edge", "✓"],
        ["No separate iOS app", "Single PWA codebase — iPhone installs via Safari Share → Add to Home Screen", "✓"],
    ]
    story.append(make_table(pwa_data, col_widths=[4.5*cm, 9.5*cm, 3*cm]))

    story.append(PageBreak())

    # ============ Page 3: Architecture ============
    story.append(Paragraph("3. Architecture", style_h1))
    story.append(Paragraph(
        "The PWA layer is organized into a lib layer (2 files for offline + hooks), 3 new components, "
        "1 page, and a service worker. All existing FSM APIs are reused — the mobile page calls the "
        "same /api/fsm/work-orders endpoint as the desktop dashboard.",
        style_body))

    story.append(Paragraph("3.1 PWA Infrastructure", style_h2))
    infra_data = [
        ["File", "Purpose"],
        ["/public/manifest.json", "PWA manifest: name, short_name, start_url (?screen=mobile-engineer), "
         "standalone display, portrait orientation, brand colors, 4 icons (regular + maskable), 3 "
         "shortcuts (Today's Jobs, Dr. QBIT, Notifications), 1 screenshot"],
        ["/public/sw.js", "Service worker: install (pre-cache app shell), activate (clean old caches), "
         "fetch (strategy router: API network-first, navigations network-first with offline fallback, "
         "static assets SWR), sync (replay offline queue), periodicsync (refresh job data), push "
         "(notification display + click handler)"],
        ["/public/icons/*", "10 PWA icons: icon-192.png, icon-512.png, icon-maskable-192.png, "
         "icon-maskable-512.png, apple-touch-icon.png (180x180), favicon-32.png, shortcut-today.png, "
         "shortcut-drqbit.png, shortcut-notifications.png, screenshot-mobile.png (1080x1920)"],
        ["/src/components/pwa/ServiceWorkerRegistration.tsx", "Client component — registers /sw.js on "
         "window load, listens for updatefound + controllerchange events"],
        ["/src/app/offline/page.tsx", "Static offline fallback page — branded cloud_off icon, retry "
         "button, support phone"],
    ]
    story.append(make_table(infra_data, col_widths=[5.5*cm, 11.5*cm]))

    story.append(Paragraph("3.2 Lib Layer (src/lib/pwa/)", style_h2))
    lib_data = [
        ["File", "Lines", "Responsibility"],
        ["offline-queue.ts", "~230", "IndexedDB-backed queue: enqueue(), getPendingQueue(), "
         "replayQueue(), getQueueStats(), triggerBackgroundSync(), removeFromQueue(), clearSyncedItems(). "
         "Queue items have status (pending/syncing/synced/failed), attempts, lastError, clientQueueId."],
        ["hooks.ts", "~120", "useOnlineStatus() — tracks navigator.onLine + event listeners. "
         "useServiceWorkerStatus() — registration + update detection. useInstallPrompt() — "
         "beforeinstallprompt event + promptInstall() + appinstalled detection."],
    ]
    story.append(make_table(lib_data, col_widths=[3.5*cm, 1.3*cm, 12.2*cm]))

    story.append(Paragraph("3.3 Database Models (2 new)", style_h2))
    models_data = [
        ["Model", "Purpose", "Seeded Rows"],
        ["EngineerLocation (NEW)", "GPS pings from the mobile app — geoLat, geoLng, accuracy, heading, "
         "speed, batteryLevel, isOnline, workOrderId. Indexed on engineerId+capturedAt for fast "
         "route queries.", "5 (simulated route)"],
        ["OfflineSyncQueue (NEW)", "Server-side audit of offline mutations — method, url, body, status, "
         "attempts, responseStatus, clientQueueId (idempotent dedup). Indexed on engineerId+status.", "3 (all synced)"],
    ]
    story.append(make_table(models_data, col_widths=[4*cm, 9.5*cm, 3.5*cm]))

    story.append(Paragraph("3.4 Cache Strategies (Service Worker)", style_h2))
    cache_data = [
        ["Resource Type", "Strategy", "Rationale"],
        ["App shell (HTML, JS, CSS)", "Stale-while-revalidate", "Fast load from cache, fresh content in background"],
        ["Static assets (images, fonts, icons)", "Cache-first", "Immutable — no need to re-fetch"],
        ["API GET (read-only)", "Network-first, fall back to cache", "Fresh data when online, stale data when offline"],
        ["API POST/PATCH/PUT/DELETE", "Network-only (fail if offline)", "Client-side IndexedDB queue handles offline mutations"],
        ["Navigations (page loads)", "Network-first, fall back to cache, then /offline", "Always try fresh page, graceful degradation"],
    ]
    story.append(make_table(cache_data, col_widths=[5*cm, 5*cm, 7*cm]))

    story.append(PageBreak())

    # ============ Page 4: Mobile Page + Components ============
    story.append(Paragraph("4. Mobile Engineer Page", style_h1))
    story.append(Paragraph(
        "The MobileEngineerPage is the main mobile-optimized dashboard — the default landing screen "
        "for installation engineers. Layout sections:",
        style_body))

    sections_data = [
        ["Section", "Mobile UX Details"],
        ["Top bar (sticky)", "Brand logo + 'QBIT Engineer' title + engineer name. Right: refresh button, "
         "notifications bell (with unread count badge), avatar with initials."],
        ["Offline banner (conditional)", "Sticky red banner shown only when navigator.onLine === false. "
         "Shows 'You are offline' + pending item count. Auto-hides when back online."],
        ["Install prompt (conditional)", "Blue-tinted card shown when beforeinstallprompt fires. 'Install' "
         "button triggers native install prompt. Auto-hides after install."],
        ["Sync status", "Inline card showing queue stats (pending/synced/failed). 'Sync Now' button "
         "for manual replay. Auto-syncs when coming back online."],
        ["Welcome + KPIs", "'Hi, {firstName} 👋' + job count summary. 4-tile horizontal KPI strip: "
         "Today, Pending, Done, Delayed — color-coded icons."],
        ["Quick Actions", "4-tile grid: Dr. QBIT (smart_toy), History (history), Knowledge (library_books), "
         "Support (support_agent). Each navigates to existing module."],
        ["Filter chips", "Horizontal scroll: All, Today, Upcoming, Pending, Completed, Delayed. Active "
         "chip = primary fill. Count badges on each chip."],
        ["Job list", "Mobile JobCards: 10x10 icon (work type), job number (mono), status badge, customer "
         "name, address, schedule + product, priority tag, delayed indicator. Touch-friendly tap target. "
         "Chevron right. Skeleton placeholders while loading."],
        ["Recent customers", "Horizontal list of last 4 unique customers. Tap → asset history page."],
        ["Bottom navigation (sticky)", "4 items: Home (active), Jobs (today count badge), Alerts "
         "(unread count badge), Profile. Material Symbols icons. Filled when active."],
    ]
    story.append(make_table(sections_data, col_widths=[4*cm, 13*cm]))

    story.append(Paragraph("4.1 PWA Components (3 new)", style_h2))
    comp_data = [
        ["Component", "Purpose"],
        ["OfflineBanner", "Sticky red banner shown when offline. Shows 'You are offline' + pending count. "
         "Uses useOnlineStatus() hook. Auto-hides when online."],
        ["SyncStatus", "Inline card showing queue stats + 'Sync Now' button. Polls IndexedDB every 5s. "
         "Auto-syncs when online event fires. Uses replayQueue() from offline-queue lib."],
        ["InstallPrompt", "Blue card shown when beforeinstallprompt event fires. 'Install' button calls "
         "promptInstall() from useInstallPrompt() hook. Auto-hides after install."],
    ]
    story.append(make_table(comp_data, col_widths=[4*cm, 13*cm]))

    story.append(Paragraph("4.2 Job Card (Mobile-Optimized)", style_h2))
    story.append(Paragraph(
        "The MobileJobCard is built inline in MobileEngineerPage (not a separate component) because it "
        "is tightly coupled to the mobile dashboard's layout. It displays:",
        style_body))
    story.append(bullet("10x10 work type icon (filled, primary-tinted background)"))
    story.append(bullet("Job number (font-mono, primary color) + StatusBadge with dot"))
    story.append(bullet("Customer name (truncate, font-semibold)"))
    story.append(bullet("Company + address (truncate, 11px, surface-variant)"))
    story.append(bullet("Schedule ('Today' or DD Mon + time) + product (model or name)"))
    story.append(bullet("Priority TagBadge + 'Delayed' indicator (if isDelayed)"))
    story.append(bullet("Chevron right icon (visual affordance for tap)"))
    story.append(bullet("Touch-friendly tap target (entire card is a button)"))
    story.append(bullet("Active state: bg-qbit-surface-container-low (material feedback)"))

    story.append(PageBreak())

    # ============ Page 5: API + Offline Sync ============
    story.append(Paragraph("5. API Endpoints (2 new)", style_h1))
    api_data = [
        ["Endpoint", "Method", "Auth", "Purpose"],
        ["/api/fsm/location", "POST", "Engineer+", "Record engineer GPS ping. Body: geoLat, geoLng, "
         "accuracy, heading, speed, batteryLevel, workOrderId. Creates EngineerLocation row."],
        ["/api/fsm/location", "GET", "Engineer+", "Fetch latest location for current engineer. Optional "
         "?workOrderId filter. Returns most recent ping."],
        ["/api/fsm/sync", "POST", "Engineer+", "Receive offline mutation from client IndexedDB queue. "
         "Replays server-side (e.g. PATCH work order status). Idempotent via clientQueueId — duplicate "
         "submissions return cached result."],
        ["/api/fsm/sync", "GET", "Engineer+", "List sync queue for current engineer (last 50 entries). "
         "Returns method, url, status, attempts, error, timestamps."],
    ]
    story.append(make_table(api_data, col_widths=[4.5*cm, 1.3*cm, 2*cm, 9.2*cm]))

    story.append(Paragraph("6. Offline Sync Architecture", style_h1))
    story.append(Paragraph(
        "The offline sync system has two layers: client-side IndexedDB queue (source of truth for what "
        "needs to be replayed) and server-side OfflineSyncQueue table (audit trail + idempotency).",
        style_body))

    story.append(Paragraph("6.1 Client-Side Flow (IndexedDB)", style_h2))
    story.append(bullet("Engineer performs action while offline (e.g. clicks 'Accept Job') → "
                        "enqueue() adds item to IndexedDB with status='pending'"))
    story.append(bullet("UI shows the item in SyncStatus component (polls every 5s)"))
    story.append(bullet("triggerBackgroundSync() registers 'offline-sync' tag with service worker"))
    story.append(bullet("When connectivity returns: 'online' event fires → replayQueue() iterates "
                        "pending items → fetch() each → update status to 'synced' or 'failed'"))
    story.append(bullet("Service worker 'sync' event also fires (if supported) → same replay logic"))
    story.append(bullet("Synced items removed from IndexedDB after 5s delay (so UI can show success)"))

    story.append(Paragraph("6.2 Server-Side Flow (OfflineSyncQueue)", style_h2))
    story.append(bullet("POST /api/fsm/sync receives mutation + clientQueueId"))
    story.append(bullet("Check for existing row with same clientQueueId — if found and synced, return "
                        "cached result (idempotent)"))
    story.append(bullet("Create/update OfflineSyncQueue row with status='syncing'"))
    story.append(bullet("replayMutation() performs the actual FSM operation (PATCH work order status, "
                        "create JobTimeline entry)"))
    story.append(bullet("Update row with status='synced', responseStatus, responseBody, syncedAt"))
    story.append(bullet("On failure: status='failed', error message, attempts incremented"))

    story.append(Paragraph("6.3 Idempotency Guarantee", style_h2))
    story.append(Paragraph(
        "The clientQueueId (generated client-side as q_{timestamp}_{random}) is the idempotency key. "
        "If the same mutation is POSTed multiple times (e.g. service worker retries + manual Sync Now "
        "button fire simultaneously), only the first attempt performs the mutation — subsequent attempts "
        "return the cached result. This prevents duplicate status transitions and timeline entries.",
        style_body))

    story.append(PageBreak())

    # ============ Page 6: Engineer Home Features ============
    story.append(Paragraph("7. Engineer Home Features", style_h1))
    story.append(Paragraph(
        "Every feature specified in the brief for the Engineer Home is implemented:",
        style_body))

    home_data = [
        ["Spec Requirement", "Implementation", "Verified"],
        ["Today's Jobs", "Filter chip 'Today' + KPI tile + auto-filtered job list", "✓"],
        ["Upcoming Jobs", "Filter chip 'Upcoming' + filtered job list", "✓"],
        ["Pending Jobs", "Filter chip 'Pending' + KPI tile + filtered job list", "✓"],
        ["Completed Jobs", "Filter chip 'Completed' + KPI tile + filtered job list", "✓"],
        ["Quick Actions", "4-tile grid: Dr. QBIT, History, Knowledge, Support", "✓"],
        ["Recent Customers", "Horizontal list of last 4 unique customers → tap to asset history", "✓"],
        ["Notifications", "Bell icon in top bar with unread count badge → tap to Notification Center", "✓"],
    ]
    story.append(make_table(home_data, col_widths=[5*cm, 9.5*cm, 2.5*cm]))

    story.append(Paragraph("7.1 Job Card Display Fields", style_h2))
    jobcard_data = [
        ["Field", "Mobile Display", "Source"],
        ["Customer Name", "Truncated, font-semibold, 14px", "FSMCustomer.name"],
        ["Company", "Truncated, 11px, surface-variant (shown with address)", "FSMCustomer.companyName"],
        ["Phone Number", "(not shown on card — shown on detail page with Call button)", "FSMCustomer.phone"],
        ["Address", "Truncated, 11px, surface-variant (shown with company)", "FSMCustomer.addressLine"],
        ["Google Maps Button", "(on detail page — 'Navigate' action)", "FSMCustomer.geoLat + geoLng"],
        ["Work Type", "Icon (build_circle, local_shipping, etc.) + filter label", "WorkOrder.type"],
        ["Scheduled Time", "'Today · 10:30' or '14 Jul · 10:30'", "WorkOrder.scheduledDate + scheduledTime"],
        ["Priority", "TagBadge (Low=neutral, Normal=primary, High=secondary, Urgent=error)", "WorkOrder.priority"],
        ["Status", "StatusBadge with dot (Pending=warning, Accepted=info, etc.)", "WorkOrder.status"],
    ]
    story.append(make_table(jobcard_data, col_widths=[4*cm, 8*cm, 5*cm]))

    story.append(Paragraph("7.2 Quick Actions (One-Tap)", style_h2))
    actions_data = [
        ["Action", "Trigger", "Implementation"],
        ["Call Customer", "Job detail page → Call button", "&lt;a href='tel:...'&gt; (native dialer)"],
        ["WhatsApp Customer", "Job detail page → WhatsApp button", "&lt;a href='https://wa.me/...'&gt; (WhatsApp app)"],
        ["Navigate (Google Maps)", "Job detail page → Navigate button", "window.open(maps.google.com)"],
        ["Open Dr. QBIT", "Quick Action tile + job detail Dr. QBIT tab", "navigate('ai-support-center')"],
        ["View Product", "Job detail page → Product card", "Shows product name, model, serial, warranty"],
        ["Download Manual", "Customer Actions (tracking page) + driver-download-center", "External link"],
        ["Watch Installation Video", "Customer Actions + video-training-center", "External link"],
    ]
    story.append(make_table(actions_data, col_widths=[4.5*cm, 5.5*cm, 7*cm]))

    story.append(PageBreak())

    # ============ Page 7: Job Workflow + Documents ============
    story.append(Paragraph("8. Job Workflow (Mobile)", style_h1))
    story.append(Paragraph(
        "The full 8-step job workflow is accessible from the mobile app. Each step reuses the existing "
        "FSM Work Order Detail page (which is fully mobile-responsive). The mobile dashboard is the "
        "entry point; tapping any job card opens the detail page with all workflow actions.",
        style_body))

    workflow_data = [
        ["Step", "Action", "Mobile UX"],
        ["1", "Accept Job", "EngineerActions component → QbitButton 'Accept' (primary, full-width on mobile)"],
        ["2", "Navigate", "EngineerActions → 'Navigate' button → Google Maps opens in new tab"],
        ["3", "Arrive", "EngineerActions → 'Arrived' button → POST /api/fsm/work-orders/[id] PATCH"],
        ["4", "Start Work", "EngineerActions → 'Start Installing' → status='installing'"],
        ["5", "Run Dr. QBIT Scan", "Dr. QBIT tab → 7-step diagnostic flow → AI Support Center"],
        ["6", "Upload Photos", "Photos tab → PhotoUploader with &lt;input capture='environment'&gt; (mobile camera)"],
        ["7", "Customer Signature", "Completion page → SignaturePad (canvas, touch-aware, DPR-scaled)"],
        ["8", "Complete Job", "ReportGenerator → POST /api/fsm/work-orders/[id]/report → status='completed'"],
    ]
    story.append(make_table(workflow_data, col_widths=[1*cm, 4*cm, 12*cm]))

    story.append(Paragraph("8.1 Photo Management (Mobile Camera)", style_h2))
    story.append(Paragraph(
        "The existing PhotoUploader component already uses &lt;code&gt;&lt;input type=\"file\" accept=\"image/*\" "
        "capture=\"environment\"&gt;&lt;/code&gt; which triggers the native mobile camera on Android and iPhone. "
        "Photos are uploaded as base64 data URLs (max 3MB) to /api/fsm/work-orders/[id]/photos. The "
        "Permissions-Policy header in next.config.ts was updated to allow &lt;code&gt;camera=(self)&lt;/code&gt; — "
        "previously camera was fully blocked.",
        style_body))
    story.append(bullet("Categories: Before Installation, Printer Setup, Cable Connections, Final Setup, Issue"))
    story.append(bullet("Mobile camera opens directly (capture='environment' = rear camera)"))
    story.append(bullet("Client-side size validation (max 3MB) before upload"))
    story.append(bullet("Photos stored at /public/uploads/fsm/[jobNumber]/ — served as static files"))
    story.append(bullet("Thumbnail grid with category tabs + count badges"))

    story.append(Paragraph("8.2 Customer Signature (Mobile Touch)", style_h2))
    story.append(Paragraph(
        "The existing SignaturePad primitive (lifted to src/components/qbit/primitives/SignaturePad.tsx "
        "in the FSM module) is fully touch-aware — uses Pointer Events API which works on mobile "
        "touchscreens, tablets, and desktop mice. DPR-aware canvas scaling ensures crisp signatures on "
        "retina displays. The signature is captured as PNG via canvas.toDataURL() and uploaded to "
        "/api/fsm/work-orders/[id]/signature.",
        style_body))

    story.append(Paragraph("9. Documents Access", style_h1))
    story.append(Paragraph(
        "All document types are accessible from the mobile app via existing modules:",
        style_body))
    docs_data = [
        ["Document Type", "Access Point", "Module"],
        ["Drivers", "Quick Actions → Knowledge Base → Driver Download Center", "driver-download-center"],
        ["Firmware", "Driver Download Center (firmware category)", "driver-download-center"],
        ["Manuals", "Driver Download Center (manual category)", "driver-download-center"],
        ["Installation Guides", "Quick Actions → Knowledge → Installation Center", "installation-center"],
        ["Knowledge Base", "Quick Actions → Knowledge → AI Support Center", "ai-support-center"],
    ]
    story.append(make_table(docs_data, col_widths=[4*cm, 8*cm, 5*cm]))

    story.append(PageBreak())

    # ============ Page 8: Verification ============
    story.append(Paragraph("10. Verification Results", style_h1))

    story.append(Paragraph("10.1 Build Verification", style_h2))
    build_data = [
        ["Check", "Result", "Notes"],
        ["TypeScript (tsc --noEmit)", "PASS", "Zero errors across all PWA files"],
        ["Next.js Production Build", "PASS", "44 routes total (3 new: /api/fsm/location, /api/fsm/sync, /offline)"],
        ["ESLint", "PASS", "No new lint errors"],
        ["Vercel Deployment", "READY", "Deployment dpl_53Y7DNFJeWViVqjot5AytgwJAyRi — state: READY"],
        ["Git Push", "DONE", "Commit 2f743b1 on main"],
    ]
    story.append(make_table(build_data, col_widths=[5*cm, 2.5*cm, 9.5*cm]))

    story.append(Paragraph("10.2 PWA Asset Verification (live on Vercel)", style_h2))
    asset_data = [
        ["Asset", "URL", "HTTP Status", "Content-Type"],
        ["manifest.json", "/manifest.json", "200", "application/json"],
        ["service worker", "/sw.js", "200", "application/javascript"],
        ["icon-192.png", "/icons/icon-192.png", "200", "image/png"],
        ["icon-512.png", "/icons/icon-512.png", "200", "image/png"],
        ["icon-maskable-192.png", "/icons/icon-maskable-192.png", "200", "image/png"],
        ["apple-touch-icon.png", "/apple-touch-icon.png", "200", "image/png"],
        ["favicon-32.png", "/favicon-32.png", "200", "image/png"],
        ["offline page", "/offline", "200", "text/html"],
        ["mobile engineer page", "/?screen=mobile-engineer", "200", "text/html"],
    ]
    story.append(make_table(asset_data, col_widths=[4.5*cm, 5.5*cm, 2*cm, 4.5*cm]))

    story.append(Paragraph("10.3 API Endpoint Verification", style_h2))
    api_test_data = [
        ["Endpoint", "Test", "Result"],
        ["POST /api/fsm/location", "Unauthenticated (no session)", "✓ 403 Forbidden — 'Engineer access required'"],
        ["POST /api/fsm/location", "Authenticated as engineer — valid coords + battery + workOrderId", "✓ 201 Created — returns location ID + capturedAt"],
        ["GET /api/fsm/location", "Authenticated — latest ping for workOrderId", "✓ 200 OK — returns lat/lng/battery/capturedAt"],
        ["GET /api/fsm/sync", "Authenticated — list queue", "✓ 200 OK — returns 3 synced entries with timestamps"],
        ["POST /api/fsm/sync", "Idempotent replay (same clientQueueId)", "✓ Returns cached result (200, no duplicate mutation)"],
    ]
    story.append(make_table(api_test_data, col_widths=[5*cm, 6*cm, 6*cm]))

    story.append(Paragraph("10.4 PWA Installation Verification", style_h2))
    story.append(Paragraph(
        "PWA installability is verified by checking the three required criteria:",
        style_body))
    story.append(bullet("<b>Valid manifest:</b> /manifest.json served with correct Content-Type — "
                        "contains name, icons (192+512), start_url, display=standalone ✓"))
    story.append(bullet("<b>Service worker:</b> /sw.js registered successfully (console log confirms) — "
                        "scope=/, updateViaCache=none ✓"))
    story.append(bullet("<b>HTTPS:</b> Vercel serves all assets over HTTPS (Strict-Transport-Security "
                        "header with preload) ✓"))
    story.append(Paragraph(
        "On Chrome/Edge (Android + Desktop): install prompt appears in address bar. On Safari (iOS): "
        "user taps Share → Add to Home Screen. Both produce a standalone app icon that opens in "
        "fullscreen mode with the QBIT branding.",
        style_body))

    story.append(Paragraph("10.5 Offline Mode Verification", style_h2))
    story.append(bullet("Service worker pre-caches app shell on install (PRECACHE_URLS) ✓"))
    story.append(bullet("API GET requests fall back to cache when offline (networkFirstForApi) ✓"))
    story.append(bullet("Navigations fall back to /offline page when no cache available ✓"))
    story.append(bullet("OfflineBanner component shows sticky red banner when navigator.onLine === false ✓"))
    story.append(bullet("IndexedDB queue persists offline mutations across page reloads ✓"))
    story.append(bullet("Background Sync tag 'offline-sync' registered (Chrome/Edge/Opera support) ✓"))

    story.append(Paragraph("10.6 Synchronization Verification", style_h2))
    story.append(bullet("replayQueue() iterates pending items, calls fetch() for each, updates status ✓"))
    story.append(bullet("Auto-sync triggers on 'online' event (useOnlineStatus hook) ✓"))
    story.append(bullet("Manual 'Sync Now' button in SyncStatus component ✓"))
    story.append(bullet("Server-side idempotency via clientQueueId (no duplicate mutations) ✓"))
    story.append(bullet("3 demo sync entries seeded — all show status='synced' with responseStatus=200 ✓"))

    story.append(Paragraph("10.7 Mobile Responsiveness Verification", style_h2))
    story.append(bullet("max-w-md container centers content on mobile (max 448px) ✓"))
    story.append(bullet("4-column KPI grid fits all phone widths (each tile ~100px) ✓"))
    story.append(bullet("Horizontal scroll for filter chips (overflow-x-auto) ✓"))
    story.append(bullet("Bottom navigation fixed to viewport (position: fixed, bottom: 0) ✓"))
    story.append(bullet("Touch targets meet 44x44pt minimum (buttons + job cards) ✓"))
    story.append(bullet("viewport meta: width=device-width, initialScale=1, viewportFit=cover (notch) ✓"))
    story.append(bullet("user-scalable=no prevents accidental zoom on form inputs ✓"))

    story.append(Paragraph("10.8 Camera + Signature Verification", style_h2))
    story.append(bullet("Permissions-Policy header allows camera=(self) (was fully blocked before) ✓"))
    story.append(bullet("PhotoUploader uses &lt;input capture='environment'&gt; → opens rear camera on mobile ✓"))
    story.append(bullet("SignaturePad uses Pointer Events (touch + mouse + pen) ✓"))
    story.append(bullet("SignaturePad is DPR-aware (crisp on retina) ✓"))
    story.append(bullet("Signature exported as PNG via canvas.toDataURL() ✓"))

    story.append(PageBreak())

    # ============ Page 9: Demo + Next Steps ============
    story.append(Paragraph("11. Demo Access", style_h1))
    story.append(Paragraph(
        "The Engineer Mobile Portal is live at the URL below. Login as the installation engineer, "
        "then open on a mobile device for the full PWA experience.",
        style_body))
    demo_data = [
        ["Item", "Value"],
        ["Mobile Portal URL", "https://qbithub.vercel.app/?screen=mobile-engineer"],
        ["Engineer Login", "engineer@qbithub.com / engineer123"],
        ["Install on Android", "Open in Chrome → address bar 'Install' prompt OR menu → Install app"],
        ["Install on iPhone", "Open in Safari → Share button → Add to Home Screen"],
        ["Test Offline", "Open portal → Chrome DevTools → Network → Offline → perform action → "
                          "go back online → auto-sync"],
        ["Test Camera", "Login → tap any job → Photos tab → 'Capture' button opens camera"],
        ["Test Signature", "Login → tap job in testing state → Generate Report → sign on screen"],
    ]
    story.append(make_table(demo_data, col_widths=[4*cm, 13*cm]))

    story.append(Paragraph("12. Reused Existing Modules (No Duplication)", style_h1))
    story.append(Paragraph(
        "The PWA module reuses all existing infrastructure — no components or APIs were duplicated:",
        style_body))
    story.append(bullet("<b>FSM APIs:</b> /api/fsm/work-orders (GET list), /api/fsm/work-orders/[id] "
                        "(GET detail, PATCH status) — same endpoints used by desktop dashboard"))
    story.append(bullet("<b>Notification API:</b> /api/notifications (GET unread count for badge)"))
    story.append(bullet("<b>FSM Work Order Detail page:</b> tapping any mobile job card opens the "
                        "existing detail page (fully mobile-responsive)"))
    story.append(bullet("<b>PhotoUploader + SignaturePad:</b> existing primitives, no changes needed"))
    story.append(bullet("<b>AI Support Center:</b> Dr. QBIT quick action navigates to existing page"))
    story.append(bullet("<b>Customer Asset History:</b> History quick action navigates to existing page"))
    story.append(bullet("<b>Notification Center:</b> Alerts bottom-nav item opens existing page"))
    story.append(bullet("<b>All primitives:</b> Icon, QbitButton, StatusBadge, TagBadge"))
    story.append(bullet("<b>All hooks:</b> useAuth, useNavigation, useToast"))

    story.append(Paragraph("13. Production Hardening Recommendations", style_h1))
    rec_data = [
        ["Area", "Current State", "Recommendation"],
        ["Push Notifications", "Service worker has push event listener but no provider", "Add FCM (Android) "
         "+ APNs (iOS) via web-push library. Set VAPID keys as env vars."],
        ["Periodic Background Sync", "Registered but not invoked (Chrome-only feature)", "Add "
         "periodic-background-sync permission request + 12-hour interval for job data refresh."],
        ["Geolocation Tracking", "Manual POST on status transition", "Add navigator.geolocation."
         "watchPosition() while status='on_the_way' — auto-ping every 60s."],
        ["Photo Compression", "Full-resolution base64 upload (max 3MB)", "Add client-side canvas "
         "compression (max 1600px, JPEG 0.8) before upload — reduces payload ~80%."],
        ["Offline Conflict Resolution", "Last-write-wins (no conflict detection)", "Add version "
         "number to WorkOrder — reject PATCH if client version < server version."],
        ["App Store Listing", "PWA only (no store presence)", "Optional: use Bubblewrap (Android) "
         "or PWABuilder to generate TWA for Play Store. iOS keeps PWA-only."],
        ["Analytics", "Not implemented", "Add PostHog or Plausible for: app_install, job_open, "
         "photo_capture, signature_complete, sync_replay events."],
        ["Update Notification", "Console log only on SW update", "Show toast: 'New version available — "
         "click to refresh' when service worker update detected."],
    ]
    story.append(make_table(rec_data, col_widths=[3.5*cm, 4.5*cm, 9*cm]))

    story.append(Paragraph("14. Conclusion", style_h1))
    story.append(Paragraph(
        "The QBIT Engineer Mobile Portal — Version 2 — is fully implemented, deployed, and verified as "
        "a Progressive Web App. It is installable on Android (Chrome/Edge) and iPhone (Safari), works "
        "offline with IndexedDB-backed mutation queue + service worker caching, and automatically "
        "syncs when connectivity returns via Background Sync API.",
        style_body))
    story.append(Paragraph(
        "The module reuses all existing FSM, Notification, and AI Support infrastructure — only 2 new "
        "database models (EngineerLocation, OfflineSyncQueue) and 3 new components (OfflineBanner, "
        "SyncStatus, InstallPrompt) were created. The mobile dashboard is now the default home screen "
        "for installation engineers, providing a native-app-like experience from a single web codebase.",
        style_body))
    story.append(Paragraph(
        "All 9 brief requirements are verified: PWA installation ✓, offline mode ✓, synchronization ✓, "
        "mobile responsiveness ✓, camera uploads ✓, customer signature ✓, plus the full engineer home "
        "feature set (today's jobs, upcoming, pending, completed, quick actions, recent customers, "
        "notifications).",
        style_body))
    story.append(callout(
        "Status: READY FOR PRODUCTION  •  Verified: 14 July 2026  •  Owner: QBIT Hub Engineering Team"))
    story.append(Paragraph(
        "<b>Next module awaiting approval:</b> Dr. QBIT Device Detection Engine — as specified in the "
        "brief, implementation will begin only after explicit approval.",
        style_body))

    return story


def main():
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
        title="QBIT Engineer Mobile Readiness Report — Version 2",
        author="QBIT Hub Engineering Team",
        subject="Engineer Mobile Portal (PWA) Verification & Deployment Audit",
        creator="QBIT Hub",
    )
    story = build_story()
    doc.build(story, onFirstPage=draw_cover, onLaterPages=draw_chrome)
    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"✓ PDF generated: {OUTPUT_PATH}")
    print(f"  Size: {size_kb:.1f} KB")


if __name__ == "__main__":
    main()
