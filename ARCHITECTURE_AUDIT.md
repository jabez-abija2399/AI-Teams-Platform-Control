# Architecture Audit: AI Teams Platform

**Author:** Principal AI Systems Architect & Senior Staff Software Engineer  
**Date:** 2026-08-26  
**Status:** COMPLETE  
**Codebase:** `AI-Teams-Platform-Control/ai-teams-platform`

---

## 1. Executive Summary

AI Teams is designed as an autonomous AI Software Engineering Company capable of taking a user's high-level software idea and producing validated, runnable, previewable software through a coordinated team of specialized AI agents (Product Manager, Architect, Designer, Developer, QA).

This audit provides a comprehensive map of the existing implementation, identifies architectural fragmentation (specifically multiple competing orchestrators, in-memory state leakage, simulated tool execution, and stack coupling), and establishes the canonical target architecture and incremental migration strategy.

---

## 2. Current Execution Entry Points & Orchestrators

### 2.1 Existing Entry Points
| Route / Trigger | Handler / Service | Primary Orchestrator Invoked |
| :--- | :--- | :--- |
| **Workspace Pipeline UI** (`/api/projects/[id]/lifecycle/start`) | `ProjectLifecycleService.startLifecycle` | `CompanyPipelineEngine.runPipeline` (`src/core/company-orchestration/`) |
| **Lifecycle Resume** (`/api/projects/[id]/lifecycle/resume`) | `ProjectLifecycleService.resumeLifecycle` | `CompanyPipelineEngine.runPipeline` |
| **Autonomous Route** (`/api/projects/[id]/autonomous/start`) | `AutonomousExecutionEngine.start` | `OrchestratorEngine.executePipeline` (`src/core/orchestrator/`) |
| **Company Route** (`/api/projects/[id]/company/start`) | `CompanyOrchestrator.start` | `CompanyOrchestrator.execute` (`src/core/company/`) |
| **Execution Route** (`/api/projects/[id]/execution/start`) | `PipelineOrchestrator.start` | `PipelineOrchestrator.execute` (`src/core/execution-engine/`) |
| **Master Orchestrator** | `MasterOrchestrator.run` | `MasterOrchestrator` (`src/core/master-orchestrator/`) |

### 2.2 Duplication & Split-Brain Analysis
There are **5 distinct orchestrators** currently implemented:
1. `src/core/company-orchestration/company-pipeline.engine.ts` (1,061 lines) — **Currently driving Mission Control UI & SSE streams**. Has durable lifecycle state (`ProjectWorkflowState`, `ApprovalHistory`, `ArtifactLifecycleRecord`).
2. `src/core/execution-engine/pipeline.orchestrator.ts` (720 lines) — Secondary pipeline with task engine and budget manager.
3. `src/core/company/company-orchestrator.ts` (590 lines) — Event-bus driven company orchestrator.
4. `src/core/master-orchestrator/master-orchestrator.ts` (450 lines) — Standalone master orchestrator.
5. `src/core/orchestrator/orchestrator.engine.ts` (680 lines) — Phase-by-phase execution engine.

**Audit Finding:** The system has split-brain risk if routes trigger different orchestrators. `CompanyPipelineEngine` is the most feature-complete and UI-integrated engine; it should form the foundation of the **Canonical Core Orchestrator**, and the other 4 engines must be adapted into compatibility facades delegating to it.

---

## 3. Current State Models & Durable Execution

### 3.1 Existing Prisma Schema Models
- **`Project`**: Core project entity (`id`, `name`, `slug`, `status`, `ownerId`, `selectedStackId`, `selectedStackVersion`, `projectType`, `runtimeContract`, `capabilities`).
- **`Mission`**: Unit of work inside a project (`id`, `projectId`, `title`, `status`, `currentPhase`, `checkpoint`, `attempt`, `budgetUsd`).
- **`ProjectWorkflowState`**: Persisted lifecycle phase (`currentPhase`, `completedPhases`, `activeAgent`, `waitingApprovals`, `progress`).
- **`ApprovalHistory`**: Human approval gates (`approvalType`, `status`, `phase`, `comments`, `reviewedBy`).
- **`ArtifactLifecycleRecord`**: Persisted artifact tracking (`artifactType`, `artifactId`, `producerRole`, `consumerRoles`, `version`).
- **`ValidationRun`**: Deterministic test and build execution evidence (`command`, `exitCode`, `stdout`, `stderr`, `passed`, `evidence`, `rootCause`).
- **`File` & `Folder`**: Virtual workspace filesystem persisted in PostgreSQL.
- **`UserAiCredential`**: Encrypted API keys (`provider`, `keyHint`, `encryptedKey`, AES-256-GCM).

### 3.2 In-Memory Leakage to Eliminate
- In `developer.service.ts`: `const builds = new Map<string, BuildState>()` used for active build progress.
- In `company-pipeline.engine.ts`: `private static readonly runningProjects = new Map<string, number>()` used for execution locks.
- **Target Resolution:** Migrate locks and active build status to durable database rows (`ProjectWorkflowState.metadata` / `Mission.status` / `MissionRun`) with heartbeat timestamps to guarantee resilience across server restarts.

