# AI Teams Platform
# Project Memory


Version:
1.0


Last Updated:
2026-07-23



# Current Project State


## Project Phase

Foundation / MVP Development


## Current Goal

Build the first version of an AI software company platform where users can create software projects and manage AI teams.


# Completed Understanding


## Core Concept Defined

The platform contains:

- Users
- Software Projects
- AI Teams
- AI Agents
- Workflows
- Generated Artifacts
- Project Memory


# Current Architecture Direction


## Application Type

Web application


## Architecture

Modular Monolith


## Frontend

Next.js App Router

TypeScript

Tailwind CSS

Component-based UI


## Backend

Next.js server architecture

API routes / server actions


## Database

PostgreSQL


ORM:

Prisma


## Authentication

Implemented:

NextAuth with Prisma adapter, JWT session strategy, credentials provider with bcrypt password hashing.


# Main Modules


## User Module

Responsible for:

- Accounts
- Authentication
- User settings


## Project Module

Responsible for:

- Creating software projects
- Managing project information
- Tracking progress


## AI Organization Module

Responsible for:

- AI teams
- Agent roles
- Agent communication


## Workflow Engine

Responsible for:

- Task states
- Execution flow
- Approvals


## Artifact System

Responsible for:

- Documents
- Plans
- Code outputs
- Reports


## Memory System

Responsible for:

- Context storage
- Decisions
- Project history



# Current MVP Features


## Required


Authentication

Project creation

AI team creation

Agent definitions

Workflow management

Artifact storage

Project dashboard



# Future Features


Autonomous AI development

Code generation

Repository integration

Deployment automation

AI testing

AI monitoring


# Important Decisions


## Decision 1

Start with modular monolith.

Reason:

Simpler development and easier iteration.


## Decision 4

Split Workspace into Creator Mode and Developer Mode.

Reason:

Non-technical users need a magical, jargon-free experience focused on the AI Chat and Live Preview. Developers need a full IDE. A single unified interface was overwhelming for non-technical users.


# Known Risks

## Complexity

The platform can become too complex.

Solution:

Build MVP first.


## AI Reliability

AI output may be inconsistent.

Solution:

Use workflows and verification.


## Context Management

AI needs memory.

Solution:

Artifact and memory systems.



# Current Priority


1. Build foundation architecture.

2. Create database models.

3. Build project management system.

4. Build AI agent framework.

5. Build workflow engine.


# Active Task

Task Name: HibirDev AI Frontend-Backend Integration & Production Readiness
Status: Completed

### What Changed
- **Authentication & Post-Login Smart Routing:**
  - `src/components/auth/login-form.tsx`: Added post-auth project count check to automatically route new users (0 projects) to `/welcome` and returning users to `/dashboard/projects`.

- **Complete Page Security Guard:**
  - `src/app/dashboard/projects/[id]/complete/page.tsx`: Added guard redirect (`project.status !== 'COMPLETED'`) to enforce that non-completed projects are redirected back to their active Mission Control Workspace.

- **Design Workspace Room & Router Integration:**
  - `src/features/workspace/components/rooms/design-room.tsx`: Created dedicated `DesignRoom` workspace view displaying UI/UX Design Specifications, visual tokens, and approval dialogs.
  - `src/features/workspace/components/rooms/room-router.tsx` & `index.ts`: Integrated `"design"` phase into `PipelinePhaseId` and workspace room router switch.

- **Proposal API Response Standardization:**
  - `src/app/api/projects/[id]/proposal/route.ts`: Standardized response payload to `{ success: true, data: { proposal, score } }`.
  - `src/features/projects/components/new-project-wizard.tsx`: Aligned proposal extraction in onboarding wizard.

- **Architecture-Specific Approval Routing:**
  - `src/features/workspace/components/company-workspace.tsx`: Routed architecture approvals directly to `POST /api/projects/[id]/architecture/approve`.

- **Active Project Dashboard Hero Hydration:**
  - `src/features/dashboard/components/active-project-hero.tsx`: Replaced static heuristics with real-time pipeline status hydration from `GET /api/projects/[id]/pipeline/status`.

