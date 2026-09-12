---
name: Ishara Clinical Comm
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#40484b'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#70787b'
  outline-variant: '#c0c8cb'
  surface-tint: '#2d6675'
  primary: '#003440'
  on-primary: '#ffffff'
  primary-container: '#084c5b'
  on-primary-container: '#85bbcd'
  inverse-primary: '#98cfe1'
  secondary: '#4b41e1'
  on-secondary: '#ffffff'
  secondary-container: '#645efb'
  on-secondary-container: '#fffbff'
  tertiary: '#00343f'
  on-tertiary: '#ffffff'
  tertiary-container: '#004c5c'
  on-tertiary-container: '#6cbed6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b4ebfe'
  primary-fixed-dim: '#98cfe1'
  on-primary-fixed: '#001f27'
  on-primary-fixed-variant: '#0b4e5d'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0f0069'
  on-secondary-fixed-variant: '#3323cc'
  tertiary-fixed: '#b0ecff'
  tertiary-fixed-dim: '#81d2ea'
  on-tertiary-fixed: '#001f27'
  on-tertiary-fixed-variant: '#004e5e'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 3rem
    fontWeight: '700'
    lineHeight: 3.5rem
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: 2.5rem
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.005em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
  body-xl:
    fontFamily: Manrope
    fontSize: 1.25rem
    fontWeight: '500'
    lineHeight: 1.875rem
  body-lg:
    fontFamily: Manrope
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
  body-md:
    fontFamily: Manrope
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-sm:
    fontFamily: Manrope
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-lg:
    fontFamily: Manrope
    fontSize: 1rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: 0.01em
  label-md:
    fontFamily: Manrope
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Manrope
    fontSize: 0.75rem
    fontWeight: '700'
    lineHeight: 1rem
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 1.5rem
  gutter-desktop: 2rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system delivers a calm, authoritative, and deeply empathetic healthcare communication interface tailored for Deaf and hard-of-hearing patients communicating via Indian Sign Language (ISL), clinical hospital teams, and remote interpreters. The brand aesthetic merges modern clinical precision with reassuring warmth to mitigate anxiety in vulnerable, high-distress triage and consultation settings.

The visual style embraces modern healthcare functionalism: soft-geometry containers, ultra-crisp visual affordances, high-contrast text hierarchy, and quiet surfaces that recede to let live video feeds, real-time sign prompts, and crucial medical data command primary focus. The emotional objective is instantaneous reassurance, effortless legibility across physical viewing distances (e.g., bedside tablets and nurse-station monitors), and unwavering institutional reliability.

## Colors

The color system is grounded in a deep teal foundation (`#084C5B`) complemented by oceanic slate tones and purposeful semantic indicators designed to meet strict WCAG AAA contrast standards for high-stress medical environments.

### Core Swatches
- **Primary Deep Teal (`#084C5B`)**: Anchors critical clinical navigation, primary interactive actions, and stable structural banners.
- **Primary Mid Teal (`#0D748A`)**: Used for active highlights, focus rings, and primary interactive hover states.
- **Primary Tint Surface (`#E6F4F7`)**: Calming background for patient-facing message cards and active dialogue streams.
- **Secondary Indigo (`#4F46E5` / Tint `#EEF2FF`)**: Dedicated exclusively to Interpreter Portal contexts, video triage connections, and active translation channels to immediately distinguish clinical records from live translation feeds.
- **Neutrals**:
  - `Canvas / Light Base`: `#F8FAFC` (clinical off-white minimizing eye strain under fluorescent lights)
  - `Surface Crisp`: `#FFFFFF`
  - `Borders / Dividers`: `#E2E8F0`
  - `Muted Slate`: `#64748B`
  - `Body / Contrast Neutral`: `#334155`
  - `Obsidian Text Anchor`: `#0F172A`

### Semantic Triage Accents
- **Emergency / Alert**: `#DC2626` (Surface: `#FEF2F2`, Dark Border: `#991B1B`) for pain-scale spikes, nurse alerts, and medical distress triggers.
- **Warning**: `#D97706` (Surface: `#FFFBEB`) for connection lag or ambient noise in ISL sessions.
- **Success / Connected**: `#16A34A` (Surface: `#F0FDF4`) for confirmed translation sync, stable video feeds, and verified vitals.

## Typography

Typography prioritizes extreme visual clarity, generous x-height, and rapid legibility during critical, split-second patient exchanges. `Plus Jakarta Sans` provides geometric friendliness with structural authority for headlines and status titles. `Manrope` governs body copy and interface labels, ensuring clear character distinction for high-stress reading.

### Scaling & Legibility Guidelines
- **Enhanced Baseline**: Patient-facing communications and high-distress quick-phrases default to `body-xl` (20px) or `body-lg` (18px) to guarantee readability when a tablet is mounted to an IV pole or held at arm's length.
- **Data Scannability**: Clinical vital badges and interpreter status tags rely on `label-md` and `label-sm` set in bold weights with positive letter-spacing to prevent numeral blending.

## Layout & Spacing

The layout model balances dense clinical telemetry with spacious, accessible touch targets for patients with impaired mobility or acute distress.

