---
name: Alexandria Protocol
colors:
  surface: '#13131a'
  surface-dim: '#13131a'
  surface-bright: '#393840'
  surface-container-lowest: '#0e0e15'
  surface-container-low: '#1b1b22'
  surface-container: '#1f1f26'
  surface-container-high: '#2a2931'
  surface-container-highest: '#34343c'
  on-surface: '#e4e1ec'
  on-surface-variant: '#bbcbbb'
  inverse-surface: '#e4e1ec'
  inverse-on-surface: '#303038'
  outline: '#869486'
  outline-variant: '#3d4a3e'
  surface-tint: '#4ae183'
  primary: '#54e98a'
  on-primary: '#003919'
  primary-container: '#2ecc71'
  on-primary-container: '#005027'
  inverse-primary: '#006d37'
  secondary: '#ebb2ff'
  on-secondary: '#500a6c'
  secondary-container: '#6b2c87'
  on-secondary-container: '#e49eff'
  tertiary: '#ffbfb5'
  on-tertiary: '#690001'
  tertiary-container: '#ff9687'
  on-tertiary-container: '#8b110a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6bfe9c'
  primary-fixed-dim: '#4ae183'
  on-primary-fixed: '#00210c'
  on-primary-fixed-variant: '#005228'
  secondary-fixed: '#f8d8ff'
  secondary-fixed-dim: '#ebb2ff'
  on-secondary-fixed: '#320047'
  on-secondary-fixed-variant: '#692984'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4a9'
  on-tertiary-fixed: '#410000'
  on-tertiary-fixed-variant: '#8e130c'
  background: '#13131a'
  on-background: '#e4e1ec'
  surface-variant: '#34343c'
typography:
  display-hero:
    fontFamily: Playfair Display
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: 0em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  title-editorial:
    fontFamily: Playfair Display
    fontSize: 19px
    fontWeight: '600'
    lineHeight: 26px
  body-reader:
    fontFamily: Newsreader
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: 0.005em
  body-reader-excerpt:
    fontFamily: Newsreader
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 28px
  body-ui:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-ui-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-ui:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  code-meta:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.02em
  code-badge:
    fontFamily: Space Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4rem
  space-4xl: 6rem
  gutter-mobile: 1rem
  gutter-tablet: 1.5rem
  gutter-desktop: 2rem
  content-reading-max: 680px
  content-catalog-max: 1280px
---

## Brand & Style

This design system embodies an uncompromising ideological synthesis: the reverence, depth, and scholarly authority of a centuries-old sanctuary combined with the razor-sharp resistance of modern cryptographic permanence. It speaks directly to preservationists, dissidents, researchers, and voracious readers who regard literature not as ephemeral digital assets, but as essential cultural memory under siege.

The visual style blends **Literary Editorial** with **Cryptographic Neo-Brutalism**. Dark archival foundations reflect digital secrecy and night-reading focus, punctuated by stark editorial typography, cryptographic verification markers, and high-visibility banned-book alerts. The interface treats text with absolute sanctity: generous margins, pristine line measures, tactile book card treatments, and unyielding on-chain verification stamps that celebrate immutable preservation over corporate ephemerality.

## Colors

The palette operates on a dual-register framework: deep archival darkness for navigation, search, and catalog metadata, transitioning seamlessly into warm tactile parchment for prolonged, fatigue-free reading sessions.

### Functional Roles
- **Canvas Base (`#0d0d14`)**: Deep abyssal void for general discovery, catalog navigation, and page backdrop.
- **Surface Elevation 1 (`#13131f`)**: Section containers, alternating narrative stripes, and modal backings.
- **Surface Elevation 2 (`#1a1a2e`)**: Interactive book tiles, metadata badges, inspection drawers, and code blocks.
- **Reading Surfaces (`#f8f7f3` / `#f5f4ef`)**: High-fidelity reading sheets and blockquote inserts. Text transitions to `#1c1c24` on these parchment substrates for natural optical ink contrast.
- **Primary Accent (`#2ecc71`)**: Cryptographic health, verified on-chain permanence, mint status, and confirmation states.
- **Secondary Accent (`#9b59b6`)**: Protocol metadata, cryptographic signatures, historical epoch dividers, and secondary actions.
- **Alert / Banned Red (`#c0392b`)**: Censorship alerts, challenged status notifications, jurisdiction strike warnings, and suppressed editions.
- **Body Ink (`#a0a0b8`)**: Calibrated contrast for legibility on dark surfaces without generating eye strain.
- **Borders & Rules (`rgba(255, 255, 255, 0.08)`)**: Fine hairline boundaries for structural containment.
- **Brand Signature Gradient**: Linear left-to-right (`135deg`) from `#2ecc71` to `#9b59b6`, reserved strictly for brand iconography, signature titles, verification seals, and primary call-to-action state overlays.

## Typography

The typographic hierarchy arbitrates between humanistic literary heritage, modern UI utility, and immutable ledger instrumentation.

- **Display & Headlines (`Playfair Display`)**: Used for book titles, manifesto excerpts, section headers, and author callouts. High contrast serifs deliver gravity and classical publishing authority.
- **Reading Body (`Newsreader`)**: Tuned specifically for sustained continuous reading. The 18px / 32px line height geometry achieves an optimal 65–75 character measure across devices.
- **Interface & Control Plane (`Inter`)**: Neutral, highly legible sans-serif for search inputs, filtering controls, tabs, navigational breadcrumbs, and actionable chrome.
- **Ledger & Cryptographic Metadata (`Space Mono`)**: Dedicated to Flow blockchain transaction hashes, IPFS CID addresses, publication dates, banned status taxonomy, and technical protocol signatures. Always rendered in tabular spacing.

