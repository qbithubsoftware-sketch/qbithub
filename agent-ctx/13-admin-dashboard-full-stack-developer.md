# Task 13 — admin-dashboard — full-stack-developer

## Goal
Build `/home/z/my-project/src/components/qbit/pages/AdminDashboardPage.tsx` from the Stitch `admin_dashboard_qbit_hub` design HTML.

## Inputs read
- `/home/z/my-project/upload/stitch_qbit_hub_enterprise_portal/ANALYSIS.md` (sections 1, 2.15, 3-7).
- `/home/z/my-project/upload/stitch_qbit_hub_enterprise_portal/stitch_qbit_hub_enterprise_portal/admin_dashboard_qbit_hub/code.html` (full 471-line source).
- `/home/z/my-project/worklog.md` (previous agents' work, esp. 1-engineer-dashboard and 12-user-role-management for the admin sidebar wiring).
- Primitives: Icon, GlassCard/SurfaceCard/Pill, StatusBadge/TagBadge, KpiCard, ProgressTracker, QbitButton.
- Shells: AppShell, Sidebar, TopBar.
- Navigation: `useNavigation` store + `ADMIN_NAV` config (Dashboard/Products/Drivers/Manuals/Videos/Users/Analytics/Settings).

## Implementation
- AppShell `variant="admin"`, brand `{ title: "QBIT Hub", tagline: "Control Center", icon: "bolt" }`, `activeScreen="admin-dashboard"` (no exact sidebar match — intentional per task spec), user `{ name: "Admin User", role: "Super Administrator", initials: "AU" }`, topBar search `"Global search commands..."`.
- Header: H2 "Admin Control Center" + verbatim subtitle + 3 QbitButtons (Invite User surface/person_add, Upload Driver primary-container/upload, Add Product primary/add).
- KPI grid (1/2/5 responsive): 5 cards (Total Products 124, Active Users 856, Drivers 42, Manuals 18, Storage Used 65% with ProgressTracker variant=error pulse=true value=65).
- Main 8/4 grid:
  - Left: recharts BarChart card "Download Trends" with custom legend + custom Tooltip rendering month + Drivers/Manuals values (data exactly as specified). Recent Uploads table (3 rows verbatim, gradient+icon image column, Published/Draft badges).
  - Right: Activity Logs timeline (5 entries verbatim with colored dots, attachment chip for PDF, 3 overlapping avatar initials for invitees, dimmed Automator entry). "View All Activity" footer button.
- All navigation via `useNavigation`. All icons via `<Icon name="..." />`. Strict TypeScript, no `any`, no emojis.

## Lint
`bun run lint` — passes (only the pre-existing layout.tsx font warning, unrelated). Dev server returns GET / 200 in 247ms with clean compile.

## Output file
`/home/z/my-project/src/components/qbit/pages/AdminDashboardPage.tsx` (overwritten stub).
