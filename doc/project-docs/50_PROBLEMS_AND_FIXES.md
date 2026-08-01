# Problems & Fixes — Full Codebase Audit

**Date:** 2026-07-27 | **Status:** Ready for Implementation | **Priority:** Critical → High → Medium → Low

---

## Table of Contents

- [Critical: UI Disconnected from Pipeline](#critical-ui-disconnected-from-pipeline)
- [Critical: Pipeline Routing Bug](#critical-pipeline-routing-bug)
- [Critical: Approval Resume Bug](#critical-approval-resume-bug)
- [High: Three State Machines](#high-three-state-machines)
- [High: Two Event Buses](#high-two-event-buses)
- [High: Two ClarificationEngine Implementations](#high-two-clarificationengine-implementations)
- [Medium: Nine Orphaned Engines](#medium-nine-orphaned-engines)
- [Medium: Dead Code & Unused Transitions](#medium-dead-code--unused-transitions)
- [Low: Code Quality Issues](#low-code-quality-issues)
- [Implementation Order](#implementation-order)

---

## Critical: UI Disconnected from Pipeline

### Problem

The workspace UI does NOT use the `CompanyPipelineEngine` that was built in Integration Sprint 1. Instead, it uses a **step-by-step wizard** where each agent tab independently calls its own API endpoint:

```
User clicks "Analyze" in CEO Chat
  -> POST /api/ai/ceo            <- runs CEO ALONE (ceo.service.ts)
  | auto-advance
  -> Architecture Chat loads
  -> POST /api/ai/architect      <- runs Architect ALONE
  | auto-advance
  -> Developer Chat loads
  -> POST /api/ai/developer       <- runs Developer ALONE
  | auto-advance
  -> QA Chat (manual)
  -> Deploy Panel (manual)
```

**No pipeline orchestrator runs at any point.** The `CompanyPipelineEngine.runPipeline()` — which runs Discovery -> Clarification -> Proposal -> Strategy -> PM -> Analysis -> Design -> Architecture -> Planning -> Development -> Testing -> Review -> Security -> Deployment -> Monitoring — is never triggered from the UI.

### Root Cause

**File:** `src/features/workspace/components/agent-panel.tsx` (lines 46-53, 109-148)

The `AgentPanel` defines 6 tabs and renders them individually. Each agent tab (`CEOChat`, `ArchitectureChat`, `DeveloperChat`, `QAChat`, `DeploymentPanel`) makes independent API calls. The auto-advance logic at lines 86-94 simply switches tabs — it doesn't trigger any pipeline.

**File:** `src/features/ceo-ai/components/ceo-chat.tsx` (line 92)

The "Analyze" button calls `POST /api/ai/ceo` which runs `analyzeUserIdea()` from `ceo.service.ts` — a standalone CEO analysis, not the pipeline.

**File:** `src/app/api/projects/[id]/lifecycle/start/route.ts` (lines 1-24)

The lifecycle start endpoint exists and correctly calls `ProjectLifecycleService.startLifecycle()` -> `CompanyPipelineEngine.runPipeline()`, but **no UI component calls this endpoint**.

### Fix 1.1 — Wire "Analyze" to trigger the full pipeline

**File:** `src/features/ceo-ai/components/ceo-chat.tsx` — after `handleAnalyze` succeeds (line 101-105), add a call to start the pipeline:

```typescript
// After CEO analysis succeeds (after line 105)
fetch(`/api/projects/${projectId}/lifecycle/start`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userIdea: text }),
});
```

This triggers `ProjectLifecycleService.startLifecycle()` which:
1. Stores `ProjectIdea` artifact
2. Transitions to `DISCOVERY_RUNNING`
3. Calls `CompanyPipelineEngine.runPipeline()` asynchronously
4. The pipeline runs all phases automatically

### Fix 1.2 — Replace agent tabs with artifact viewers

**File:** `src/features/workspace/components/agent-panel.tsx` — instead of rendering independent agent chats, each tab should display the artifact produced by the corresponding pipeline phase:

| Tab | Reads Artifact From Pipeline Phase |
|-----|-----------------------------------|
| Mission Control | SSE stream (`/api/projects/[id]/execution/stream`) — already built |
| CEO Agent | `ProductSpecification` artifact (from DISCOVERY_RUNNING) |
| Architect | `ArchitectureDesign` artifact (from ARCHITECTURE_RUNNING) |
| Developer | `Implementation` artifact (from DEVELOPMENT_RUNNING) |
| QA Tester | `QualityReport` artifact (from TESTING_RUNNING) |
| Deploy Engine | `DeploymentPlan` artifact (from DEPLOYMENT_RUNNING) |

Each tab reads from `ArtifactManager.getLatestArtifact(projectId, type)` instead of calling its own API.

### Fix 1.3 — Keep Mission Control as the pipeline dashboard

**File:** `src/features/observability/components/mission-control-dashboard.tsx` — already wired to receive SSE events from the pipeline via `EventSource` at `/api/projects/[id]/execution/stream`. No changes needed here — it will show live pipeline progress once the pipeline actually runs.

---

## Critical: Pipeline Routing Bug

### Problem

There is no API route that calls `CompanyPipelineEngine.runPipeline()` directly. The only path is through `POST /api/projects/[id]/lifecycle/start` -> `ProjectLifecycleService.startLifecycle()`. There is no dedicated "Run Pipeline" endpoint that simply triggers the pipeline on an existing project.

### Root Cause

**File:** `src/app/api/projects/[id]/lifecycle/start/route.ts`

The `startLifecycle` method (line 27-83) does three things at once:
1. Stores `ProjectIdea` artifact
2. Transitions to `DISCOVERY_RUNNING`
3. Triggers `CompanyPipelineEngine.runPipeline()`

If the project already has an artifact and state (like Enat Hotels after CEO analysis), calling `startLifecycle` again would create a duplicate `ProjectIdea` artifact and attempt to transition from an already-running state, which would fail.

### Fix 2 — Add a dedicated "Run Pipeline" endpoint

**Create:** `src/app/api/projects/[id]/pipeline/run/route.ts`

```typescript
import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { CompanyPipelineEngine } from '@/core/company-orchestration';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  const result = await CompanyPipelineEngine.runPipeline(id);
  return toResponse(result);
}
```

---

## Critical: Approval Resume Bug

### Problem

After any of the 4 approval gates (Product, Design, Architecture, Deployment), the pipeline re-executes the phase that just completed instead of advancing to the next phase.

### Root Cause

**File:** `src/core/company-orchestration/project-lifecycle.service.ts` lines 121-131

```typescript
// Determine which phase was completed right before pause
let nextPhase: ProjectLifecycleState = 'DISCOVERY_RUNNING';
const completed = state.completedPhases;
if (completed && completed.length > 0) {
  const lastCompleted = completed[completed.length - 1]; // THIS IS WRONG
  const def = PIPELINE_PHASE_DEFINITIONS[lastCompleted];
  if (def && def.nextState) {
    nextPhase = def.nextState;
  }
}
```

`completedPhases` does NOT include the approval-gated phase itself (it's not completed yet — it's paused). So `lastCompleted` is the phase *before* the approval gate, and `def.nextState` points back to the approval-gated phase.

Example: After `PROPOSAL_RUNNING` pauses for Product Approval:
- `completedPhases = ['DISCOVERY_RUNNING', 'CLARIFICATION_RUNNING']`
- `lastCompleted = 'CLARIFICATION_RUNNING'`
- `def.nextState` for `CLARIFICATION_RUNNING` = `'PROPOSAL_RUNNING'`
- So resume re-enters `PROPOSAL_RUNNING` instead of advancing to `STRATEGY_RUNNING`

### Fix 3.1 — Track the phase that triggered the pause

**File:** `src/core/company-orchestration/types.ts`

Add a `pausedAtPhase` field to the workflow state:

```typescript
export interface ProjectWorkflowState {
  currentPhase: ProjectLifecycleState;
  completedPhases: ProjectLifecycleState[];
  pausedAtPhase?: ProjectLifecycleState; // NEW
  // ... existing fields
}
```

**File:** `src/core/company-orchestration/company-pipeline.engine.ts` — when pausing for approval (line 156-163), record which phase triggered it:

```typescript
if (compRes.data.action === 'PAUSE_FOR_APPROVAL') {
  // Record which phase triggered the approval
  await WorkflowManager.setPausedAtPhase(projectId, currentPhase);

  const approvalType = def.approvalRequiredAfter || 'Unknown Approval';
  WorkspaceService.markApprovalRequired(projectId, approvalType, currentPhase);
  await this.emitVisibilityEvent(projectId, 'STEP_START', currentPhase, `Waiting for approval: ${approvalType}`);
  isRunning = false;
  break;
}
```

### Fix 3.2 — Use `pausedAtPhase` to determine resume target

**File:** `src/core/company-orchestration/project-lifecycle.service.ts` lines 121-131 — replace with:

```typescript
let nextPhase: ProjectLifecycleState = 'DISCOVERY_RUNNING';
const pausedAt = state.pausedAtPhase;
if (pausedAt) {
  const def = PIPELINE_PHASE_DEFINITIONS[pausedAt];
  if (def && def.nextState) {
    nextPhase = def.nextState;
  }
}
```

**Expected resume targets:**

| Approval Gate | pausedAtPhase | nextState | Correct Target |
|--------------|---------------|-----------|----------------|
| Product Approval | `PROPOSAL_RUNNING` | `STRATEGY_RUNNING` | OK |
| Design Approval | `DESIGN_RUNNING` | `ARCHITECTURE_RUNNING` | OK |
| Architecture Approval | `ARCHITECTURE_RUNNING` | `PLANNING_RUNNING` | OK |
| Deployment Approval | `SECURITY_RUNNING` | `DEPLOYMENT_RUNNING` | OK |

### Fix 3.3 — Add PAUSED transitions

**File:** `src/core/company-orchestration/types.ts` line 229 — ensure all valid PAUSED transitions are present:

```typescript
PAUSED: ['DISCOVERY_RUNNING', 'STRATEGY_RUNNING', 'PRODUCT_RUNNING', 'ANALYSIS_RUNNING',
         'DESIGN_RUNNING', 'ARCHITECTURE_RUNNING', 'PLANNING_RUNNING', 'DEVELOPMENT_RUNNING',
         'TESTING_RUNNING', 'SECURITY_RUNNING', 'DEPLOYMENT_RUNNING', 'MONITORING', 'FAILED'],
```

---

## High: Three State Machines

### Problem

Three independent state machine implementations with different state sets, persistence strategies, and consumers:

| System | File | States | Persistence | Consumers |
|--------|------|--------|-------------|-----------|
| `WorkflowManager` | `core/company-orchestration/workflow-manager.ts` | 19 | PostgreSQL | `CompanyPipelineEngine`, `ProjectLifecycleService` |
| `CompanyStateMachine` | `core/company/company-state-machine.ts` | 12 | In-memory Map | `ContinuousCompanyOrchestrator` |
| `LifecycleManager` | `core/integration/lifecycle-manager.ts` | 10 | In-memory | `CompanyOrchestrator`, `PipelineManager` |

A project can be in different states across all three simultaneously. In-memory systems lose state on server restart.

### Fix 4 — Unify into a single `StateManager`

**Create:** `src/core/state/state-manager.ts`

Merge all three into one class:
- Use the **19-state model** from `WorkflowManager` (most comprehensive, already DB-backed)
- Expose: `getState()`, `canTransition()`, `transition()`, `getCompletedPhases()`, `getPausedAtPhase()`
- Keep DB persistence via `ProjectWorkflowState` Prisma model
- Wrap `PIPELINE_PHASE_DEFINITIONS` for pipeline routing

**Delete:**
- `src/core/company/company-state-machine.ts`
- `src/core/integration/lifecycle-manager.ts`
- Update all consumers to import from `src/core/state/`

---

## High: Two Event Buses

### Problem

Two independent event bus implementations with zero cross-communication:

| Event Bus | File | Used By |
|-----------|------|---------|
| Integration `CompanyEventBus` | `core/integration/event-bus.ts` | `approval-manager`, `handoff-manager`, `company-pipeline.engine`, `project-lifecycle.service`, `company-orchestrator`, `lifecycle-manager`, `pipeline-manager`, `integration-validator` |
| Company `CompanyEventBus` | `core/company/company-event-bus.ts` | `company-orchestrator`, `company-state-machine`, `company-supervisor`, `company-heartbeat` |

Events published on one bus are invisible to subscribers on the other.

### Fix 5 — Merge into a single EventBus

**Create:** `src/core/events/event-bus.ts`

Merge the 14 event types from integration and 20 from company into a single enum. Keep both subscription lists. Support `publish()`, `subscribe()`, `getHistory()`, `getLatestEvent()`.

**Delete:**
- `src/core/integration/event-bus.ts`
- `src/core/company/company-event-bus.ts`
- Update all consumers to import from `src/core/events/`

---

## High: Two ClarificationEngine Implementations

### Problem

Two completely independent classes with the same name:

| Implementation | File | Lines | Method Signature | Used By |
|----------------|------|-------|------------------|---------|
| Discovery | `core/discovery/clarification.engine.ts` | 81 | `generateQuestions(spec)` | `CompanyPipelineEngine` |
| Specification | `core/specification/clarification-engine.ts` | 16 | `generateClarificationQuestions(missingContext[])` | `SpecificationEngine` |

Same name, different implementations, no shared code.

### Fix 6 — Unify ClarificationEngine

**File:** `src/core/discovery/clarification.engine.ts`

Add overloaded `generateQuestions` that accepts both signatures:

```typescript
class ClarificationEngine {
  static generateQuestions(spec: ProductSpecification): ClarificationQuestion[];
  static generateQuestions(missingContext: string[]): ClarificationQuestion[];
  static applyAnswers(spec: ProductSpecification, answers: Record<string, string | string[]>): ProductSpecification;
}
```

**Delete:** `src/core/specification/clarification-engine.ts`
**Update:** `src/core/specification/specification-engine.ts` to import from `core/discovery/`

---

## Medium: Nine Orphaned Engines

### Problem

9 engines are fully implemented and tested but never imported from production code (~777 lines dead code):

| Engine | File | Lines | Wire Into |
|--------|------|-------|-----------|
| `AutonomousRefactoringEngine` | `core/refactoring/refactoring-engine.ts` | 48 | `REVIEW_RUNNING` — auto-refactor files flagged by QA |
| `RetryEngine` | `core/autonomous/retry-engine.ts` | 49 | Replace `handleFailure()` with intelligent retry + backoff |
| `SelfReflectiveEngine` | `core/execution-engine/self-reflective.engine.ts` | 111 | `TESTING_RUNNING` — agent self-reviews before QA |
| `SpecificationEngine` | `core/specification/specification-engine.ts` | 75 | After `CLARIFICATION_RUNNING` — generate full SRS |
| `ConversationEngine` | `core/workforce/communication/conversation.engine.ts` | 110 | `CLARIFICATION_RUNNING` — agents discuss before questions |
| `ConflictResolutionEngine` | `core/workforce/communication/conflict-resolution.engine.ts` | 65 | `REVIEW_RUNNING` — resolve conflicting review outputs |
| `DelegationEngine` | `core/workforce/communication/delegation.engine.ts` | 90 | `PLANNING_RUNNING` — lead delegates to specialists |
| `PipelineManager` | `core/integration/pipeline-manager.ts` | 137 | Pipeline orchestration fallback or merge |
| `IntegrationValidator` | `core/integration/integration-validator.ts` | 92 | After each phase — validate artifact integrity |

### Fix 7 — Wire engines into pipeline phases

**File:** `src/core/company-orchestration/company-pipeline.engine.ts`

Add each orphaned engine to the corresponding phase's `executeDepartmentTask()` case:

```typescript
case 'REVIEW_RUNNING': {
  const report = ReviewCommittee.evaluateCodebase(projectId, fileMap);
  const refactored = await AutonomousRefactoringEngine.refactor(fileMap, report);
  const conflicts = ConflictResolutionEngine.resolve(report.conflicts);
  return { success: true, data: { ...report, refactored, conflicts } };
}

case 'TESTING_RUNNING': {
  const selfReview = await SelfReflectiveEngine.review(inputData);
  const qaRes = await reviewImplementation(projectId, inputData);
  return { success: true, data: { ...qaRes.data, selfReview } };
}

case 'CLARIFICATION_RUNNING': {
  const discussion = await ConversationEngine.facilitate(spec);
  const questions = ClarificationEngine.generateQuestions(spec);
  return { success: true, data: { specification: applyAnswers(spec, discussion), questions } };
}
```

---

## Medium: Dead Code & Unused Transitions

### Unused Back-step Transitions

| From | To | Action |
|------|-----|--------|
| `PROPOSAL_RUNNING` | `CLARIFICATION_RUNNING` | Wire into approval rejection — re-clarify |
| `TESTING_RUNNING` | `DEVELOPMENT_RUNNING` | Wire into QA failure — re-develop |
| `REVIEW_RUNNING` | `TESTING_RUNNING` | Wire into review failure — re-test |
| `SECURITY_RUNNING` | `DEVELOPMENT_RUNNING` | Wire into security failure — re-develop |

### Unused FAILED Transitions

All 12 transitions from `FAILED` to each phase are defined but never triggered. No code path exits `FAILED`.

**Fix:** Wire `RetryEngine` to evaluate which phase to retry from. Expose via API endpoint `POST /api/projects/[id]/pipeline/retry`.

---

## Low: Code Quality Issues

### Missing Barrel Exports

- `core/discovery/` has no `index.ts` — consumers import files directly
- `core/execution-engine/` — `SelfReflectiveEngine` not exported from `index.ts`

**Fix:** Add `index.ts` with barrel exports to all core modules.

### Massive Project Model

`prisma/schema.prisma` — `Project` model has 40+ relation fields.

**Fix:** Extract into normalized sub-models: `ProjectSettings`, `ProjectMeta`, `ProjectPipelineConfig`.

### JSON Blobs in Typed Models

`ProductRequirement`, `BusinessAnalystSpec`, etc. store everything as top-level JSON blobs.

**Fix:** Replace with typed fields where possible. Keep JSON for genuinely dynamic content.

---

## Implementation Order

### Phase 0 — Critical Bugs (1-2 days)

```
Priority: MUST FIX BEFORE ANYTHING ELSE
```

- [ ] Fix 1.1 — Wire "Analyze" to trigger CompanyPipelineEngine
- [ ] Fix 1.2 — Replace agent tabs with artifact viewers
- [ ] Fix 2 — Add dedicated "Run Pipeline" endpoint
- [ ] Fix 3.1 — Track `pausedAtPhase` in workflow state
- [ ] Fix 3.2 — Fix resume to use `pausedAtPhase` for next phase
- [ ] Fix 3.3 — Fix PAUSED transitions

### Phase 1 — Unification (3-5 days)

```
Priority: Architectural foundation
```

- [ ] Fix 4 — Unify state machines into single `StateManager`
- [ ] Fix 5 — Unify event buses into single `EventBus`
- [ ] Fix 6 — Unify ClarificationEngine implementations

### Phase 2 — Wire Orphaned Engines (3-5 days)

```
Priority: Feature completeness
```

- [ ] Fix 7 — Wire 9 orphaned engines into pipeline phases

### Phase 3 — Cleanup (2-3 days)

```
Priority: Code quality
```

- [ ] Remove dead code and unused transitions
- [ ] Add barrel exports
- [ ] Normalize Project model
- [ ] Fix JSON blob types

### Phase 4 — Testing (2-3 days)

```
Priority: Quality assurance
```

- [ ] E2E test for full pipeline from UI trigger
- [ ] Integration tests for wired orphaned engines
- [ ] State machine transition matrix test

---

*Document generated from full codebase audit. See also: `48_INTEGRATION_SPRINT_1.md`, `49_FINAL_INTEGRATION_AUDIT.md`*
