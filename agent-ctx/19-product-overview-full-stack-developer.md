# Task 19 — QbitT800ProductOverviewPage

## What was built
Standalone marketing page for the QBIT T-800 product overview design (Stitch screen `qbit_t_800_product_overview`), implemented at `src/components/qbit/pages/QbitT800ProductOverviewPage.tsx`.

## Key decisions
- No AppShell / no sidebar — this is a marketing page. `--sidebar-width` CSS var is set to `0px` via useEffect.
- Custom fixed top header (h-[72px]) with transparent-to-solid transition + hide/show-on-scroll behavior matching the Stitch JS.
- IntersectionObserver applies `.active` to all `.scroll-reveal` elements (sections + cards).
- Footer uses `bg-qbit-on-background` (dark) with white text per design.
- All icons via `<Icon name="..." />`. All copy from the design HTML, verbatim.
- Native `<details>/<summary>` for FAQ per task spec.
- "View Full Installation Guide" button wired to `navigate("t800-installation-guide")`.

## File produced
- `src/components/qbit/pages/QbitT800ProductOverviewPage.tsx`

## Verification
- `bun run lint`: clean (only pre-existing warning in layout.tsx).
- Dev server compiled successfully (see dev.log).
