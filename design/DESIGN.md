# Design System: AI Trainer Video Generator

## 1. Overview & Creative North Star
**Creative North Star: The Kinetic Precision Lab**

This design system is engineered to feel like a high-end cinematic workstation. It moves away from the "SaaS template" aesthetic by embracing a **Kinetic Editorial** layout—where high-performance tech meets premium fitness photography. The goal is to make the user feel like a director in a high-tech studio. 

We break the standard grid through **intentional asymmetry**: large-scale typography might overlap a video preview container, and "floating" AI prompt panels sit on elevated glass layers. This isn't just a tool; it’s a professional environment where the darkness of the `background` (#0d1000) acts as a void that makes the neon `primary` (#ddffb1) and electric `secondary` (#00e3fd) pulses feel alive.

---

## 2. Colors: Tonal Architecture
The palette is a deep, monochromatic olive-black, accented by high-frequency neons. 

*   **Primary (The Action):** `primary` (#ddffb1) and `primary_container` (#9eff00). Use these for high-energy conversion points.
*   **Secondary (The Tech):** `secondary` (#00e3fd). Used for AI-status indicators, data visualizations, and "processing" states.
*   **Neutrals (The Depth):** Ranging from `surface_container_lowest` (#000000) to `surface_bright` (#292f00).

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning or grouping. 
Boundaries must be defined solely through background color shifts. For example, a video library section (`surface_container_low`) should sit flush against the main sidebar (`surface_container_high`) without a stroke. Use the natural contrast between `#121500` and `#1d2200` to define space.

### The "Glass & Gradient" Rule
To prevent a "flat" feeling, floating elements (like AI prompt modals) should use a backdrop-blur effect (20px–30px) over a semi-transparent `surface_variant`. 
*   **Signature Gradient:** Apply a subtle linear gradient from `primary` to `secondary` at a 45-degree angle for primary CTA buttons to give them a "charged" energy that flat colors lack.

---

## 3. Typography: Editorial Authority
We pair the technical, wide-set nature of **Space Grotesk** with the utilitarian precision of **Inter**.

*   **Display & Headlines (Space Grotesk):** These are your "billboard" moments. Use `display-lg` (3.5rem) for hero value propositions. The wide apertures of Space Grotesk convey a "tech-forward" and slightly "brutalist" confidence.
*   **Body & Labels (Inter):** All functional data, cost tracking, and AI prompt inputs use Inter. This ensures maximum legibility in data-dense tables.
*   **Visual Hierarchy:** Use `on_surface_variant` (#a8b074) for secondary metadata to create a "recessed" text effect, allowing the neon `primary` headlines to command the eye's first focus.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are replaced by **Tonal Stacking**.

*   **The Layering Principle:** 
    *   **Level 0 (Base):** `surface` (#0d1000) for the main canvas.
    *   **Level 1 (Sections):** `surface_container_low` (#121500) for sidebar or footer areas.
    *   **Level 2 (Cards):** `surface_container_highest` (#232800) for media cards and list items.
*   **Ambient Shadows:** For elements that *must* float (like context menus), use a shadow with a blur of `40px`, an opacity of `8%`, and a color derived from `on_surface`.
*   **The Ghost Border:** If accessibility requires a container edge, use the `outline_variant` (#454b1b) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Media Cards
Cards must have a corner radius of `xl` (1.5rem). No borders. Use `surface_container_highest` as the card background. The "Video Play" icon should be a floating `secondary_container` glass circle with a `secondary` icon.

### AI Prompt Input
Text areas use `surface_container_low`. On focus, the container does not get a border; instead, it shifts to `surface_bright` with a `primary` "glow" (a subtle 2px blur glow on the bottom edge only).

### Data-Dense Tables (Cost Tracking)
*   **No Dividers:** Use `0.5rem` vertical spacing between rows. 
*   **Alternating Tones:** Use subtle shifts between `surface_container_low` and `surface_container_lowest` to differentiate rows.
*   **Headings:** Use `label-md` in all-caps with `0.1em` letter spacing for a technical, "ledger" feel.

### Buttons
*   **Primary:** `primary` background with `on_primary` text. Radius: `full`.
*   **Secondary (Glass):** Backdrop blur + `surface_variant` at 40% opacity. 
*   **Tertiary:** No background. `primary` text with a `label-md` weight.

### Action Chips
For AI tags (e.g., "Deepfake-Ready", "4K Render"). Use `secondary_container` with `on_secondary_container` text. Corners should be `sm` (0.25rem) to differentiate them from the rounded buttons.

---

## 6. Do's and Don'ts

### Do
*   **DO** use extreme vertical white space (`spacing.20` or `spacing.24`) between major sections to emphasize the premium "Editorial" feel.
*   **DO** overlap elements. Let a video thumbnail slightly hang over its container edge to create visual tension.
*   **DO** use `primary_fixed` (#9eff00) for "Live" or "Active" states to provide a high-visibility status signal.

### Don't
*   **DON'T** use pure white (#FFFFFF). All "white" text should be `on_surface` (#f4fcba) to keep the palette cohesive and reduce eye strain in dark mode.
*   **DON'T** use standard 1px borders or dividers. If you feel the need for a line, try a background color change instead.
*   **DON'T** use "Drop Shadows" on cards. Use tonal layering (`surface_container` tokens) to create depth.
*   **DON'T** clutter the AI Prompt area. Keep it minimal with `body-lg` text for the input to make the interaction feel significant.