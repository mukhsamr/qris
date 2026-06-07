---
name: NQMCreative
description: A restrained product design system with tinted light surfaces, forest-green focus, and quiet operational density.
colors:
  surface: "oklch(98.5% 0.002 155)"
  surface-soft: "oklch(96.5% 0.003 155)"
  card: "oklch(100% 0 0)"
  border: "oklch(92% 0.002 155)"
  border-strong: "oklch(85% 0.003 155)"
  ink: "oklch(14% 0.018 160)"
  muted: "oklch(46% 0.015 160)"
  muted-soft: "oklch(66% 0.012 160)"
  accent: "oklch(46% 0.095 160)"
  accent-strong: "oklch(33% 0.065 160)"
  accent-light: "oklch(95% 0.025 160)"
  accent-soft: "oklch(88% 0.065 160)"
  sidebar: "oklch(12% 0.020 160)"
  sidebar-panel: "oklch(16% 0.022 160)"
  sidebar-text: "oklch(95% 0.008 160)"
  sidebar-muted: "oklch(62% 0.012 160)"
  accent-highlight: "oklch(80% 0.07 160)"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.12em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "32px"
  "3xl": "48px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.card}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.accent-strong}"
    textColor: "{colors.card}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  field-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
  card-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "24px"
  chip-selected:
    backgroundColor: "{colors.accent-light}"
    textColor: "{colors.accent-strong}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
---

# Design System: NQMCreative

## 1. Overview

**Creative North Star: "The Quiet Forest Desk"**

NQMCreative is a product-first design system for focused work surfaces. It feels clean, precise, and grounded: a light desk with a deep forest sidebar, soft green focus states, thin borders, and compact controls that help people finish tasks without visual friction.

The system is restrained by default. Color is used for action, selection, focus, and meaningful state, not decoration. Layouts should feel operational and trustworthy: clear hierarchy, predictable navigation, readable lists, practical forms, and invoice-quality alignment even when the product domain changes.

**Key Characteristics:**

- Light, tinted neutral surfaces with low-chroma green undertones.
- Deep forest panels for navigation, authentication, summaries, or strong contrast moments.
- Emerald accent used sparingly for primary actions, active states, and positive status.
- Rounded but not soft UI: 8px is the default shape.
- Dense, calm product composition with Inter as the main voice and Geist Mono for numbers, IDs, and code-like data.

## 2. Colors

The palette is a restrained forest-neutral system: almost white work surfaces, green-black structure, and one emerald accent that appears only when the interface needs commitment.

### Primary

- **Forest Action** (`accent`): Use for primary buttons, selected navigation, links that carry the main action, focus outlines, paid/success emphasis, and high-confidence status.
- **Deep Forest Action** (`accent-strong`): Use for hover states, emphasized text links, required markers, and stronger action contrast.
- **Mint Wash** (`accent-light`): Use for selected chips, success badges, empty-state icons, subtle highlights, and gentle backgrounds behind accent content.
- **Mint Edge** (`accent-soft`): Use when the accent needs a visible but quiet border or chip background.

### Neutral

- **Tinted Paper** (`surface`): Default app background. It should read as almost white, not gray.
- **Soft Paper** (`surface-soft`): Hover rows, table headers, low-emphasis panels, and nested content strips.
- **Clean Card** (`card`): Cards, form panels, buttons on light surfaces, and document surfaces.
- **Fine Border** (`border`): Default separator, card stroke, input stroke, table divider, and toolbar line.
- **Strong Border** (`border-strong`): Use only where the default border is too quiet.
- **Ink** (`ink`): Main text and high-priority data.
- **Muted Ink** (`muted`): Secondary text, helper copy, metadata, and placeholders.
- **Soft Muted Ink** (`muted-soft`): Eyebrows, table header text, empty-state icon color, and low-priority labels.

### Dark Structure