- **Dedicated Project Engineering History Route:**
  - `src/app/dashboard/projects/[id]/history/page.tsx`: Created standalone route for Screen 16 presenting complete decision history and artifact version lineage.

- **Verification:**
  - Ran `npx tsc --noEmit` -> 0 errors.
  - Ran `npx vitest run` -> 3/3 test suites passed (9/9 tests passed).

### What Changed
- **Database Schema Models & Relations:**
  - Created `ArchitectureDecisionRecord` (`ADR-xxx`), `DesignDecisionRecord` (`DES-xxx`), `RequirementTraceabilityRecord`, and `FeedbackEscalationRecord` in `prisma/schema.prisma`.
  - Updated Prisma Client bindings with `npx prisma generate`.

- **Strategic Core Services:**
  - Created `src/core/traceability/traceability.service.ts` & `types.ts`. Mapped `REQ-xxx` → `ADR`/`DES` → Code Files → Tests with 100% matrix coverage calculation.
  - Created `src/core/feedback/controlled-feedback.engine.ts` & `types.ts`. Implemented structured upward feedback loops (`DEVELOPER_TO_ARCHITECT`, `DEVELOPER_TO_DESIGNER`, `DEVELOPER_TO_CEO`).
  - Created `src/core/artifacts/artifact-version.service.ts`. Enforced strict domain artifact ownership (`CEO` → `PRODUCT_SPEC`, `ARCHITECT` → `ARCHITECTURE`, `DESIGNER` → `DESIGN_SPEC`, `DEVELOPER` → `IMPLEMENTATION`).

- **API Layer Routes:**
  - `src/app/api/projects/[id]/traceability/route.ts`
  - `src/app/api/projects/[id]/feedback/escalate/route.ts`
  - `src/app/api/projects/[id]/artifacts/versions/route.ts`

- **Workspace UX & 16-Screen Journey Components:**
  - Created `src/components/workspace/persistent-pipeline-indicator.tsx` rendering `CEO ✓ → Architect ✓ → Designer ● → Developer ○`.
  - Created `src/components/workspace/context-artifact-drawer.tsx` for inspecting project context, ADR/DES decisions, and artifact lineage.
  - Created checkpoint gates: `ceo-review-checkpoint.tsx`, `architect-review-checkpoint.tsx`, `designer-review-checkpoint.tsx`.
  - Created stage views: `verification-stage-view.tsx` (Screen 14) and `project-history-stage-view.tsx` (Screen 16).
  - Integrated persistent indicator, context drawer toggle, and stage navigation into `top-nav.tsx` and `mission-control-workspace.tsx`.

- **Automated Tests:**
  - `tests/traceability/traceability.test.ts`
  - `tests/feedback/controlled-feedback.test.ts`
  - `tests/artifacts/artifact-version.test.ts`


### What Changed
- **Phase 25 (AI Review Committee Engine):**
  - Created `src/core/review-committee/` (`review-committee.ts`, `types.ts`, `index.ts`). Evaluates code across 7 roles before approval.

- **Phase 26 (AI Design Review Engine):**
  - Created `src/core/design-review/` (`design-reviewer.ts`, `types.ts`, `index.ts`). Evaluates UI components against 11 design and UX guidelines.

- **Phase 27 (Architecture Quality Engine):**
  - Created `src/core/architecture-quality/` (`architecture-scorer.ts`, `types.ts`, `index.ts`). Scores architecture scalability, security, coupling, and debt.

- **Phase 28 (Autonomous Refactoring Engine):**
  - Created `src/core/refactoring/` (`refactoring-engine.ts`, `types.ts`, `index.ts`). Analyzes large files and suggests component extraction with behavior verification.

- **Phase 29 (Component Intelligence System):**
  - Created `src/core/component-intelligence/` (`component-registry.ts`, `types.ts`, `index.ts`). Semantic component registry preventing duplicate UI development.

- **Phase 30 (Context Compression Engine):**
  - Created `src/core/context-compression/` (`context-compressor.ts`, `types.ts`, `index.ts`). Achieves >80% token reduction with knowledge graphs.

