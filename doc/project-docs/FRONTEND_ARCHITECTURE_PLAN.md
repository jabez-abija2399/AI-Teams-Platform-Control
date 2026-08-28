# AI Teams Platform — Master Frontend Architecture & File Blueprint

**Author:** CTO & Principal Systems Architect  
**Architecture Pattern:** Modular Feature-Sliced Design (FSD) + Next.js App Router  
**Design Standard:** Ultra-Premium Dark Luxury + Frosted Glassmorphism (`backdrop-filter: blur(16px)`)  
**Strictness:** 100% TypeScript Strict, Zero Any (where possible), Reusable Component-Based Architecture  

---

## Table of Contents
1. [Core Directory Architecture & Feature Slices](#1-core-directory-architecture--feature-slices)
2. [Milestone 1: Design System, Tokens, Typography & Shared Primitives](#milestone-1-design-system-tokens-typography--shared-primitives)
3. [Milestone 2: Landing Page, Authentication & User Profile](#milestone-2-landing-page-authentication--user-profile)
4. [Milestone 3: Executive Dashboard, Project Hub & Creation Wizard](#milestone-3-executive-dashboard-project-hub--creation-wizard)
5. [Milestone 4: AI Settings, BYOK Credentials & Model Routing](#milestone-4-ai-settings-byok-credentials--model-routing)
6. [Milestone 5: Flagship Mission Control & 5-Agent Command Roster](#milestone-5-flagship-mission-control--5-agent-command-roster)
7. [Milestone 6: Monaco Code Studio, File Explorer & Live Preview Engine](#milestone-6-monaco-code-studio-file-explorer--live-preview-engine)
8. [Milestone 7: Production Build, Testing & Zero-Error Verification](#milestone-7-production-build-testing--zero-error-verification)

---

## 1. Core Directory Architecture & Feature Slices

The frontend code follows a clean, decoupled, package-based structure:

```
src/
├── app/                                    # Next.js App Router Page Routes
│   ├── (auth)/                             # Auth Route Group
│   │   ├── login/page.tsx                  # Login Page
│   │   └── signup/page.tsx                 # Signup Page
│   ├── dashboard/                          # Dashboard Layout & Routes
│   │   ├── layout.tsx                      # Dashboard Sidebar & App Shell
│   │   ├── page.tsx                        # Executive Command Overview
│   │   ├── projects/
│   │   │   ├── page.tsx                    # Projects Portfolio Grid
│   │   │   ├── new/page.tsx                # Project Creation Wizard
│   │   │   └── [id]/workspace/page.tsx     # Mission Control & Code Studio Flagship
│   │   └── settings/page.tsx               # BYOK Key Manager & Quotas
│   ├── preview/[projectId]/page.tsx        # Fullscreen Standalone App Preview
│   ├── profile/page.tsx                    # User Profile & Security
│   ├── layout.tsx                          # Root Layout with Font & Theme Providers
│   ├── page.tsx                            # Modern Landing Page Showcase
│   └── globals.css                         # Design System Tokens & Glassmorphism Utilities
├── components/                             # Global Reusable Design System Primitives
│   ├── ui/                                 # Atomic UI (Button, Card, Badge, Modal, Input, Toast)
│   ├── layouts/                            # Shells, TopNav, AppSidebar, Header, Footer
│   └── feedback/                           # Skeletons, ErrorBoundaries, EmptyStates
├── features/                               # Modular Domain Feature Slices
│   ├── workspace/                          # Flagship Mission Control, Stepper, Live Stream
│   ├── studio/                             # Monaco Editor, Tabs, File Tree, Terminal
│   ├── preview/                            # Sandpack, WebContainer, HTML Sandbox
│   ├── projects/                           # Project Cards, Filters, Creation Wizard
│   ├── ai-settings/                        # Key Validation, Provider Cards, Model Routing
│   ├── agents/                             # 5-Agent Roster, Direct Chat Drawers, Avatars
│   └── dashboard/                          # Executive Metrics, Activity Feed, Telemetry
├── hooks/                                  # Shared Custom Hooks (useSSE, useViewport, useKeybinds)
├── lib/                                    # Utilities (cn, formatters, api-client)
└── stores/                                 # Zustand State Stores (workspace, studio, settings)
```

---

## Milestone 1: Design System, Tokens, Typography & Shared Primitives

### Purpose
Establish a scalable, high-performance visual design system with consistent tokens, glassmorphism, responsive utilities, and reusable atomic primitives.

### File Blueprint & Component Contracts

#### 1. `src/app/globals.css`
- **What:** Root stylesheet declaring HSL variables, dark mode color tokens, glassmorphism utilities, and micro-animation keyframes.
- **Where Integrated:** Imported in `src/app/layout.tsx`.
- **When:** Evaluated globally on initial app load.
- **Key Tokens:** `--background`, `--card`, `--primary` (Cyan `#38bdf8`), `--accent` (Indigo `#818cf8`), `.glass-card`, `.glass-panel`, `.glow-teal`, `.glow-amber`, `.glow-emerald`, `.gradient-brand`.

#### 2. `src/components/ui/button.tsx`
- **What:** Polymorphic button supporting variants (`default`, `glass`, `glow`, `outline`, `destructive`, `ghost`), sizes (`sm`, `md`, `lg`, `icon`), and loading states.
- **Where Integrated:** Used across all forms, dialogs, and navigation action bars.
- **When:** On user interaction (click, submit, hover).

#### 3. `src/components/ui/card.tsx`
- **What:** Modular card primitives (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) with optional `.glass-card` styling.
- **Where Integrated:** Dashboard widgets, project cards, agent roster tiles, and approval drawers.
- **When:** Rendered in container grids.

#### 4. `src/components/ui/badge.tsx`
- **What:** Status pill component with variant support (`active`, `working`, `queued`, `done`, `warning`, `error`, `outline`) and glowing dot indicators.
- **Where Integrated:** Stepper phases, employee cards, project health badges, tech stack tags.

#### 5. `src/components/ui/modal.tsx` & `src/components/ui/drawer.tsx`
- **What:** Accessible dialog and sliding drawer components with backdrop blur (`backdrop-blur-md`), keyboard traps (`Esc` to close), and focus management.
- **Where Integrated:** Agent direct chat, deliverable inspections, project creation modals.

---

## Milestone 2: Landing Page, Authentication & User Profile

### Purpose
Create a high-impact, modern first impression that showcases the power of the autonomous AI Software Company with sleek authentication and user profile management.

### File Blueprint & Component Contracts

#### 1. `src/app/page.tsx` (Landing Page)
- **What:** Public marketing homepage.
- **Where Integrated:** Root URL `/`.
- **Subcomponents:**
  - `src/features/landing/components/hero-section.tsx`: Headline, ambient animated grid, dynamic prompt preview bar, and 1-click CTA.
  - `src/features/landing/components/ai-team-showcase.tsx`: Interactive interactive carousel of the 5 agents (CEO, Architect, Designer, Developer, QA) solving real engineering tasks.
  - `src/features/landing/components/bento-features.tsx`: Glassmorphism bento-grid highlighting Monaco Editor, WebContainer live preview, BYOK security, and deterministic verification.
  - `src/features/landing/components/cta-banner.tsx`: Final conversion banner with instant signup link.

#### 2. `src/app/login/page.tsx` & `src/app/signup/page.tsx`
- **What:** Dedicated authentication pages.
- **Where Integrated:** `/login`, `/signup`, `/register`.
- **Subcomponents:**
  - `src/features/auth/components/auth-card.tsx`: Centered glassmorphism container with ambient glow.
  - `src/features/auth/components/social-auth-buttons.tsx`: GitHub & Google 1-click OAuth triggers.
  - `src/features/auth/components/credentials-form.tsx`: Email & password inputs with client-side Zod validation, password reveal toggle, and animated error feedback.

#### 3. `src/app/profile/page.tsx`
- **What:** User profile and organization overview.
- **Where Integrated:** `/profile`.
- **Subcomponents:**
  - `src/features/profile/components/user-info-card.tsx`: User avatar, name, email, and subscription plan.
  - `src/features/profile/components/usage-stats.tsx`: Total projects generated, token consumption, and active missions.

---

## Milestone 3: Executive Dashboard, Project Hub & Creation Wizard

### Purpose
Provide a central command hub where founders and engineering leaders can track company telemetry, view project portfolios, and launch new autonomous missions with 1-click wizards.

### File Blueprint & Component Contracts

#### 1. `src/app/dashboard/page.tsx` (Executive Command Center)
- **What:** Main dashboard overview.
- **Where Integrated:** `/dashboard`.
- **Subcomponents:**
  - `src/features/dashboard/components/executive-metrics.tsx`: 4 glowing metric cards (Active Projects, Generated LOC, Test Pass Rate, Saved Hours).
  - `src/features/dashboard/components/recent-projects-carousel.tsx`: Quick access to last active projects.
  - `src/features/dashboard/components/live-activity-feed.tsx`: Real-time SSE pulse of agents committing files and passing QA gates.
  - `src/features/dashboard/components/quick-launcher.tsx`: Prompt bar to instantly spawn an AI software team with an idea.

#### 2. `src/app/dashboard/projects/page.tsx` (Project Portfolio)
- **What:** Filterable project directory.
- **Where Integrated:** `/dashboard/projects`.
- **Subcomponents:**
  - `src/features/projects/components/project-filter-bar.tsx`: Search input, status dropdown (`All`, `Running`, `Needs Review`, `Completed`), and stack selector.
  - `src/features/projects/components/project-card.tsx`: Reusable project card with health score indicator, active department badge, last updated time, and 1-click "Open Workspace" action.

#### 3. `src/app/dashboard/projects/new/page.tsx` (Creation Wizard)
- **What:** Guided intake wizard for new software projects.
- **Where Integrated:** `/dashboard/projects/new`.
- **Subcomponents:**
  - `src/features/projects/components/wizard/step-idea.tsx`: Vision prompt input with prompt enhancement suggestions (SaaS, Studio, Dashboard, Mobile).
  - `src/features/projects/components/wizard/step-stack.tsx`: Preset selector (Static HTML/CSS, React/Vite, Next.js Full Stack, Node API).
  - `src/features/projects/components/wizard/step-autonomy.tsx`: Autonomy level toggle (Full Autonomous vs Strict Human Approvals).

---

## Milestone 4: AI Settings, BYOK Credentials & Model Routing

### Purpose
Allow users to securely manage their own AI provider API keys (Gemini, Groq, OpenAI, Anthropic) with real-time health checks, latency tests, and token quota monitors.

### File Blueprint & Component Contracts

#### 1. `src/app/dashboard/settings/page.tsx` (Settings & AI Credentials)
- **What:** Main settings surface.
- **Where Integrated:** `/dashboard/settings`.
- **Subcomponents:**
  - `src/features/ai-settings/components/provider-key-card.tsx`: Card per provider (Gemini, Groq, OpenAI, Anthropic, OpenRouter) with masked API key input, **Test Connection** button, latency badge, and default model selector.
  - `src/features/ai-settings/components/model-routing-table.tsx`: Mapping which agent roles (CEO, Architect, Developer, QA) use which models.
  - `src/features/ai-settings/components/quota-meter.tsx`: Project token quotas, monthly limits, and credits balance indicator.

---

## Milestone 5: Flagship Mission Control & 5-Agent Command Roster

### Purpose
The flagship Mission Control workspace where the human and AI team collaborate in real time with glowing telemetry, live SSE token streaming, decision diff drawers, and instant deliverables export.

### File Blueprint & Component Contracts

#### 1. `src/app/dashboard/projects/[id]/workspace/page.tsx`
- **What:** Next.js page wrapper loading the project workspace hub.
- **Where Integrated:** `/dashboard/projects/[id]/workspace`.
- **File Hierarchy:**
  - `src/features/workspace/components/project-workspace-hub.tsx`: Top-level coordinator switching between Mission Control and Studio modes.
  - `src/features/workspace/components/company-workspace.tsx`: Mission Control layout wrapper with top control bar and status badges.
  - `src/features/workspace/components/mission-control-board.tsx`: Main grid combining Left AI Team Rail and Right Action Stage.

#### 2. `src/features/workspace/components/mission-control-board.tsx`
- **What:** Mission Control orchestrator UI.
- **Subcomponents:**
  - `10-Phase Pipeline Stepper`: Visual step track with active pulse rings, step numbers, and status badges.
  - `Left AI Team Rail (5-Agent Roster)`: Cards for CEO, Architect, Designer, Developer, QA with active glow (`Working`, `Queued`, `Done`, `Standby`) and direct 1-click chat launcher.
  - `src/features/workspace/components/live-generation-panel.tsx`: Terminal-style token output streaming directly from the model generation bus.
  - `src/features/workspace/components/approval-review-panel.tsx`: Expandable decision drawer with structured before/after diffs, feedback comments textarea, and keyboard shortcuts (`Enter` / `⌘↵`).
  - `src/features/workspace/components/deliverables-panel.tsx`: Library of approved PRDs, specs, and test reports with Markdown and PDF export.

---

## Milestone 6: Monaco Code Studio, File Explorer & Live Preview Engine

### Purpose
A full-featured IDE environment integrated inside the browser with Monaco Editor, file tree, multi-tab switching, split preview pane, and Sandpack/WebContainer execution.

### File Blueprint & Component Contracts

#### 1. `src/features/workspace/components/workspace-shell.tsx`
- **What:** Workbench layout managing split panes (File Explorer, Monaco Editor, Live Preview, Agent Chat).
- **Subcomponents:**
  - `src/features/workspace/components/layouts/top-nav.tsx`: Studio header with **"Mission Control"** return button, file search (`⌘K`), split toggle, run preview, and deploy triggers.
  - `src/features/workspace/explorer/components/file-tree.tsx`: Interactive tree view with file creation, renaming, deletion, and dirty status indicators.
  - `src/features/workspace/editor/components/monaco-editor-surface.tsx`: Monaco Editor with VS Code dark theme, syntax highlighting, minimap, and multi-file tabs.
  - `src/features/workspace/components/layouts/studio-preview-pane.tsx`: Live preview pane with responsive viewport toggles (Desktop, Tablet 768px, Mobile 375px), reload button, and external window launcher.
  - `src/features/workspace/components/agent-panel.tsx`: Multi-agent conversation drawer supporting direct chat with CEO, Architect, Developer, QA, and DevOps.

---

## Milestone 7: Production Build, Testing & Zero-Error Verification

### Purpose
Enforce enterprise-grade stability, zero TypeScript errors, 100% test passing rate, and successful production compilation.

### Verification Matrix & Command Blueprint
1. **Next.js Production Build:** `npm run build` $\rightarrow$ Validates all 73 application routes and static page generation.
2. **Full Vitest Test Suite:** `npx vitest run tests/` $\rightarrow$ 104+ test suites, 407+ individual tests passing.
3. **TypeScript Strict Type Check:** `npx tsc --noEmit` $\rightarrow$ 0 type errors.
4. **Git Production Push:** All changes committed with structured conventional commit messages and pushed to `main`.