## Layout & Spacing

The system enforces a strict 8pt base grid alongside dedicated dual reading/catalog layouts.

### Structural Framework
- **Catalog & Archival Views**: 12-column responsive fluid grid capped at `1280px`. Gutters scale dynamically from `1rem` on mobile, `1.5rem` on tablet, to `2rem` on desktop. Columns collapse into single-column vertical stacks on viewports under `640px`.
- **Reading Sanctuary Mode**: Fixed, distraction-free container locked to a maximum width of `680px` (`content-reading-max`). Outer margins remain responsive to guarantee at least `1.5rem` side clearance on mobile and `4rem` on desktop screens.

### Responsive Breakpoints
- **Mobile (`< 640px`)**: Single-column book stack, off-canvas filter drawer, persistent pinned bottom metadata trigger, full-width modal sheets.
- **Tablet (`640px – 1024px`)**: 2–3 column shelf grid, top-mounted scrolling filter chips, split-pane metadata inspector.
- **Desktop (`> 1024px`)**: 4-column catalog grid, sticky faceted left rail (genres, ban jurisdictions, on-chain verification epochs), and expansive reader canvas.

## Elevation & Depth

Visual depth is achieved through **tonal layering and crisp hairline containment**, eschewing muddy drop shadows in favor of precise cryptographic plates.

### Surface Hierarchy
- **Level 0 (Base Canvas)**: `#0d0d14` background with an optional subtle 5% radial gradient for ambient depth.
- **Level 1 (Structural Insets)**: `#13131f` surfaces framed by `1px solid rgba(255, 255, 255, 0.08)`.
- **Level 2 (Interactive Elements & Cards)**: `#1a1a2e` surfaces featuring a `1px solid rgba(255, 255, 255, 0.08)` perimeter. On hover, the border transitions cleanly to `rgba(46, 204, 113, 0.35)` with an ambient back-glow: `0 8px 30px rgba(0, 0, 0, 0.6)`.
- **Level 3 (Modals, Overlays & Drawers)**: `#1a1a2e` with `backdrop-filter: blur(16px)` when hovering over reading surfaces, supported by a directional cast shadow of `0 16px 48px -8px rgba(0, 0, 0, 0.8)`.

### Tactical Banned Indicator
Cards or records carrying banned/challenged state feature a left spine rule: `3px solid #c0392b`, immediately signaling historical suppression without breaking grid alignment.

## Shapes

The interface embraces an architectural, slightly historicized precision by utilizing low-radius **Soft (`1`)** corner geometry. 

- Standard inputs, buttons, and archival badges utilize `0.25rem` (`4px`) radii.
- Book cover frames, reading excerpt plaques, and dialog modules scale to `rounded-lg` (`0.5rem` / `8px`).
- Circular pill geometry is strictly avoided except for live node ping indicators and censorship severity tags to preserve an editorial, document-like posture.

## Components

### Buttons & Interactive Triggers
- **Primary Sovereign**: Solid gradient background (emerald-to-purple, `135deg`), text in crisp white (`#ffffff`), `0.25rem` border radius, uppercase `Inter` label with subtle letter-spacing. Focus rings display `2px solid #2ecc71` with a `2px` offset.
- **Secondary Protocol**: Surface `#1a1a2e` with a `1px solid rgba(255, 255, 255, 0.12)` border. On hover, the border shifts to `#9b59b6` with text shifting from `#a0a0b8` to `#ffffff`.
- **Banned Action / Alert**: Bordered in `#c0392b`, background tinted to `rgba(192, 57, 43, 0.12)`, text `#c0392b`. Used for viewing censorship logs, tribunal filings, and challenge details.

### Book Cards & Archive Units
- Container rendered in `#1a1a2e` with `0.25rem` corners and a structural hairline border.
- Top banner slots an immutable Flow verification tag (`Space Mono`, `#2ecc71`) alongside censorship jurisdiction badges (`#c0392b`).
- Card interiors incorporate the book cover ratio (1:1.48) framed inside an archival inset, followed by high-contrast `Playfair Display` titling, author line in `Inter`, and cryptographic content hash strings.

### Reading Surface Plaque
- Dedicated toggle switches the viewer into parchment view (`#f8f7f3`).
- Inverted palette: body rendered in `#1c1c24` using `Newsreader` (`18px / 32px`).
- Inline excerpts, footnotes, and redaction overrides rest on warm white backgrounds (`#f5f4ef`) flanked by a 2px left border in `#9b59b6`.

### Verification Chips & Censorship Badges
- **Verified On-Chain**: Monospaced chip with a `#2ecc71` pulse beacon, black background, and emerald hairline rule. Displays Flow block height and storage node count.
- **Censorship / Banned Badge**: Monospaced chip with `#c0392b` background fill (15% opacity), text in pure crimson `#c0392b`, specifying issuing jurisdiction (e.g., `BANNED: US-TX-2023`).

### Form Controls & Filter Inputs
- Inputs utilize surface `#13131f` bounded by `rgba(255, 255, 255, 0.08)`.
- Active focus state sharpens the border to `#2ecc71` without expanding outward thickness.
- Checkboxes and radio selectors maintain sharp 2px radii with emerald `#2ecc71` positive validation fills.