- **Phase 20 (Product Discovery Agent Implementation):**
  - Created `src/ai/agents/roles/product-discovery.agent.ts`. Pre-planning intelligence layer that transforms raw human ideas into a structured `ProductSpecification` (productName, vision, problemStatement, targetAudience, platform, complexity, mvpFeatures, futureFeatures, questions).

- **Phase 21 (Guided Clarification Engine & Human Approval Workflow):**
  - Created `src/core/discovery/clarification.engine.ts` & `src/core/discovery/approval.service.ts`. Evaluates missing requirements, generates 3-5 clarification questions, creates formal proposals, and enforces `WAITING_FOR_APPROVAL` execution pauses.

- **Phase 22 (Product Proposal Intelligence Engine & Creator Experience):**
  - Created `src/core/product/proposal/product-proposal.engine.ts` & `proposal-score.service.ts`. Generates user-friendly product proposal cards, calculates quality scores (clarity, features, feasibility, overall), provides proposal API endpoints (`GET`, `POST approve`, `POST update`), and persists proposals in `ProductProposal` DB model.

- **Phase 23 (Architecture Decision & Approval System):**
  - Created `src/core/architecture/proposal/architecture-proposal.engine.ts`, `architecture-score.service.ts`, & `architecture-approval.service.ts`. Inserts a human approval checkpoint for technical architecture decisions before code generation begins, calculates architecture quality scores (scalability, security, maintainability, complexity, overall), adds API endpoints (`GET`, `POST approve`, `POST update`, `POST reject`), and enforces `WAITING_FOR_ARCHITECTURE_APPROVAL` pipeline pauses.

- **Phase 24 (AI Company Workspace - Mission Control):**
  - Created `src/core/workspace/workspace.service.ts`, `activity.service.ts`, and full Mission Control Workspace UI (`TopNav`, `MissionTimeline`, `AIEmployeePanel`, `ActivityFeedPanel`, `MissionControlWorkspace`). Replaces pipeline view with an AI Software Company experience featuring active AI employee cards, milestone timeline, real-time activity stream, and Creator Mode vs Developer Mode toggle.

- **Phase 25 (Shared Company Memory & Decision Intelligence):**
  - Created `src/core/memory/company-memory.service.ts`, `decision-intelligence.engine.ts`, `agent-context-loader.ts`, `knowledge-graph.ts`, `change-impact-analyzer.ts`, `memory-timeline.service.ts`, & `knowledge-search.service.ts`. Establishes central project memory, decision tracking with confidence scores, automatic agent context injection, knowledge graph topology, change impact analysis, and semantic search retrieval.

- **Phase 26 (AI Executive Planning & Work Management Engine):**
  - Created `src/core/executive/executive-planner.ts`, `assignment-engine.ts`, `dependency-engine.ts`, `progress-engine.ts`, & `executive-dashboard.ts`. Converts proposals into strategic milestones, work packages, and executable tasks with automatic AI specialist assignment, dependency tracking, project health scoring, and automatic replanning.

- **Phase 27 (Autonomous Execution Engine):**
  - Created `src/core/autonomous/execution-scheduler.ts`, `parallel-execution.engine.ts`, `conflict-detector.ts`, `retry-engine.ts`, `review-pipeline.ts`, & `execution-timeline.service.ts`. Establishes execution scheduler loop, parallel worker pool (concurrency limit: 4), state machine, 4-stage review pipeline, conflict detector, and automatic retry engine.

- **Phase 28 Step 1 (AI Agent Profile System):**
  - Created `src/core/workforce/types.ts` & `src/core/workforce/agent-profile.service.ts`. Establishes AI employee profiles across all 10 roles (`CEO`, `PRODUCT_MANAGER`, `SOFTWARE_ARCHITECT`, `DATABASE_ENGINEER`, `BACKEND_ENGINEER`, `FRONTEND_ENGINEER`, `UI_ENGINEER`, `QA_ENGINEER`, `SECURITY_ENGINEER`, `DEVOPS_ENGINEER`) with skill matrices, personalities, responsibilities, and experience levels.

