# HibirDev AI — Frontend ↔ Backend Integration Plan
**Version:** 1.0  
**Date:** September 2026  
**Status:** Active Implementation Guide

---

## Table of Contents

1. [Current State Audit](#1-current-state-audit)
2. [Integration Architecture Overview](#2-integration-architecture-overview)
3. [API Surface Map](#3-api-surface-map)
4. [Screen-by-Screen Integration](#4-screen-by-screen-integration)
5. [Pipeline State Machine & Frontend Mapping](#5-pipeline-state-machine--frontend-mapping)
6. [Real-Time SSE Integration](#6-real-time-sse-integration)
7. [Approval Gate Integration](#7-approval-gate-integration)
8. [Artifact System Integration](#8-artifact-system-integration)
9. [Room Router — Phase-to-UI Mapping](#9-room-router--phase-to-ui-mapping)
10. [Data Contracts — Request/Response Shapes](#10-data-contracts--requestresponse-shapes)
11. [Gap Analysis — What's Missing](#11-gap-analysis--whats-missing)
12. [Implementation Phases](#12-implementation-phases)
13. [Error Handling & Loading States](#13-error-handling--loading-states)
14. [Auth Integration](#14-auth-integration)

---

## 1. Current State Audit

### What exists and works

**Backend (complete):**
- 130+ API routes across `src/app/api/`
- Full pipeline orchestration: `src/core/company-orchestration/`
- `ProjectLifecycleState` enum — 18 states from `CREATED` → `COMPLETED`
- `PIPELINE_PHASE_DEFINITIONS` — maps every lifecycle state to agentRole, artifacts, approvals, progress %
- SSE stream: `GET /api/projects/[id]/execution/stream`
- Pipeline status polling: `GET /api/projects/[id]/pipeline/status`
- Approval gating: `POST /api/projects/[id]/pipeline/approve`
- Lifecycle start: `POST /api/projects/[id]/lifecycle/start`
- Retry/resume: `POST /api/projects/[id]/pipeline/retry`
- Proposal system: `GET/POST /api/projects/[id]/proposal`, `/approve`, `/update`
- Architecture approvals: `GET/POST /api/projects/[id]/architecture`, `/approve`, `/update`, `/reject`
- Artifact timeline: `GET /api/projects/[id]/artifacts/timeline`

**Frontend (partial):**
- `usePipeline` hook — polls `/pipeline/status` every 5s + optional SSE
- `PipelineProvider` — React context wrapping `usePipeline`
- `CompanyWorkspace` — full Mission Control header + `MissionControlBoard`
- `MissionControlBoard` — left roster, center content, right panel (now/deliverables tabs)
- `RoomRouter` — maps `currentPhase` string → room component (12 room components)
- `ApprovalReviewPanel` — document preview + approve/requestChanges UI
- `LiveGenerationPanel` — SSE token streaming display
- `DeliverablesPanel` — artifact viewer with pin/export
- `ProjectWorkspaceHub` — Mission Control ↔ Studio toggle

**Frontend (gaps — documented in Section 11):**
- Project overview polls pipeline but doesn't display room-level content
- NewProjectWizard calls `lifecycle/start` but doesn't await SSE confirmation
- No dedicated checkpoint review screen outside workspace
- Dashboard hero shows hardcoded pipeline state
- Settings uses `AiCredentialsForm` (real API) ✅ but some pages still mock
- Welcome page exists but no post-auth routing logic in `login-form.tsx`
- `/projects/[id]/complete` page exists but `DeploymentPanel` needs real data

---

## 2. Integration Architecture Overview

```
Browser
  │
  ├── Next.js App Router (SSR pages)
  │     ├── Server Components → Prisma direct queries (dashboard stats, project list)
  │     └── Client Components → fetch() to API routes
  │
  ├── React Context
  │     └── PipelineProvider
  │           └── usePipeline hook
  │                 ├── REST polling: GET /api/projects/[id]/pipeline/status  (5s)
  │                 └── SSE:          GET /api/projects/[id]/execution/stream
  │
  └── Direct fetch() calls (mutations)
        ├── POST /api/projects/[id]/lifecycle/start
        ├── POST /api/projects/[id]/pipeline/approve
        ├── POST /api/projects/[id]/pipeline/retry
        └── POST /api/projects/[id]/proposal/approve

API Routes (Next.js Route Handlers)
  │
  └── Core Orchestration Layer
        ├── canonicalOrchestrator   (lifecycle/start)
        ├── WorkflowManager         (pipeline state)
        ├── ProjectLifecycleService (status, timeline)
        ├── CompanyPipelineEngine   (phase execution)
        └── ArtifactManager         (artifact CRUD)
              │
              └── Prisma → PostgreSQL
```

---

## 3. API Surface Map

### Project lifecycle

| Method | Endpoint | Frontend consumer | Purpose |
|--------|----------|------------------|---------|
| `POST` | `/api/projects` | `NewProjectWizard` | Create project |
| `GET` | `/api/projects/[id]` | `ProjectOverviewClient` | Get project |
| `POST` | `/api/projects/[id]/lifecycle/start` | `NewProjectWizard`, `CompanyWorkspace` | Start pipeline |
| `POST` | `/api/projects/[id]/lifecycle/resume` | `CompanyWorkspace` | Resume paused pipeline |

### Pipeline status & streaming

| Method | Endpoint | Frontend consumer | Purpose |
|--------|----------|------------------|---------|
| `GET` | `/api/projects/[id]/pipeline/status` | `usePipeline` (polling) | Full pipeline state |
| `GET` | `/api/projects/[id]/execution/stream` | `usePipeline` (SSE) | Live execution events |
| `GET` | `/api/projects/[id]/pipeline/generation-stream` | `TokenStreamPanel` | Token-level SSE |
| `POST` | `/api/projects/[id]/pipeline/approve` | `CompanyWorkspace.handleApprove` | Approve checkpoint |
| `POST` | `/api/projects/[id]/pipeline/retry` | `CompanyWorkspace.handleRetry` | Resume after failure |
| `POST` | `/api/projects/[id]/pipeline/settings` | `CompanyWorkspace` | Toggle strict mode |

### Proposal system (CEO stage)

| Method | Endpoint | Frontend consumer | Purpose |
|--------|----------|------------------|---------|
| `GET` | `/api/projects/[id]/proposal` | `NewProjectWizard` (step 2) | Fetch CEO proposal |
| `POST` | `/api/projects/[id]/proposal/approve` | `NewProjectWizard` (step 2) | Approve product spec |
| `POST` | `/api/projects/[id]/proposal/update` | `NewProjectWizard` (step 2) | Request revision |

### Architecture system

| Method | Endpoint | Frontend consumer | Purpose |
|--------|----------|------------------|---------|
| `GET` | `/api/projects/[id]/architecture` | `ArchitectureRoom` | Get arch spec |
| `POST` | `/api/projects/[id]/architecture/approve` | `ApprovalReviewPanel` | Approve architecture |
| `POST` | `/api/projects/[id]/architecture/update` | `ApprovalReviewPanel` | Request revision |
| `POST` | `/api/projects/[id]/architecture/reject` | `ApprovalReviewPanel` | Reject architecture |

### Artifact system

| Method | Endpoint | Frontend consumer | Purpose |
|--------|----------|------------------|---------|
| `GET` | `/api/projects/[id]/artifacts/timeline` | `ProjectOverviewClient`, `ProjectHistory` | Artifact list |
| `GET` | `/api/projects/[id]/explorer` | `WorkspaceShell` | File tree |
| `POST` | `/api/projects/[id]/explorer/ensure` | `ProjectWorkspaceHub.openStudio` | Sync files |

### Settings / credentials

| Method | Endpoint | Frontend consumer | Purpose |
|--------|----------|------------------|---------|
| `GET` | `/api/settings/ai-credentials` | `AiCredentialsForm` | Load credential status |
| `PUT` | `/api/settings/ai-credentials` | `AiCredentialsForm` | Save API key |
| `POST` | `/api/settings/ai-credentials/test` | `AiCredentialsForm` | Test connection |
| `DELETE` | `/api/settings/ai-credentials` | `AiCredentialsForm` | Remove key |

### Deployment

| Method | Endpoint | Frontend consumer | Purpose |
|--------|----------|------------------|---------|
| `GET` | `/api/projects/[id]/deployments` | `DeploymentPanel` | List deployments |
| `POST` | `/api/projects/[id]/deploy` | `OneClickDeploy` | Trigger deployment |
| `GET` | `/api/deployments/[id]/logs` | `DeploymentPanel` | Deployment logs |

---

## 4. Screen-by-Screen Integration

### Screen 01 — Landing (`/`)

**Components:** `LandingHeader`, `LandingHero`, `LandingWorkflowSpine`, `LandingAgents`, `LandingFeatures`, `LandingProof`, `LandingFooter`

**API calls:** None — fully static server component.

**Integration status:** ✅ Complete

**Remaining work:** None.

---

### Screen 02 — Login (`/login`)

**Component:** `LoginForm` inside `AuthShell`

**API flow:**
```
User submits email + password
  → next-auth signIn('credentials', { email, password, redirect: false })
  → NextAuth calls /api/auth/[...nextauth]
  → Returns session JWT
  → On success:
      Check if user has projects: GET /api/projects?limit=1
      has projects → router.push('/dashboard/projects')
      no projects  → router.push('/welcome')
```

**Integration gap:** `LoginForm` currently redirects to `/dashboard/projects` unconditionally.

**Fix required in `src/components/auth/login-form.tsx`:**
```typescript
// After successful signIn:
const projectsRes = await fetch('/api/projects?limit=1', { credentials: 'same-origin' });
const projectsData = await projectsRes.json();
const hasProjects = (projectsData?.data?.length ?? 0) > 0;
router.push(hasProjects ? ROUTES.projects : ROUTES.welcome);
```

**Integration status:** 🔴 Needs post-login routing fix

---

### Screen 03 — Sign Up (`/signup`)

**Component:** `SignupForm` inside `AuthShell`

**API flow:**
```
User submits name + email + password
  → POST /api/auth/register { name, email, password }
  → On success: auto signIn('credentials') → router.push('/welcome')
```

**Integration status:** ✅ Complete (implemented in previous sprint)

---

### Screen 04 — Welcome (`/welcome`)

**Component:** `WelcomePage` (server component)

**API flow:**
```
Server: getAuthSession() → session.user.id
Server: listProjects(userId) → if projects.length > 0 → redirect('/dashboard/projects')
Client: Static page with CTA → /projects/new
```

**Integration status:** ✅ Complete

---

### Screen 05 — Projects (`/dashboard/projects`)

**Component:** `ProjectsPage` (server component) + `ProjectCard` (client)

**API flow:**
```
Server: listProjects(userId)
  → Prisma: Project.findMany({ where: { ownerId }, orderBy: { updatedAt: 'desc' } })
Each card: links to /dashboard/projects/[id]/workspace
```

**Integration status:** ✅ Complete

**Enhancement needed:** Project cards should show real pipeline progress %. Currently shows hardcoded "Live/Done/Idle" status.

**Fix:** Add a lightweight pipeline status field to the `listProjects` service response or fetch it client-side per card via `GET /api/projects/[id]/pipeline/status` with `{ progress, phaseStatus }`.

---

### Screen 06 — Project Overview (`/dashboard/projects/[id]`)

**Component:** `ProjectOverviewClient` (polls pipeline status every 15s)

**API flow:**
```
Client mount:
  GET /api/projects/[id]/pipeline/status
    → { currentPhase, phaseStatus, progress, phases[], artifacts[], activities[], approvalRequests[] }
  
Polling every 15s:
  Same endpoint — updates agent nodes, progress bar, artifact list, activity feed

On approval banner CTA:
  Links to /dashboard/projects/[id]/workspace
```

**Response shape used by `ProjectOverviewClient`:**
```typescript
{
  currentPhase: string,           // 'discovery' | 'architecture' | ...
  phaseStatus: string,            // 'running' | 'approval' | 'completed' | 'failed'
  progress: number,               // 0–100
  phases: Array<{ name, status, agentRole }>,
  artifacts: Array<{ id, type, name, createdAt }>,
  activities: Array<{ id, type, message, createdAt, agentRole? }>,
  approvalRequests: Array<{ id, artifactName? }>
}
```

**Integration status:** ✅ Functional — polls real API

**Gap:** `activities` field on `/pipeline/status` — confirm this is populated by `WorkspaceService.getActivity()`. May need to verify the response shape matches what `ProjectOverviewClient` expects.

---

### Screen 07 — Create Project (`/projects/new`)

**Component:** `NewProjectWizard` (4-step state machine)

**API flow — step by step:**

```
STEP 1 (define):
  POST /api/projects
    body: { name: string, description: string }
    response: { success: true, data: { id: string, name: string } }
  
  Then immediately:
  GET /api/projects/[id]/proposal
    response:
      200: { success: true, proposal: ProposalData, score: number }
      404: proposal not yet generated (show idea summary fallback)

STEP 2 (review):
  If user approves:
    POST /api/projects/[id]/proposal/approve
      body: { approved: true }
      response: { success: true } | 404 (skip, continue to prepare)
  
  If user requests revision:
    POST /api/projects/[id]/proposal/update
      body: { feedback: string }
      response: { success: true }
    Then: GET /api/projects/[id]/proposal  (re-fetch updated proposal)

STEP 3 (prepare):
  Static — no API call

STEP 4 (launching):
  POST /api/projects/[id]/lifecycle/start
    body: { userIdea: string }
    response: { success: true } | { success: false, error: { message } }
  On success:
    router.push('/dashboard/projects/[id]/workspace')
```

**Known issue:** `GET /api/projects/[id]/proposal` returns `{ success: true, proposal, score }` but the route handler at `src/app/api/projects/[id]/proposal/route.ts` actually returns `{ success: true, proposal, score }` without the `data` wrapper. The wizard handles both shapes with optional chaining.

**Fix needed:** Standardize the proposal response to match API convention:
```typescript
// Current (non-standard):
return NextResponse.json({ success: true, proposal: result.proposal, score: result.score });

// Standard (matches other routes):
return NextResponse.json({ success: true, data: { proposal: result.proposal, score: result.score } });
```
Update `NewProjectWizard` to read `data.proposal` accordingly.

**Integration status:** ✅ Wired — one standardization fix needed

---

### Screen 08 — Mission Control Workspace (`/dashboard/projects/[id]/workspace`)

**Components:** `ProjectWorkspaceHub` → `CompanyWorkspace` + `WorkspaceShell` (Studio mode)

**Integration flow:**
```
Page load (server):
  getAuthSession() + prisma.project.findUnique()
  → renders CompanyWorkspaceWrapper(projectId, projectName, ...)

Client mount:
  PipelineProvider → usePipeline(projectId)
    → GET /api/projects/[id]/pipeline/status  (immediate)
    → EventSource /api/projects/[id]/execution/stream  (SSE)
    → setInterval GET /api/projects/[id]/pipeline/status  (5s polling)

CompanyWorkspace receives pipeline state and renders:
  - Header: project name, connection status, token meter, strict mode
  - MissionControlBoard:
      Left panel: COMPANY_ROSTER status per phase
      Center: MissionControlBoard center (approval/live-gen/deliverables)
      Right panel: Activity feed | Deliverables tab

MissionControlBoard center content driven by phaseStatus:
  phaseStatus === 'approval' + pendingDocument → ApprovalReviewPanel
  phaseStatus === 'running' + liveGeneration   → LiveGenerationPanel
  rightTab === 'deliverables'                  → DeliverablesPanel
  isWaiting (canStart === true)                → Start button
```

**Mutations:**
```
Start pipeline:
  POST /api/projects/[id]/lifecycle/start
  body: { userIdea: projectDescription }

Approve checkpoint:
  POST /api/projects/[id]/pipeline/approve
  body: { approvalType: artifact.artifactName, action: 'approve' }

Request changes:
  POST /api/projects/[id]/pipeline/approve
  body: { approvalType: artifact.artifactName, action: 'request_changes', comments }

Retry/resume:
  POST /api/projects/[id]/pipeline/retry

Toggle strict mode:
  POST /api/projects/[id]/pipeline/settings
  body: { strictMode: boolean }
```

**Integration status:** ✅ Fully integrated — this is the most complete screen

---

### Screen 09 — Project Complete (`/dashboard/projects/[id]/complete`)

**Component:** `ProjectCompletePage` (server component)

**API flow:**
```
Server:
  getProject(id, userId)          → project name, description, status
  prisma.artifact.findMany({ where: { projectId }, take: 12 })
    → artifact list for registry panel

Client:
  DeploymentPanel(projectId)
    → GET /api/projects/[id]/deployments
    → POST /api/projects/[id]/deploy  (on trigger)
```

**Integration status:** ✅ Functional

**Gap:** No redirect guard — if user navigates here on an incomplete project it shows "Build Complete" incorrectly.

**Fix in `ProjectCompletePage`:**
```typescript
if (project.status !== 'COMPLETED') {
  redirect(`/dashboard/projects/${id}/workspace`);
}
```

---

### Screen 10 — Settings (`/dashboard/settings`)

**Component:** `AiCredentialsForm` + `SettingsNavTabs`

**API flow:**
```
Mount:
  GET /api/settings/ai-credentials
    → { success: true, data: { status: AiCredentialPublicStatus, providers: AiProviderCatalogEntry[] } }

Save key:
  PUT /api/settings/ai-credentials
    body: { provider: string, apiKey: string }
    → { success: true, data: { status } }

Test connection:
  POST /api/settings/ai-credentials/test
    body: { provider, apiKey?, action: 'test' }
    → { success: true, data: { message, model, latencyMs } }

Remove key:
  DELETE /api/settings/ai-credentials
    → { success: true }
```

**Integration status:** ✅ Fully integrated

---

## 5. Pipeline State Machine & Frontend Mapping

### Backend `ProjectLifecycleState` → Frontend `currentPhase`

The mapping in `/api/projects/[id]/pipeline/status/route.ts`:

```typescript
const LIFECYCLE_TO_PHASE_ID = {
  CREATED:              'discovery',   // shows Start button (canStart: true)
  DISCOVERY_RUNNING:    'discovery',
  CLARIFICATION_RUNNING:'clarification',
  PROPOSAL_RUNNING:     'proposal',    // CEO checkpoint
  STRATEGY_RUNNING:     'strategy',
  PRODUCT_RUNNING:      'product',
  ANALYSIS_RUNNING:     'architecture', // maps to architecture room
  DESIGN_RUNNING:       'design',       // no frontend room yet — maps to architecture
  ARCHITECTURE_RUNNING: 'architecture', // Architect checkpoint
  PLANNING_RUNNING:     'planning',
  DEVELOPMENT_RUNNING:  'development',
  TESTING_RUNNING:      'development',  // same room
  REVIEW_RUNNING:       'review',
  SECURITY_RUNNING:     'development',  // same room
  DEPLOYMENT_RUNNING:   'deployment',
  MONITORING:           'completed',
  COMPLETED:            'completed',
  FAILED:               'development',  // error state in dev room
  PAUSED:               'development',  // resume state
}
```

### Frontend `RoomRouter` phase → component

```typescript
'discovery'      → DiscoveryRoom     // CEO — product discovery thinking steps
'clarification'  → ClarificationRoom // Product Manager clarifying requirements
'proposal'       → ProposalRoom      // CEO proposal + approval dialog
'strategy'       → StrategyRoom      // CEO executive strategy
'product'        → ProductRoom       // Product Manager requirements
'architecture'   → ArchitectureRoom  // Architect — system design
'planning'       → PlanningRoom      // Planning phase
'development'    → DevelopmentRoom   // Developer + health bar + timeline
'testing'        → DevelopmentRoom   // Same as development
'security'       → DevelopmentRoom   // Same as development
'review'         → ReviewRoom        // Review committee
'deployment'     → DeploymentRoom    // Deployment
'completed'      → FinalRoom         // Done — full artifact summary
```

### Pipeline progress mapping

| Lifecycle state | Progress % |
|----------------|------------|
| CREATED | 0% |
| DISCOVERY_RUNNING | 6% |
| CLARIFICATION_RUNNING | 10% |
| PROPOSAL_RUNNING | 14% |
| STRATEGY_RUNNING | 16% |
| PRODUCT_RUNNING | 25% |
| ANALYSIS_RUNNING | 33% |
| ARCHITECTURE_RUNNING | 50% |
| DESIGN_RUNNING | 58% |
| PLANNING_RUNNING | 40% |
| DEVELOPMENT_RUNNING | 68% |
| TESTING_RUNNING | 80% |
| REVIEW_RUNNING | 88% |
| SECURITY_RUNNING | 92% |
| DEPLOYMENT_RUNNING | 96% |
| COMPLETED | 100% |

---

## 6. Real-Time SSE Integration

### Two SSE streams exist

**Stream 1 — Execution events (primary)**
```
GET /api/projects/[id]/execution/stream
Event types: status, progress, phase_change, activity, error
Used by: usePipeline (supplements 5s polling)
```

**Stream 2 — Generation token stream**
```
GET /api/projects/[id]/pipeline/generation-stream
Event types: generation (token chunks)
Used by: TokenStreamPanel inside LiveGenerationPanel
```

### How `usePipeline` uses SSE

```typescript
// usePipeline.ts pattern (simplified):
// 1. Always poll every 5s — source of truth
setInterval(() => fetchPipelineStatus(), 5000);

// 2. SSE as supplementary — faster updates, but polling wins on conflict
const source = new EventSource(`/api/projects/${projectId}/execution/stream`);
source.onmessage = (e) => {
  // Only apply SSE data if newer than last poll
  if (e.data.timestamp > lastPollTimestamp) updateState(e.data);
};

// connectionStatus logic:
// SSE connected + data received → 'connected'
// SSE down but polling works   → 'polling'
// SSE reconnecting             → 'reconnecting'
// Both down                    → 'offline'
```

### What this means for frontend components

Components should **never directly create EventSource**. They consume `usePipelineContext()` which already handles SSE + polling + reconnection. The only exception is `TokenStreamPanel` which subscribes to the generation token stream for live typing effects.

---

## 7. Approval Gate Integration

### How approval gates work end-to-end

```
Backend:
  Pipeline reaches PROPOSAL_RUNNING → completes → sets state to 'approval'
  Writes ApprovalRequest record to DB
  Pipeline halts — waits for human input

Frontend (usePipeline polls):
  phaseStatus === 'approval'
  approvalRequests: [{ id, title, description, artifactName, urgency }]
  pendingDocument: { title, type, summary, content }

MissionControlBoard renders:
  ApprovalReviewPanel(document, onApprove, onRequestChanges)

User approves:
  CompanyWorkspace.handleApprove(artifactName)
  → POST /api/projects/[id]/pipeline/approve
    body: { approvalType: artifactName, action: 'approve' }
  → Pipeline resumes to next state

User requests changes:
  CompanyWorkspace.handleRequestChanges(artifactName, comments)
  → POST /api/projects/[id]/pipeline/approve
    body: { approvalType: artifactName, action: 'request_changes', comments }
  → Agent regenerates artifact → back to 'approval' state
```

### Three approval gates in the pipeline

| Gate | Lifecycle state | `approvalType` value | Agent |
|------|----------------|---------------------|-------|
| Product Approval | `PROPOSAL_RUNNING` | `'Product Approval'` | Product Manager / CEO |
| Architecture Approval | `ARCHITECTURE_RUNNING` | `'Architecture Approval'` | Architect |
| Design Approval | `DESIGN_RUNNING` | `'Design Approval'` | Designer |

### Architecture-specific approval (separate endpoint)

The architecture approval uses a **different route** from the general pipeline approval:

```typescript
// General pipeline approval (used for Product + Design):
POST /api/projects/[id]/pipeline/approve
body: { approvalType: 'Product Approval' | 'Design Approval', action: 'approve' }

// Architecture-specific approval (dedicated route):
POST /api/projects/[id]/architecture/approve
body: { approved: true, reviewedBy: string }

// Architecture revision:
POST /api/projects/[id]/architecture/update
body: { feedback: string }

// Architecture rejection:
POST /api/projects/[id]/architecture/reject
body: { reason: string }
```

**Gap:** `CompanyWorkspace.handleApprove` currently uses only `/pipeline/approve` for all gates. For architecture specifically, it should detect the approval type and route to `/architecture/approve`.

**Fix in `company-workspace.tsx`:**
```typescript
const handleApprove = async (artifact: string) => {
  if (artifact.toLowerCase().includes('architecture')) {
    // Use architecture-specific endpoint
    await fetch(`/api/projects/${projectId}/architecture/approve`, {
      method: 'POST',
      body: JSON.stringify({ approved: true, reviewedBy: userName }),
    });
  } else {
    await approve(artifact); // standard pipeline approve
  }
};
```

---

## 8. Artifact System Integration

### What an artifact looks like from the API

From `GET /api/projects/[id]/pipeline/status` → `artifacts[]`:
```typescript
{
  id: string,
  name: string,
  type: string,       // 'ProductSpecification' | 'ArchitectureDesign' | 'SourceCode' | ...
  createdBy: string,  // agent role
  createdAt: string,
  status: 'draft' | 'review' | 'approved' | 'rejected',
  score?: number,
  content?: unknown,  // full document body — used by DocumentReader
  summary?: string,
  producedBy?: string
}
```

### Artifact types and which room they appear in

| Artifact type | Room | Display component |
|--------------|------|------------------|
| `ProductSpecification` / `ProductProposal` | ProposalRoom | `ArtifactCard` + `DocumentDrawer` |
| `ArchitectureDesign` / `ArchitectureSpecification` | ArchitectureRoom | `ArtifactCard` + `DocumentDrawer` |
| `UiDesign` / `DesignSystem` | Development (design phase) | `ArtifactCard` |
| `SourceCode` / `Implementation` | DevelopmentRoom | `ArtifactCard` |
| `QualityReport` | ReviewRoom | `ArtifactCard` |
| `SecurityReport` | ReviewRoom / DevelopmentRoom | `ArtifactCard` |
| `DeploymentPlan` | DeploymentRoom | `ArtifactCard` |

### Artifact timeline (for Project History page)

```
GET /api/projects/[id]/artifacts/timeline
→ { success: true, data: TimelineEvent[] }

TimelineEvent {
  id: string,
  type: 'artifact' | 'approval' | 'phase_start' | 'phase_complete' | 'revision',
  title: string,
  description?: string,
  timestamp: string,
  agentRole?: string,
  artifactType?: string,
  version?: number
}
```

This powers the Project History screen (Screen 16).

---

## 9. Room Router — Phase-to-UI Mapping

### Current room component responsibilities

**DiscoveryRoom** (CEO phase)
- Shows `ThinkingPanel` with 6 animated steps (Market Research → Product Specification)
- `ApprovalDialog` when `phaseStatus === 'approval'`
- Props: `{ projectId, projectName, projectDescription }`

**ClarificationRoom / ProposalRoom / StrategyRoom / ProductRoom**
- Show `AIEmployeeGrid`, `ActivityFeed`, `ArtifactCard` list
- `ApprovalDialog` when approval needed
- All consume `usePipelineContext()`

**ArchitectureRoom**
- Same pattern + can open architecture artifact in `DocumentDrawer`

**PlanningRoom**
- Milestone/task list from `executive/milestones` endpoint (future)

**DevelopmentRoom**
- `ProjectHealthBar` (progress, health score, active agents, time elapsed)
- `PipelineTimeline` (all phases as ordered list)
- `AIEmployeeGrid`, `ActivityFeed`, `ArtifactCard`
- Approval dialog if any checkpoint fires mid-development

**ReviewRoom**
- Quality reports, review committee results

**DeploymentRoom**
- `DeploymentPanel` wired to `/api/projects/[id]/deployments`

**FinalRoom**
- Full artifact summary (deliverables list)
- `AIEmployeeGrid` (all completed)
- `ActivityFeed`
- Links to Studio mode

### Missing room: DesignRoom

The `DESIGN_RUNNING` lifecycle state maps to phase `'design'` in the pipeline status, but `RoomRouter` has no `'design'` case — it falls through to the `default` (DiscoveryRoom).

**Fix required in `room-router.tsx`:**
```typescript
case 'design':
  return <DesignRoom projectId={projectId} />;
```

And create `src/features/workspace/components/rooms/design-room.tsx` following the same pattern as `ArchitectureRoom` but for design artifacts.

---

## 10. Data Contracts — Request/Response Shapes

### `GET /api/projects/[id]/pipeline/status` — full response

```typescript
{
  success: true,
  data: {
    // Phase state
    currentPhase: string,           // 'discovery' | 'architecture' | ...
    phaseStatus: 'running' | 'completed' | 'approval' | 'waiting' | 'failed',
    progress: number,               // 0–100
    canStart: boolean,              // true only when lifecycle === 'CREATED'
    strictMode: boolean,

    // Pipeline phases (left panel roster)
    phases: Array<{
      id: string,
      name: string,
      status: 'completed' | 'active' | 'pending' | 'failed',
      agentRole: string,
      progress?: number
    }>,

    // AI employees (left panel cards)
    employees: Array<{
      id: string,
      name: string,
      role: string,
      avatar: string,
      status: 'active' | 'idle' | 'completed' | 'waiting',
      currentTask?: string,
      confidence?: number
    }>,

    // Right panel activity feed
    activities: Array<{
      id: string,
      agentName: string,
      agentAvatar: string,
      action: string,
      timestamp: string,
      type: 'created' | 'reviewed' | 'fixed' | 'deployed' | 'approved' | 'started' | 'completed'
    }>,

    // Right panel deliverables tab
    artifacts: Array<{
      id: string,
      name: string,
      type: string,
      createdBy: string,
      createdAt: string,
      status: 'draft' | 'review' | 'approved' | 'rejected',
      score?: number,
      content?: unknown,
      summary?: string,
      producedBy?: string
    }>,

    // Approval center
    approvalRequests: Array<{
      id: string,
      title: string,
      description: string,
      requestedBy: string,
      artifactName?: string,
      urgency: 'normal' | 'high' | 'critical'
    }>,
    pendingDocument: {
      title: string,
      type: string,
      summary?: string,
      producedBy?: string,
      content: unknown        // DocumentBody — parsed by documentToSections()
    } | null,

    // Live generation
    liveGeneration: LiveGenerationState | null,
    revisionDiff: RevisionDiffData | null,

    // Token usage
    usage: { tokensUsed: number, tokensLimit: number } | null,
    credits: { remaining: number, limit: number } | null,

    // Deliverable checklist
    deliverableChecklist: DeliverableCheckItem[] | null,
    deliveryPlan: unknown | null,

    // Health
    healthScore: number,           // 0–100
    timeElapsed: string            // '5m', '1h 23m'
  }
}
```

### `POST /api/projects/[id]/lifecycle/start`

```typescript
// Request
{ userIdea: string }

// Response
{ success: true } | { success: false, error: { message: string, code: string } }
```

### `POST /api/projects/[id]/pipeline/approve`

```typescript
// Request
{
  approvalType: string,          // 'Product Approval' | 'Architecture Approval' | 'Design Approval' | artifact name
  action: 'approve' | 'request_changes',
  comments?: string              // required when action === 'request_changes', min 3 chars
}

// Response
{ success: true } | { success: false, error: { message: string } }
```

### `POST /api/projects`

```typescript
// Request
{ name: string, description?: string }

// Response
{ success: true, data: { id: string, name: string, status: string, createdAt: string } }
```

---

## 11. Gap Analysis — What's Missing

### 🔴 Critical (blocks user journey)

| Gap | Location | Fix |
|-----|----------|-----|
| Login doesn't route new users to `/welcome` | `login-form.tsx` | After signIn success, check `GET /api/projects?limit=1`, route accordingly |
| Complete page allows access for non-completed projects | `complete/page.tsx` | Add `if (project.status !== 'COMPLETED') redirect(...)` |
| No `DesignRoom` component | `room-router.tsx` | Create `design-room.tsx`, add `case 'design':` to router |
| Proposal API response not standardized | `proposal/route.ts` | Wrap in `{ success, data: { proposal, score } }` |

### 🟡 Important (degrades experience)

| Gap | Location | Fix |
|-----|----------|-----|
| Architecture approval uses wrong endpoint | `company-workspace.tsx` | Route architecture approvals to `/architecture/approve` |
| ProjectCard shows static status | `project-card.tsx` | Optionally fetch `{ progress, phaseStatus }` from pipeline status |
| `activities` field shape not verified | `project-overview-client.tsx` | Confirm `activities[]` includes `agentRole` field from status API |
| NewProjectWizard `data.proposal` vs `proposal` | `new-project-wizard.tsx` | Fix after API standardization |
| Dashboard hero shows hardcoded pipeline step | `active-project-hero.tsx` | Fetch real pipeline status per active project |

### 🟢 Future enhancements (not blocking)

| Gap | Location | Fix |
|-----|----------|-----|
| Project History screen (Screen 16) | New route needed | `GET /api/projects/[id]/artifacts/timeline` → timeline UI |
| DeploymentPanel on complete page needs real deployment data | `complete/page.tsx` | Already wired — verify `deployments` API returns data |
| Token meter shows "—" when no usage data | `token-meter.tsx` | Gracefully handle null usage |
| No mobile sidebar drawer | `sidebar.tsx` | Add mobile hamburger + sheet drawer |

---

## 12. Implementation Phases

### Phase A — Critical fixes (1–2 days)

**A1. Fix login routing**

File: `src/components/auth/login-form.tsx`

After successful `signIn`, before `router.push`:
```typescript
const checkRes = await fetch('/api/projects?limit=1', { credentials: 'same-origin' });
const checkData = await checkRes.json().catch(() => ({ data: [] }));
const hasProjects = Array.isArray(checkData?.data) 
  ? checkData.data.length > 0 
  : (checkData?.data?.projects?.length ?? 0) > 0;
router.push(hasProjects ? ROUTES.projects : ROUTES.welcome);
```

**A2. Guard complete page**

File: `src/app/dashboard/projects/[id]/complete/page.tsx`

After `getProject()`:
```typescript
if (!project || project.status !== 'COMPLETED') {
  redirect(`${ROUTES.projects}/${id}/workspace`);
}
```

**A3. Create DesignRoom**

File: `src/features/workspace/components/rooms/design-room.tsx`

Model after `architecture-room.tsx`. Use `usePipelineContext()`, show design artifacts, ApprovalDialog when `phaseStatus === 'approval'` with `approvalType: 'Design Approval'`.

Update `room-router.tsx`:
```typescript
import { DesignRoom } from './design-room';
// ...
case 'design':
  return <DesignRoom projectId={projectId} />;
```

**A4. Standardize proposal API response**

File: `src/app/api/projects/[id]/proposal/route.ts`

Change response to:
```typescript
return NextResponse.json({
  success: true,
  data: { proposal: result.proposal, score: result.score }
});
```

Update `new-project-wizard.tsx`:
```typescript
const proposalData = await proposalRes.json();
if (proposalRes.ok && proposalData.success && proposalData.data?.proposal) {
  setProposal(proposalData.data.proposal as ProposalData);
}
```

---

### Phase B — Architecture approval routing (1 day)

**B1. Route architecture approvals correctly**

File: `src/features/workspace/components/company-workspace.tsx`

In `handleApprove`:
```typescript
const handleApprove = async (artifact: string) => {
  setApproving(true);
  setStartError(null);
  try {
    const isArchApproval = artifact.toLowerCase().includes('architecture');
    if (isArchApproval) {
      const res = await fetch(`/api/projects/${projectId}/architecture/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true, reviewedBy: userName }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message || 'Architecture approval failed');
      }
    } else {
      await approve(artifact);
    }
    toast.success('Approved', { description: 'Pipeline continuing to the next phase.' });
    setTimeout(refresh, 1200);
    setTimeout(refresh, 3500);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not approve';
    setStartError(message);
    toast.error('Approval failed', { description: message });
  } finally {
    setApproving(false);
  }
};
```

---

### Phase C — Dashboard active project hero (1 day)

**C1. Wire ActiveProjectHero to real pipeline data**

File: `src/features/dashboard/components/active-project-hero.tsx`

Change from server-rendered static pipeline to client-side fetch:

```typescript
'use client';
// Add useEffect to fetch /api/projects/[projectId]/pipeline/status
// Map response.currentPhase to PIPELINE_STEPS indices
// Show real progress bar value
```

Since this is inside a server-rendered dashboard page, the cleanest approach is to add a thin `ActiveProjectHeroClient` wrapper that hydrates the pipeline status client-side, while keeping the static hero rendering for SSR.

---

### Phase D — Project History screen (2 days)

**D1. Add /dashboard/projects/[id]/history route**

File: `src/app/dashboard/projects/[id]/history/page.tsx`

```typescript
// Server component
const timeline = await fetch(`/api/projects/${id}/artifacts/timeline`);
// Render timeline events as ordered list
```

**D2. Link from project overview and complete page**

Add "View History" link in `ProjectOverviewClient` and `ProjectCompletePage`.

---

### Phase E — Mobile sidebar (1 day)

**E1. Add mobile drawer to Sidebar**

File: `src/components/layout/sidebar.tsx`

Use `Sheet` from shadcn/ui. Add hamburger button in dashboard layout header (mobile only). Sidebar slides in as a bottom-anchored or left-anchored sheet on screens < `md`.

---

## 13. Error Handling & Loading States

### Pattern used throughout the codebase

Every screen must handle exactly three states:

```typescript
// 1. Loading
if (loading) return <SkeletonComponent />;

// 2. Error / offline
if (connectionStatus === 'offline') return <ErrorState onRetry={refresh} />;

// 3. Content
return <Content />;
```

### Existing skeleton components

- `MissionControlSkeleton` — workspace loading state
- `ErrorState` — generic error with retry button
- `PageSkeletons` — various page-level skeletons

### Error boundary placement

```
/dashboard/layout.tsx
  └── ErrorBoundary (dashboard/error.tsx)

/dashboard/projects/[id]/workspace/
  └── ErrorBoundary (workspace/error.tsx)

/dashboard/projects/[id]/
  └── NotFound handler (not-found.tsx)
```

### API error shape (standard)

All API routes return:
```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: { message: string, code?: string } }
```

Components should always check `res.ok && data.success` before using `data.data`.

---

## 14. Auth Integration

### Session flow

```
NextAuth JWT strategy (src/lib/auth.ts)
  → Session contains: { user: { id, email, name, image, platformRole } }

Server components:
  getAuthSession() from '@/lib/session-helper'
  → returns session or null

Client components:
  useSession() from 'next-auth/react'
  → { data: session, status: 'authenticated' | 'loading' | 'unauthenticated' }

API routes:
  auth() from '@/lib/auth'
  → returns session or null — all protected routes check session.user.id
```

### Route protection layers

```
1. Edge proxy (src/proxy.ts)
   Protected prefixes: ['/dashboard', '/welcome', '/projects']
   → Redirects unauthenticated to /login?callbackUrl=...

2. Server components
   getAuthSession() + redirect('/login') if no session

3. API routes
   auth() + return 401 if no session
```

### Admin routes

```
SUPER_ADMIN check: isPlatformSuperAdmin({ email, platformRole })
  → env SUPER_ADMIN_EMAILS or platformRole === 'SUPER_ADMIN'

Protected: /dashboard/admin/* (ADMIN_NAV_ITEMS only shown to admins)
```

---

## Summary Checklist

| Item | Status |
|------|--------|
| Landing page wired (static) | ✅ |
| Sign up → auto-login → /welcome | ✅ |
| Login routing (new vs returning user) | 🔴 Fix needed |
| Welcome page (server, redirect guard) | ✅ |
| Projects list (real data) | ✅ |
| Project overview (polls pipeline status) | ✅ |
| NewProjectWizard (4-step, real APIs) | ✅ |
| Workspace / Mission Control (SSE + polling) | ✅ |
| Approval gates (product, design) | ✅ |
| Architecture approval (separate endpoint) | 🟡 Fix needed |
| DesignRoom component | 🔴 Missing |
| Complete page (server, deploy panel) | ✅ w/ fix needed |
| Settings (real AiCredentialsForm) | ✅ |
| Proposal API response standardization | 🔴 Fix needed |
| Project History screen | 🟢 Future |
| Mobile sidebar | 🟢 Future |
| Dashboard hero real pipeline data | 🟡 Enhancement |

**Critical path: A1 → A2 → A3 → A4 → B1**  
All other items are enhancements that do not block the primary user journey.
