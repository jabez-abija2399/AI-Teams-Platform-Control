# Integration Sprint 1 — Master Prompt File

Version: 1.0

Last Updated: 2026-07-25

Goal: 80% integration, 15% testing, 5% new functionality

---

## PROMPT 1 — Wire Discovery → Clarification → Product Proposal → Approval

```text
# Integration Sprint 1 — Prompt 1

Objective

Integrate the Product Discovery workflow into the Company Pipeline.

DO NOT create any new services.

Only integrate the existing ones.

Already implemented:

- ProductDiscoveryAgent
- ClarificationEngine
- ProductProposalEngine
- ApprovalManager

Current issue

Pipeline currently executes:

DISCOVERY
↓

CEO

instead of

DISCOVERY
↓

CLARIFICATION
↓

PRODUCT PROPOSAL
↓

WAITING FOR APPROVAL
↓

CEO

Requirements

1. Add new workflow states

CLARIFICATION_RUNNING

PROPOSAL_RUNNING

WAITING_FOR_PRODUCT_APPROVAL

2. After ProductDiscoveryAgent completes

Call

ClarificationEngine.generateQuestions()

Store questions

Pause if answers required

3. After clarification

Call

ProductProposalEngine.generateProposal()

Store proposal

4. Call ApprovalManager.requestApproval()

Pipeline MUST stop

WAITING_FOR_PRODUCT_APPROVAL

5. Resume only after approval

6. Rejection returns to clarification

Do NOT continue

Acceptance Criteria

✓ Discovery
✓ Clarification
✓ Proposal
✓ Approval
✓ CEO starts only after approval

No mock data

No placeholders

No TODOs

Return:

- changed files
- workflow diagram
- tests
- explanation
```

---

## PROMPT 2 — Replace Hardcoded Executive Planning

```text
# Integration Sprint 1 — Prompt 2

Objective

Replace every hardcoded planning object.

Current code creates milestones manually.

Delete it.

Use ExecutivePlanner.

Requirements

Replace

const planData={...}

with

ExecutivePlanner.planProjectWork(projectId)

Planner must produce

- milestones
- work packages
- tasks
- dependencies

Pipeline should receive planner output.

Acceptance

No hardcoded milestones remain.

Everything generated dynamically.

Show changed files.

Show before/after.
```

---

## PROMPT 3 — Wire Capability Engine

```text
# Integration Sprint 1 — Prompt 3

Objective

Integrate AgentCapabilityEngine.

Current pipeline dispatches agents directly.

Wrong.

Instead

Task

↓

Capability Engine

↓

Best Worker

↓

Reviewer

↓

Dispatch

Call

AgentCapabilityEngine.evaluateTaskCapability()

Use confidence scores.

Assign

Primary Worker

Supporting Reviewer

Store results.

Acceptance

Every task has

assignedAgent

reviewer

confidence

reason

Show execution flow.
```

---

## PROMPT 4 — Wire Context Injector

```text
# Integration Sprint 1 — Prompt 4

Objective

Before any agent executes

inject complete project context.

Use

ContextInjectorService

Do not create another injector.

Injected context must include

• Product Vision
• Requirements
• Architecture
• Previous Decisions
• Company Memory
• Constraints
• Coding Standards
• Reviewer Expectations
• Related Artifacts
• Previous Agent Output

Pipeline

Task

↓

Capability Engine

↓

Context Injector

↓

Agent

↓

Output

Acceptance

Every agent receives rich context.

No agent receives raw project text.

Show sample injected context.
```

---

## PROMPT 5 — Wire Review Committee

```text
# Integration Sprint 1 — Prompt 5

Objective

Integrate ReviewCommittee.

Current pipeline skips it.

Wrong.

Pipeline should become

Developer

↓

QA

↓

Review Committee

↓

Security

↓

DevOps

Call

ReviewCommittee.evaluateCodebase()

Committee members

Architecture

Backend

Frontend

QA

Security

Performance

Maintainability

Store review artifact.

Reject if score below threshold.

Acceptance

Review runs automatically.

Pipeline pauses if review fails.

Show review report.
```

