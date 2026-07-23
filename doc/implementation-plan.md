# AI Software Company — Implementation Plan

## Goal
Unify all AI agents into the workspace to create a cohesive "AI software company" experience where agents work together as a team and artifacts (code, docs, tests) appear in the file explorer in real-time.

## Current Architecture (Audited)

```
Tabs Page (/dashboard/projects/{id})
├── CEO AI tab (ProjectTabsClient → ceo-chat)
├── Architect AI tab (architecture-chat)
├── Developer AI tab (developer-chat — SSE, DAG, cancel, workspace sync)
├── QA AI tab (qa-chat)
├── Deploy tab (deployment-panel)
└── WorkspaceBuildSync (background SSE listener)

Workspace Page (/dashboard/projects/{id}/workspace)
├── VS Code-like IDE layout
│   ├── Activity Bar: Explorer, Search, AI Employees, Projects, Git, GitHub,
│   │                 Quality, Documentation, Deployment, Analytics, Extensions
│   ├── Sidebar Panel: switches content based on selectedActivity
│   │   ├── explorer → ExplorerTree (file tree)
│   │   ├── git → GitPanel
│   │   ├── ai-employees → Placeholder("AI Employees")  ← EMPTY STUB
│   │   ├── search → Placeholder("Search") ← EMPTY STUB
│   │   ├── projects → Placeholder("Projects") ← EMPTY STUB
│   │   └── ... (others are functional)
│   ├── Editor Area (center)
│   ├── AI Panel (right sidebar) → AssistantChat (generic code Q&A, NOT the 4 agents)
│   ├── Bottom Panel: Preview, Review, Performance, Workflow, Database,
│   │                 Terminal, Problems, Output, Logs, Tests
│   └── WorkspaceBuildSync (background SSE listener)
└── ProjectInitializer (resets workspace store on mount)

Problem: Agents live in tabs page, files live in workspace page. Disconnected.
The workspace AI panel has a generic chat, not the specialized agents.
The "AI Employees" sidebar is a dead stub.
```

## Target Architecture
```
Workspace Page — single hub for everything
├── Activity Bar (default: AI Employees on first visit)
├── Sidebar Panel (switches by activity)
│   ├── AI Employees → agent team overview with status cards
│   └── Explorer → file tree (existing)
├── AI Panel (right sidebar)
│   └── 4 agent tabs: CEO / Architect / Developer / QA (replaces AssistantChat)
├── Bottom Panel (Pipeline added)
│   └── Pipeline tab → kanban board for full build workflow
├── Editor Area → opens agent outputs as documents
└── Status Bar → shows build status
```

## Phases

---

### Phase 1 — Move All 4 Agents into Workspace AI Panel
**Effort:** 1–2 days

**What:**
Replace the generic `AssistantChat` in the workspace AI panel with the 4 specialized
agent UIs (CEO, Architect, Developer, QA) rendered as tabs.

**Files to create:**

| File | Purpose |
|---|---|
| `src/features/workspace/components/agent-panel.tsx` | Tabbed container wrapping 4 agent chat components. Reads `projectId` from workspace store. Each tab renders the corresponding agent's chat component with the same props used in `project-tabs-client.tsx`. |

**Files to change:**

| File | Change |
|---|---|
| `src/app/dashboard/projects/[id]/workspace/assistant-chat-wrapper.tsx` | Replace `AssistantChat` import with `AgentPanel`. Rename to `agent-panel-wrapper.tsx` (or keep name, change internals). |
| `src/app/dashboard/projects/[id]/workspace/page.tsx` | Update import if file was renamed. No other change needed — `aiPanelContent` prop already accepts `ReactNode`. |

**What does NOT change:**
- All 4 agent service files — untouched
- All 4 agent chat components — imported as-is, no modifications
- All API routes (CEO, Architect, Developer with SSE, QA, cancel) — untouched
- `WorkspaceBuildSync` — already mounted on workspace page
- Explorer with `refreshTrigger` — already working
- `syncFilesToWorkspace()` — already called by Developer AI
- `developer-chat.tsx` — still handles SSE, cancel, "Open in Workspace" button

