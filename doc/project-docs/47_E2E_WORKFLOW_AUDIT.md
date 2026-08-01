# Phase 47 — End-to-End Company Pipeline Audit

Version: 1.0

Last Updated: 2026-07-25

---

## Test Project: ExpenseFlow

### User Input

```
I want to build a simple personal expense tracker web application.

Users should be able to:
- Create expenses
- Add expense categories
- View spending history
- See monthly spending summaries

The application should be simple, fast, and easy for students to use.

Build this as an MVP first.
```

---

## 13-Step Workflow Checklist

| # | Phase | Engine State | Status |
|---|-------|-------------|--------|
| 1 | Product Discovery | `DISCOVERY_RUNNING` | ✅ Working |
| 2 | Clarification Engine | `CLARIFICATION_RUNNING` | ❌ Missing |
| 3 | Product Proposal | `PROPOSAL_RUNNING` | ❌ Missing |
| 4 | Human Approval (Product) | approval gate | ⚠️ Needs verification |
| 5 | CEO Strategy | `STRATEGY_RUNNING` | ✅ Working |
| 6 | Product Manager | `PRODUCT_RUNNING` | ✅ Working |
| 7 | Software Architect | `ARCHITECTURE_RUNNING` | ✅ Working |
| 8 | Architecture Approval | approval gate | ✅ Working |
| 9 | Executive Planning | `PLANNING_RUNNING` | ⚠️ Hardcoded |
| 10 | Capability Matching | — | ❌ Not wired |
| 11 | Context Injection | — | ❌ Not wired |
| 12 | Developer | `DEVELOPMENT_RUNNING` | ✅ Working |
| 13 | QA + Review Committee | `TESTING_RUNNING` / `REVIEW_RUNNING` | ⚠️ Review missing |

---

## What Already Works

### `src/core/company-orchestration/` — Full engine exists

| File | Status | What it does |
|------|--------|-------------|
| `types.ts` | ✅ | State machine, 12 phase definitions, valid transitions |
| `workflow-manager.ts` | ✅ | State init, transition, prerequisite check, approval gating |
| `artifact-manager.ts` | ✅ | Store/retrieve/timeline of artifacts |
| `handoff-manager.ts` | ✅ | Agent handoff with memory + event bus |
| `approval-manager.ts` | ✅ | Request/resolve approvals with pause |
| `company-pipeline.engine.ts` | ✅ | 12-phase loop, 12 agent dispatchers |
| `project-lifecycle.service.ts` | ✅ | Start + resume lifecycle |

### Working Phases in Engine

```
CREATED → DISCOVERY_RUNNING → STRATEGY_RUNNING → PRODUCT_RUNNING →
ANALYSIS_RUNNING → DESIGN_RUNNING → ARCHITECTURE_RUNNING →
PLANNING_RUNNING → DEVELOPMENT_RUNNING → TESTING_RUNNING →
SECURITY_RUNNING → DEPLOYMENT_RUNNING → MONITORING → COMPLETED
```

### Agent Implementations (all exist in `src/ai/agents/roles/`)

| Agent | Files | Status |
|-------|-------|--------|
| Product Discovery | `product-discovery.agent.ts` | ✅ |
| CEO | `ceo/` (6 files) | ✅ |
| Product Manager | `product-manager/` (6 files) | ✅ |
| Architect | `architect/` (6 files) | ✅ |
| Developer | `developer/` (6 files) | ✅ |
| QA | `qa/` (6 files) | ✅ |
| Security | `security/` (6 files) | ✅ |
| DevOps | `devops/` (6 files) | ✅ |
| Business Analyst | `business-analyst/` (6 files) | ✅ |
| UI/UX Designer | `ui-designer/` (6 files) | ✅ |

### Support Engines (all exist in `src/core/workforce/`)

| Engine | Status |
|--------|--------|
| `AgentCapabilityEngine` (capability matching) | ✅ Exists, not wired |
| `ContextInjectorService` (context injection) | ✅ Exists, not wired |
| `ReviewCommittee` (review committee) | ✅ Exists, not wired |
| `ExecutivePlanner` (executive planning) | ✅ Exists, but not called |
| `ClarificationEngine` (clarification) | ✅ Exists, not wired |
| `ProductProposalEngine` (product proposal) | ✅ Exists, not wired |

---

## Errors / Gaps Found

### ❌ Missing: Clarification Engine Phase

**Where:** `src/core/company-orchestration/company-pipeline.engine.ts`

**Problem:** After `DISCOVERY_RUNNING`, engine jumps straight to `STRATEGY_RUNNING`. Never calls `ClarificationEngine`.

**Impact:** User questions are never generated or collected.

---

### ❌ Missing: Product Proposal Phase

**Where:** `src/core/company-orchestration/company-pipeline.engine.ts`

**Problem:** No proposal generation or human approval gate after discovery.

**Impact:** No formal proposal is created. No approval checkpoint before building.

---

### ❌ Missing: Capability Matching

**Where:** `src/core/company-orchestration/company-pipeline.engine.ts`

**Problem:** `AgentCapabilityEngine.evaluateTaskCapability()` exists at `src/core/workforce/capability/agent-capability.engine.ts` but is never called in the pipeline.

**Impact:** Tasks are assigned by phase definition, not by capability analysis. No reviewer pairing.

---

### ❌ Missing: Context Injection

**Where:** `src/core/company-orchestration/company-pipeline.engine.ts`

**Problem:** `ContextInjectorService.injectContextForTask()` exists at `src/core/workforce/context/context-injector.service.ts` but is never called.

**Impact:** Agents receive raw input data without project context, architecture constraints, or company memory.

