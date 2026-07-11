---
Task ID: 16-system-settings
Agent: full-stack-developer
Task: Build SystemSettingsPage from Stitch design

Work Log:
- Read ANALYSIS.md §1 (shared design system), §2.18 (system_settings_qbit_hub_admin spec), §3-7 (general patterns) to absorb Material-3 tokens, typography scale, and the page-by-page spec.
- Read original Stitch HTML at upload/stitch_qbit_hub_enterprise_portal/stitch_qbit_hub_enterprise_portal/system_settings_qbit_hub_admin/code.html to capture exact copy text, icon names, bento layout (col-span-8 Branding, col-span-4 App Settings, col-span-5 Security, col-span-7 Backup), the glass-panel sticky footer action bar, and the JS micro-interactions (theme toggle + live range slider label).
- Inspected existing primitives and shells: Icon, GlassCard/SurfaceCard/Pill, StatusBadge/TagBadge, QbitButton, AppShell, Sidebar (variant="admin" → secondary-container brand bg), TopBar (search + user), useNavigation store, ADMIN_NAV.
- Confirmed shadcn Select / Switch / Table component APIs and verified `qbit-*` token namespace in tailwind.config.ts (qbit-primary #0043c8, qbit-primary-container #0057ff, surface-container-* scale, outline/outline-variant, on-surface-variant).
- Confirmed `--sidebar-width` CSS var is set by AppShell (256px expanded / 80px collapsed) so the sticky footer can compute its left offset via `calc(var(--sidebar-width,256px)+32px)`.
- Confirmed `.qbit-range-slider` class already exists in globals.css (styled webkit + moz thumbs in qbit-primary) — reused as required.
- Confirmed shadcn `--primary` is a neutral dark gray (oklch 0.205 0 0), NOT qbit-primary blue, so the Switch was given an explicit `data-[state=checked]:bg-qbit-primary` override to match the design's blue toggle.
- Overwrote the stub at src/components/qbit/pages/SystemSettingsPage.tsx with a full `"use client"` implementation using named export `SystemSettingsPage`.
- Built AppShell wrapper: variant="admin", brand {QBIT Hub / Control Center / bolt}, activeScreen="system-settings", user {Admin User / Super Administrator / AU}, topBar search "Search settings...", navItems=ADMIN_NAV.
- Built Header section: H2 "System Settings" + subtitle verbatim from design.
- Built 12-col bento grid (`grid grid-cols-12 gap-8`) with 4 SurfaceCard panels (p-8, default surface-container-lowest bg + outline-variant border + rounded-xl shadow-sm):
  1. Branding (lg:col-span-8) — palette icon header; inner 2-col grid (md:grid-cols-2): left = dashed-border cloud_upload drag-drop zone (h-40, "Drag and drop or click to upload" + "PNG, SVG up to 2MB"); right = Primary Color row (#0057ff swatch + "Active Corporate Blue" label + Change button, with info icon tooltip) and Primary Font shadcn Select (Inter default, Roboto, Open Sans, IBM Plex Sans).
  2. App Settings (lg:col-span-4) — language icon header; Default Language Select (English US default), Appearance Theme 3-button grid (Light/Dark/System with light_mode/dark_mode/desktop_windows icons) controlled by `useState<ThemeId>` where active button gets `border-qbit-primary bg-qbit-primary-container/10` + filled primary icon, Timezone Select (Pacific Time default).
  3. Security & Privacy (lg:col-span-5) — security icon header; MFA toggle row using shadcn Switch (checked by default, blue via data-state override) with verbatim helper text; Session Timeout block with live-updating `{sessionTimeout} Minutes` label (primary color) bound to a `.qbit-range-slider` input (min=5 max=120 step=5 value=30) and 5m/60m/120m uppercase tracking-widest labels.
  4. Backup & Restore (lg:col-span-7) — backup icon header on left + `Create Manual Backup` QbitButton (primary, cloud_sync) on right (flex-col on mobile / flex-row on md+); shadcn Table with 4 columns (Date & Time / Size / Status / Action) and 3 rows using StatusBadge (success green for SUCCESS, error red for FAILED) and inline Restore/Retry buttons (text-qbit-primary hover:underline).
- Built sticky footer action bar: fixed bottom-6 with glass-panel bg, left offset `calc(var(--sidebar-width,256px)+32px)` on md+ and full-width left-4/right-4 on mobile, primary pulse dot + "Changes detected but not saved." text on left, Discard (outline) + Save All Changes (primary) QbitButtons on right.
- Added `pb-24` wrapper around main content so the fixed footer does not overlap the last card.
- Ran `bun run lint` → 0 errors (only a pre-existing warning in src/app/layout.tsx about custom fonts). Verified dev.log shows clean `✓ Compiled` lines with no errors.

Stage Summary:
- src/components/qbit/pages/SystemSettingsPage.tsx is a pixel-faithful, fully typed (`"use client"`, named export `SystemSettingsPage`, no `any`) implementation of the system_settings_qbit_hub_admin Stitch design.
- Uses the Admin AppShell variant, ADMIN_NAV, the qbit-* color token namespace, and existing primitives (SurfaceCard, QbitButton, StatusBadge, Icon) plus shadcn Select/Switch/Table.
- Three live React interactions: theme button toggle, MFA switch, and session-timeout range slider (label updates live).
- Sticky footer always visible with Discard + Save All Changes; responsive layout (cards stack to col-span-12 on mobile, footer adapts to full-width on mobile, sidebar-offset on desktop).
- Lint clean and dev server compiles without errors; page is wired through src/app/page.tsx case "system-settings".