- **Phase 28 Step 2 (AI Agent Capability Intelligence Engine):**
  - Created `src/core/workforce/capability/capability.types.ts`, `capability.constants.ts`, `capability-score.service.ts`, `capability-matcher.service.ts`, & `agent-capability.engine.ts`. Evaluates task domain requirements, computes match and confidence scores (0.0-1.0), pairs primary workers with supporting reviewer agents, and integrates capability matching into executive task assignment.

- **Phase 28 Step 3 (Context Injector & Prompt Intelligence Engine):**
  - Created `src/core/workforce/context/` & `src/core/workforce/prompt/` modules. Assembles `AgentExecutionContext` (identity, capabilities, task, project, memory, constraints, reviewer requirements), generates role-specific system prompts for all 10 roles, compresses token overhead 50%+, and records prompts in `AgentPromptRecord`.

- **Phase 28 Step 4 (Agent Communication & Collaboration Protocol Engine):**
  - Created `src/core/workforce/communication/` module with `MessageService`, `ConversationEngine`, `DelegationEngine`, `ConflictResolutionEngine`, and `CollaborationMemoryService`. Enables agent-to-agent messaging (8 message types), threaded discussions, subtask delegation with capability validation, organizational-hierarchy conflict resolution, and decision persistence into Company Memory.

- **Phase 29 (AI Agent Runtime & Model Execution Engine):**
  - Created `src/core/runtime/` and `src/core/tools/` modules. Implements unified LLM Provider abstraction (`OPENAI`, `ANTHROPIC`, `LOCAL_MODEL`), complexity-based model routing, role-gated tool execution (`FILE_READ`, `FILE_WRITE`, `CODE_SEARCH`, `TERMINAL_EXECUTE`, `DATABASE_QUERY`, `TEST_RUNNER`, `GIT_OPERATION`), execution state machine, token usage limits (max 16k tokens), cost tracking ($0.50 max), and Prisma persistence (`AgentExecution`, `ToolExecution`).

