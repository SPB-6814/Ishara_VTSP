# Ishara — Design System Specification (`design.md`)
**Version:** 1.0.0  
**Target:** Next.js, Tailwind CSS v3/v4, shadcn/ui  
**Compliance:** WCAG 2.1 AA across product; WCAG 2.1 AAA on Patient Tablet surfaces

---

## 1. Brand Identity & Product Philosophy

**Ishara** (इशारा / Gesture) is a clinical-grade hospital communication system connecting Deaf/mute patients (using Indian Sign Language) with clinical staff, physicians, and remote certified ISL interpreters. 

### Core Principles
1. **Calm Competence Over Decoration:** Sits alongside EHR and patient monitors. No consumer whimsy, illustration clutter, or playful UI tropes.
2. **Never Color Alone:** Every semantic status (emergency, warning, online, connecting) strictly pairs color with an iconography glyph and unambiguous text label.
3. **High-Stress Patient Ergonomics:** Patient-facing tablet interfaces feature fixed high-contrast light mode (WCAG AAA), touch targets ≥48px (minimum 64px for emergency actions), and high-legibility Indian Sign Language pictograms.
4. **Clinical Low-Light Support:** Staff and Interpreter portals offer calibrated clinical Dark Mode for dim hospital wards, ICU workstations, and overnight shifts without retinal blow-out.

---

## 2. Color Palette & Token Architecture

### Primary Palette (Clinical Trust & Reliability)
- `primary-50`: `#F0F9FA` (subtle tint backgrounds, active item fills)
- `primary-100`: `#E1F4F7` (pill badges, hover backgrounds)
- `primary-200`: `#BBE5EC` (borders on selected items)
- `primary-500`: `#0E88A3` (interactive buttons, icons)
- `primary-600`: `#0D748A` **(Primary Brand Color)**
- `primary-700`: `#0A5C6E` (hover states, primary headers)
- `primary-900`: `#083B47` (deep contrast text, active indicators)

### Interpreter Portal Distinct Accent (Visual Partition)
- `interpreter-50`: `#EEF2FF`
- `interpreter-100`: `#E0E7FF`
- `interpreter-500`: `#6366F1`
- `interpreter-600`: `#4F46E5` (Interpreter Primary Accent)
- `interpreter-700`: `#4338CA`

### Semantic & Urgency Palette
*Strictly reserved for status and clinical signals.*
- **Critical / Emergency Alert:**
  - Background: `#FEF2F2` (Red 50)
  - Surface Alert: `#FEE2E2` (Red 100)
  - Border: `#F87171` (Red 400)
  - Primary / Text: `#DC2626` (Red 600)
  - Solid Fill: `#B91C1C` (Red 700)
- **Warning / Pending:**
  - Background: `#FFFBEB` (Amber 50)
  - Border: `#FCD34D` (Amber 300)
  - Primary / Text: `#D97706` (Amber 600)
- **Connected / Online / Available:**
  - Background: `#F0FDF4` (Green 50)
  - Border: `#86EFAC` (Green 300)
  - Primary / Text: `#16A34A` (Green 600)
  - Dark Mode Glow: `#22C55E`
- **Busy / In Session:**
  - Primary / Text: `#EA580C` (Orange 600)
  - Background: `#FFF7ED` (Orange 50)
- **Offline:**
  - Background: `#F1F5F9` (Slate 100)
  - Primary / Text: `#64748B` (Slate 500)

### Neutral Surface Palette (Light Theme / Patient Tablet AAA)
- `bg-app`: `#F8FAFC` (Slate 50)
- `bg-surface`: `#FFFFFF` (White)
- `bg-surface-elevated`: `#FFFFFF` (Shadow: `0 1px 3px rgba(0,0,0,0.06)`)
- `border-subtle`: `#E2E8F0` (Slate 200)
- `border-strong`: `#CBD5E1` (Slate 300)
- `text-primary`: `#0F172A` (Slate 900) — Contrast ratio > 13:1 on white
- `text-secondary`: `#334155` (Slate 700) — Contrast ratio > 7:1 on white
- `text-muted`: `#64748B` (Slate 500) — Contrast ratio > 4.5:1 on white

### Neutral Surface Palette (Clinical Dark Theme — Staff & Interpreter)
- `dark-bg-app`: `#090D14`
- `dark-bg-surface`: `#0F172A` (Slate 900)
- `dark-bg-surface-elevated`: `#1E293B` (Slate 800)
- `dark-border-subtle`: `#1E293B` (Slate 800)
- `dark-border-strong`: `#334155` (Slate 700)
- `dark-text-primary`: `#F8FAFC` (Slate 50)
- `dark-text-secondary`: `#CBD5E1` (Slate 300)
- `dark-text-muted`: `#94A3B8` (Slate 400)

---

## 3. Typography Hierarchy

