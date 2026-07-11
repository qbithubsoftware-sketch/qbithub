# Task 17 — Universal Search Command Center

**Agent:** full-stack-developer
**Page:** `/home/z/my-project/src/components/qbit/pages/UniversalSearchCommandCenterPage.tsx`
**Design source:** `upload/stitch_qbit_hub_enterprise_portal/stitch_qbit_hub_enterprise_portal/universal_search_command_center_qbit_hub/code.html`
**AppShell variant:** `ai-support` (brand `smart_toy`, tagline `InstalCore Enterprise`, CTA `New Support Case`, AI Assistant topbar button)
**activeScreen:** `universal-search-command-center`
**navItems:** `COMMAND_CENTER_NAV`
**User:** Alex Mercer / Lead Engineer / AM

## What was built

A two-layer page:
1. **Background dashboard** (AppShell children) — H1 "Engineer Dashboard", subtitle "Welcome back, Rivera. Here's your active workflow overview.", 12-col grid: Activity Stream placeholder card (gradient bg + filled `activity` icon) on the left, System Health SurfaceCard (Cloud Sync `Optimal`, License Server `Active`, both `StatusBadge variant="success"`) on the right.
2. **Command Center Modal** (AppShell sibling at z-[60]) — auto-opens on mount; also opens via topBar search focus or global ⌘K / Ctrl+K; closes on Escape / backdrop click.

### Modal structure
- Backdrop: `.command-palette-backdrop` (rgba(20,27,43,0.4) + blur-8px, defined in globals.css)
- Container: `w-full max-w-[720px]` rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-2xl, role="dialog" aria-modal
- Search header: 28px primary `search` icon + transparent border-less `text-xl font-semibold` input ("Type a command or search...") + ESC badge
- Filter chips (`hide-scrollbar` horizontal scroll, bg-surface-dim/20): All (active -> bg-primary text-on-primary), Products, Drivers, Manuals, Videos — clicking toggles `activeFilter` state
- Results (`custom-scrollbar max-h-[480px] overflow-y-auto`): 3 grouped sections with primary uppercase headers
  - Quick Actions: Create Ticket (primary/10 tile + `Enter` right-badge), Upload Driver (secondary/10 tile, **selected by default** — border-l-4 border-primary bg-surface-container-low)
  - Recent Items: T-800 Manual (`menu_book`), Windows POS Driver (`settings_input_component`) — both neutral surface-variant tiles
  - Products: QBIT T-800 (`qbit-gradient-primary` tile + filled `memory` icon, "Industrial Processing Unit")
- Empty state (triggered when `query.trim().length > 5 && query.toLowerCase().includes("xyz")`): 24x24 surface-container-low circle with `search_off` icon at 48px opacity-40, "No results found for '<query>'" headline, suggestion copy, Contact Support (primary) + View FAQ (outline) buttons
- Footer keyboard hints: bg-surface-container-low border-t — `↑↓ to navigate`, `Enter to select`, `Press Esc to close` (arrows via HTML entities, no emojis)

### Keyboard navigation
- Global keydown listener (always on): ⌘K / Ctrl+K -> `openModal()`
- Modal-only keydown listener (registered when `isOpen`):
  - Escape -> `closeModal()`
  - ArrowDown -> `(i + 1) % FLAT_ITEMS.length`
  - ArrowUp -> `(i - 1 + FLAT_ITEMS.length) % FLAT_ITEMS.length`
  - Enter -> `activate(FLAT_ITEMS[selectedIndex])` -> toast + navigate (if item has `screen`)
- `scrollIntoView({ block: "nearest" })` keeps the active row visible
- Input auto-focuses ~60ms after the modal opens

### Flat result list (5 items)
| idx | id | title | group |
|---|---|---|---|
| 0 | create-ticket | Create Ticket | Quick Actions |
| 1 | upload-driver | Upload Driver | Quick Actions (default selected) |
| 2 | t800-manual | T-800 Manual | Recent Items |
| 3 | windows-pos-driver | Windows POS Driver | Recent Items |
| 4 | qbit-t-800 | QBIT T-800 | Products (navigates to product-details-t800) |

## Tokens used (all qbit-*)
primary, primary-container, secondary, surface-variant, surface-container-lowest, surface-container-low, surface-container, surface-container-high, surface-dim, outline, outline-variant, on-surface, on-surface-variant, on-primary, on-primary-container. Plus `.qbit-gradient-primary` for the product tile and `.command-palette-backdrop` / `.custom-scrollbar` / `.hide-scrollbar` utility classes from globals.css.

## Quality
- Strict TypeScript — `FilterChip`, `ResultIconTone`, `ResultItem`, `ResultGroup` unions/interfaces; no `any`.
- `"use client"` directive; named export `UniversalSearchCommandCenterPage`.
- All icons via `<Icon name="..." />` (filled variant for the gradient product tile + the activity placeholder icon).
- All in-app navigation via `useNavigation((s) => s.navigate)` with typed `ScreenId` targets (ai-support-center, system-settings, product-details-t800).
- No emojis — arrows rendered via `&#8593;` / `&#8595;` HTML entities.
- Responsive — modal uses `px-4 pt-24 md:pt-32`; footer hints use `flex-wrap`; grid collapses to single column on mobile.
- `bun run lint` — 0 errors, 0 warnings in the new file (only the pre-existing custom-font warning in layout.tsx). Dev server compiles cleanly.