- **Forest Black** (`sidebar`): Sidebars, auth split panels, dark preview panels, and compact strong-contrast zones.
- **Forest Panel** (`sidebar-panel`): Nested cards inside dark panels.
- **Mist Text** (`sidebar-text`): Primary text on dark panels.
- **Muted Mist** (`sidebar-muted`): Secondary text on dark panels.
- **Bright Mint Signal** (`accent-highlight`): Small highlight on dark surfaces only.

### Named Rules

**The One Accent Rule.** Use `accent` for commitment only. If every row, heading, icon, and card uses green, the system loses its signal.

**The Tinted Neutral Rule.** Never use pure black for text or dead gray for backgrounds. Neutrals should carry a slight forest tint.

**The Dark Panel Rule.** Dark panels are structural anchors. Use them for navigation, auth, summary, or preview emphasis, not as decorative boxes scattered through a page.

## 3. Typography

**Display Font:** Inter with system sans fallbacks.  
**Body Font:** Inter with system sans fallbacks.  
**Label/Mono Font:** Geist Mono for invoice numbers, totals, IDs, API keys, and code-like data.

**Character:** The typography is crisp and businesslike. Headings use tight tracking and confident weight; body copy stays compact, readable, and quiet.

### Hierarchy

- **Display** (700, 3rem to 3.75rem, 1.05 line-height): Use only for landing or auth hero statements.
- **Headline** (600, 1.875rem, 1.18 line-height): Use for page titles, auth forms, and major screen headers.
- **Title** (600, 1.125rem, 1.35 line-height): Use for section titles, panel headers, card titles, and entity names.
- **Body** (400 to 500, 0.875rem to 1rem, 1.6 line-height): Use for normal UI copy, form helper text, table metadata, and descriptions. Keep prose to 65-75ch.
- **Label** (600 to 700, 0.7rem to 0.75rem, uppercase, 0.12em to 0.15em tracking): Use for eyebrows, metadata headings, and compact section labels.
- **Mono Data** (Geist Mono, 600, 0.875rem): Use for money, invoice numbers, API keys, short codes, and tabular numeric content.

### Named Rules

**The Tight Heading Rule.** Headings may use negative tracking for polish; body text and buttons must not. Body text stays readable before it feels stylized.

**The Mono Means Data Rule.** Mono type is reserved for values users compare, copy, or audit. Do not use mono as decorative branding.

## 4. Elevation

NQMCreative uses tonal layering first and shadows second. Borders, surface changes, and spacing create most hierarchy. Shadows appear on cards, buttons, overlays, and hover states only when they clarify interactivity or lift a document-like surface.

### Shadow Vocabulary

- **Subtle Resting Shadow** (`0 1px 2px color-mix(in oklch, black 6%, transparent)`): Use for quiet cards, secondary buttons, and small tool surfaces.
- **Action Shadow** (`0 10px 24px color-mix(in oklch, var(--color-accent-strong) 10%, transparent)`): Use for primary auth or confirmation actions that need clear affordance.
- **Document Shadow** (`0 20px 45px color-mix(in oklch, var(--color-accent-strong) 6%, transparent)`): Use for print previews, invoice sheets, and standalone document surfaces.
- **No Shadow**: Use for tables, inline panels, list rows, and nested surfaces. Let borders and background shifts do the work.

### Named Rules

**The Flat Table Rule.** Lists and tables must not become card grids. Use row dividers, hover background, and tight alignment.

**The Shadow Has a Job Rule.** If a shadow does not explain elevation, document preview, or interactivity, remove it.

## 5. Components

Components should feel familiar, compact, and consistent across frameworks. Use the same shape, color roles, icon stroke, and state behavior whether the implementation is Svelte, React, Vue, server-rendered HTML, or native mobile-inspired UI.

### Buttons

- **Shape:** Gently squared corners (8px).
- **Primary:** Forest Action background, white or card text, 10-12px vertical padding, 16-20px horizontal padding, 600 weight.
- **Hover / Focus:** Hover shifts to Deep Forest Action. Optional `translateY(-1px)` or `translateY(-2px)` is allowed for primary actions. Focus uses a 2px accent outline or a soft accent ring.
- **Secondary:** Clean Card background, Fine Border stroke, Ink text, subtle shadow, and Soft Paper hover.
- **Icon Buttons:** Use the same 8px radius. Keep icons 14-18px with a 1.75 stroke. Add text labels only when the action is ambiguous.