Primary Typeface: **Inter** or **Plus Jakarta Sans**, with system fallback `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.

| Token | Size / Line-Height | Weight | Tracking | Usage |
|---|---|---|---|---|
| `display-xl` | 36px / 44px (2.25rem) | Bold (700) | -0.02em | Emergency Alert Banners, Patient Key Figures |
| `heading-lg` | 24px / 32px (1.5rem) | SemiBold (600) | -0.015em | Patient Tablet Action Headers, Portal Selector Titles |
| `heading-md` | 20px / 28px (1.25rem) | SemiBold (600) | -0.01em | Panel Titles, Modal Headings, Patient Pictogram Labels |
| `heading-sm` | 16px / 24px (1rem) | SemiBold (600) | 0 | Card Headers, Audit Log Section Groupings |
| `body-lg` | 18px / 28px (1.125rem) | Regular (400) / Med (500) | 0 | Patient Screen Descriptions, Call Status |
| `body-md` | 14px / 20px (0.875rem) | Regular (400) / Med (500) | 0 | Clinical Transcripts, Form Inputs, Session Metadata |
| `caption` | 12px / 16px (0.75rem) | Medium (500) | +0.01em | Timestamps, Bed IDs, Direction Badges (PATIENT → STAFF) |
| `micro` | 11px / 14px (0.6875rem) | SemiBold (600) | +0.04em | Uppercase Legal Badges, Interpreter Certification Code |

---

## 4. Spacing & Elevation Scale

- **Grid Base:** 4px rhythm
- `space-1`: 4px | `space-2`: 8px | `space-3`: 12px | `space-4`: 16px | `space-5`: 20px | `space-6`: 24px | `space-8`: 32px | `space-10`: 40px | `space-12`: 48px
- **Touch Target Minimum:** `48px x 48px` on web, `64px x 64px` on Patient Tablet.
- **Corner Radii:**
  - `rounded-sm`: 4px (small badge/indicator)
  - `rounded-md`: 8px (inputs, standard buttons, transcript bubbles)
  - `rounded-lg`: 12px (cards, popovers, video overlays)
  - `rounded-xl`: 16px (pictogram cards, alert containers)
  - `rounded-full`: 9999px (avatar, status pills)
- **Shadows:**
  - `shadow-subtle`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
  - `shadow-card`: `0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.04)`
  - `shadow-floating`: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.08)`
  - `shadow-alert`: `0 0 0 4px rgba(220, 38, 38, 0.15)`

---

## 5. Component Specifications

### 5.1 Emergency Alert Banner
- **Idle State:** Collapsed to a minimal status pill (`#F1F5F9`, "Patient Status: Stable") or completely hidden to preserve clinical real estate.
- **Active State:** Expands instantly across screen width.
  - Border: 2px solid `#DC2626`
  - Background: `#FEF2F2` (Light) / `#450A0A` (Dark)
  - Icon: Bell Alert / Exclamation Triangle (`w-7 h-7 text-red-600 animate-pulse`)
  - Text: Display bold "CHEST PAIN REPORTED • BED 04" + exact timestamp `10:42:18 AM`.
  - Actions: "Acknowledge" (Red Solid Button) + "Dispatch Nursing" (White/Border Red).

### 5.2 Patient Tablet Pictogram Card
- **Dimensions:** 160px x 150px min on tablet grid.
- **Background:** `#FFFFFF`
- **Border:** 2px solid `#E2E8F0`; hover/focus: 2px solid `#0D748A`. Active press: `#0D748A` with `scale-[0.98]`.
- **Icon:** SVG outline 48px x 48px, stroke-width 2px. High clarity (e.g. Heart with pulse for Chest Pain; Lungs for Can't Breathe; Glass for Water; Stretcher for Doctor).
- **Label:** `text-lg font-bold text-slate-900` paired with bilingual / symbol cue where configured.

### 5.3 Live Transcript Feed Entry
- **Directional Clarity:**
  - **Patient → Staff:** Left-aligned or distinguished with soft Teal badge (`PATIENT (BED 04)`), speech bubble `#F0FDF4` (Green tint) or `#F0F9FA` (Teal tint). Displays gesture source (e.g. `[ISL Gesture Recognition]`, `[Pictogram Tap]`).
  - **Staff → Patient:** Right-aligned or distinguished with Slate badge (`STAFF (NURSE MEERA)`), speech bubble `#F1F5F9`. Displays delivery status: `[ISL Video Fallback Sent]`.
  - **Interpreter:** Centered or Purple badge (`INTERPRETER (ID #IN-882)`).

### 5.4 Pain Scale Mini-Widget (Wong-Baker 1–10 Scale)
- Horizontal segmented scale from 1 (Green / No Pain) through 5 (Amber / Moderate) to 10 (Deep Red / Worst Pain).
- Emoji facial indicators + numeric score + clinical adjective.
- Direct tap interaction with clear focus halo.

### 5.5 Interpreter Availability Toggle
- Three-state segmented toggle:
  1. **Available:** Green indicator dot + "Available for Calls" (`bg-green-50 text-green-700 border-green-300`)
  2. **Busy:** Amber indicator dot + "Busy / In Session" (`bg-amber-50 text-amber-700 border-amber-300`)
  3. **Offline:** Slate indicator dot + "Offline" (`bg-slate-100 text-slate-600 border-slate-300`)

---

## 6. Motion & Accessibility Directives

- **Pulsing Animation:** Soft ring glow for incoming calls:
  `@keyframes gentle-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.02); } }`
- **Reduced Motion:** All transitions fallback to instant opacity fades under `@media (prefers-reduced-motion: reduce)`.
- **Acoustic Alternatives:** Every video ring or urgent alert features high-intensity visual flashing banners and on-screen tactile/visual indicators for Deaf and hard-of-hearing clinical users.
