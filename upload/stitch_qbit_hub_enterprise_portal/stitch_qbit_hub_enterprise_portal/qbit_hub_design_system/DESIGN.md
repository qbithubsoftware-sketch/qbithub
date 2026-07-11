---
name: QBIT Hub Design System
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#434656'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004ee7'
  primary: '#0043c8'
  on-primary: '#ffffff'
  primary-container: '#0057ff'
  on-primary-container: '#e5e8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#4e5153'
  on-tertiary: '#ffffff'
  tertiary-container: '#66696b'
  on-tertiary-container: '#e7e9eb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#001550'
  on-primary-fixed-variant: '#003ab2'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-sm:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system embodies a premium enterprise aesthetic that prioritizes clarity, precision, and high-performance utility. It draws inspiration from the "utility-luxe" movements seen in industry leaders like Linear and Stripe, blending rigorous functionalism with high-end visual polish.

The personality is authoritative yet approachable, evoking a sense of "quiet power." This is achieved through a **Modern Minimalist** style augmented by subtle **Glassmorphism** for secondary layering. The UI should feel airy and expansive, utilizing generous whitespace to reduce cognitive load in complex data environments. Every interaction should feel intentional, frictionless, and robust, reinforcing the reliability required by enterprise-grade software.

## Colors
This design system utilizes a high-contrast palette rooted in professional blues and clean neutrals. The background is a crisp off-white (#F8FAFC), providing a softer canvas than pure white to reduce eye strain during long work sessions.

- **Primary & Accent:** The Electric Blue (#0057FF) is reserved for primary actions and brand moments, while the softer Blue (#2563EB) is used for secondary interactive elements and links.
- **Semantic Palette:** Success, Warning, and Danger colors are calibrated for high legibility against the light background, ensuring critical status information is immediately recognizable.
- **Neutrals:** We use a deep Charcoal (#111827) for primary text to maintain high accessibility standards, while grays are scaled to define borders and secondary metadata.

## Typography
Inter is the sole typeface for this design system, chosen for its exceptional legibility in digital interfaces and its neutral, systematic character. 

The hierarchy is built on a tight scale to maintain professional density. **Display** and **Headline** styles use tighter letter spacing and heavier weights to create a strong visual anchor. **Body** text is optimized for readability with standard tracking, while **Labels** use medium weights and occasional uppercase styling for clear categorization. For mobile views, large headlines scale down to ensure content remains the focus without excessive scrolling.

## Layout & Spacing
The system follows a strict **8px spacing grid**. All dimensions, padding, and margins must be increments of 8px (or 4px for micro-adjustments).

- **Grid System:** A 12-column fluid grid is used for desktop (1440px max-width), transitioning to 8 columns for tablets and 4 columns for mobile.
- **Sidebars:** Fixed-width navigation sidebars (256px) are preferred to provide a consistent "home base" for enterprise workflows.
- **White Space:** Use "ample" spacing (`2xl` and `3xl`) between major sections to define hierarchy without needing heavy separator lines. Use `md` (16px) for internal card padding and `sm` (8px) for element grouping.

## Elevation & Depth
Depth is communicated through a combination of **Tonal Layers** and **Ambient Shadows**. 

1.  **Level 0 (Base):** Background color (#F8FAFC).
2.  **Level 1 (Cards/Surface):** Pure White (#FFFFFF) with a 1px border (#E2E8F0).
3.  **Level 2 (Modals/Popovers):** Pure White with a "Soft Glass" backdrop blur (12px) and a multi-layered ambient shadow (Offset: 0, 10px; Blur: 15px; Opacity: 0.05).
4.  **Floating Elements:** Elements like toast notifications use a more pronounced shadow to indicate temporary prominence.

Shadows should never be pure black; they are tinted with the Neutral color (#111827) at very low opacities to maintain a clean, high-end feel.

## Shapes
The shape language is sophisticated and approachable. We use a **Rounded** standard (`0.5rem` or 8px) for standard UI components like inputs and buttons. 

Larger containers, such as cards and modals, use `rounded-lg` (16px) to create a distinct visual container that feels modern and "designed." Status chips and specific "pill" buttons use a fully rounded radius to differentiate them from functional inputs.

## Components

### Buttons & Interaction
- **Primary:** Solid #0057FF, white text. Slight inner glow on hover.
- **Secondary:** Light gray surface (#F1F5F9) with charcoal text. 
- **Outline:** 1px border (#E2E8F0) with interactive blue text on hover.
- **Danger:** Solid #EF4444 for destructive actions.
- **Icon Buttons:** Ghost style (no background) by default, appearing on hover to reduce visual noise.

### Inputs & Form Elements
- **Search Bars:** Subtle gray background (#F1F5F9) that transitions to white with a blue border focus state.
- **Dropdowns:** Use the Level 2 Elevation (Soft Glass) for the menu container.
- **Checkboxes/Radios:** Use the primary blue for selected states with a crisp white inner mark.

### Data & Navigation
- **Tables:** No vertical borders. Use 1px horizontal dividers (#F1F5F9). Headers in `label-sm` style.
- **Sidebar:** Dark neutral or light gray background. Active states indicated by a primary blue "indicator" bar on the left edge.
- **Badges/Chips:** Low-saturation backgrounds with high-saturation text (e.g., Success badge is light green with dark green text).

### Feedback & Overlays
- **Modals:** Centered, 16px corner radius, soft ambient shadow, and a 40% opacity dark overlay behind.
- **Toast Notifications:** Positioned bottom-right. Use minimal icons and `body-sm` text.
- **Empty States:** Use center-aligned, desaturated illustrations and a clear Primary CTA button.