**Key detail:** `WorkspaceShell` passes `aiPanelContent` as `{children}` to `<AIPanel>`,
which renders it in a scrollable container. The new `AgentPanel` will be a self-contained
tabbed component that receives `projectId` via `useWorkspaceStore` (not props).

**Verification:**
1. Navigate to workspace → AI panel shows tabbed agent UI (CEO / Architect / Developer / QA)
2. CEO tab loads and functions (POST `/api/ai/ceo` → displays vision/requirements/plan)
3. Developer tab shows SSE streaming (POST `/api/ai/developer` → real-time task progress)
4. Cancel button on Developer tab still works
5. Build completes → files auto-sync to explorer
6. "Open in Workspace" button on Developer AI navigates within workspace (no-op or scroll)

---

### Phase 2 — Make "AI Employees" Sidebar Functional
**Effort:** 1 day

**What:**
The `ai-employees` activity currently renders `<Placeholder label="AI Employees" />`.
Replace it with a real agent team overview panel.

**Files to change:**

| File | Change |
|---|---|
| `src/features/workspace/components/workspace-sidebar-content.tsx` | Change `case 'ai-employees': return <Placeholder ... />` → `return <AgentTeamOverview projectId={currentProjectId} />` |

**Files to create:**

| File | Purpose |
|---|---|
| `src/features/workspace/ai-employees/components/agent-team-overview.tsx` | Shows all 8 agents as cards: CEO, Architect, Developer, QA, DevOps, Security, Operations, UI/UX. Each card shows: name, status (IDLE/RUNNING/COMPLETE), last output summary. Clicking a card opens the agent's tab in the AI panel. |

**Verification:**
1. Click AI Employees icon in activity bar → sidebar shows agent cards
2. Each card shows agent name and current status
3. Clicking a card switches the AI panel to that agent's tab

---

### Phase 3 — Redirect to Workspace by Default
**Effort:** 1 hour

**What:**
Change project creation redirect and default activity so workspace is the primary landing page.

**Files to change:**

| File | Change |
|---|---|
| `src/features/projects/components/project-form.tsx` (line 49) | `router.push(\`/dashboard/projects/\${result.data.id}/workspace\`)` (was `/dashboard/projects/{id}`) |
| `src/features/workspace/stores/workspace.store.ts` (line 39) | Change `selectedActivity: 'explorer'` → `selectedActivity: 'ai-employees'` so the sidebar opens to the AI team overview on first visit. |

**What stays the same:**
- Tabs page still accessible at `/dashboard/projects/{id}` for manual navigation
- Workspace page already has all required wiring (`WorkspaceBuildSync`, `ProjectInitializer`)

---

### Phase 4 — Pipeline Board (Full Build Visualization)
**Effort:** 2–3 days

**What:**
When "Run Full Build" executes the full pipeline (CEO → Architect → Developer → QA → Deploy),
show a visual pipeline board as a new bottom-panel tab.

**Prerequisites:**
- `BottomPanelTab` type needs `'pipeline'` added (`workspace.types.ts:9`)
- `bottom-panel.tsx` needs a new tab entry + render condition for pipeline
- Master orchestrator needs to emit SSE events per phase

**Files to create:**

| File | Purpose |
|---|---|
| `src/features/workspace/pipeline/components/pipeline-board.tsx` | Kanban-style board: Planning → Designing → Building → Testing → Deploying. Columns show agent name, status badge (Running/Complete/Failed/Idle), output summary, duration. Click card → preview in editor area. |

**Pipeline columns:**

```
Planning   | Designing  | Building   | Testing    | Deploying
   CEO         Arch         Dev          QA          Deploy
   status      status       status       status      status
   summary     summary      summary      summary     summary
```

**Verification:**
1. Click "Run Full Build" → bottom panel shows Pipeline tab with active progress
2. Each phase lights up as agents complete
3. Click completed phase card → opens output in editor