### Grid & Responsiveness
- **Desktop / Workstation (1024px+)**: 12-column fluid responsive grid with `2rem` gutters and `2.5rem` outer margins. Accommodates split-view layouts: 7 columns for multi-party video (Patient, Clinician, ISL Interpreter) and 5 columns for synchronous medical charting and visual symbol boards.
- **Tablet / Bedside Device (600px - 1023px)**: 8-column layout with `1.5rem` gutters and margins, prioritizing vertical stack split-screens (top 60% video/gestural feed, bottom 40% two-way communication keyboard/sign-symbol picker).
- **Mobile Handheld (<600px)**: 4-column layout with `1rem` gutters and `1rem` edge padding, enforcing single-focus views with sticky low-latency emergency triggers.

### Touch Targets
All actionable controls, quick-response chips, and emergency nurse-call buttons must adhere to an absolute minimum touch dimension of `48px x 48px` (ideally `56px` on tablet triage modes) surrounded by at least `space-sm` separation.

## Elevation & Depth

Visual depth is achieved through crisp, low-contrast boundary lines (`#E2E8F0`) combined with calm, clinical tonal stepping and diffused ambient shadows that minimize distraction.

### Elevation Hierarchy
- **Level 0 (Canvas Base)**: `#F8FAFC`. Completely flat.
- **Level 1 (Card & Module Containers)**: `#FFFFFF` surface with a `1px` crisp border in `#E2E8F0`. Shadow: `0px 1px 3px rgba(15, 23, 42, 0.04), 0px 1px 2px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Active Panels, Dropdowns & Video Controls)**: `#FFFFFF` with shadow `0px 4px 6px -1px rgba(8, 76, 91, 0.06), 0px 2px 4px -2px rgba(8, 76, 91, 0.04)` and border `#CBD5E1`.
- **Level 3 (Emergency Modals & Critical Overlays)**: `#FFFFFF` with high-impact ambient blur: `0px 20px 25px -5px rgba(15, 23, 42, 0.1), 0px 8px 10px -6px rgba(15, 23, 42, 0.06)` anchored by a `2px` focus stroke in `#084C5B` or `#DC2626`.
- **Dark Mode Adjustment (Bedside / Night-mode rooms)**: Surface shifts to `#0F172A`, borders to `#1E293B`, and elevation relies strictly on tonal stepping (`#1E293B` to `#334155`) rather than shadows.

## Shapes

The design system employs a roundedness level of `2` (`0.5rem` / `8px` base, `1rem` / `16px` for large cards, and `1.5rem` / `24px` for structural sheet containers). This soft geometry avoids the harshness of severe rectangular corners—reducing perceived clinical intimidation—while preserving clean, space-efficient horizontal lines for medical data matrices.

- **Buttons, Inputs & Small Chips**: `0.5rem` (8px)
- **Clinical Cards, Diagnostic Tiles & Video Containers**: `0.75rem` to `1rem` (12px - 16px)
- **Floating Modals & Bottom Sheets**: `1.5rem` (24px) for upper corners
- **Status Pills & Live Indicators**: Fully pill-shaped (`9999px`)

## Components

### Buttons
- **Primary (Clinical Action)**: Background `#084C5B`, text `#FFFFFF`, border-radius `0.5rem`. Minimum height `48px`. Hover: `#0D748A`. Active state features a persistent `2px` offset ring in `#084C5B`.
- **Interpreter Connect (Specialized)**: Background `#4F46E5`, text `#FFFFFF`. Used strictly to request or patch in live ISL interpreters.
- **Emergency / Assistance Button**: Background `#DC2626`, text `#FFFFFF`, bold `1.125rem` typography, minimum height `56px`. Accompanied by haptic feedback and instant visual state lock.
- **Secondary / Ghost**: Transparent fill with `1.5px` border in `#CBD5E1`, text `#0F172A`.

### Chips & Quick-Sign Prompts
- **Visual ISL Phrase Chips**: Compact, high-contrast pills with an icon/pictogram paired with text (e.g., "Pain Level", "Water", "Doctor", "Family").
- Background `#F1F5F9`, border `1px solid #E2E8F0`, text `#334155`.
- Selected state: Background `#E6F4F7`, border `1.5px solid #084C5B`, text `#084C5B`, font weight `600`.

### Cards & Telehealth Tiles
- Enclosed in `#FFFFFF` with `1px solid #E2E8F0` and `0.75rem` (12px) border radius.
- **Video Tiles**: In-stream overlays displaying connection latency, interpreter certification badge (`#4F46E5` label tag), and real-time audio waveform/caption toggle buttons positioned at top right.

### Input Fields & Communication Console
- Height `48px` or `56px`, internal padding `0.75rem 1rem`.
- Background `#FFFFFF`, border `1.5px solid #CBD5E1`, text `#0F172A`.
- Focused: Border color `#084C5B` with `0 0 0 3px rgba(8, 76, 91, 0.15)`. Error: Border color `#DC2626`.
- Integrated with quick-action sign language phrase drawer toggles inside the field suffix.

### Lists & Triage Timeline
- Separators use `#E2E8F0` hairline dividers.
- Items feature distinct state-indicator left accents (e.g., `4px` solid bar: `#16A34A` for completed translation, `#D97706` for awaiting confirmation).

### Checkboxes & Radio Buttons
- Sized at `24px x 24px` with a minimum interactive tap target of `48px`.
- Checkbox uses `0.25rem` radius; radio is fully circular. Checked state fills with `#084C5B` displaying a crisp `#FFFFFF` checkmark or center pip.