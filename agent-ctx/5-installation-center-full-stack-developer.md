# Task 5-installation-center — full-stack-developer work record

## Goal
Build `src/components/qbit/pages/InstallationCenterPage.tsx` from the Stitch
`installation_center_qbit_hub` design using the InstalCore sidebar variant.

## Inputs read
- `/home/z/my-project/upload/stitch_qbit_hub_enterprise_portal/ANALYSIS.md`
- `/home/z/my-project/upload/stitch_qbit_hub_enterprise_portal/stitch_qbit_hub_enterprise_portal/installation_center_qbit_hub/code.html`
- Primitives: Icon, GlassCard, StatusBadge, ProgressTracker, QbitButton
- Shells: AppShell, TopBar, Sidebar
- Navigation: `useNavigation`, `ScreenId`, `INSTALCORE_NAV`
- `tailwind.config.ts` (qbit-* color tokens), `src/app/globals.css` (helpers)

## Implementation
- AppShell `variant="instalcore"`, `brand={ title: "InstalCore", tagline: "Enterprise Portal", icon: "hub" }`, `activeScreen="installation-center"`, user `{ name: "Senior Engineer", role: "Terminal ID: 4920", initials: "EP" }`, topBar search "Search across enterprise assets...".
- Hero: `rounded-3xl bg-qbit-primary-container`, H2 "Installation Center", exact subtitle, controlled search input + `QbitButton` "Filter" (`filter_list`) styled with `bg-qbit-inverse-surface`.
- Quick Access Bento: 1/2/3 responsive grid, 6 cards (`menu_book`, `video_library`, `bolt`, `account_tree`, `settings_applications`, `error_outline`), hover lift + `arrow_forward` indicator that translates on hover. "Installation Videos" navigates to `video-training-center`.
- Product Selection: header with "View All Products" link (`navigate("product-library")`), 2/3/5 responsive grid of aspect-square gradient cards with Material icons (`desktop_windows`, `phone_android`, `print`, `barcode_scanner`, `store`) and labels `TERMINALS / MOBILE / PERIPHERALS / SCANNING / SELF-SERVICE`.
- Recently Viewed Guides: 3 entries using `ProgressTracker` primitive; titles, section copy, `StatusBadge` (primary / warning / success), progress %, Resume/Review `QbitButton`. Third entry dimmed to opacity-70 to match design.
- Footer: "InstalCore Hub", "Enterprise Hardware Installation Management System v4.2.1", three policy links, share + print icon buttons.
- FAB: `fixed bottom-6 right-6`, `add` icon, hover-rotate, tooltip "New Installation Report".

## Quality gates
- `"use client"` + named export `InstallationCenterPage`.
- Strict TS, no `any`, no emojis, no placeholder copy.
- All icons via `<Icon name="..." />`.
- All in-app navigation via `useNavigation`.
- `bun run lint` -> 0 new errors (only pre-existing layout.tsx custom-font warning).
- dev.log ends with `Compiled in 5.8s` (success).

## Output
- `/home/z/my-project/src/components/qbit/pages/InstallationCenterPage.tsx`
- `/home/z/my-project/worklog.md` (appended section)
