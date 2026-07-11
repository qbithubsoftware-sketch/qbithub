# Task 10 — JobDetailsInst550APage

## Summary
Built the focused-work "Job Details: INST-550-A" page (topbar-only, no sidebar, fixed bottom action bar) at `src/components/qbit/pages/JobDetailsInst550APage.tsx`.

## Layout
- `useEffect` sets `--sidebar-width: 0px` on `documentElement` so the custom topbar spans the full width.
- Custom inline fixed topbar (h-16): brand "QBIT Hub" + "Job ID: INST-550-A" subtitle, center nav (Dashboard / My Jobs active / Inventory), right cluster (notifications + settings + AR avatar).
- Main: `max-w-container-max mx-auto`, `pt-16 md:pt-20`, `pb-24`, `grid-cols-1 lg:grid-cols-12` with col-span-3 / col-span-5 / col-span-4.
- Fixed bottom action bar (h-20, backdrop-blur): left = Estimated End Time + Report Issue + View Manual (horizontal scroll on mobile), right = primary "Next Step: Connectivity" CTA.

## Sections
- **Left**: Customer Details (CloudScale Systems, #CS-8820-XP, Sarah Jenkins, 442 Industrial Way address, business icon); Location card with a grayscale gradient + grid + map icon + location_on pin map placeholder and "Open in Maps" button (secondary-fixed bg).
- **Middle**: Installation Progress timeline using 3 TimelineStep primitives (completed/active/pending); Product Checklist with 2 rows (QBIT Core Hub V2 checked with emerald check_circle, Satellite Interface Pad with primary "Scan" button).
- **Right**: Documentation card with Capture button + 2-col grid (BEFORE tile with hover overlay + photo_camera icon, Upload During dashed placeholder); Testing Checklist with 3 rows of Pass/Fail/Retry segmented controls (emerald/error/secondary backgrounds, spinning progress_activity icon for Retrying).

## Interactivity
- Testing checklist segmented control wired via `useState<TestItem[]>` — clicking any option updates that row only and applies the correct color/icon variant.
- Navigation: Dashboard + Inventory → field-engineer-workspace; View Manual → installation-center; Next Step: Connectivity → job-completion-handover.

## Quality
- Strict TypeScript, no `any`, no emojis, named export `JobDetailsInst550APage`, `"use client"`.
- All icons via `<Icon name="..." />`.
- All qbit-* Material-3 color tokens (no indigo/blue, no random colors).
- Responsive 1-col → 3-col grid; bottom bar scrolls horizontally on small viewports.
- `bun run lint` clean (only pre-existing layout.tsx custom-font warning).
- Dev server log shows clean recompiles.
