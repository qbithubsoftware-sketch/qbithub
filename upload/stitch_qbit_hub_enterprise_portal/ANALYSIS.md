# QBIT Hub Enterprise Portal — Stitch Design Analysis

Comprehensive structural analysis of all 21 Stitch design HTML pages. Use this document to recreate each page in Next.js + Tailwind + shadcn/ui.

---

## 1. Shared Design System

### Tailwind Configuration (used in every page)

All pages include the same Tailwind CDN config (`tailwind.config = {...}`) plus Inter + Material Symbols Outlined fonts:

```html
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
```

### Color Tokens (Material 3 inspired)

| Token | Hex |
|---|---|
| `primary` | `#0043c8` |
| `on-primary` | `#ffffff` |
| `primary-container` | `#0057ff` |
| `on-primary-container` | `#e5e8ff` |
| `secondary` | `#0051d5` |
| `on-secondary` | `#ffffff` |
| `secondary-container` | `#316bf3` |
| `on-secondary-container` | `#fefcff` |
| `tertiary` | `#4e5153` |
| `on-tertiary` | `#ffffff` |
| `tertiary-container` | `#66696b` |
| `on-tertiary-container` | `#e7e9eb` |
| `error` | `#ba1a1a` |
| `on-error` | `#ffffff` |
| `error-container` | `#ffdad6` |
| `on-error-container` | `#93000a` |
| `background` | `#f9f9ff` |
| `on-background` | `#141b2b` |
| `surface` | `#f9f9ff` |
| `surface-bright` | `#f9f9ff` |
| `surface-dim` | `#d3daef` |
| `surface-variant` | `#dce2f7` |
| `surface-tint` | `#004ee7` |
| `surface-container-lowest` | `#ffffff` |
| `surface-container-low` | `#f1f3ff` |
| `surface-container` | `#e9edff` |
| `surface-container-high` | `#e1e8fd` |
| `surface-container-highest` | `#dce2f7` |
| `on-surface` | `#141b2b` |
| `on-surface-variant` | `#434656` |
| `outline` | `#737688` |
| `outline-variant` | `#c3c5d9` |
| `inverse-surface` | `#293040` |
| `inverse-on-surface` | `#edf0ff` |
| `inverse-primary` | `#b6c4ff` |
| `primary-fixed` | `#dce1ff` |
| `primary-fixed-dim` | `#b6c4ff` |
| `secondary-fixed` | `#dbe1ff` |
| `secondary-fixed-dim` | `#b4c5ff` |
| `tertiary-fixed` | `#e0e3e5` |
| `tertiary-fixed-dim` | `#c4c7c9` |

Note: `darkMode: "class"` is enabled. Some pages include `dark:` variants for sidebar/top bar.

### Typography Scale (Inter font everywhere)

| Token | Size | Line | Weight | Tracking |
|---|---|---|---|---|
| `display-lg` | 48px | 56px | 700 | -0.02em |
| `display-sm` | 36px | 44px | 700 | -0.02em |
| `headline-lg` | 30px | 38px | 600 | -0.01em |
| `headline-lg-mobile` | 24px | 32px | 600 | — |
| `headline-md` | 24px | 32px | 600 | — |
| `headline-sm` | 20px | 28px | 600 | — |
| `body-lg` | 18px | 28px | 400 | — |
| `body-md` | 16px | 24px | 400 | — |
| `body-sm` | 14px | 20px | 400 | — |
| `label-md` | 14px | 20px | 500 | — |
| `label-sm` | 12px | 16px | 600 | 0.05em |

Used via custom font family classes: `font-display-lg`, `font-headline-md`, `font-body-sm`, `font-label-md`, etc. Each has matching text-size helper `text-display-lg`, etc.

### Spacing & Layout

| Token | Value |
|---|---|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 16px |
| `lg` | 24px |
| `xl` | 32px |
| `2xl` | 48px |
| `3xl` | 64px |
| `unit` | 8px |
| `gutter` | 24px |
| `container-max` | 1440px |
| `margin-mobile` | 16px |
| `margin-desktop` | 32px |

### Border Radius

- `DEFAULT`: 0.25rem (4px)
- `lg`: 0.5rem (8px)
- `xl`: 0.75rem (12px)
- `full`: 9999px

Note: In practice, designs use Tailwind's `rounded-lg` (8px), `rounded-xl` (12px), `rounded-2xl` (16px), `rounded-3xl` (24px), and `rounded-full`.

### Custom CSS Classes (define in globals.css)

```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.8);
}
.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.glass-effect { backdrop-filter: blur(12px); }
.bento-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; }
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #c3c5d9; border-radius: 10px; }
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
.scroll-reveal { opacity: 0; transform: translateY(20px); transition: all 0.6s ease; }
.scroll-reveal.active { opacity: 1; transform: translateY(0); }
```

### Icons (Material Symbols Outlined)

Filled variants enabled via inline style: `style="font-variation-settings: 'FILL' 1;"`. Common sizes: `text-[12px]`, `text-[14px]`, `text-[18px]`, `text-[20px]`, `text-[24px]`, `text-[32px]`, `text-[48px]`, `text-3xl`, `text-4xl`.

### Shared Layout Patterns

**Standard Enterprise Layout** (used in ~12 pages):
- Fixed left sidebar (`aside`) `w-64` (256px), `fixed left-0 top-0 h-full`, `bg-surface-container-lowest` or `bg-surface-container-low`, `border-r border-outline-variant`, `shadow-sm`, `z-50`.
- Brand at top: `QBIT Hub` headline + tagline ("Enterprise SaaS", "Control Center", "Field Ops v2.4", "InstalCore Enterprise")
- `<nav>` with `flex-1` and active item: `text-primary font-semibold border-l-4 border-primary bg-surface-container` (sometimes `bg-primary-container/10`).
- Footer of sidebar: avatar (or initials), user name, role.
- Top header `fixed top-0 right-0 w-[calc(100%-256px)] h-16` with `bg-surface-container-lowest/80 backdrop-blur-md`, `border-b border-outline-variant`, `shadow-sm`, `z-40`.
- Main: `ml-64 pt-16 min-h-screen` with `max-w-container-max mx-auto p-lg` or `p-xl`.

**Active Sidebar Item Pattern:**
```
class="flex items-center gap-md px-md py-sm rounded-lg text-primary font-semibold border-l-4 border-primary bg-surface-container"
```

**Inactive Sidebar Item Pattern:**
```
class="flex items-center gap-md px-md py-sm rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors duration-200"
```

### Recurring Sidebar Items (Engineer Portal pages)
- Dashboard (`dashboard`)
- Products (`inventory_2`)
- Drivers (`settings_input_component` or `local_shipping`)
- Installation Guides / Manuals (`menu_book`)
- Videos (`play_circle` or `video_library` or `videocam`)
- Downloads (`download`)
- Knowledge Base (`library_books`)
- Troubleshooting (`build`)
- Bookmarks (`bookmark`)
- Recent Files (`history`)
- Support (`contact_support`)
- Settings (`settings`)
- Collapse (`menu_open`)

### Recurring Sidebar Items (Admin pages)
- Dashboard (`dashboard`)
- Products (`inventory_2`)
- Drivers (`local_shipping`)
- Manuals (`menu_book`)
- Videos (`videocam`)
- Users (`group`)
- Analytics (`monitoring`)
- Settings (`settings`)

### Recurring Sidebar Items (Field Engineer pages)
- Dashboard (`dashboard`)
- My Jobs (`engineering`)
- Inventory (`inventory_2`)
- Documents (`description`)
- Support (`support_agent`)
- (Plus "Sync Offline Data" CTA button at bottom)

### Recurring Sidebar Items (AI Support pages)
- Dashboard (`dashboard`)
- Knowledge Base (`menu_book`)
- Troubleshooting (`build`)
- Support Tickets (`confirmation_number`)
- Analytics (`insights`)
- (Plus "New Support Case" CTA button)

### Common Top Bar Elements
- Search input with leading `search` icon, `bg-surface-container-low`, `rounded-full` (engineer portal) or `rounded-lg` (admin)
- Notification bell (`notifications`) — sometimes with red `bg-error rounded-full w-2 h-2` dot
- Help icon (`help` or `help_outline`)
- Dark mode toggle (`dark_mode`)
- Apps grid (`apps`)
- Avatar (often `<img>` circle `w-8 h-8` or `w-10 h-10` rounded-full)
- User name display

---

## 2. Page-by-Page Analysis

### 2.1 `login_qbit_hub` — Login

**Title:** `Login | QBIT Hub`

**Layout:** Split-screen, full-height. Left 3/5 (lg) / 2/3 (xl) brand panel; right 2/5 (lg) / 1/3 (xl) form panel. No sidebar/topbar. Hidden on small mobile (left section).