---

### Phase 5 — Agent Communication (Future)
**Effort:** 3–5 days

**What:**
Agents communicate with each other via shared memory, visible in a "Team Chat" panel.

**Not started yet** — requires coordination protocol design, shared memory schema,
and cross-agent event bus.

---

## Corrected File Inventory (Full Audit)

### Files that exist and are correct

| File | Status | Notes |
|---|---|---|
| `src/ai/agents/roles/ceo/ceo.service.ts` | ✅ | No changes needed |
| `src/ai/agents/roles/architect/architect.service.ts` | ✅ | No changes needed |
| `src/ai/agents/roles/developer/developer.service.ts` | ✅ | SSE/DAG/cancel already built |
| `src/ai/agents/roles/qa/qa.service.ts` | ✅ | No changes needed |
| `src/features/ceo-ai/components/ceo-chat.tsx` | ✅ | Will be reused in AgentPanel |
| `src/features/architect-ai/components/architecture-chat.tsx` | ✅ | Will be reused in AgentPanel |
| `src/features/developer-ai/components/developer-chat.tsx` | ✅ | Has SSE, cancel, "Open in Workspace" |
| `src/features/qa-ai/components/qa-chat.tsx` | ✅ | Will be reused in AgentPanel |
| `src/features/workspace/components/workspace-build-sync.tsx` | ✅ | Already mounted on both pages |
| `src/features/workspace/explorer/stores/explorer.store.ts` | ✅ | Has refreshTrigger |
| `src/features/workspace/explorer/components/explorer-tree.tsx` | ✅ | Watches refreshTrigger |
| `src/features/workspace/stores/workspace.store.ts` | ✅ | Has setActivity, selectedActivity |
| `src/features/workspace/constants/workspace.constants.ts` | ✅ | Has ai-employees in ACTIVITY_ITEMS |
| `src/features/workspace/components/workspace-shell.tsx` | ✅ | Accepts aiPanelContent prop |
| `src/features/workspace/components/layouts/ai-panel.tsx` | ✅ | Renders children in scrollable panel |
| `src/features/workspace/components/layouts/sidebar-panel.tsx` | ✅ | Renders children with title header |
| `src/features/workspace/components/layouts/activity-bar.tsx` | ✅ | Highlights selectedActivity |
| `src/features/workspace/components/layouts/bottom-panel.tsx` | ✅ | 10 tabs, extensible |
| `src/app/dashboard/projects/[id]/workspace/page.tsx` | ✅ | Mounts WorkspaceBuildSync + WorkspaceShell |
| `src/app/dashboard/projects/[id]/workspace/assistant-chat-wrapper.tsx` | ⚠️ | Will be replaced with AgentPanel |
| `src/features/workspace/components/workspace-sidebar-content.tsx` | ⚠️ | ai-employees case is Placeholder stub |

### Stubs that need work

| File | Current | Target |
|---|---|---|
| `workspace-sidebar-content.tsx` (ai-employees case) | `<Placeholder label="AI Employees" />` | `<AgentTeamOverview />` |
| `assistant-chat-wrapper.tsx` | Renders `AssistantChat` | Renders `AgentPanel` |
| `BottomPanelTab` type | 10 tabs, no pipeline | Add `'pipeline'` |
| `workspace.store.ts` default activity | `'explorer'` | `'ai-employees'` |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Agent UIs have hardcoded dependencies on tabs page context | High | Audit each chat component's props and internal state before wrapping |
| Developer Chat's "Open in Workspace" button is a no-op if already in workspace | Low | Add conditional: if already on workspace page, scroll to AI panel or highlight the generated file |
| Performance: 4 agent components mounted simultaneously | Medium | Use lazy loading (`next/dynamic`) for non-active agent tabs in `AgentPanel` |
| Workspace store reset on page navigation | Low | Handled by `ProjectInitializer` — resets tabs but preserves layout pref |