---

## 4. Current Agents & Strict Contracts

### 4.1 Five Conceptual Agents
1. **Product Manager (PM)** (`product-discovery.agent.ts`, `product-manager.service.ts`):
   - *Current State:* Generates `ProductSpecification`, `ClarifiedSpecification`, `ProductProposal`, `PRD`.
   - *Target Contract:* Focuses strictly on problem discovery, user stories, acceptance criteria, non-goals, and project intent classification. Must never write code.
2. **Architect** (`architect.service.ts`):
   - *Current State:* Produces `ArchitectureSpecification`, `fileStructure`, `implementationTodos`. Contained legacy HTML/CSS login heuristic shortcuts.
   - *Target Contract:* Recommends verified stack profile from central Stack Registry, locks Runtime Contract, defines service boundaries, data schema, and task graph.
3. **Designer** (`ui-designer.service.ts`):
   - *Current State:* Produces `UiDesignSpecification` (tokens, components, responsive layouts).
   - *Target Contract:* Dual-mode: UI/UX design (frontend/full-stack) or DX/API contract design (backend/API). Explicitly consumed by implementation planning.
4. **Developer** (`developer.service.ts`):
   - *Current State:* Executes task todos, writes code to `File` table, syncs to explorer.
   - *Target Contract:* Task-bounded file edits against real workspace files; no synthetic fallbacks on provider failure. Checkpoints after each subtask.
5. **QA Engineer** (`qa.service.ts`):
   - *Current State:* Produces test reports, quality scores.
   - *Target Contract:* Consumes deterministic validation evidence (typecheck, lint, test, build exit codes) + requirement coverage. Performs root cause attribution.

---

## 5. Tool Execution & Sandbox Isolation

### 5.1 Current Tool Execution Audit
- In `src/core/tools/tool-executor.ts`:
  - `TEST_RUNNER` and `TERMINAL_EXECUTE` previously contained hardcoded mock returns (`{ passed: 12, failed: 0 }`, `{ exitCode: 0 }`).
- In `src/core/deterministic-validation/deterministic-validator.ts`:
  - Deterministic validator executes real workspace checks when configured with stack commands.

### 5.2 Target Sandbox Architecture
- Isolated workspace sandbox runner (`src/core/sandbox/`).
- Real process execution with strict timeouts (e.g. 60s), CPU/memory bounds, and structured output capture:
  ```json
  {
    "command": "npm run test",
    "exitCode": 0,
    "stdout": "...",
    "stderr": "...",
    "durationMs": 1420,
    "timedOut": false
  }
  ```

---

## 6. Stack System & Runtime Contract

### 6.1 Three Distinct Concepts
1. **Project Intent**: `FRONTEND_ONLY | BACKEND_ONLY | FULL_STACK | MOBILE | API | LIBRARY | CLI`
2. **Stack Profile (Registry)**: Verified template in `src/core/stack-registry/` (e.g., `nextjs-fullstack-v1`, `nextjs-frontend-v1`, `react-vite-frontend-v1`).
3. **Project Runtime Contract**: Immutable, persisted JSON per project/version specifying exact commands (`install`, `dev`, `build`, `typecheck`, `test`), ports, health checks, entry points, and environment requirements.

---

## 7. Migration Roadmap (12 Phases)

```
[Phase 1] Architecture Audit & Canonical Entry Point Mapping (COMPLETED)
   │
   ▼
[Phase 2] Canonical Durable Project / Mission / Execution State Model
   │
   ▼
[Phase 3] Unified Artifact Lineage & Stale Invalidation Engine
   │
   ▼
[Phase 4] Stack Registry & Immutable Runtime Contract Enforcement
   │
   ▼
[Phase 5] Unify Single Canonical Core Orchestrator (Deprecate Competing Engines)
   │
   ▼
[Phase 6] End-to-End Migration of Discovery → Delivery on Canonical Orchestrator
   │
   ▼
[Phase 7] Modernize 5 Agent Contracts & Strict Input/Output Schema Enforcement
   │
   ▼
[Phase 8] Sandbox Execution Layer & Elimination of Mocked Tool Results
   │
   ▼
[Phase 9] Deterministic Validation Engine (Contract-Driven Build/Lint/Test)
   │
   ▼
[Phase 10] Root Cause Diagnoser & Upstream Invalidation Routing
   │
   ▼
[Phase 11] Contract-Driven Multi-Service Preview Manager
   │
   ▼
[Phase 12] Observability Tracing & Regression Benchmark Suite
```

---

## 8. Immediate Phase 1 Recommendation

**Phase 1 Execution Step:**
1. Establish `CanonicalCoreOrchestrator` facade unifying `CompanyPipelineEngine` as the single execution authority.
2. Route legacy endpoints (`/api/projects/[id]/autonomous/*`, `/api/projects/[id]/execution/*`, `/api/projects/[id]/company/*`) to the canonical orchestrator.
3. Eliminate in-memory locks by persisting lease timestamps to PostgreSQL.
4. Replace mocked tool execution in `src/core/tools/tool-executor.ts` with real contract-bound validation runners.