---

### ❌ Missing: Review Committee Phase

**Where:** `src/core/company-orchestration/company-pipeline.engine.ts`

**Problem:** `ReviewCommittee.evaluateCodebase()` exists at `src/core/review-committee/review-committee.ts` but is never called.

**Impact:** No multi-perspective review of completed work before security phase.

---

### ⚠️ Broken: PLANNING_RUNNING uses hardcoded data

**Where:** `src/core/company-orchestration/company-pipeline.engine.ts` (lines 188-201)

**Current (wrong):**
```typescript
case 'PLANNING_RUNNING': {
  const planData = {
    projectId,
    milestones: [
      { name: 'Core Infrastructure & Schema', durationDays: 3, dependencies: [] },
      { name: 'Backend Services & APIs', durationDays: 5, dependencies: ['Core Infrastructure & Schema'] },
      { name: 'Frontend UX & Component Integration', durationDays: 5, dependencies: ['Backend Services & APIs'] },
      { name: 'E2E Testing & Security Hardening', durationDays: 3, dependencies: ['Frontend UX & Component Integration'] },
    ],
    resourceAllocation: { developers: 3, qa: 1, devops: 1 },
    status: 'APPROVED',
    inputArchitectureRef: typeof inputData === 'object' ? inputData?.architecture || 'Ref' : 'Ref',
  };
  return { success: true, data: planData };
}
```

**Fix:** Replace with `ExecutivePlanner.planProjectWork(projectId)`.

---

### ⚠️ Broken: CREATED state breaks pipeline loop

**Where:** `src/core/company-orchestration/company-pipeline.engine.ts` (line 38)

**Current (wrong):**
```typescript
if (currentPhase === 'PAUSED' || currentPhase === 'COMPLETED' || currentPhase === 'FAILED' || currentPhase === 'CREATED') {
  break;
}
```

**Fix:** Handle `CREATED` by transitioning to `DISCOVERY_RUNNING` and continuing the loop.

---

### ⚠️ Broken: Resume may fail for new phases

**Where:** `src/core/company-orchestration/project-lifecycle.service.ts` (lines 123-131)

**Problem:** Resume logic reads `completedPhases` array to find `lastCompleted → def.nextState`. With new phases added, this must resolve correctly.

**Fix:** Verify `lastCompleted → def.nextState` chain works after adding `CLARIFICATION_RUNNING`, `PROPOSAL_RUNNING`, `REVIEW_RUNNING`.

---

## Fix Plan Summary

| # | Fix | Files | Complexity |
|---|-----|-------|------------|
| 1 | Add `CLARIFICATION_RUNNING` state + handler | `types.ts` + `engine.ts` | Easy |
| 2 | Add `PROPOSAL_RUNNING` state + handler | `types.ts` + `engine.ts` | Easy |
| 3 | Add `REVIEW_RUNNING` state + handler | `types.ts` + `engine.ts` | Easy |
| 4 | Fix CREATED loop break | `engine.ts` line 38 | Easy |
| 5 | Replace hardcoded planning | `engine.ts` lines 188-201 | Easy |
| 6 | Wire capability matching + context injection | `engine.ts` before agent dispatch | Medium |
| 7 | Verify resume logic | `project-lifecycle.service.ts` | Easy |

---

## E2E Test (To Be Created)

**File:** `tests/scenarios/expense-flow.e2e.test.ts`

Mock AI provider → call `ProjectLifecycleService.startLifecycle()` → assert all 15 phases complete with correct artifacts.

### Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectLifecycleService } from '../../src/core/company-orchestration/project-lifecycle.service';
import { WorkflowManager } from '../../src/core/company-orchestration/workflow-manager';
import { prisma } from '../../src/lib/prisma';

describe('ExpenseFlow E2E Workflow Test', () => {
  const projectId = 'expense-flow-test-project';
  const userIdea = `I want to build a simple personal expense tracker...`;

  beforeEach(async () => {
    // Mock AI provider
    // Setup test project in DB
  });

  it('runs full 13-step pipeline end-to-end', async () => {
    const result = await ProjectLifecycleService.startLifecycle(projectId, userIdea);
    expect(result.success).toBe(true);

    // Wait for pipeline to complete
    const final = await waitForCompletion(projectId);

    expect(final.currentPhase).toBe('COMPLETED');
    expect(final.completedPhases).toContain('DISCOVERY_RUNNING');
    expect(final.completedPhases).toContain('CLARIFICATION_RUNNING');
    expect(final.completedPhases).toContain('PROPOSAL_RUNNING');
    expect(final.completedPhases).toContain('STRATEGY_RUNNING');
    expect(final.completedPhases).toContain('PRODUCT_RUNNING');
    expect(final.completedPhases).toContain('ARCHITECTURE_RUNNING');
    expect(final.completedPhases).toContain('PLANNING_RUNNING');
    expect(final.completedPhases).toContain('DEVELOPMENT_RUNNING');
    expect(final.completedPhases).toContain('TESTING_RUNNING');
    expect(final.completedPhases).toContain('REVIEW_RUNNING');
    expect(final.completedPhases).toContain('SECURITY_RUNNING');
    expect(final.completedPhases).toContain('DEPLOYMENT_RUNNING');
    expect(final.completedPhases).toContain('MONITORING');
  });
});
```

---

## Related Documentation

- `doc/project-docs/03_ARCHITECTURE.md` — System architecture
- `doc/project-docs/05_WORKFLOWS.md` — Workflow definitions
- `doc/project-docs/07_AGENT_CONTRACTS.md` — Agent rules and limits