**Structure:**
- **Left brand panel:** `bg-primary-container`, gradient overlay `from-primary/80 to-transparent`, image bg with `mix-blend-overlay`. Glass-panel content card.
  - Pill badge: `Enterprise Installation Management` with `verified` icon
  - H1: `Precision Engineering for Modern POS Systems.`
  - Body: `Manage hardware lifecycles, installation workflows, and driver deployments across your global enterprise fleet with QBIT Hub.`
  - Micro-stats grid (2 cols): `12,400+ Active Drivers` / `99.9% Uptime Reliability`
- **Right form panel:** `bg-surface-container-lowest`, `p-xl md:p-3xl`
  - Brand header: blue `dataset` icon in `w-10 h-10 bg-primary rounded-lg` + "QBIT Hub" text
  - H2: `Welcome Back`
  - Subtitle: `Sign in to manage your enterprise POS infrastructure.`
  - **Form fields:**
    - Corporate Email (icon `mail`, placeholder `name@company.com`)
    - Password (icon `lock`, show/hide `visibility` button, placeholder `••••••••`)
    - Remember Device checkbox + `Forgot Password?` link
    - Primary button: `Login to Dashboard` with `arrow_forward` icon
  - Divider: `or continue with`
  - SSO button: `Single Sign-On (SSO)` with `security` icon
  - Footer:
    - `System Build` label + `v2.4.12-enterprise`
    - Support Hub (`contact_support`) → `mailto:support@qbithub.io`
    - API Docs (`terminal`)

**Colors used:** primary, primary-container, on-primary, outline, outline-variant, surface-container-lowest, surface-container-low, background.

**JS interactivity:** Focus scales input wrapper (`scale-[1.01]`). Button click adds ping ripple.

---

### 2.2 `dashboard_qbit_hub` — Installation Engineer Dashboard

**Title:** `QBIT Hub - Installation Engineer Dashboard`

**Layout:** Sidebar + topbar + main content. Full-width bento layout.

**Sidebar items:** Dashboard (ACTIVE), Products, Drivers, Installation Guides, Videos, Downloads, Knowledge Base, Troubleshooting, Bookmarks, Recent Files, Support + (footer: Settings, Collapse).

**Top bar:** Search "Search resources...", notifications, dark_mode, apps icon, divider, avatar + "Alex Chen" name.

**Main sections:**
1. **Welcome banner:** H2 `Welcome back, Installation Engineer`, subtitle `Access all enterprise deployment tools, drivers, and technical manuals from your central command center.`, large search bar with `Search Hub` button. Trending tags: `V3 POS Firmware`, `Printer SDK 2.4`, `Android Integration`.
2. **Summary cards (6-col bento, glass-card):**
   - Total Products: **1,248** (`inventory_2`)
   - Drivers: **432** (`settings_input_component`)
   - Guides: **156** (`menu_book`)
   - Videos: **84** (`play_circle`)
   - Articles: **3.2k** (`library_books`)
   - Latest Updates: **12** (`update`)
3. **Quick Actions (2x2 grid in main col):** Browse Products (`grid_view`), Download Drivers (`cloud_download`), Installation Guides (`fact_check`), Watch Videos (`video_library`)
4. **Pinned Resources (2x2 image cards):**
   - Windows POS Setup Guide (badge: `Popular`)
   - Thermal Printer Driver (badge: `Driver`)
   - Barcode Scanner Manual (badge: `Manual`)
   - Android POS Installation (badge: `Android`)
5. **Recent Activity timeline** (right col):
   - Driver Updated: QBIT T-800, v2.4.1 (2h ago)
   - Manual Revised: Android Kiosk (5h ago)
   - Product Added: HUB-X Pro (Yesterday)
   - Video Uploaded: Fiber Cabling (2 days ago)
6. **Announcements:**
   - System Notice: `Scheduled maintenance on Nov 24, 02:00 GMT.`
   - Firmware: `Global rollout of Firmware 4.0 for all Retail Units.`
   - Knowledge Base: `New security protocols for data encryption added.`
   - Button: `Check All Updates`

**Custom CSS:** `.glass-card`, `.bento-grid`, `.hide-scrollbar`

**JS:** Glass-card hover lift (`translateY(-4px)`). Collapse button toggles sidebar between `w-64`/`w-20`.

---

### 2.3 `home_qbit_hub` — Admin Home

**Title:** `QBIT Hub - Dashboard`

**Layout:** Sidebar (with "QBIT Hub Admin" top bar) + topbar + main.

**Sidebar items:** Dashboard (ACTIVE), Products, Drivers, Manuals, Videos, Users, Analytics, Settings. Footer user: `Alex Rivera`, `Admin Access`.

**Top bar:** "QBIT Hub Admin" text + global search "Global search..." + notifications + help_outline + avatar.

**Main sections:**
1. **Welcome hero (gradient bg, 2-col):**
   - Pill: `System Online • 99.9% Uptime`
   - H2: `Good Morning, Alex.`
   - H3: `Welcome back to QBIT Hub`
   - Meta: `Current Session: Monday, Oct 23 • 09:41 AM` (live updating), `Active Alerts: 2 Critical Updates` (error color)
   - Right: hero illustration image
2. **Universal Search Center** (`max-w-4xl mx-auto`, glass-card): placeholder `Search products, drivers, manuals, installation guides, videos or ask AI...`, keyboard shortcut `⌘K` hint.
3. **System Status KPIs (4-col grid):**
   - Total Products: **1,284** (`inventory_2`) +4%
   - Drivers Active: **342** (`download_for_offline`) +12%
   - Guides & Manuals: **891** (`menu_book`) Stable
   - Training Videos: **156** (`videocam`) -2% (error)
4. **Quick Access (2x3 grid):** Products (Browse Catalog), Drivers (Latest Firmware), Install Guides (Setup Workflows), Manuals (Documentation), Troubleshooting (Error Codes), Knowledge Base (Article Wiki).
5. **New Releases carousel (horizontal scroll):** QBIT Nexus X1 (Enterprise Hub Controller v2.0, "New" badge), Aura Terminal G3 (Advanced POS Interface System), Optic Pro Scan (Precision Inventory Scanner). Each card: View Specs button.
6. **Continue Working sidebar:**
   - X1_Firmware_v4.2.bin (Driver • 2 hours ago)
   - Setup_Manual_Terminal_G3 (Manual • 5 hours ago)
   - Troubleshooting_Optic_Pro (Video • Yesterday)
   - View Full History button
7. **System Updates timeline:**
   - Critical Driver Update: Nexus X1 security patch (TODAY 08:30 AM)
   - New Manual Added: Aura Terminal G3 (Oct 21)
   - Server Maintenance: API optimization (Oct 20)
8. **Floating AI Assistant widget** (bottom-right): toggle button with `chat` icon, expands to chat window with `smart_toy` avatar. Quick prompt suggestions.

**JS:** Live clock update (60s). `⌘K` keyboard shortcut to focus search.

---

### 2.4 `product_library_qbit_hub` — Product Library

**Title:** `QBIT Hub - Product Library`

**Layout:** Sidebar + topbar + main.

**Sidebar:** Same as dashboard (Products ACTIVE).

**Top bar:** Search "Search product technical library...", notifications, dark_mode, apps, avatar (no name shown).

**Main sections:**
1. **Hero (centered):**
   - H2: `Product Library`
   - Body: `Browse all QBIT hardware with specifications, images, videos, manuals and drivers. The definitive technical repository for enterprise-grade hardware solutions.`
   - Search: "Enter model number (e.g. T-800)..." with ⌘K hint
2. **Categories (5-col grid):** Windows POS (12 Products, `desktop_windows`), Android POS (8 Products, `phone_android`), Thermal Printers (15 Products, `print`), Barcode Scanners (6 Products, `barcode_scanner`), Accessories (24 Products, `cable`).
3. **Trending Hardware (horizontal scroll):**
   - HUB-X Pro (Top Resource, Thermal Printer • v2.4 Driver)
   - ScanMaster Elite (Newly Released, Wireless Scanner • User Manual)
   - QBIT T-800 (Most Downloaded, Windows POS • Setup Guide)
4. **Full Hardware Inventory (3-col grid):**
   - Filter & Sort buttons
   - **Card 1: QBIT T-800** — badge `WINDOWS POS`, `MODEL: T-800`, OS icons (Windows/Mac/Linux), chips: Manual/Driver/Video, buttons: View Details, Share (`share`), Favorite (`favorite`).
   - **Card 2: HUB-X Pro** — badge `PRINTER`, `MODEL: HUB-X PRO`, chips: Manual/Driver.
   - **Card 3: ScanMaster Elite** — badge `SCANNER`, `MODEL: SM-E1`, chips: Manual/Video.
5. **Share Modal** (hidden by default, toggleShareModal): "Share Hardware Profile" — copyable URL `https://hub.qbit.com/assets/T-800`, WhatsApp button (`chat`), Download PDF button (`picture_as_pdf`), Email Technical Specs button (`mail`).

**JS:** `toggleShareModal()`, mouse-tracking on glass-cards.

---

### 2.5 `product_details_qbit_t_800` — Product Details: QBIT T-800

**Title:** `QBIT Hub - Product Details: QBIT T-800`

