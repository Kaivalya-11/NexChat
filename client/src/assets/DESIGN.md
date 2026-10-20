---
name: Obsidian Telemetry
colors:
  surface: '#0f1417'
  surface-dim: '#0f1417'
  surface-bright: '#353a3d'
  surface-container-lowest: '#0a0f12'
  surface-container-low: '#171c1f'
  surface-container: '#1b2023'
  surface-container-high: '#262b2e'
  surface-container-highest: '#303539'
  on-surface: '#dfe3e7'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dfe3e7'
  inverse-on-surface: '#2c3134'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#e29100'
  on-tertiary-container: '#523200'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0f1417'
  on-background: '#dfe3e7'
  surface-variant: '#303539'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-metric:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-base:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  mono-tag:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-caps:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 1.75rem
---

## Brand & Style
This design system embodies high-density, mission-critical infrastructure control. Drawing heavily from cyberpunk precision and terminal interfaces, it mixes **Minimalism** with **Modern Developer Console** aesthetics.

- **Brand Personality**: Rigorous, hyper-observant, surgical, and authoritative. Designed for engineers, site reliability teams, and administrators who need instant diagnostic clarity without visual fatigue.
- **Target Audience**: Infrastructure operators, backend architects, sysadmins, and security engineers managing distributed platforms.
- **Visual Mood**: Abyssal slate surfaces bathed in glowing emerald telemetry pulses. The atmosphere feels deliberate, quiet, and ultra-responsive—mirroring an air-gapped operations room where every pixel conveys state.

## Colors
The palette relies on deep oceanic black-slate tones overlaid with high-vibrancy phosphors. Surfaces do not use pure grayscale; they carry a subtle cold teal tint that grounds the interface.

- **Background & Canvas**: Root application canvas `#0B1013`, mid-tier navigation/toolbars `#11181C`, and elevated analytical cards `#162026`.
- **Borders & Dividers**: Crisp, structural boundaries `#1F2E35` and subtle interactive hover rings `#2C3F49`.
- **Primary Telemetry (Emerald)**: `#10B981` (active state, operational beacons, primary buttons), with `#34D399` for prominent glow and hover states, and `#064E3B` for low-priority fills.
- **Secondary (Cyan/Teal)**: `#06B6D4` and `#0891B2` used for network routing, message channels, and system IDs.
- **Tertiary (Amber/Warning)**: `#F59E0B` and `#D97706` reserved for moderation cues, elevated warnings, and rate limits.
- **Destructive/Error (Rose)**: `#F43F5E` used strictly for system degradation, security alerts, and purge actions.
- **Text & Foreground**: Highest contrast `#F1F5F9` for headlines and core metrics, `#94A3B8` for secondary descriptions, and `#475569` for auxiliary metadata.

## Typography
Typography is split purposefully between clean modern grotesque (`Geist`) for layout hierarchy and high-precision monospaced numerals/codes (`JetBrains Mono`).

- **Numerical Hierarchy**: Large metric cards employ `headline-metric` in `Geist` with tabular lining figures to ensure fast visual scanning during anomaly surges.
- **Section Headers & Module Identifiers**: Micro-headers utilize `label-caps` styled with `text-transform: uppercase` and `letter-spacing: 0.08em` for distinct tactical grouping.
- **Telemetry Indicators**: All timestamps, runtime versions, hash keys, and event logs run strictly in `JetBrains Mono` (`mono-tag` / `mono-data`) to retain column alignment and fixed optical density.

## Layout & Spacing
The layout adheres to a persistent lateral dock system paired with a responsive 12-column grid.

- **Sidebar Anchor**: Fixed desktop width of 260px spanning viewport height, collapsible to 64px on mid-tier viewports.
- **Grid Architecture**: Content canvas employs an adaptive 12-column fluid grid with `1.25rem` gutters. Metric cards span 3 columns on desktop, 6 columns on tablets, and 12 columns on mobile.
- **Density & Rhythms**: Compact and data-dense. Inner card padding holds firmly at `1.25rem` (`space-lg`), while micro-stats and badge groupings use `0.5rem` (`space-sm`) gaps to prevent fragmented gaze traversal.

## Elevation & Depth
Depth is constructed through **Tonal Layers** coupled with **Subtle Neon Ambient Bleeds** rather than traditional drop shadows.

- **Layer 0 (Canvas Base)**: `#0B1013` deep solid floor.
- **Layer 1 (Card & Module Surfaces)**: `#11181C` with a sharp, hairline 1px stroke of `#1F2E35`. No outer shadow in neutral rest states.
- **Layer 2 (Elevated & Modals)**: `#162026` with a border stroke of `#2C3F49` and a muted emerald ambient glow: `0 8px 24px -4px rgba(0, 0, 0, 0.6), 0 0 16px -2px rgba(16, 185, 129, 0.08)`.
- **Interactive State**: Focused inputs and hovered interactive tiles subtly intensify their border to `#10B981` at 50% opacity, paired with an inner edge illumination `box-shadow: inset 0 1px 0 rgba(52, 211, 153, 0.15)`.

## Shapes
The system balances technical structure with ergonomic handling:
- **Panels & Containers**: Outer cards, navigation modules, and modal containers use `rounded-lg` (0.75rem / 12px) for structured framing.
- **Interactive Controls**: Buttons, inputs, and list rows adhere to `0.5rem` (8px).
- **Status & Indicators**: Telemetry badges, system pills, and delta metrics adopt fully rounded pill profiles (`9999px`) to immediately visually differentiate tags from structural containers.

## Components

### Status Pills & Telemetry Badges
- **Pill Construction**: Height of 24px, pill-shaped radius (`9999px`), bordered by a 1px stroke at 20% opacity matching the status tone.
- **Live Indicator**: Includes a 6px circular dot positioned to the left. Live operational states feature a continuous pulse keyframe: `box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7)`.
- **Typography**: `JetBrains Mono`, 11px uppercase, bold.

### Metric Overview Cards
- **Structure**: Surface `#11181C`, 1px border `#1F2E35`, padding `space-lg`.
- **Top Row**: Header tracking title in uppercase (`label-caps`), paired with an icon housed in an inset soft-square `#162026` badge.
- **Value Cluster**: Primary numeric value rendered in `headline-metric`, adjacent to a compact delta pill (`+2 7d`) with directional coloring (emerald positive, rose negative, muted neutral).
- **Footer**: Subtle hairline separator leading to metadata attributes and contextual arrow links (`Review Queue →`).

### Buttons
- **Primary**: Background `#10B981`, foreground `#0B1013`, weight 600. On hover, transitions to `#34D399` with `box-shadow: 0 0 12px rgba(16, 185, 129, 0.35)`.
- **Secondary / Ghost**: Background `#162026`, border 1px solid `#1F2E35`, foreground `#F1F5F9`. Hover state shifts border to `#2C3F49` and background to `#1E2B33`.

### Navigation List Items
- **Inactive Item**: Text `#94A3B8`, icon `#64748B`, transparent background, 8px radius.
- **Active Item**: Inset border or soft tint `#162026`, primary emerald icon `#10B981`, crisp white text `#F1F5F9`, bordered by `#1F2E35`.

### Activity & Audit Tables
- **Row Styling**: Alternating hairline row dividers `#1F2E35` with no vertical borders. Row padding is fixed to `0.75rem 1rem`.
- **Interactive Rows**: Mouse hover casts a subtle `#162026` background highlight.
- **Log Badges**: Hex event flags (e.g., `CHANNEL_DELETED`, `MAINTENANCE_MODE`) rendered in mono uppercase pills with `#059669` tinted backgrounds and high-contrast green text.