---

## PROMPT 6 — Fix CREATED State

```text
# Integration Sprint 1 — Prompt 6

Objective

Fix pipeline startup.

Current code exits when phase==CREATED.

Wrong.

Instead

CREATED

↓

DISCOVERY_RUNNING

↓

Continue

No manual intervention.

Acceptance

New project starts automatically.
```

---

## PROMPT 7 — Verify Resume Logic

```text
# Integration Sprint 1 — Prompt 7

Objective

Audit ProjectLifecycleService.

Ensure resume works after

Product Approval

Architecture Approval

Review

Deployment

Use workflow definitions.

Never hardcode next phase.

Acceptance

Resume works from every paused state.

Show test results.
```

---

## PROMPT 8 — Build Full E2E Test

```text
# Integration Sprint 1 — Prompt 8

Objective

Create production integration test.

Project

ExpenseFlow

Run

StartLifecycle()

Complete entire company pipeline.

Verify

Discovery
Clarification
Proposal
Approval
CEO
PM
Architect
Architecture Approval
Planning
Capability Matching
Context Injection
Development
QA
Review
Security
Deployment
Monitoring
Completed

Assert

Artifacts exist
Memory exists
Timeline exists
Assignments exist
No phase skipped.

100% automated.

Show coverage.
```

---

## PROMPT 9 — Mission Control Integration

```text
# Integration Sprint 1 — Prompt 9

Objective

Mission Control should reflect live execution.

Every phase change

↓

Timeline

↓

Activity Feed

↓

Agent Card

↓

Progress

↓

Memory Timeline

↓

Artifact Timeline

No polling.

Use execution events.

Acceptance

User sees company working in real time.

Every event synchronized.
```

---

## PROMPT 10 — Final Integration Audit

```text
# Integration Sprint 1 — Final Audit

Perform a complete audit.

Verify

✓ Workflow
✓ Approvals
✓ Planner
✓ Capability Matching
✓ Context Injection
✓ Memory
✓ Review Committee
✓ Security
✓ DevOps
✓ Mission Control
✓ Scheduler
✓ Resume
✓ Retry
✓ Parallel Execution
✓ Artifacts
✓ Timeline
✓ Event Bus

Produce

1. Missing integrations
2. Broken transitions
3. Dead code
4. Duplicate services
5. Unused engines
6. Performance issues
7. Refactoring recommendations
8. Final architecture diagram
9. Technical debt list
10. Production readiness score (0–100)

Do not implement anything.

Only audit the system and provide a detailed report with prioritized fixes.
```

---

## Execution Order

| # | Prompt | Depends On | Complexity |
|---|--------|-----------|------------|
| 1 | Discovery → Clarification → Proposal → Approval | — | High |
| 2 | Replace Hardcoded Planning | — | Medium |
| 3 | Wire Capability Engine | — | Medium |
| 4 | Wire Context Injector | 3 | Medium |
| 5 | Wire Review Committee | — | Medium |
| 6 | Fix CREATED State | 1 | Low |
| 7 | Verify Resume Logic | 1 | Low |
| 8 | Build E2E Test | 1-7 | High |
| 9 | Mission Control Integration | 1-8 | Medium |
| 10 | Final Integration Audit | 1-9 | Low |

---

## Related Files

- `src/core/company-orchestration/company-pipeline.engine.ts` — Main engine (modify)
- `src/core/company-orchestration/types.ts` — Phase definitions (modify)
- `src/core/company-orchestration/project-lifecycle.service.ts` — Lifecycle service (modify)
- `src/core/company-orchestration/workflow-manager.ts` — State machine (verify)
- `src/core/company-orchestration/artifact-manager.ts` — Artifacts (verify)
- `src/core/company-orchestration/handoff-manager.ts` — Handoffs (verify)
- `src/core/company-orchestration/approval-manager.ts` — Approvals (verify)