### Files Created
- `src/ai/agents/roles/product-discovery.agent.ts`
- `src/core/discovery/clarification.engine.ts`
- `src/core/discovery/approval.service.ts`
- `src/core/product/proposal/product-proposal.engine.ts`
- `src/core/product/proposal/proposal-score.service.ts`
- `src/core/architecture/proposal/architecture-proposal.engine.ts`
- `src/core/architecture/proposal/architecture-score.service.ts`
- `src/core/architecture/architecture-approval.service.ts`
- `src/core/workspace/types.ts`
- `src/core/workspace/workspace.service.ts`
- `src/core/workspace/activity.service.ts`
- `src/core/memory/types.ts`
- `src/core/memory/company-memory.service.ts`
- `src/core/memory/decision-intelligence.engine.ts`
- `src/core/memory/agent-context-loader.ts`
- `src/core/memory/knowledge-graph.ts`
- `src/core/memory/change-impact-analyzer.ts`
- `src/core/memory/memory-timeline.service.ts`
- `src/core/memory/knowledge-search.service.ts`
- `src/core/executive/types.ts`
- `src/core/executive/assignment-engine.ts`
- `src/core/executive/dependency-engine.ts`
- `src/core/executive/progress-engine.ts`
- `src/core/executive/executive-planner.ts`
- `src/core/executive/executive-dashboard.ts`
- `src/core/autonomous/types.ts`
- `src/core/autonomous/conflict-detector.ts`
- `src/core/autonomous/retry-engine.ts`
- `src/core/autonomous/review-pipeline.ts`
- `src/core/autonomous/execution-timeline.service.ts`
- `src/core/autonomous/parallel-execution.engine.ts`
- `src/core/autonomous/execution-scheduler.ts`
- `src/core/workforce/types.ts`
- `src/core/workforce/agent-profile.service.ts`
- `src/core/workforce/capability/capability.types.ts`
- `src/core/workforce/capability/capability.constants.ts`
- `src/core/workforce/capability/capability-score.service.ts`
- `src/core/workforce/capability/capability-matcher.service.ts`
- `src/core/workforce/capability/agent-capability.engine.ts`
- `src/components/ui/progress.tsx`
- `src/components/workspace/top-nav.tsx`
- `src/components/workspace/mission-timeline.tsx`
- `src/components/workspace/ai-employee-panel.tsx`
- `src/components/workspace/activity-feed-panel.tsx`
- `src/components/workspace/mission-control-workspace.tsx`
- `src/components/workspace/company-knowledge-panel.tsx`
- `src/components/workspace/executive-dashboard-panel.tsx`
- `src/components/workspace/autonomous-execution-panel.tsx`
- `src/app/api/projects/[id]/proposal/route.ts`
- `src/app/api/projects/[id]/proposal/approve/route.ts`
- `src/app/api/projects/[id]/proposal/update/route.ts`
- `src/app/api/projects/[id]/architecture/route.ts`
- `src/app/api/projects/[id]/architecture/approve/route.ts`
- `src/app/api/projects/[id]/architecture/update/route.ts`
- `src/app/api/projects/[id]/architecture/reject/route.ts`
- `src/app/api/projects/[id]/workspace/route.ts`
- `src/app/api/projects/[id]/workspace/toggle-mode/route.ts`
- `src/app/api/projects/[id]/workspace/pause/route.ts`
- `src/app/api/projects/[id]/workspace/activity/route.ts`
- `src/app/api/projects/[id]/memory/route.ts`
- `src/app/api/projects/[id]/memory/decisions/route.ts`
- `src/app/api/projects/[id]/memory/impact-analysis/route.ts`
- `src/app/api/projects/[id]/memory/search/route.ts`
- `src/app/api/projects/[id]/executive/dashboard/route.ts`
- `src/app/api/projects/[id]/executive/milestones/route.ts`
- `src/app/api/projects/[id]/executive/tasks/route.ts`
- `src/app/api/projects/[id]/executive/replan/route.ts`
- `src/app/api/projects/[id]/autonomous/status/route.ts`
- `src/app/api/projects/[id]/autonomous/queue/route.ts`
- `src/app/api/projects/[id]/autonomous/dispatch/route.ts`
- `src/app/api/projects/[id]/autonomous/timeline/route.ts`
- `tests/discovery/product-discovery.test.ts`
- `tests/discovery/clarification.engine.test.ts`
- `tests/product/proposal-engine.test.ts`
- `tests/architecture/architecture-proposal.test.ts`
- `tests/workspace/mission-control.test.ts`
- `tests/memory/company-memory.test.ts`
- `tests/executive/executive-planner.test.ts`
- `tests/autonomous/execution-engine.test.ts`
- `tests/workforce/agent-profile.test.ts`
- `tests/workforce/capability-score.test.ts`
- `tests/workforce/matcher.test.ts`
- `tests/workforce/capability-engine.test.ts`
- `tests/workforce/context-injector.test.ts`
- `tests/workforce/prompt-engine.test.ts`
- `phase20-product-discovery.md`
- `phase21-clarification-engine.md`
- `phase22-product-proposal.md`
- `phase23-architecture-approval.md`
- `phase24-ai-company-workspace.md`
- `phase25-company-memory.md`
- `phase26-executive-planning.md`
- `phase27-autonomous-execution.md`
- `phase28-step1-workforce-profile.md`
- `phase28-step2-capability-intelligence.md`
- `phase28-step3-context-intelligence.md`
- `phase28-step4-agent-communication.md`
- `phase29-ai-runtime-engine.md`

### Files Modified
- `src/ai/agents/core/agent.types.ts`
- `src/ai/agents/core/agent.constants.ts`
- `src/ai/agents/manager/agent.registry.ts`
- `src/core/specification/specification-engine.ts`
- `src/core/execution-engine/pipeline.orchestrator.ts`
- `src/core/execution-engine/types.ts`
- `src/core/execution-engine/project.service.ts`
- `src/core/executive/assignment-engine.ts`
- `src/core/autonomous/parallel-execution.engine.ts`
- `src/core/memory/company-memory.service.ts`
- `src/app/dashboard/projects/[id]/project-tabs-client.tsx`
- `prisma/schema.prisma`
- `doc/project-docs/01_PROJECT_MEMORY.md`

# Next Recommended Work

Create:
- Phase 30: AI Employee Feedback & Learning Loop Engine.



