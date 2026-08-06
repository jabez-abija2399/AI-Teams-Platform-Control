# AI Teams Platform
# Design System


Version:

1.1


Last Updated:

2026-08-05



# Purpose


Define visual standards for the AI Teams Platform interface.



# Design Philosophy



The interface should feel like:


"Mission Control for an AI Software Company"



Characteristics:

- Professional
- Sophisticated
- Clear
- Powerful
- Minimal



# Visual Direction



Style:

Modern SaaS + AI Command Center with Yacht Club brand identity



Inspired by:

- Developer tools
- Enterprise dashboards
- Nautical sophistication



# Brand Color System — Yacht Club Palette



| Token | Hex | Usage |
|-------|-----|-------|
| Brand Cream | `#F2F0EF` | Page backgrounds, light surfaces |
| Brand Gray | `#BBBDBC` | Muted text, borders, secondary UI |
| Brand Teal | `#245F73` | Primary actions, links, navigation active states |
| Brand Brown | `#733E24` | Accent highlights, badges, warm CTAs |



CSS variables (defined in `src/app/globals.css`):

- `--brand-cream`, `--brand-gray`, `--brand-teal`, `--brand-brown`
- Mapped to shadcn tokens: `--primary`, `--background`, `--accent`, `--muted`



# Typography



Primary (sans):

Manrope (`--font-sans`)



Display / headings:

Fraunces (`--font-heading`)



Code / mono:

JetBrains Mono (`--font-mono`)



Requirements:

- Readable
- Technical
- Clean
- Brand-first hierarchy: product name and section titles use Fraunces; UI chrome uses Manrope



# Component Principles



Every component must:

- Have clear purpose
- Be reusable
- Support states
- Use design tokens (not hardcoded slate/sky/blue classes)



Components:


Button

Card

Dashboard Panel

Agent Card

Workflow Timeline

Artifact Viewer

Status Badge

Command Panel



# AI Dashboard Components



## Agent Card


Shows:


Name

Role

Status

Current task

Performance



## Workflow View


Shows:


Current phase

Completed stages

Blocked stages



## Artifact Viewer


Shows:


Document

Version

Owner

History



# Animation Rules



Use animation for:

- State changes
- AI activity
- Loading


Avoid:

- Excessive effects



# Accessibility


Must support:

- Keyboard navigation
- Screen readers
- Good contrast (teal on cream meets WCAG AA for large text)
- Responsive layouts



# Frontend Rules


Components should:

- Be reusable
- Be typed
- Follow design tokens from `globals.css`
- Prefer `bg-background`, `text-primary`, `border-border` over raw Tailwind color scales



# Future Design Goals


Advanced features:


- AI activity visualization
- Agent communication graphs
- Real-time collaboration
- 3D organization map