### Chips

- **Style:** Rounded 8px or full pill only for status badges. Use Mint Wash with Deep Forest Action text for selected or positive states.
- **State:** Draft or neutral states use Soft Paper and Muted Ink. Warning, error, and info may use amber, red, or blue, but keep them pale and semantic.

### Cards / Containers

- **Corner Style:** 8px for normal panels, 12px only for larger summary blocks or modals.
- **Background:** Clean Card for primary panels, Soft Paper for lower-level strips, Forest Panel inside dark surfaces.
- **Shadow Strategy:** Subtle Resting Shadow for top-level cards only. Nested cards are prohibited.
- **Border:** Fine Border by default. Use Strong Border only for separators that need clear structure.
- **Internal Padding:** 16px for compact rows, 20px for table toolbars, 24px to 32px for page panels.

### Inputs / Fields

- **Style:** 8px radius, Fine Border, Surface or `surface / 80%` background, Ink text, Muted placeholders.
- **Focus:** Border moves to Forest Action with a soft accent ring. Background may become Clean Card.
- **Error / Disabled:** Error uses pale red background with red border and text. Disabled fields keep the same shape and become lower contrast, never a new component style.

### Navigation

- **Desktop:** Use a deep Forest Black sidebar when the product needs persistent sections. Active links use `white / 8%` or Forest Action depending on surface. Inactive links use Muted Mist.
- **Mobile:** Convert navigation to a compact top bar plus horizontal pills. Active mobile nav may use Forest Action with white text.
- **Typography:** Navigation labels are 0.75rem to 0.875rem, medium weight, with lucide-style 16-18px icons where useful.

### Tables and Lists

- **Style:** Use full-width rows with thin dividers. Avoid isolated card rows unless the viewport forces a mobile stacked layout.
- **Hover:** Soft Paper or faint Surface background shift.
- **Data:** Money, IDs, totals, and invoice-like numbers use Geist Mono with tabular alignment where available.

### Document Preview

- **Style:** Use a Clean Card or white document surface with generous padding and a Document Shadow on screen.
- **Print:** Remove shadows and navigation. Use real page margins and keep content aligned to a document grid.

## 6. Do's and Don'ts

### Do:

- **Do** keep the system restrained: light tinted surfaces, one emerald accent, and strong dark panels only where structure needs them.
- **Do** use 8px as the default radius for buttons, inputs, nav items, cards, chips, and compact controls.
- **Do** use Inter for UI and Geist Mono for numbers, IDs, invoice numbers, API keys, and code-like snippets.
- **Do** make tables and lists scan-friendly with dividers, hover rows, aligned metadata, and compact actions.
- **Do** keep primary actions visually obvious with Forest Action background and clear focus treatment.
- **Do** design empty states as useful next steps with one icon, one concise title, short helper text, and one clear action.
- **Do** preserve readable contrast on dark panels with Mist Text and Muted Mist.

### Don't:

- **Don't** turn the interface into a green theme by coloring every icon, heading, border, and card.
- **Don't** use gradient text, glassmorphism, decorative blobs, or ornamental color washes.
- **Don't** create nested cards. If a panel needs inner grouping, use dividers, Soft Paper strips, spacing, or table rows.
- **Don't** use colored side-stripe borders as accents. Use full borders, background tints, icons, or status chips.
- **Don't** use pure black, generic gray, or heavy blue-slate palettes. The neutral system must stay forest-tinted.
- **Don't** make large rounded pill buttons the default. This system is gently squared, not bubbly.
- **Don't** animate layout for decoration. Motion should be short, state-driven, and optional under reduced motion.
- **Don't** make dashboards look like marketing hero pages. Product screens should start with the workflow, not a pitch.