**Layout:** Sidebar + topbar + main.

**Sidebar:** Same as dashboard (Products ACTIVE).

**Top bar:** Search "Search components, documentation, or drivers...", notifications, dark_mode, apps, avatar.

**Main sections:**
1. **Hero (2-col, 7/5 grid):**
   - **Left gallery:** Large 4:3 image with "Hover to zoom" overlay; thumbnail strip (8 thumbnails, first one active with `border-2 border-primary`).
   - **Right info:**
     - Status chips: `In Stock` (green, `check_circle`), `Latest Firmware v4.2.1` (primary)
     - Category label: `WINDOWS POS`
     - H2: `QBIT T-800`
     - Model: `T800-ENT` (italic)
     - OS support icons (Windows, Android, Linux logos)
     - Quick Actions: `Download Driver` (primary, `download`), `User Manual` (`menu_book`), `Installation Video` (`play_circle`), Share/Email/WhatsApp/PDF quick links
     - Key Specs mini-card: CPU (Intel i5-11th Gen, `memory`), Display (15.6" FHD Touch, `tv`)
2. **Detailed Specs section (8/4 grid):**
   - **Left (col-span-8): Technical Specifications table** with header "Technical Specifications" + "Print Spec Sheet" button.
     - Processor (CPU): Intel® Core™ i5-1135G7
     - Memory (RAM): 16GB DDR4 3200MHz
     - Storage: 512GB NVMe M.2 SSD
     - Display: 15.6" IPS, FHD 1920x1080, 10-point Multi-touch
     - Connectivity: Dual-band Wi-Fi 6, Bluetooth 5.1, 1Gbps Ethernet
     - Ports: 6x USB 3.0, 2x COM, 1x HDMI, 1x Cash Drawer (RJ11)
     - Power Supply: External 12V/5A, Energy Star 8.0
   - **Driver section:** "Universal Driver Package" with `STABLE` badge, Version 2.4.1 Stable • Released Oct 12, 2023 • 45.2 MB, `Download Now` + `Release Notes` buttons.
   - **Right (col-span-4): Feature cards** + **5-step Deployment Guide timeline**:
     - Feature cards: Industrial Build (IP54 aluminum chassis, `shield`), Multi-Port Support (`hub`), Energy Efficient (40% less power, `eco`)
     - Deployment Guide steps: 1. Unbox & Inspect (5 min), 2. Mount & Cable (15 min), 3. OS Boot & Setup (10 min), 4. Driver Sync (5 min), 5. Test Print (2 min)
3. **Document Library (3-col):** User Manual v4.0 (PDF, `picture_as_pdf`), Datasheet & Specs (`description`), Warranty Terms (`verified_user`)
4. **Related POS Hardware (horizontal carousel):** QBIT Duo X-200 (Dual-Screen Terminal), QBIT Go M-50 (Mobile POS), QBIT Print P-80 (Peripherals), QBIT Tab Rugged 10 (Industrial Tablet)

**JS:** `showToast()` — Download Started toast notification for "Universal_Driver_v2.4.1.msi". Thumbnail switching with border class toggle.

---

### 2.6 `driver_download_center_qbit_hub` — Driver Download Center

**Title:** `QBIT Hub - Driver Download Center`

**Layout:** Sidebar (Installation Guides ACTIVE) + topbar + main with hero + featured bento + filter sidebar + driver list + recent activity sidebar.

**Top bar:** Search "Search product, model...", notifications, dark_mode, apps, "Admin User" name + avatar.

**Main sections:**
1. **Hero (centered):** Pill `Resource Center`, H2 `Driver Download Center`, body subtitle. Large central search with `Search` button. Filter chips: All Products (active), Windows POS, Android POS, Thermal Printer, Barcode Scanner, Kiosks.
2. **Featured Bento (3-col):**
   - Latest Driver (`bolt` icon): `NEW RELEASE` label, "Universal Thermal Printer v2.4.1", Quick Download
   - Recommended Firmware (`verified`): `STABLE BUILD`, "HUB-X Series Security Patch"
   - Most Downloaded (`trending_up`): `POPULAR`, "Barcode Scanner SDK v1.9"
3. **Filter sidebar (left, w-72):** Product Category checkboxes (POS Terminals, Thermal Printers (checked), Scanners), Operating System select (Windows 11/10, Ubuntu 22.04, Android 13.0), Type chips (Driver active, Firmware, SDK, Utility), Release Year range slider (2020-2024).
4. **Driver list:** "Showing 24 drivers for Thermal Printer", Sort By dropdown. Driver cards (3 shown):
   - **Card 1:** Universal Thermal Printer Driver v2.4.0 — `Verified Official` badge, HUB-X Pro Series, Oct 12 2023, 12.4 MB, OS tags Windows 11/10, release notes preview, Download + Release Notes buttons (`print` icon)
   - **Card 2:** Advanced POS Terminal Firmware v4.1.2 — `Critical Update` (error), POS-2000 & 3000, Nov 05 2023, 45.8 MB, Embedded OS, CVE patch note
   - **Card 3:** Barcode Scanner SDK for Android — `Developer Kit`, Scanner Q-Series, Dec 12 2023, 128 MB, Android 10+, full dev kit note
5. **Pagination:** 1 (active) 2 3 ... 12
6. **Right sidebar (w-80): Recent History timeline:**
   - Thermal Driver v2.4.0 (2 hours ago, downloaded)
   - Scanner SDK v1.9 (Yesterday, viewed)
   - POS Security Patch (Oct 24 2023, downloaded)
   - "View All Activity" button
   - CTA card: "Need Hardware Support?" → Contact Support
7. **Empty State (hidden):** `find_in_page` icon, "No drivers found", Reset All Filters button.

**JS:** Search input focus scale, checkbox filter console logging.

---

### 2.7 `installation_center_qbit_hub` — Installation Center

**Title:** `QBIT Hub - Installation Center`

**Layout:** Sidebar ("InstalCore" brand, Installation Guides ACTIVE with `font-variation-settings: 'FILL' 1`) + topbar + main.

**Sidebar:** Branded as "InstalCore" / "Enterprise Portal". Items: Dashboard, Products, Drivers, Installation Guides (ACTIVE), Videos, Downloads, Settings. Footer user: `Senior Engineer`, `Terminal ID: 4920`, "EP" initials avatar.

**Top bar:** Search "Search across enterprise assets...", notifications (with red dot), help, avatar with `expand_more`.

**Main sections:**
1. **Hero (rounded-3xl, bg-primary-container):** H2 `Installation Center`, subtitle, search input + Filter button (`filter_list`).
2. **Quick Access Bento (3-col, 6 cards):**
   - Installation Guides (`menu_book`)
   - Installation Videos (`video_library`)
   - Quick Setup (`bolt`)
   - Wiring Diagrams (`account_tree`)
   - Configuration Guides (`settings_applications`)
   - Troubleshooting (`error_outline`)
   Each has hover lift + `arrow_forward` indicator.
3. **Product Selection (5-col grid, image cards):** Windows POS (TERMINALS), Android POS (MOBILE), Thermal Printer (PERIPHERALS), Barcode Scanner (SCANNING), Kiosk (SELF-SERVICE). Header has "View All Products" link.
4. **Recently Viewed Guides (list with progress bars):**
   - Windows Terminal Elite X2 Configuration — Section 4: BIOS and Peripheral Sync, `Active` badge, 75% complete, Resume button (`desktop_windows`)
   - TP-800 Thermal Printer Wiring Schematic — Section 2: Parallel Port Pinout, `In Review` badge, 30% complete, Resume button (`print`)
   - Kiosk Core Server Connectivity Setup — Static IP Assignment, `Complete` badge (emerald), 100% complete, Review button (`dns`)
5. **Footer:** InstalCore Hub branding, version "v4.2.1", links (Documentation Policy, Support Portal, Security Standards), share + print icon buttons.
6. **FAB:** `add` icon, tooltip "New Installation Report".

**JS:** Search input scale on focus.

---

### 2.8 `customer_handover_report_qbit_hub` — Customer Handover & Completion Report

**Title:** `QBIT Hub - Customer Handover Report`

**Layout:** Sidebar ("InstalCore" brand) + topbar + main 12-col bento.

**Sidebar:** Dashboard, Products (ACTIVE), Drivers, Installation Guides, Videos, Downloads, Settings. Footer: `Alex Rivera`, `Lead Engineer`, `person` icon.

**Top bar:** Search "Search installation reports...", notifications (red dot), help, divider, "Project: IC-9842" text.

**Main sections:**
1. **Page Header:** Breadcrumb `Reports › Handover`, H2 `Customer Handover & Completion Report`, subtitle "Final validation and sign-off for Installation ID: **INST-442-B**". Action buttons: `Print Installation Report` (`print`), `Download Handover PDF` (`download`, primary).
2. **Bento Grid (12-col):**
   - **Left (col-span-7):**
     - **Completion Checklist:** Three items with status badges:
       - Installation Done (COMPLETED, green) — checked
       - System Tests Passed (VERIFIED, green) — checked
       - Customer Trained & Onboarded (IN PROGRESS, amber) — unchecked
     - **Testing Procedure table:** Columns HARDWARE COMPONENT | DIAGNOSTIC STATUS | ACTION. Rows:
       - Thermal Printer (`print`) — PASS (green) — Retest
       - High-Speed Scanner (`qr_code_scanner`) — PASS — Retest
       - Capacitive Touch Screen (`touch_app`) — FAIL (Recalibration Req.) — Troubleshoot
   - **Right (col-span-5):**
     - **Summary card (bg-primary):** "Handover Status: Awaiting Signatures", `Today, Oct 24 • 14:32 PM`
     - **Digital Signatures:** 
       - Field Engineer: Alex Rivera — signed with image signature, "E-Signed: 2023-10-24 14:15 UTC", "ID: FR-9921-X"
       - Customer: James Wilson (Operations Dir.) — unsigned, "Click here to sign on screen" with `gesture` icon
       - Button: `Email Report to Customer` (`send`, secondary)
3. **Troubleshooting Quick Links (4-col grid):**
   - Network Connectivity (`wifi_off`)
   - Admin Credentials (`key`)
   - Data Sync Delay (`sync`)
   - Level 2 Support (`support_agent`)

**JS:** Toast auto-display after 2s, mock retest button that simulates testing state.

---

### 2.9 `video_training_center_qbit_hub` — Video Training Center

**Title:** `QBIT Hub - Video Training Center`

**Layout:** Sidebar ("InstalCore") + topbar + main.

**Sidebar:** Same as installation center (Videos ACTIVE with FILL 1). Footer user: `Engineer Alpha`, `Tier 3 Certified`.

**Top bar:** Search "Search training, products, or videos...", notifications, help, avatar.

**Main sections:**
1. **Featured Hero (rounded-3xl, bg-primary-container, 2-col):**
   - Left: Pill `Featured Training` (`star`), H2 `Advanced Network Configuration 2.0`, body "Master complex VLAN tagging, priority queuing, and edge security protocols for the newest QBIT Hub enterprise firmware.", `Start Learning` button (white bg), `48m Duration` meta (`schedule`)
   - Right: 16:9 video thumbnail with play button overlay (`play_arrow`)
2. **Category Filter (horizontal scroll):** All Videos (active), Installation (`construction`), Setup (`settings_suggest`), Troubleshooting (`build`), Maintenance (`verified`)
3. **Video Grid (4-col):** Each card has aspect-video thumbnail, duration badge (bottom-right), difficulty badge (top-left, green=Beginner / amber=Expert), category label, title, action buttons (Bookmark, Share, Download), `arrow_forward` indicator. Videos:
   - **Card 1:** QBIT Hub Pro — "Physical Hardware Installation" (12:45, Beginner)
   - **Card 2:** Core Gateway — "SSH Protocol Troubleshooting" (08:20, Expert)
   - **Card 3:** QBIT Mini — "Initial Device Pairing" (05:15, Beginner)
   - **Card 4:** Cooling Units — "Quarterly Filter Replacement" (15:50, Beginner)
   - **Card 5:** Security Edge — "Firewall Rule Orchestration" (22:10, Expert)
   - **Card 6:** Mobile App — "Field Technician App Setup" (06:30, Beginner)
4. **FAB:** `add` icon

**JS:** Filter chip toggling (active state).

---

### 2.10 `t_800_installation_guide_qbit_hub` — T-800 Installation Guide

**Title:** `QBIT Hub - T-800 Installation Guide`

**Layout:** Sidebar ("InstalCore") + topbar + main.

**Sidebar:** Same as installation center (Installation Guides ACTIVE). Footer user: `E. Richardson`, `Lead Field Engineer`.

**Top bar:** Search "Search documentation...", notifications, help, divider, "QBIT T-800 Series" text with `verified` icon.

**Main sections:**
1. **Header:** Breadcrumb `Products › POS Systems › QBIT T-800 Installation`, H2 `Step-by-Step Installation Guide`, subtitle "Complete hardware setup and software provisioning for the QBIT T-800 Windows Point of Sale workstation.", "Estimated total time: **25 Minutes**"
2. **Progress Bar Card:** `Overall Progress` Step 2 of 5, `40%`, gradient progress bar with pulse animation
3. **Main Content (12-col, 8/4 grid):**
   - **Left (col-span-8) — Timeline of steps:**
     - **Step 1: Unbox & Inventory** (completed, `check` icon): "Ensure all components are present including the terminal, stand, power brick, and accessory box." Required Tools: Box Cutter (`content_cut`)
     - **Step 2: Power Connection** (active, pulsing, `2`): "Route the DC power cable through the stand neck and connect to the underside of the QBIT head unit." Estimated Time: 5 mins, `Mark as Complete` button, image
     - **Step 3: Peripheral Wiring** (pending, `3`): "Connect Printer, Cash Drawer, and MSR/Scanner to designated ports." `View Wiring Diagram` link (`schema`)
     - **Step 4: Driver Configuration** (pending, `4`): "Install specific Windows POS drivers for the touchscreen and thermal printer." `Driver Download Center` link (`download_for_offline`)
   - **Right (col-span-4):**
     - **Tools Required:** Power Adapter (In Box, `power`), Cat6 LAN Cable (`lan`), Philips #2 Screwdriver (`build`)
     - **Interactive Checklist:** Safety Verification (Surface is flat and stable, Power outlet is grounded), Hardware Checks (Base plate screws tightened - checked/line-through, Screen tilt mechanism verified, I/O cover plate seated correctly). `Export Certification Log` button.
     - **Help Widget (glass-panel):** "Need Technical Support?" `Live Support Chat` button (`support_agent` watermark in background)
4. **Toast:** "Progress Saved" / "Installation state uploaded to cloud."

**JS:** Auto-show toast on load (1.5s delay, hide after 5s). "Mark as Complete" button transitions to "Processing..." then "Step Completed" (green).

---

### 2.11 `ai_support_center_qbit_hub` — AI Support Center

**Title:** `QBIT Hub - AI Support Center`

**Layout:** Sidebar ("QBIT Hub" / "InstalCore Enterprise") + topbar + main.

**Sidebar items:** Dashboard, Knowledge Base (ACTIVE, `menu_book`), Troubleshooting (`build`), Support Tickets (`confirmation_number`), Analytics (`insights`). CTA button: `New Support Case` (`add`). Footer: Settings, Help Center, user `Alex Mercer` / `Lead Engineer`.

**Top bar:** Title `Technical Installation Support` + nav (Status, Documentation ACTIVE, Remote Assistance) + history, notifications, divider, `AI Assistant` button (`smart_toy`, secondary-container bg).

**Main sections:**
1. **Hero (centered):** H1 `AI Support Center`, subtitle "Intelligent diagnostic and resolution tools for InstalCore hardware." Search bar "Ask anything... e.g. 'Thermal printer not printing'" with `Search` button.
2. **2-col grid (8/4):**
   - **Left (col-span-8):**
     - **AI Assistant Chat Interface:** Header "QBIT Technical Assistant" with `smart_toy` avatar, "Online • Powered by CoreAI" status (emerald pulse dot). Chat shows:
       - Greeting: "Hi Alex! I'm your QBIT Technical Assistant. I have analyzed your previous support logs and current fleet status. How can I help you today?"
       - Suggestion chips: "How do I install Windows POS?", "Printer not detected", "Barcode scanner setup"
       - Detailed response about "Thermal Printer (QBIT-P20) Connection Issue" with numbered steps, code block (`qbit-cli device --reset-port /dev/usb/lp0 --verbose` with copy button), links to V2.4 Driver and Service Manual
       - Input: "Type your technical question..." with send button (`send`)
     - **Troubleshooting Center (2-col):**
       - "Printer not printing" (`print_disabled`, error-container bg) — `Action Required` badge, "3 identical issues reported in Sector 4. Likely firmware mismatch.", `Start Wizard` button
       - "Scanner not scanning" (`barcode_scanner`) — `Common Issue` badge, "Occasional beam timeout during high-frequency operation.", `Run Calibration` button
   - **Right (col-span-4):**
     - **Quick Resources (2x4 grid):** Driver Downloads (`download`), Installation Guides (`menu_book`), Firmware Updates (`system_update`), Manual Library (`library_books`), Training Videos (`videocam`), Warranty (`verified_user`), Support Tickets (`confirmation_number`), Troubleshooting (`construction`)
     - **Recent Tickets:** "2 Open" badge
       - #TIC-9042 — `High Priority` (error), "Kernel Error on POS-X10", Eng. Sarah J., `In Progress` status
       - #TIC-8812 — `Normal` (primary), "Scanner Firmware Update", Eng. David K., `Resolved` status (emerald)
3. **Knowledge Base section:**
   - Filter dropdown: All Categories / POS Machines / Printers / Scanners
   - Articles (3-col):
     - "Optimizing Windows 11 for InstalCore POS-X10 Series" (POS Machines, 8 min read, 2.4k views)
     - "Troubleshooting Thermal Head Overheating Issues" (Printers, 12 min read, 1.8k views)
     - "Configuring Static IP on Mobile Wireless Hubs" (Networking, 5 min read, 3.1k views, bookmarked)
   - Button: `Explore All Articles` (`arrow_forward`)

**JS:** Mouse-down scale-[0.98] on all buttons/links. Search input focus scale.

---

### 2.12 `job_details_inst_550_a_qbit_hub` — Job Details: INST-550-A

**Title:** `QBIT Hub - Job Details: INST-550-A`

**Layout:** Topbar only (NO sidebar) + main 12-col bento + bottom action bar.

**Top bar:** "QBIT Hub" + "Job ID: INST-550-A", nav (Dashboard, My Jobs ACTIVE, Inventory), notifications, settings, avatar.

**Main sections (3-col 3/5/4 grid):**
1. **Left (col-span-3):**
   - **Customer Details:** CloudScale Systems, Acct: #CS-8820-XP, Contact: Sarah Jenkins, Site: "442 Industrial Way, Suite 300, San Francisco, CA 94103" (`business` icon)
   - **Location:** Map preview (grayscale image), `Open in Maps` button (`open_in_new`, secondary-fixed bg)
2. **Middle (col-span-5):**
   - **Installation Progress** timeline (vertical):
     - Step 1: Unboxing & Inspection — 08:45 AM, completed (green check)
     - Step 2: Hardware Setup — `Live` (pulsing), active (primary)
     - Step 3: Final Testing — Scheduled (pending, opacity-50)
   - **Product Checklist:** 
     - QBIT Core Hub V2 (SN: QB-9941-XJ-00, `inventory_2`) — checked (`check_circle`)
     - Satellite Interface Pad (SN: SIP-3342-AA-91, `terminal`) — `Scan` button (primary)
3. **Right (col-span-4):**
   - **Documentation:** `Capture` button (`add_a_photo`), 2-col grid: BEFORE image (with view overlay), "Upload During" placeholder (`add_photo_alternate`, dashed border)
   - **Testing Checklist:** Three test items with Pass/Fail/Retry segmented controls:
     - Thermal Printer (`print`) — Pass selected
     - Laser Scanner (`barcode_scanner`) — Fail selected (error)
     - Local LAN Connect (`lan`) — Retrying (secondary, spinning refresh icon)
4. **Bottom Action Bar (fixed):**
   - Left: "Estimated End Time: 11:30 AM (2h 45m left)", `Report Issue` (`warning`), `View Manual` (`description`)
   - Right: `Next Step: Connectivity` (`arrow_forward`, primary)

**JS:** Glass-card hover lift. Pass/Fail/Retry segmented control toggle.

---

### 2.13 `field_engineer_workspace_qbit_hub` — Field Engineer Workspace

**Title:** `QBIT Hub - Field Engineer Workspace`

**Layout:** Sidebar (`hidden md:flex` mobile-aware) + topbar + main with KPIs + job list.

**Sidebar:** Branded "QBIT Hub" / "Field Ops v2.4". Items: Dashboard (ACTIVE, `dashboard`), My Jobs (`engineering`), Inventory (`inventory_2`), Documents (`description`), Support (`support_agent`). CTA: `Sync Offline Data` (`sync`). Logout link.

**Top bar:** Mobile menu icon (`menu`), search "Search jobs, customers, or serials...", notifications, help, settings, user "Alex Rivera" / "Senior Field Engineer" + avatar.

**Main sections:**
1. **Header:** H2 `Field Workspace`, subtitle "Welcome back, Alex. You have **4 jobs** scheduled for today." Buttons: `View Schedule` (`calendar_today`), `New Job Request` (`add`, primary)
2. **KPI Grid (3-col):**
   - Today's Jobs: **04** (`task_alt`) — +2 from yesterday
   - Pending Installs: **12** (`pending_actions`) — Current backlog
   - Open Issues: **03** (`emergency_home`) — Requires attention (error)
3. **My Installation Jobs (list):** "4 Remaining" badge, filter/sort icons. Job cards:
   - **Job 1:** INST-550-A, `High Priority` (error badge), "The Daily Grind - Soho Branch", "Daily Grind Hospitality Co. • 42nd St, Manhattan", `In Progress` (secondary pulse dot), buttons: Navigate (`near_me`), Call (`call`), Open Job (`arrow_forward`). Icon: `router`
   - **Job 2:** INST-552-C, `Normal`, "Harbor Logistics Hub", "Global Freight Solutions • Pier 94, Industrial Zone", `Scheduled`, Navigate/Call/Open Job. Icon: `satellite_alt`
   - **Job 3:** INST-601-B, `Normal`, "Elevate Coworking Space", "Urban Workplaces LLC • Broadway, Floor 12", `Scheduled`. Icon: `sensors`
   - Footer: "View All 12 Pending Installations" link

**JS:** Active scale-95 on buttons. Search ring on focus.

---

### 2.14 `job_completion_handover_qbit_hub` — Job Completion Handover

**Title:** `QBIT Hub - Job Completion Handover`

**Layout:** Sidebar ("QBIT Hub" / "Field Ops v2.4", My Jobs ACTIVE) + topbar + main.

**Top bar:** Mobile menu, search "Search tasks, assets, or records...", notifications, help, settings, divider, "Alex Rivera" / "Senior Engineer" + avatar.

**Main sections:**
1. **Page Header:** Breadcrumb `Work Orders › WO-94281`, H2 `Installation Handover`, subtitle "Finalize the installation by verifying test results, documenting notes, and collecting authorized signatures from both parties.", Status pill `Status: Quality Check` (`verified`, secondary).
2. **Bento Grid (12-col, 7/5):**
   - **Left (col-span-7):**
     - **Test Results Verification** (AUTO-VERIFIED): Three test rows:
       - Signal Calibration (`signal_cellular_alt`) — -14.2 dBm (Target: -15.0), `check_circle` (secondary)
       - Gateway Response (`router`) — 8ms Latency (Target: <20ms), `check_circle`
       - Power Consumption (`bolt`) — Idle: 4.2W / Peak: 12.1W, `check_circle`
     - **Installation Notes & Recommendations** (`edit_note`): Rich text editor with toolbar (Bold `format_bold`, Italic `format_italic`, Bullet `format_list_bulleted`, Link `link`, Image `image`) + textarea "Describe the deployment environment..."
   - **Right (col-span-5):**
     - **Customer Feedback** (left-bordered secondary): "Ask the client to rate the installation experience..." 5-star rating (4 filled, 1 outline), comments textarea
     - **Digital Authorization** (`draw`): Two signature pads (canvas elements) with `gesture` and `signature` icons:
       - Engineer Signature (Alex Rivera)
       - Customer Signature (James P. Harrison)
       - Clear buttons (`delete`)
     - **Final Action:** `Generate Installation Report` button (`picture_as_pdf`, primary-container bg) + "Final report will be emailed to all stakeholders immediately upon generation."
3. **Success Modal (hidden):** "Handover Complete" with `task_alt` icon, message "The installation report for WO-94281 has been generated and successfully uploaded to the central vault." Buttons: View Report, Done.

**JS:** "Generate Report" button click → loading spinner (`progress_activity` icon) → modal shows. Canvas drawing simulation for signatures.

---

### 2.15 `admin_dashboard_qbit_hub` — Admin Dashboard

**Title:** `QBIT Hub - Admin Dashboard`

**Layout:** Sidebar ("QBIT Hub" / "Control Center", Dashboard ACTIVE) + topbar + main.

**Top bar:** Search "Global search commands...", notifications (with red dot), help_outline, divider, avatar + `keyboard_arrow_down`.

**Main sections:**
1. **Header:** H2 `Admin Control Center`, subtitle "Manage products, drivers, manuals, videos, users and application settings." Action buttons: `Invite User` (`person_add`, surface bg), `Upload Driver` (`upload`, secondary-container bg), `Add Product` (`add`, primary).
2. **KPI Grid (5-col):**
   - Total Products: **124** +12% (`inventory_2`, primary)
   - Active Users: **856** +8.4% (`group`, secondary)
   - Drivers: **42** Stable (`local_shipping`, tertiary)
   - Manuals: **18** +2 (`menu_book`)
   - Storage Used: **65%** Critical (`storage`, error) — with progress bar (error color, pulse)
3. **Main Grid (8/4):**
   - **Left (col-span-8):**
     - **Download Trends chart (simulated bar chart):** Legend "Drivers / Manuals", 7 vertical bars with primary/primary-container colors, floating tooltip "Aug 24 / Drivers: 2.4k"
     - **Recent Uploads table:** Columns Image | Product Name | Category | Status | Last Updated. Rows:
       - Q-Core Engine V2 (Hardware, `Published` primary badge, 2 mins ago)
       - Network Map 2024 (Manual, `Draft` tertiary badge, 1 hour ago)
       - PCIe Kernel Driver (Drivers, `Published`, Yesterday)
   - **Right (col-span-4): Activity Logs timeline:**
     - Alex Johnson uploaded a new product manual (Setup_Guide_V3.pdf, `picture_as_pdf`, 2 minutes ago)
     - Sarah Chen updated Driver #42 (15 minutes ago)
     - System: Security alert - Unrecognized login attempt from IP 192.168.1.45 (1 hour ago, error)
     - Admin invited 3 new team members (3 initials: MK/PT/RL, 3 hours ago)
     - Automator: Backups completed successfully (Yesterday 11:45 PM, opacity-60)
     - "View All Activity" button

**JS:** Table row click navigation log.

---

### 2.16 `user_role_management_qbit_hub_admin` — User & Role Management

**Title:** `QBIT Hub - User Role Management`

**Layout:** Sidebar (Users ACTIVE) + topbar + main.

**Top bar:** Search "Search resources...", notifications, help_outline, "QBIT Hub Admin" title.

**Main sections:**
1. **Page Header:** H2 `User Management`, subtitle "Manage organization members and their access levels.", `Invite User` button (`person_add`, primary).
2. **Tabs:** `Users` (active, primary, border-b-2), `Roles & Permissions`
3. **Users Tab Content:**
   - **Users Table:** Columns Name | Role | Email | Status | Last Login | (action). Rows:
     - Alex Rivera (Team Lead, `Administrator` primary badge), alex.rivera@qbithub.com, `Active` (green dot), 2 hours ago, `more_vert` action
     - Sarah Chen (Field Operations, `Service Engineer` secondary badge), s.chen@qbithub.com, `Active`, Yesterday
     - Jordan Smythe (Logistics, `Hub User` neutral badge), jsmythe@qbithub.com, `Inactive` (outline dot), 3 days ago
   - **Insights (2-col, 3-col-span-2):**
     - Active Sessions bar chart (8 bars, primary/20 hover)
     - Security Audit card: "All users have 2FA enabled. Last audit was 48 hours ago.", `Run Audit` button (`verified_user`)
4. **Roles Tab Content (hidden initially):**
   - **Permission Matrix:** Columns Role | View | Create | Edit | Delete | Upload. Rows:
     - Administrator (Full system access) — all checked & disabled
     - Service Engineer (Maintenance & Diagnostics) — View/Create/Edit/Upload checked
     - Logistics Hub (Fleet & Routing only) — only View checked
     - Guest Observer (Read-only analytics) — only View checked, rest disabled

**JS:** `toggleTab('users' | 'roles')` switches tabs. Row hover translateX(4px).

---

### 2.17 `product_management_qbit_hub_admin` — Product Management

**Title:** `QBIT Hub - Product Management`

**Layout:** Sidebar (Products ACTIVE) + topbar + main.

**Top bar:** Search "Search catalog, serials, or models...", notifications, help_outline, avatar with ring.

**Main sections:**
1. **Header:** Breadcrumb `Inventory › Products`, H2 `Product Management`, `Add Product` button (`add`, primary).
2. **Stats (4-col):**
   - Total SKU: **1,284** +12% vs last month (`trending_up`)
   - Active Items: **1,042** 81% operation rate
   - Archived: **242** 14 new this week (`archive`)
   - System Health: **99.9%** Synchronized (primary color)
3. **Bulk Actions Bar (hidden, slides in when items selected):** "X items selected", `Bulk Delete` (`delete`, error border), `Export CSV` (`file_download`), `close` button
4. **Products Table:** Columns: checkbox | Image | Product Name | Model Number | Category | Status | Last Updated | Actions. Rows:
   - QBIT T-800 (Flagship Enterprise POS), T800-ENT-2024, `Windows POS` (secondary-fixed badge), `Active` (green), Oct 24 2023. Actions on hover: visibility, edit, delete (error)
   - ScanPro M-10 (Industrial Handheld), SPM-10-MOB, `Android Device` (tertiary-fixed badge), `Active`, Nov 02 2023
   - PrintX G-5 (Legacy Thermal Printer), PXG5-LEGACY, `Accessories` (neutral badge), `Archived` (outline), Aug 12 2023
5. **Pagination:** "Showing 1 - 25 of 1,284", first/prev page buttons (disabled), pages 1 (active) 2 3 ... 52, next/last buttons.

**JS:** Select-all checkbox, individual row checkboxes, bulk bar visibility toggle. `clearSelection()` function. Search input focus scale.

---

### 2.18 `system_settings_qbit_hub_admin` — System Settings

**Title:** `QBIT Hub - System Settings`

**Layout:** Sidebar (Settings ACTIVE) + topbar + main.

**Top bar:** Search "Search settings...", notifications, help_outline.

**Main sections:**
1. **Header:** H2 `System Settings`, subtitle "Configure your enterprise hub branding and global application parameters."
2. **Grid (12-col):**
   - **Branding (col-span-8):** `palette` icon
     - Company Logo upload area (drag-drop, dashed border, `cloud_upload` icon, "PNG, SVG up to 2MB")
     - Primary Color: #0057ff (Active Corporate Blue), `Change` button
     - Primary Font: select (Inter default, Roboto, Open Sans, IBM Plex Sans)
   - **App Settings (col-span-4):** `language` icon
     - Default Language: select (English US, Spanish, French, German)
     - Appearance Theme: 3-button grid (Light `light_mode` active, Dark `dark_mode`, System `desktop_windows`)
     - Timezone: select (Pacific Time, UTC, Central European Time)
   - **Security & Privacy (col-span-5):** `security` icon
     - MFA toggle (checked) — "Require additional verification via email or authenticator app."
     - Session Timeout: range slider 5-120 mins, current "30 Minutes"
   - **Backup & Restore (col-span-7):** `backup` icon
     - `Create Manual Backup` button (`cloud_sync`, primary)
     - Backup history table (Date & Time | Size | Status | Action):
       - Oct 24, 2023 - 14:00, Manual backup by Admin, 124.5 MB, `SUCCESS` (green), Restore button
       - Oct 23, 2023 - 03:00, Scheduled system backup, 123.8 MB, `SUCCESS`, Restore
       - Oct 22, 2023 - 03:00, Scheduled system backup, 123.2 MB, `FAILED` (red), Retry
3. **Sticky Footer Action Bar:** "Changes detected but not saved." with `Discard` and `Save All Changes` buttons.

**JS:** Theme button toggle. Range slider live update of "X Minutes" label.

---

### 2.19 `universal_search_command_center_qbit_hub` — Universal Search Command Center

**Title:** `QBIT Hub - Universal Search`

**Layout:** Sidebar (Dashboard ACTIVE, "QBIT Hub" / "InstalCore Enterprise") + topbar + main with command palette modal overlay.

**Top bar:** Title `Technical Installation Support` + search trigger "Search or command..." with `⌘K` badge (clickable, opens modal). Nav: Status, Documentation, Remote Assistance. Notifications (red dot), history, `AI Assistant` button (`auto_awesome`, primary-container bg).

**Main content (background):** Engineer Dashboard placeholder with H1 `Engineer Dashboard`, "Welcome back, Rivera. Here's your active workflow overview." Activity Stream placeholder image, System Health card (Cloud Sync `Optimal`, License Server `Active`).

**Command Center Modal (the focus of the page):**
- **Triggered by:** clicking search bar or pressing `⌘K` / `Ctrl+K`
- **Backdrop:** `command-palette-backdrop backdrop-blur-md`
- **Container:** max-w-2xl (720px max), `bg-surface-container-lowest`, `rounded-2xl`, `shadow-2xl`
- **Search Header:** `search` icon (primary, 28px), input "Type a command or search..." (headline-sm font), `ESC` badge
- **Filter Chips (horizontal scroll):** All (active, primary), Products, Drivers, Manuals, Videos
- **Results (max-h-480px scroll):** Grouped sections:
  - **Quick Actions:** "Create Ticket" (`confirmation_number`, primary bg, `Enter` badge), "Upload Driver" (`upload_file`, secondary bg) — this one is currently selected (border-l-4 primary)
  - **Recent Items:** "T-800 Manual" (`menu_book`, "Manuals • Last opened 2h ago"), "Windows POS Driver" (`settings_input_component`, "Drivers • v2.4.1 Stable")
  - **Products:** "QBIT T-800" (image thumb, "Industrial Processing Unit")
- **Empty State (hidden, simulated):** `search_off` icon, "No results found for '...'", suggested actions (Contact Support, View FAQ)
- **Footer Keyboard Hints:** `↑↓ to navigate`, `Enter to select`, `Esc to close`

**JS:** `openCommandCenter()` / `closeCommandCenter()`. Global hotkey ⌘K / Ctrl+K. Escape to close. Input simulation for no-results (type "xyz" + >5 chars).

---

### 2.20 `universal_search_mobile_qbit_hub` — Universal Search Mobile

**Title:** `QBIT Hub - Search (Mobile)`

**Layout:** Mobile-first. NO sidebar. Top header + sticky search + results + bottom nav + FAB.

**Header (fixed top, glass-header bg):** QBIT Hub logo (`bolt` icon in primary-container square), history button, avatar.

**Sticky Search Section (top-[64px]):**
- Search input "Search knowledge base, tickets..." with `search` icon (left) and `cancel` icon (right, error on hover)
- Filter chips (horizontal scroll): All (active, primary), Documentation, Support Tickets, Drivers, Knowledge Base

**Results (grouped sections):**
1. **Documentation:** "View all" link. Result cards (rounded-2xl, with chevron_right indicator):
   - V3 Core Installation Guide (`menu_book` icon, "Updated 2 days ago • v4.2.0 compatibility...")
   - CLI Reference: Hub Utility (`terminal`, "Comprehensive command list for local dev...")
2. **Recent Tickets:** "Open cases" link. Critical ticket card (`#INC-4921`, `Critical` red badge, "Kernel panic on v3-alpha build", assignee Alex Chen with avatar)
3. **Quick Actions (2-col grid):** `New Case` (`add_circle`, secondary-container bg), `Latest SDK` (`download`, primary icon, surface-container-high bg)
4. **Recent Searches:** List with history icon and `north_west` arrow:
   - Database migration scripts
   - API Authentication v2

**FAB (bottom-24 right-md):** `qr_code_scanner` icon (filled), `w-14 h-14`, `rounded-2xl`, primary bg.

**Bottom Navigation (fixed, h-72px):** Dashboard, Products, Search (ACTIVE with FILL 1, primary color, primary dot badge), Downloads, Profile.

**JS:** Search icon scale animation on focus. Header shadow on scroll > 10px.

---

### 2.21 `qbit_t_800_product_overview` — QBIT T-800 Product Overview (Marketing)

**Title:** `QBIT T-800 — Enterprise Terminal`

**Layout:** Full-width marketing page. Top header (transparent w/ backdrop-blur) + main content + footer. NO sidebar.

**Top Header (fixed top, h-72px, bg-white/80 backdrop-blur-md):**
- Logo: `terminal` icon in `primary-container` square + "QBIT Hub" text
- Search bar (hidden on mobile): "Search Products"
- Nav (lg+): WhatsApp, Contact, English (`language` icon)
- Dark mode toggle (`dark_mode`)

**Main sections:**
1. **Hero (min-h-921px, 2-col, hero-gradient bg):**
   - Left: Pill `Enterprise Series • Model T8-X1`, H1 `QBIT T-800 Terminal` (with "Terminal" in primary color), body "Engineered for high-volume retail and logistics. The T-800 combines military-grade durability with seamless enterprise integration across all major platforms.", CTA buttons:
     - `Download Driver` (primary, `download`)
     - `User Manual` (white bg outline, `description`)
     - `Watch Video` (text link, `play_circle`)
   - Stats: OS Support (Windows/Android/Linux icons), Uptime 99.99%
   - Right: product image with `drop-shadow-2xl`, blurred primary/5 background
2. **Features Bento (3-col grid, bg-white):**
   - H2: `Powering Enterprise Workflows`
   - **Large feature (col-span-2):** `Nano-Performance Engine` (`bolt` icon, watermark `memory` icon), "Equipped with the latest octa-core processor architecture, the T-800 handles complex transactional data with sub-millisecond latency."
   - **Security:** `Krypton Encryption` (`security`), "Hardware-level security modules ensure your enterprise data remains isolated and encrypted at rest."
   - **Durability:** `IP65 Certified` (`shield`), "Dust-tight and protected against water jets, making it ideal for warehouse and outdoor terminal use."
   - **Connectivity (col-span-2):** `Universal I/O Connectivity` (`hub` icon), "Features dual USB-C, Ethernet, and proprietary Q-Link ports..." Tag chips: USB 4.0, Wi-Fi 6E, Bluetooth 5.3
3. **Technical Specifications (bg-surface-container-low):**
   - H2: `Technical Specifications`, `Print Spec Sheet` button
   - Table (rounded-3xl, bg-white):
     - Processor: Octa-Core Q-Silicon X2 @ 3.4GHz
     - Memory: 16GB LPDDR5x RAM
     - Storage: 256GB / 512GB NVMe Gen4 SSD
     - Display: 15.6" Ultra-Bright Retina (450 nits)
     - Dimensions: 360mm x 240mm x 18mm
     - I/O Ports: 2x USB-C 4.0, 1x RJ45, 1x HDMI 2.1, MicroSD
4. **Installation & Training (2-col 8/4):**
   - **Left (col-span-8):** H2 `Installation & Training`, main video player (aspect-video, `play_arrow` button), 3 thumbnail videos:
     - Hardware Setup Guide (2:45)
     - Software Configuration (5:12)
     - Maintenance Basics (1:30)
   - **Right (col-span-4, bg-surface-container-low):** "4-Step Quick Setup" timeline:
     1. Unbox & Inspect
     2. Connect Hardware
     3. Configure OS
     4. Diagnostics Test
     `View Full Installation Guide` button
5. **Download Center (4-col):**
   - H2 `Download Center`, subtitle, `Stable v4.2.1` badge. Cards:
     - Windows Driver (`terminal`, v4.2, Oct 24 2023, 42.5 MB, Download button)
     - Linux SDK (`code`, v3.8, Nov 12 2023, 128.0 MB)
     - BIOS Firmware (`memory`, v4.5, Jan 05 2024, 12.2 MB)
     - User Manual (`auto_stories`, PDF, Latest, 5.8 MB, View Online button)
6. **FAQ (centered, max-w-4xl):** H2 `Frequently Asked Questions`. 3 collapsible `<details>` items:
   - "What is the expected lifespan of the T-800 touch screen?" (50 million touches per point)
   - "Can I upgrade the memory or storage?" (Storage field-upgradeable, Memory soldered)
   - "Is global on-site support available?" (Yes, Enterprise Care in 45+ countries)
   - **Support Cards (3-col):** WhatsApp Support (`chat`, 24/7 Priority Chat), Call Technical Team (`call`, Mon-Fri 9am-6pm), Email Assistance (`mail`, 1-Hour Response Time)

**Footer (bg-on-background, text-white):**
- 6-col grid:
  - Logo + tagline: "Empowering the world's leading enterprises with precision-engineered hardware solutions for over two decades."
  - Products: T-Series Terminals, S-Series Scanners, P-Series Printers, Custom OEM
  - Resources: Developer SDK, Case Studies, White Papers, Documentation
  - Newsletter: email input + Join button
- Copyright row: "© 2024 QBIT Hub Technology Group. All rights reserved." Links: Privacy Policy, Terms of Service, Cookie Settings

**JS:** IntersectionObserver scroll-reveal animation. Sticky header scroll hide/show (translates up when scrolling down past 72px).

---

## 3. Cross-Page Component Patterns

### Status Badges
- **Success/Active:** `bg-green-100 text-green-700 rounded-full` or `bg-green-500/90 text-white` or `bg-emerald-100 text-emerald-700`
- **Warning/In Progress:** `bg-amber-100 text-amber-700` or `bg-amber-500/90 text-white`
- **Error/Critical:** `bg-red-100 text-red-800` or `bg-error-container text-on-error-container`
- **Info/Primary:** `bg-primary/10 text-primary` or `bg-primary text-white`
- **Neutral/Inactive:** `bg-surface-container-highest text-on-surface-variant` or `bg-outline/10 text-outline`

### Tables
- Header: `bg-surface-container-low border-b border-outline-variant`, `font-label-sm text-outline uppercase tracking-wider`
- Body rows: `divide-y divide-outline-variant`, hover `hover:bg-surface-container-low`
- Cells: `px-md py-md` or `px-gutter py-md`, `font-body-sm`

### Cards
- Standard: `bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm`
- Glass: `glass-card rounded-xl p-lg shadow-sm`
- Hover lift: `hover:shadow-md transition-all group` with `group-hover:scale-110` on inner icon

### Buttons
- **Primary:** `bg-primary text-on-primary rounded-xl px-md py-sm hover:bg-primary-container`
- **Secondary:** `bg-surface-container-low text-on-surface border border-outline-variant rounded-xl`
- **Outline:** `border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container`
- **Danger:** `bg-error text-white` or `border border-error text-error`
- **Pill/Chip:** `rounded-full px-md py-xs` or `px-md py-2`

### Forms
- Inputs: `bg-surface-container-low border border-outline-variant rounded-xl pl-10 pr-md py-md focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white`
- Search inputs typically have leading icon at `absolute left-3 top-1/2 -translate-y-1/2`
- Labels: `font-label-md text-label-md text-on-surface-variant`

### Timeline/Stepper
- Vertical line: `absolute left-[X] top-2 bottom-2 w-[2px] bg-outline-variant/30`
- Step circle: `w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center z-10`
- Completed step: filled primary with `check` icon
- Active step: `bg-primary ring-4 ring-primary/20 animate-pulse`
- Pending step: `bg-surface-container border-2 border-outline-variant text-on-surface-variant`

### Modals
- Container: `fixed inset-0 z-[60] flex items-center justify-center`
- Backdrop: `absolute inset-0 bg-on-background/40 backdrop-blur-sm`
- Card: `relative bg-surface-container-lowest w-full max-w-md p-xl rounded-2xl shadow-2xl`

### Toast Notifications
- Container: `fixed bottom-lg right-lg bg-surface-container-highest p-md rounded-xl shadow-2xl border border-outline-variant flex items-center gap-md`
- Hidden initially: `translate-y-32 opacity-0 transition-all duration-300`
- Show: remove `translate-y-32 opacity-0`

### Floating Action Button (FAB)
- `fixed bottom-lg right-lg w-14 h-14 bg-primary text-on-primary rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50`

---

## 4. Shared Component Checklist for Next.js + shadcn/ui Implementation

### Layout Components Needed
- `<AppShell>` — sidebar + topbar + main wrapper (variants: engineer, admin, field-engineer, ai-support, marketing)
- `<Sidebar>` — with brand, nav items (active state), footer user card, optional CTA button
- `<TopBar>` — with search, action icons, user
- `<MobileBottomNav>` — for mobile pages

### UI Components Needed
- `<GlassCard>` — glass effect card
- `<KpiCard>` — icon, label, value, delta badge
- `<StatusBadge>` — variants: success, warning, error, info, neutral
- `<TimelineStep>` — number/icon, title, status, content
- `<ProgressTracker>` — percentage bar with label
- `<DataTable>` — sortable, paginated, with bulk select bar
- `<FilterSidebar>` — checkboxes, selects, range slider, chips
- `<ChatInterface>` — message list, input, suggestion chips, code block
- `<CommandPalette>` — modal with search, filter chips, grouped results, keyboard hints
- `<SignaturePad>` — canvas-based signature input
- `<RichTextEditor>` — textarea with toolbar
- `<VideoCard>` — thumbnail, duration badge, difficulty badge, actions
- `<ProductCard>` — image, badges, OS icons, action buttons
- `<Toast>` — bottom-right notification with auto-dismiss
- `<Modal>` — backdrop + content with close button

### Page-Specific Notes
- **Login:** 2-pane split (brand + form), no shell
- **Marketing pages (qbit_t_800_product_overview):** No sidebar, full-width sections with footer
- **Mobile pages (universal_search_mobile):** No sidebar, bottom nav, FAB
- **Job details:** No sidebar (focused work), bottom action bar
- **Command center:** Modal overlay on top of dashboard

---

## 5. Data Points to Seed

### Products
- QBIT T-800 (T800-ENT, Windows POS, v4.2.1 firmware, 16GB RAM, 512GB SSD, $1,248 active)
- HUB-X Pro (HUB-X PRO, Printer, v2.4 driver)
- ScanMaster Elite (SM-E1, Scanner, wireless)
- QBIT Nexus X1 (Enterprise Hub Controller v2.0)
- Aura Terminal G3 (Advanced POS Interface System)
- Optic Pro Scan (Precision Inventory Scanner)
- QBIT Duo X-200 (Dual-Screen Terminal)
- QBIT Go M-50 (Mobile POS)
- QBIT Print P-80 (Peripherals)
- QBIT Tab Rugged 10 (Industrial Tablet)
- ScanPro M-10 (SPM-10-MOB, Industrial Handheld, Android)
- PrintX G-5 (PXG5-LEGACY, Legacy Thermal Printer, archived)

### Job IDs / Installation IDs
- INST-550-A (CloudScale Systems, The Daily Grind - Soho Branch)
- INST-552-C (Harbor Logistics Hub)
- INST-601-B (Elevate Coworking Space)
- INST-442-B (Customer Handover - James Wilson)
- WO-94281 (Job Completion Handover)
- IC-9842 (Project)

### Users
- Alex Chen (Installation Engineer, dashboard)
- Alex Rivera (Lead Engineer / Senior Field Engineer / Senior Engineer / Admin)
- Alex Mercer (Lead Engineer, AI Support)
- Sarah Chen (Field Operations, Service Engineer)
- Sarah Jenkins (Customer Contact, CloudScale Systems)
- Jordan Smythe (Logistics, Hub User, inactive)
- James Wilson (Operations Dir., Customer)
- James P. Harrison (Customer)
- Alex Johnson (uploaded manual)
- E. Richardson (Lead Field Engineer)
- Engineer Alpha (Tier 3 Certified)
- Admin User (Super Administrator)
- Eng. Sarah J. (ticket assignee)
- Eng. David K. (ticket assignee)

### Tickets
- #TIC-9042 — Kernel Error on POS-X10 (High Priority, In Progress)
- #TIC-8812 — Scanner Firmware Update (Normal, Resolved)
- #INC-4921 — Kernel panic on v3-alpha build (Critical)

### Drivers/Firmware
- Universal Thermal Printer Driver v2.4.0 / v2.4.1 (12.4 MB, HUB-X Pro)
- Advanced POS Terminal Firmware v4.1.2 (45.8 MB, POS-2000/3000, CVE-2023-5421)
- Barcode Scanner SDK v1.9 / Android (128 MB, Q-Series)
- Windows Driver v4.2 (42.5 MB)
- Linux SDK v3.8 (128 MB)
- BIOS Firmware v4.5 (12.2 MB)
- X1_Firmware_v4.2.bin

### Statistics
- Total Products: 124 / 1,248 / 1,284
- Drivers: 42 / 432 / 342
- Manuals/Guides: 18 / 156 / 891
- Videos: 84 / 156
- Articles: 3.2k
- Active Users: 856
- Storage Used: 65%
- Uptime: 99.9% / 99.99%
- Active Drivers: 12,400+

---

## 6. JavaScript Interactions Summary

| Page | Interaction |
|---|---|
| Login | Input focus scale, button ripple |
| Dashboard | Card hover lift, sidebar collapse toggle |
| Home | Live clock (60s interval), ⌘K focus search, AI assistant hover expand |
| Product Library | Share modal toggle, mouse-tracking on cards |
| Product Details | Thumbnail switching, download toast, auto-show after click |
| Driver Download Center | Search focus scale, checkbox logging |
| Installation Center | Search focus scale |
| Customer Handover | Auto-toast after 2s, retest button testing state |
| Video Training | Filter chip toggle, search ring |
| T-800 Installation Guide | Auto-toast on load, Mark as Complete button → Processing → Step Completed |
| AI Support Center | Mouse-down scale, search focus scale |
| Job Details | Card hover lift, segmented Pass/Fail/Retry toggle |
| Field Engineer Workspace | Active scale-95 on buttons, search ring |
| Job Completion Handover | Generate Report → spinner → success modal, canvas drawing |
| Admin Dashboard | Row click navigation |
| User Role Management | Tab switching, row hover translateX |
| Product Management | Select-all/bulk bar toggle, search focus scale |
| System Settings | Theme button toggle, range slider live update |
| Universal Search Command Center | ⌘K / Ctrl+K hotkey, ESC close, search input no-results simulation |
| Universal Search Mobile | Search icon scale animation, header shadow on scroll |
| QBIT T-800 Overview | IntersectionObserver scroll-reveal, sticky header hide/show |

---

## 7. Next.js + Tailwind + shadcn/ui Implementation Notes

1. **Tailwind config:** Add the same color tokens to `tailwind.config.ts`. Include custom font sizes via `fontSize` and font families via `fontFamily`.
2. **Inter font:** Use `next/font/google` for Inter.
3. **Material Symbols:** Either use `@fontsource/material-symbols-outlined` or load via `<link>` in root layout.
4. **Custom CSS:** Define `.glass-card`, `.glass-panel`, `.bento-grid`, `.hide-scrollbar`, `.custom-scrollbar` in `globals.css`.
5. **shadcn/ui mappings:**
   - Buttons → custom variants (primary, secondary, outline, danger, ghost)
   - Card → GlassCard with `glass-card` class
   - Table → DataTable with custom styling
   - Dialog → Modal with backdrop blur
   - Tabs → custom implementation with `border-b-2 border-primary` for active
   - Toast → shadcn Sonner with custom styling
   - Badge → StatusBadge with semantic variants
   - Checkbox → custom with primary color
   - Select → shadcn Select
6. **Layout:** Create per-role `<AppShell>` components (EngineerAppShell, AdminAppShell, FieldAppShell, AISupportAppShell).
7. **Mobile:** Use responsive utilities (`hidden md:flex`, `md:hidden`). Build dedicated mobile pages for universal_search_mobile.
8. **Dark mode:** All sidebar/topbar variants have `dark:` classes; ensure `next-themes` integration.
9. **Charts:** Use Recharts or custom CSS bar charts (the dashboard uses simple div-based bars).
10. **Signature pad:** Use `react-signature-canvas` for job_completion_handover.

---

End of analysis. Each page can now be recreated in Next.js using this document without re-reading the original HTML.
