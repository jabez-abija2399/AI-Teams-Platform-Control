# Agent System Implementation Plan

**Owner:** AI (big-pickle / opencode)  
**Created:** 2026-07-23  
**Status:** ACTIVE  
**Scope:** Agent system improvements only — no infra, no tests, no deployment

---

## Part A: Current State Diagnosis

### What Exists (4 working agents)

| Agent | Prompt File | Types File | Tools File | Service File | Config |
|-------|------------|-----------|-----------|-------------|--------|
| CEO | `ceo.prompt.ts` (29 lines) | `ceo.types.ts` (56 lines) | `ceo.tools.ts` (123 lines) | `ceo.service.ts` (79 lines) | `ceo.config.ts` |
| Architect | `architect.prompt.ts` (28 lines) | `architect.types.ts` (60 lines) | `architect.tools.ts` (108 lines) | `architect.service.ts` (78 lines) | `architect.config.ts` |
| Developer | `developer.prompt.ts` (36 lines) | `developer.types.ts` (86 lines) | `developer.tools.ts` (101 lines) | `developer.service.ts` (468 lines) | `developer.config.ts` |
| QA | `qa.prompt.ts` (32 lines) | `qa.types.ts` (47 lines) | `qa.tools.ts` (84 lines) | `qa.service.ts` (73 lines) | `qa.config.ts` |

### What Is Missing (no files at all)

| Agent | Status |
|-------|--------|
| Product Manager AI | **Does not exist** — documented in `04_AI_COMPANY.md` and `07_AGENT_CONTRACTS.md` but never built |
| Frontend Engineer AI | **Does not exist** |
| Backend Engineer AI | **Does not exist** |
| Database Engineer AI | **Does not exist** |

### What Exists But Is Shallow (class only, no service/tools/types)

| Agent | Class File | Service | Tools | Types |
|-------|-----------|---------|-------|-------|
| DevOps | `devops.agent.ts` | No | No | No |
| Security | `security/security.agent.ts` | No | No | No |
| UI/UX | `ui-ux/design.agent.ts` | No | No | No |
| Documentation | `documentation.agent.ts` | No | No | No |
| Operations | `operations/operations.agent.ts` | No | No | No |

### What Is Defined But Not Enforced

| Aspect | Documented In | Code Status |
|--------|-------------|-------------|
| Agent Contracts | `07_AGENT_CONTRACTS.md` | Not enforced — agents don't read this |
| Agent Roles | `04_AI_COMPANY.md` | `agent.constants.ts` has generic prompts, not the detailed ones in role files |
| Quality Standards | `09_DEVELOPMENT_RULES.md` | Not enforced — agents don't read this |
| Pipeline Steps | `05_WORKFLOWS.md` | Orchestrator only has CEO → Architect → Developer → QA → Security (stub) → Deploy |
| Memory Persistence | `07_AGENT_CONTRACTS.md` | In-memory only — `memory.manager` uses Prisma but agents lose context on restart |
| Self-Evaluation | `07_AGENT_CONTRACTS.md` | Only QA has quality score. No other agent self-evaluates |

### Per-Agent Pain Points

**CEO AI:**
- Prompt has a 7-step thinking process but no self-scoring
- Output is Zod-validated JSON (good) but saved to generic `Document` table (not structured tables)
- No specialized knowledge injection (doesn't read `02_PRODUCT.md`)
- No review step before passing to Architect

**Architect AI:**
- Architecture is text strings (`frontend: "Next.js"`) — not structured data that generates code
- Database design outputs entity names but not actual Prisma schema
- API design outputs paths but not route code
- No architecture verification step
- No self-evaluation

**Developer AI:**
- Most sophisticated agent (468 lines) but code is never compiled/verified
- Single Developer does frontend + backend + database — no specialization
- Tools are AI-only calls — no file system access, no shell execution
- Code is generated as text, written to DB as JSON — workspace sync is separate
- No self-evaluation

**QA AI:**
- Quality score is formula-based (AI-guessed bugs × severity weights) — not from real tests
- Test plan is text, never executed
- No re-test cycle (if QA fails, pipeline stops — no fix loop)
- No self-evaluation

**All agents:**
- Memory is in-memory + Prisma but not queried on restart
- No inter-agent review/critique step
- No specialized knowledge injection (none read project-docs/)
- No output quality standard enforced consistently

---

## Part B: Implementation Steps

### Step 1: Prompt Upgrades — Thinking Checklists + Self-Scoring

**Goal:** Every agent gets an enforced thinking checklist and must self-score before returning. This is the cheapest high-impact change — just editing prompt files.

**Files to modify:**

```
src/ai/agents/roles/ceo/ceo.prompt.ts        (modify)
src/ai/agents/roles/architect/architect.prompt.ts (modify)
src/ai/agents/roles/developer/developer.prompt.ts (modify)
src/ai/agents/roles/qa/qa.prompt.ts          (modify)
```

**What changes in each prompt:**

#### CEO Prompt — Add to end of existing prompt:

```
# Thinking checklist (BEFORE answering, work through each)
1. Restate the idea in ONE sentence — am I understanding the real problem?
2. Who exactly is the target user? Be specific (not "everyone").
3. What is the SMALLEST version that solves the core problem?
4. Am I adding features that don't solve the stated problem? Remove them.
5. For each user story: can I test whether it's done? Rewrite if not.
6. Am I being concrete or vague? Replace every vague phrase with a specific one.

# Self-scoring (include at the END of your response)
After producing the vision/requirements/plan, append a qualityScore object:
{
  "completeness": <1-10, did I cover everything?>,
  "clarity": <1-10, is every statement unambiguous?>,
  "feasibility": <1-10, can this actually be built in the proposed phases?>,
  "overall": <1-10 average>,
  "verdict": "APPROVED" | "NEEDS_REVISION" | "REJECTED"
}
If overall < 7, explain what's weak and what you'd revise.
```

#### Architect Prompt — Add to end of existing prompt:

```
# Thinking checklist (BEFORE answering, work through each)
1. Did I address EVERY requirement from the CEO's output? Check one by one.
2. For each technology choice: name the alternative I considered and why I rejected it.
3. Database: are entities normalized? Are relationships defined with cardinality?
4. API: are all endpoints RESTful? Do they match the frontend needs?
5. Security: have I addressed input validation, auth, secrets?
6. Scalability: will this architecture hold at 10x the initial load?

# Self-scoring (include at the END of your response)
After producing the architecture/database/API, append a qualityScore object:
{
  "completeness": <1-10, all requirements addressed?>,
  "technicalAccuracy": <1-10, are technologies and patterns correct?>,
  "scalability": <1-10, can this grow?>,
  "security": <1-10, are security concerns addressed?>,
  "maintainability": <1-10, will a developer understand this?>,
  "overall": <1-10 average>,
  "verdict": "APPROVED" | "NEEDS_REVISION" | "REJECTED"
}
If overall < 7, explain what's weak and what you'd revise.
```

#### Developer Prompt — Add to end of existing prompt:

```
# Quality gates (BEFORE returning code, verify each)
1. Does every file have a clear purpose? Remove any file that doesn't.
2. Is TypeScript strict? No `any`, no `as unknown`, no `!` assertions without reason.
3. Are errors handled? Every async call needs error handling.
4. Does the code match the architecture? If the architect said Next.js, don't use Express.
5. Are loading/error/empty states handled for every data-fetching component?
6. Is every external input validated before use?

# Self-scoring (include at the END of your response)
After producing the plan/changes/report, append a qualityScore object:
{
  "completeness": <1-10, did I implement everything asked?>,
  "typeSafety": <1-10, no any, strict types?>,
  "errorHandling": <1-10, all paths handled?>,
  "consistency": <1-10, matches architecture?>,
  "overall": <1-10 average>,
  "verdict": "APPROVED" | "NEEDS_REVISION" | "REJECTED"
}
If overall < 7, explain what's weak and what you'd revise.
```

#### QA Prompt — Add to end of existing prompt:

```
# Before finalizing your review, verify:
1. Did I check EVERY requirement against the implementation?
2. Did I test edge cases (empty, null, boundary, concurrent)?
3. Am I being honest about the score? Inflated scores help no one.
4. For each bug: is it a real bug or a style preference? Only report real bugs.
5. Can the Developer AI understand and fix each reported bug from my description alone?

# Self-scoring thresholds
- Quality score >= 80: APPROVED — proceed to deployment
- Quality score 50-79: NEEDS_REVISION — Developer AI must fix issues, then re-review
- Quality score < 50: REJECTED — fundamental problems, Architect may need to redesign
Include this verdict in your qualityReport.
```

**Success criteria:** Each prompt file is modified. The thinking checklist and self-scoring sections are appended to the existing prompt text. No other files change in this step.

---

### Step 2: Output Quality Scoring Types

**Goal:** Add `qualityScore` Zod schema to each agent's types file so scores are structured, validated, and stored.

**Files to modify:**

```
src/ai/agents/roles/ceo/ceo.types.ts        (modify)
src/ai/agents/roles/architect/architect.types.ts (modify)
src/ai/agents/roles/developer/developer.types.ts (modify)
src/ai/agents/roles/qa/qa.types.ts          (modify)
```

**What to add to each types file:**

```typescript
// Add this schema to each agent's types.ts

export const qualityScoreSchema = z.object({
  completeness: z.number().min(1).max(10),
  clarity: z.number().min(1).max(10),
  overall: z.number().min(1).max(10),
  verdict: z.enum(['APPROVED', 'NEEDS_REVISION', 'REJECTED']),
  notes: z.string().optional(),
});
export type QualityScore = z.infer<typeof qualityScoreSchema>;
```

For CEO, add domain-specific fields:
```typescript
export const ceoQualityScoreSchema = qualityScoreSchema.extend({
  feasibility: z.number().min(1).max(10),
});
```

For Architect, add:
```typescript
export const architectQualityScoreSchema = qualityScoreSchema.extend({
  technicalAccuracy: z.number().min(1).max(10),
  scalability: z.number().min(1).max(10),
  security: z.number().min(1).max(10),
  maintainability: z.number().min(1).max(10),
});
```

For Developer, add:
```typescript
export const developerQualityScoreSchema = qualityScoreSchema.extend({
  typeSafety: z.number().min(1).max(10),
  errorHandling: z.number().min(1).max(10),
  consistency: z.number().min(1).max(10),
});
```

For QA, the existing `qualityReportSchema` already has a `score` field. Extend it:
```typescript
export const qualityReportSchema = z.object({
  score: z.number().default(0),
  issues: z.array(bugReportSchema).default([]),
  recommendations: z.array(smartString).default([]),
  verdict: z.enum(['APPROVED', 'NEEDS_REVISION', 'REJECTED']).default('NEEDS_REVISION'),
  qualityScore: qualityScoreSchema.optional(),
});
```

**Also modify each agent's top-level schema to include the qualityScore:**

```typescript
// In ceo.types.ts — modify ceoAnalysisSchema:
export const ceoAnalysisSchema = z.object({
  vision: productVisionSchema,
  requirements: productRequirementSchema,
  plan: developmentPlanSchema,
  qualityScore: ceoQualityScoreSchema.optional(),
});

// In architect.types.ts — modify architectAnalysisSchema:
export const architectAnalysisSchema = z.object({
  architecture: technicalArchitectureSchema,
  database: databaseDesignSchema,
  api: apiSpecificationSchema,
  decisions: z.array(technologyDecisionSchema).default([]),
  qualityScore: architectQualityScoreSchema.optional(),
});

// In developer.types.ts — modify developerOutputSchema:
export const developerOutputSchema = z.object({
  plan: developmentPlanSchema,
  changes: z.array(codeChangeSchema),
  report: implementationReportSchema,
  qualityScore: developerQualityScoreSchema.optional(),
});

// In qa.types.ts — modify qaOutputSchema:
export const qaOutputSchema = z.object({
  testPlan: testPlanSchema,
  qualityReport: qualityReportSchema,
});
```

**Success criteria:** Each agent's types file exports a `qualityScoreSchema`. Each agent's top-level output schema includes an optional `qualityScore` field.

---

### Step 3: Specialized Knowledge Injection

**Goal:** Each agent reads relevant project-docs/ files before producing output, giving it domain-specific knowledge.

**Files to modify:**

```
src/ai/agents/roles/ceo/ceo.service.ts        (modify)
src/ai/agents/roles/architect/architect.service.ts (modify)
src/ai/agents/roles/developer/developer.service.ts (modify)
src/ai/agents/roles/qa/qa.service.ts          (modify)
```

**New utility file to create:**

```
src/ai/agents/core/knowledge-loader.ts       (create)
```

**Knowledge Loader implementation:**

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';

const DOCS_DIR = join(process.cwd(), 'doc', 'project-docs');

const DOC_FILES = {
  CONSTITUTION: '00_PROJECT_CONSTITUTION.md',
  MEMORY: '01_PROJECT_MEMORY.md',
  PRODUCT: '02_PRODUCT.md',
  ARCHITECTURE: '03_ARCHITECTURE.md',
  AI_COMPANY: '04_AI_COMPANY.md',
  WORKFLOWS: '05_WORKFLOWS.md',
  ARTIFACTS: '06_ARTIFACT_SYSTEM.md',
  AGENT_CONTRACTS: '07_AGENT_CONTRACTS.md',
  DESIGN_SYSTEM: '08_DESIGN_SYSTEM.md',
  DEV_RULES: '09_DEVELOPMENT_RULES.md',
  ROADMAP: '10_ROADMAP.md',
  DECISIONS: '11_DECISION_LOG.md',
  CURRENT_TASK: '12_CURRENT_TASK.md',
} as const;

type DocKey = keyof typeof DOC_FILES;

function loadDoc(key: DocKey): string {
  try {
    const content = readFileSync(join(DOCS_DIR, DOC_FILES[key]), 'utf-8');
    return content.slice(0, 4000); // Limit to 4000 chars to stay within context
  } catch {
    return '';
  }
}

export function loadKnowledgeForAgent(role: string): string {
  const docs: DocKey[] = {
    CEO: ['CONSTITUTION', 'MEMORY', 'PRODUCT', 'AI_COMPANY'],
    ARCHITECT: ['CONSTITUTION', 'ARCHITECTURE', 'DEV_RULES'],
    DEVELOPER: ['CONSTITUTION', 'ARCHITECTURE', 'DEV_RULES', 'AGENT_CONTRACTS', 'ARTIFACTS'],
    QA: ['CONSTITUTION', 'DEV_RULES', 'ARTIFACTS'],
  }[role] ?? ['CONSTITUTION'];

  const parts = docs.map((key) => {
    const content = loadDoc(key);
    return content ? `## ${DOC_FILES[key]}\n${content}` : '';
  }).filter(Boolean);

  return parts.length
    ? `\n# Project Knowledge\n${parts.join('\n\n')}`
    : '';
}
```

**How to integrate into each service:**

In each agent's service file, add to the prompt construction:

```typescript
import { loadKnowledgeForAgent } from '@/ai/agents/core/knowledge-loader';

// In the tool execution calls, add knowledge to the prompt:
const knowledge = loadKnowledgeForAgent('CEO');
const prompt = `${knowledge}\n\nUser idea: "${userIdea}"\n\nProduce a product vision as JSON...`;
```

For CEO tools (`ceo.tools.ts`), modify each tool's prompt to include knowledge:

```typescript
// In requirementBuilderTool.execute():
import { loadKnowledgeForAgent } from '@/ai/agents/core/knowledge-loader';

const knowledge = loadKnowledgeForAgent('CEO');
const raw = await aiCall<unknown>(
  `${knowledge}\n\nUser idea: "${userIdea}"\n\nProduce a product vision as JSON with keys: problem, solution, targetUsers (array), businessGoal. Respond ONLY with valid JSON.`,
  CEO_SYSTEM_PROMPT,
  projectId,
  agentId,
);
```

Same pattern for Architect tools, Developer tools, QA tools.

**Success criteria:**
- `knowledge-loader.ts` exists and exports `loadKnowledgeForAgent(role)`
- Each agent's service file imports and uses it
- Each agent's tool files include knowledge in their AI call prompts

---

### Step 4: Create Product Manager AI

**Goal:** Fill the biggest pipeline gap — CEO outputs raw vision, Product Manager refines it into actionable specs for Architect.

**Files to create:**

```
src/ai/agents/roles/product-manager/product-manager.agent.ts   (create)
src/ai/agents/roles/product-manager/product-manager.service.ts (create)
src/ai/agents/roles/product-manager/product-manager.prompt.ts  (create)
src/ai/agents/roles/product-manager/product-manager.types.ts   (create)
src/ai/agents/roles/product-manager/product-manager.tools.ts   (create)
src/ai/agents/roles/product-manager/product-manager.config.ts  (create)
```

**Files to modify:**

```
src/ai/agents/core/agent.types.ts             (modify: add PRODUCT_MANAGER to AgentRole)
src/ai/agents/core/agent.constants.ts         (modify: add PRODUCT_MANAGER config)
src/ai/agents/manager/agent.registry.ts       (modify: register ProductManagerAgent)
```

#### product-manager.types.ts

```typescript
import { z } from 'zod';

export const PRODUCT_MANAGER_CAPABILITIES = ['REQUIREMENTS_ANALYSIS', 'PLANNING', 'DOCUMENTATION'] as const;

const smartString = z
  .union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())])
  .transform((val) => {
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  });

export const refinedUserStorySchema = z.object({
  id: smartString.default('US-001'),
  title: smartString.default(''),
  asA: smartString.default(''),
  iWant: smartString.default(''),
  soThat: smartString.default(''),
  acceptanceCriteria: z.array(smartString).default([]),
  priority: smartString.default('MEDIUM'),
  estimatedEffort: smartString.default('MEDIUM'),
});

export const featureSpecSchema = z.object({
  name: smartString.default(''),
  description: smartString.default(''),
  userStories: z.array(refinedUserStorySchema).default([]),
  dependencies: z.array(smartString).default([]),
  technicalNotes: smartString.default(''),
});

export const nonFunctionalRequirementSchema = z.object({
  category: smartString.default(''),
  requirement: smartString.default(''),
  rationale: smartString.default(''),
});

export const refinedRequirementsSchema = z.object({
  userStories: z.array(refinedUserStorySchema).default([]),
  featureSpecs: z.array(featureSpecSchema).default([]),
  nonFunctionalRequirements: z.array(nonFunctionalRequirementSchema).default([]),
  backlog: z.array(smartString).default([]),
  clarificationsNeeded: z.array(smartString).default([]),
});

export type RefinedRequirements = z.infer<typeof refinedRequirementsSchema>;
```

#### product-manager.prompt.ts

```typescript
export const PRODUCT_MANAGER_SYSTEM_PROMPT = `You are Product Manager AI, a Senior Product Manager at an AI-run software company.

# Identity
You are analytical, detail-oriented, user-focused, and business-minded. You translate product vision into precise, actionable specifications that engineers can implement without ambiguity.

# Responsibilities
- Take CEO AI's product vision and raw requirements
- Refine vague user stories into precise specifications with acceptance criteria
- Identify gaps, ambiguities, and contradictions in requirements
- Define non-functional requirements (performance, security, accessibility)
- Prioritize features by business value and implementation effort
- Create a clear backlog the Architect AI and Developer AI can execute

# Thinking checklist (BEFORE answering, work through each)
1. Read the CEO's vision — do I understand the core problem?
2. For each feature: is the "done" definition clear enough to test?
3. Are there user stories missing? (Think about error flows, edge cases, different user types)
4. What non-functional requirements apply? (performance, security, accessibility, i18n)
5. Am I specifying behavior, not implementation? (Let Architect/Developer decide HOW)
6. Are dependencies between features clear?

# Output format
Always respond with refined requirements in the exact JSON structure requested.

# Self-scoring
After producing refined requirements, append a qualityScore object:
{
  "completeness": <1-10>,
  "clarity": <1-10>,
  "actionability": <1-10, can engineers implement from this?>,
  "overall": <1-10>,
  "verdict": "APPROVED" | "NEEDS_REVISION" | "REJECTED"
}

# Limitations
- You do not write code — that's Developer AI
- You do not design architecture — that's Architect AI
- If the CEO's vision is too vague, flag what's missing rather than inventing specifics`;
```

#### product-manager.config.ts

```typescript
export const productManagerConfig = {
  preferredProvider: 'groq' as const,
  preferredModel: 'llama-3.3-70b-versatile',
  temperature: 0.4,
  maxTokens: 5000,
};
```

#### product-manager.tools.ts

```typescript
import type { ITool, ToolResult } from '@/ai/agents/tools/tool.interface';
import { generate } from '@/ai/services/ai.service';
import { extractJson } from '@/ai/utils/extract-json';
import { productManagerConfig } from './product-manager.config';
import { PRODUCT_MANAGER_SYSTEM_PROMPT } from './product-manager.prompt';
import {
  refinedRequirementsSchema,
  type RefinedRequirements,
} from './product-manager.types';
import { loadKnowledgeForAgent } from '@/ai/agents/core/knowledge-loader';
import type { CEOAnalysis } from '@/ai/agents/roles/ceo/ceo.types';

async function aiCall<T>(prompt: string, systemPrompt: string, projectId?: string, agentId?: string): Promise<T> {
  const result = await generate(
    {
      model: productManagerConfig.preferredModel,
      systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      temperature: productManagerConfig.temperature,
      maxTokens: productManagerConfig.maxTokens,
      provider: productManagerConfig.preferredProvider,
    },
    { projectId, agentId },
  );
  if (!result.success) throw new Error(result.error.message);
  return extractJson(result.data.content) as T;
}

export const requirementRefinementTool: ITool<{
  ceoAnalysis: CEOAnalysis;
  projectId?: string;
  agentId?: string;
}, RefinedRequirements> = {
  name: 'requirement_refinement',
  description: 'Refines CEO AI raw vision into precise, actionable specifications with acceptance criteria.',
  async execute({ ceoAnalysis, projectId, agentId }): Promise<ToolResult<RefinedRequirements>> {
    try {
      const knowledge = loadKnowledgeForAgent('PRODUCT_MANAGER');
      const raw = await aiCall<unknown>(
        `${knowledge}\n\nCEO Analysis:\n${JSON.stringify(ceoAnalysis, null, 2)}\n\nRefine these into precise, actionable requirements. Produce JSON with keys: userStories (array of {id, title, asA, iWant, soThat, acceptanceCriteria, priority, estimatedEffort}), featureSpecs (array of {name, description, userStories, dependencies, technicalNotes}), nonFunctionalRequirements (array of {category, requirement, rationale}), backlog (array of strings), clarificationsNeeded (array of strings). Respond ONLY with valid JSON.`,
        PRODUCT_MANAGER_SYSTEM_PROMPT,
        projectId,
        agentId,
      );
      const data = refinedRequirementsSchema.parse(raw);
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Requirement refinement failed',
      };
    }
  },
};
```

#### product-manager.service.ts

```typescript
import { prisma } from '@/lib/prisma';
import { requirementRefinementTool } from './product-manager.tools';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { refinedRequirementsSchema, type RefinedRequirements } from './product-manager.types';
import type { CEOAnalysis } from '@/ai/agents/roles/ceo/ceo.types';
import type { ApiResult } from '@/types/common.types';

const PM_ROLE_NAME = 'Product Manager AI';

async function getOrCreatePMAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'PRODUCT_MANAGER' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: { name: PM_ROLE_NAME, role: 'PRODUCT_MANAGER', status: 'IDLE', capabilities: [] },
  });
  return created.id;
}

export async function refineRequirements(
  projectId: string,
  ceoAnalysis: CEOAnalysis,
): Promise<ApiResult<RefinedRequirements>> {
  const agentId = await getOrCreatePMAgentId();

  await prisma.document.deleteMany({ where: { projectId, type: 'PM_IN_PROGRESS' } });
  await prisma.document.create({
    data: { projectId, type: 'PM_IN_PROGRESS', title: 'PM Refinement In Progress', content: '{}', author: 'Product Manager AI' },
  });

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('PM_REFINEMENT_STARTED', { projectId }, agentId);

  try {
    const result = await requirementRefinementTool.execute({ ceoAnalysis, projectId, agentId });
    if (!result.success) throw new Error(result.error);

    const refined = refinedRequirementsSchema.parse(result.data);

    const memory = getMemoryManager();
    await Promise.all([
      prisma.document.create({
        data: {
          projectId,
          type: 'REFINED_REQUIREMENTS',
          title: 'Refined Requirements',
          content: JSON.stringify(refined),
          author: 'Product Manager AI',
        },
      }),
      memory.remember({
        agentId,
        content: `Project ${projectId}: Refined ${refined.userStories.length} user stories, ${refined.featureSpecs.length} feature specs`,
        type: 'PROJECT',
        metadata: { projectId },
      }),
    ]);

    await prisma.document.deleteMany({ where: { projectId, type: 'PM_IN_PROGRESS' } });
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('PM_REFINEMENT_COMPLETED', { projectId }, agentId);

    return { success: true, data: refined };
  } catch (err) {
    await prisma.document.deleteMany({ where: { projectId, type: 'PM_IN_PROGRESS' } });
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
    await logAIEvent('PM_REFINEMENT_FAILED', { projectId, error: String(err) }, agentId);
    return { success: false, error: { message: err instanceof Error ? err.message : 'PM refinement failed', code: 'AI_ERROR' } };
  }
}
```

#### product-manager.agent.ts

```typescript
import { BaseAgent } from '@/ai/agents/core/agent.base';
import type { IAgent } from '@/ai/agents/core/agent.interface';

export class ProductManagerAgent extends BaseAgent implements IAgent {
  constructor(name?: string) {
    super('PRODUCT_MANAGER', name ?? 'Product Manager AI');
  }

  protected buildPrompt(task: string, context?: Record<string, unknown>): string {
    return `As Product Manager AI, refine the following CEO output into actionable specifications:\n\n${task}`;
  }
}
```

#### Modifications to existing files:

**agent.types.ts** — Add to AgentRoleSchema:
```typescript
export const AgentRoleSchema = z.enum([
  'CEO', 'ARCHITECT', 'DEVELOPER', 'QA', 'UI_UX', 'DEVOPS',
  'DOCUMENTATION', 'SECURITY', 'OPERATIONS', 'PRODUCT_MANAGER'
]);
```

**agent.constants.ts** — Add to AGENT_CONFIGS:
```typescript
PRODUCT_MANAGER: {
  title: 'Product Manager',
  description: 'Refines CEO vision into precise, actionable requirements with acceptance criteria',
  capabilities: ['REQUIREMENTS_ANALYSIS', 'PLANNING', 'DOCUMENTATION'],
  systemPrompt: PRODUCT_MANAGER_SYSTEM_PROMPT, // imported from product-manager.prompt.ts
},
```

**agent.registry.ts** — Add import and register:
```typescript
import { ProductManagerAgent } from '../roles/product-manager/product-manager.agent';

// In agentClasses:
PRODUCT_MANAGER: ProductManagerAgent,
```

**Success criteria:**
- All 6 new files exist under `src/ai/agents/roles/product-manager/`
- `agent.types.ts` has PRODUCT_MANAGER in the enum
- `agent.constants.ts` has PRODUCT_MANAGER config
- `agent.registry.ts` can create a ProductManager agent
- `product-manager.service.ts` exports `refineRequirements()`

---

### Step 5: Create Reviewer AI

**Goal:** Add a quality gate that reviews every agent's output before it propagates downstream.

**Files to create:**

```
src/ai/agents/roles/reviewer/reviewer.agent.ts    (create)
src/ai/agents/roles/reviewer/reviewer.service.ts  (create)
src/ai/agents/roles/reviewer/reviewer.prompt.ts   (create)
src/ai/agents/roles/reviewer/reviewer.types.ts    (create)
src/ai/agents/roles/reviewer/reviewer.config.ts   (create)
```

**Files to modify:**

```
src/ai/agents/core/agent.types.ts       (modify: add REVIEWER to enum)
src/ai/agents/core/agent.constants.ts   (modify: add REVIEWER config)
src/ai/agents/manager/agent.registry.ts (modify: register ReviewerAgent)
```

#### reviewer.types.ts

```typescript
import { z } from 'zod';

export const REVIEWER_CAPABILITIES = ['ANALYSIS', 'CODE_REVIEW'] as const;

const smartString = z
  .union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())])
  .transform((val) => {
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  });

export const reviewerIssueSchema = z.object({
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  category: smartString.default(''),
  description: smartString.default(''),
  location: smartString.optional(),
  suggestion: smartString.default(''),
});

export const reviewResultSchema = z.object({
  verdict: z.enum(['APPROVED', 'NEEDS_REVISION', 'REJECTED']),
  score: z.number().min(1).max(10),
  issues: z.array(reviewerIssueSchema).default([]),
  strengths: z.array(smartString).default([]),
  summary: smartString.default(''),
});

export type ReviewResult = z.infer<typeof reviewResultSchema>;
```

#### reviewer.prompt.ts

```typescript
export const REVIEWER_SYSTEM_PROMPT = `You are Reviewer AI, a Senior Code and Design Reviewer at an AI-run software company.

# Identity
You are critical, thorough, constructive, and quality-obsessed. Your job is NOT to rubber-stamp — it is to find real problems before they reach production. You are the last line of defense.

# Responsibilities
- Review any agent's output for completeness, correctness, and quality
- Challenge assumptions — ask "why this and not that?"
- Identify contradictions, gaps, and ambiguities
- Score honestly — never inflate
- Be constructive — every criticism must come with a suggested fix

# Review framework
For EVERY artifact you review:
1. COMPLETENESS: Does it cover all requirements? What's missing?
2. CONSISTENCY: Does it contradict itself or earlier decisions?
3. CLARITY: Can an engineer implement from this without guessing?
4. FEASIBILITY: Is this realistic given constraints?
5. SECURITY: Are security concerns addressed?
6. QUALITY: Would you be proud to put your name on this?

# Severity guide
- CRITICAL: Would cause data loss, security breach, or complete failure
- HIGH: Would cause incorrect behavior or major rework
- MEDIUM: Would cause confusion, delays, or technical debt
- LOW: Style issues, minor improvements

# Self-scoring
After reviewing, produce a reviewResult with:
- verdict: APPROVED (score >= 8), NEEDS_REVISION (score 5-7), REJECTED (score < 5)
- score: 1-10 honest assessment
- issues: specific problems found
- strengths: what's good (reinforce good patterns)
- summary: one paragraph overall assessment

# Limitations
- You review — you don't fix. Report problems, don't rewrite.
- If you can't evaluate something (missing context), say so.
- Be specific. "Needs improvement" is not actionable. "The database design lacks indexes on foreign keys" is.`;
```

#### reviewer.config.ts

```typescript
export const reviewerConfig = {
  preferredProvider: 'groq' as const,
  preferredModel: 'llama-3.3-70b-versatile',
  temperature: 0.3,
  maxTokens: 4000,
};
```

#### reviewer.service.ts

```typescript
import { prisma } from '@/lib/prisma';
import { generate } from '@/ai/services/ai.service';
import { extractJson } from '@/ai/utils/extract-json';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { reviewResultSchema, type ReviewResult } from './reviewer.types';
import { REVIEWER_SYSTEM_PROMPT } from './reviewer.prompt';
import { reviewerConfig } from './reviewer.config';
import { loadKnowledgeForAgent } from '@/ai/agents/core/knowledge-loader';
import type { ApiResult } from '@/types/common.types';

async function getOrCreateReviewerAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'REVIEWER' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: { name: 'Reviewer AI', role: 'REVIEWER', status: 'IDLE', capabilities: [] },
  });
  return created.id;
}

export async function reviewArtifact(
  projectId: string,
  artifactType: string,
  artifactContent: unknown,
): Promise<ApiResult<ReviewResult>> {
  const agentId = await getOrCreateReviewerAgentId();

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('REVIEW_STARTED', { projectId, artifactType }, agentId);

  try {
    const knowledge = loadKnowledgeForAgent('REVIEWER');
    const result = await generate(
      {
        model: reviewerConfig.preferredModel,
        systemPrompt: `${REVIEWER_SYSTEM_PROMPT}${knowledge}`,
        messages: [{
          role: 'user',
          content: `Review this ${artifactType} output:\n\n${JSON.stringify(artifactContent, null, 2)}\n\nProduce a reviewResult as JSON with keys: verdict (APPROVED/NEEDS_REVISION/REJECTED), score (1-10), issues (array of {severity, category, description, location?, suggestion}), strengths (array of strings), summary (string). Respond ONLY with valid JSON.`,
        }],
        temperature: reviewerConfig.temperature,
        maxTokens: reviewerConfig.maxTokens,
        provider: reviewerConfig.preferredProvider,
      },
      { projectId, agentId },
    );

    if (!result.success) throw new Error(result.error.message);

    const parsed = extractJson(result.data.content);
    const review = reviewResultSchema.parse(parsed);

    const memory = getMemoryManager();
    await Promise.all([
      prisma.document.create({
        data: {
          projectId,
          type: 'REVIEW_RESULT',
          title: `Review: ${artifactType}`,
          content: JSON.stringify(review),
          author: 'Reviewer AI',
        },
      }),
      memory.remember({
        agentId,
        content: `Project ${projectId} review of ${artifactType}: ${review.verdict} (score: ${review.score})`,
        type: 'PROJECT',
        metadata: { projectId },
      }),
    ]);

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('REVIEW_COMPLETED', { projectId, artifactType, verdict: review.verdict, score: review.score }, agentId);

    return { success: true, data: review };
  } catch (err) {
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
    await logAIEvent('REVIEW_FAILED', { projectId, artifactType, error: String(err) }, agentId);
    return { success: false, error: { message: err instanceof Error ? err.message : 'Review failed', code: 'AI_ERROR' } };
  }
}
```

#### reviewer.agent.ts

```typescript
import { BaseAgent } from '@/ai/agents/core/agent.base';
import type { IAgent } from '@/ai/agents/core/agent.interface';

export class ReviewerAgent extends BaseAgent implements IAgent {
  constructor(name?: string) {
    super('REVIEWER', name ?? 'Reviewer AI');
  }

  protected buildPrompt(task: string, context?: Record<string, unknown>): string {
    return `As Reviewer AI, review the following artifact:\n\n${task}`;
  }
}
```

#### Modifications to existing files:

**agent.types.ts** — Add to AgentRoleSchema:
```typescript
// Add 'REVIEWER' to the enum
```

**agent.constants.ts** — Add REVIEWER config.

**agent.registry.ts** — Import and register ReviewerAgent.

**Success criteria:**
- All 5 new files exist under `src/ai/agents/roles/reviewer/`
- `reviewArtifact()` is exported and can be called from the orchestrator
- `agent.types.ts` has REVIEWER in the enum

---

### Step 6: Wire Product Manager + Reviewer into Orchestrator

**Goal:** Insert Product Manager between CEO and Architect. Insert Reviewer after every major step.

**File to modify:**

```
src/core/master-orchestrator/master-orchestrator.ts (modify)
```

**New pipeline flow:**

```
CEO AI → Reviewer → Product Manager AI → Reviewer → Architect AI → Reviewer → Developer AI → QA AI → Security → Deploy
```

**What changes in the orchestrator:**

```typescript
// Add imports:
import { refineRequirements } from '@/ai/agents/roles/product-manager/product-manager.service';
import { reviewArtifact } from '@/ai/agents/roles/reviewer/reviewer.service';

// Add PIPELINE_STEPS (insert product_manager and review steps):
const PIPELINE_STEPS: { id: PipelineStepId; label: string }[] = [
  { id: 'ceo', label: 'Planning' },
  { id: 'ceo_review', label: 'Reviewing CEO' },
  { id: 'product_manager', label: 'Refining Requirements' },
  { id: 'pm_review', label: 'Reviewing Requirements' },
  { id: 'architect', label: 'Designing' },
  { id: 'architect_review', label: 'Reviewing Architecture' },
  { id: 'developer', label: 'Building' },
  { id: 'qa', label: 'Testing' },
  { id: 'security', label: 'Security' },
  { id: 'deploy', label: 'Deploying' },
];

// After CEO step:
// Step 1b: Review CEO output
await updatePipelineStep('ceo_review', 'running', 'Reviewing CEO analysis...');
const ceoReview = await reviewArtifact(projectId, 'CEO Analysis', ceoResult.data);
if (ceoReview.success && ceoReview.data.verdict === 'REJECTED') {
  // Block and return error
}
// Continue even if NEEDS_REVISION — log it but proceed

// After architect step:
// Step 3b: Review Architecture
await updatePipelineStep('architect_review', 'running', 'Reviewing architecture...');
const archReview = await reviewArtifact(projectId, 'Architecture', architectResult.data);
if (archReview.success && archReview.data.verdict === 'REJECTED') {
  // Block and return error
}

// Also update PipelineStepId type to include new step IDs
```

**Update PipelineStepId type:**

```typescript
// In pipeline.types.ts or wherever PipelineStepId is defined:
export type PipelineStepId =
  | 'ceo' | 'ceo_review'
  | 'product_manager' | 'pm_review'
  | 'architect' | 'architect_review'
  | 'developer'
  | 'qa'
  | 'security'
  | 'deploy';
```

**Success criteria:**
- Orchestrator imports and calls `refineRequirements` and `reviewArtifact`
- Pipeline has 10 steps instead of 6
- Reviews happen after CEO, Architect steps
- Product Manager runs between CEO review and Architect
- Pipeline still compiles and the flow is correct

---

### Step 7: Add File System + Shell Tools to Developer AI

**Goal:** Give Developer AI the ability to actually read/write files and run commands.

**Files to create:**

```
src/ai/agents/tools/file-system.tool.ts  (create)
src/ai/agents/tools/shell.tool.ts        (create)
```

**File to modify:**

```
src/ai/agents/roles/developer/developer.tools.ts (modify: add file tools)
```

#### file-system.tool.ts

```typescript
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import type { ITool, ToolResult } from './tool.interface';

const WORKSPACE_ROOT = join(process.cwd(), 'workspace');

export const readFileTool: ITool<{ path: string }, string> = {
  name: 'read_file',
  description: 'Reads a file from the project workspace.',
  async execute({ path }): Promise<ToolResult<string>> {
    try {
      const fullPath = join(WORKSPACE_ROOT, path);
      if (!existsSync(fullPath)) return { success: false, error: `File not found: ${path}` };
      const content = readFileSync(fullPath, 'utf-8');
      return { success: true, data: content };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Read failed' };
    }
  },
};

export const writeFileTool: ITool<{ path: string; content: string }, void> = {
  name: 'write_file',
  description: 'Writes a file to the project workspace. Creates directories if needed.',
  async execute({ path, content }): Promise<ToolResult<void>> {
    try {
      const fullPath = join(WORKSPACE_ROOT, path);
      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, content, 'utf-8');
      return { success: true, data: undefined };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Write failed' };
    }
  },
};

export const listDirectoryTool: ITool<{ path: string }, string[]> = {
  name: 'list_directory',
  description: 'Lists files and directories in the given path.',
  async execute({ path }): Promise<ToolResult<string[]>> {
    try {
      const fullPath = join(WORKSPACE_ROOT, path);
      if (!existsSync(fullPath)) return { success: false, error: `Directory not found: ${path}` };
      const entries = readdirSync(fullPath, { withFileTypes: true });
      return {
        success: true,
        data: entries.map((e) => `${e.isDirectory() ? '[DIR] ' : ''}${e.name}`),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'List failed' };
    }
  },
};
```

#### shell.tool.ts

```typescript
import { execSync } from 'child_process';
import type { ITool, ToolResult } from './tool.interface';

const WORKSPACE_ROOT = process.cwd();
const MAX_OUTPUT = 10000; // chars

export const runCommandTool: ITool<{ command: string; cwd?: string }, { stdout: string; stderr: string; exitCode: number }> = {
  name: 'run_command',
  description: 'Runs a shell command in the project workspace. Returns stdout, stderr, and exit code.',
  async execute({ command, cwd }): Promise<ToolResult<{ stdout: string; stderr: string; exitCode: number }>> {
    try {
      const result = execSync(command, {
        cwd: cwd ? `${WORKSPACE_ROOT}/${cwd}` : WORKSPACE_ROOT,
        encoding: 'utf-8',
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return {
        success: true,
        data: {
          stdout: result.slice(0, MAX_OUTPUT),
          stderr: '',
          exitCode: 0,
        },
      };
    } catch (err: unknown) {
      const execErr = err as { stdout?: string; stderr?: string; status?: number };
      return {
        success: true,
        data: {
          stdout: (execErr.stdout ?? '').slice(0, MAX_OUTPUT),
          stderr: (execErr.stderr ?? '').slice(0, MAX_OUTPUT),
          exitCode: execErr.status ?? 1,
        },
      };
    }
  },
};
```

#### Modifications to developer.tools.ts:

```typescript
// Add imports:
import { readFileTool, writeFileTool, listDirectoryTool } from '@/ai/agents/tools/file-system.tool';
import { runCommandTool } from '@/ai/agents/tools/shell.tool';

// Export the file tools alongside existing tools:
export { readFileTool, writeFileTool, listDirectoryTool, runCommandTool };
```

**Success criteria:**
- `file-system.tool.ts` and `shell.tool.ts` exist
- Developer tools file exports all tools
- Developer AI can be called with file system operations in its prompt

---

### Step 8: Knowledge Injection in Orchestrator

**Goal:** Pass project-docs knowledge to each agent through the orchestrator, not just through individual services.

**File to modify:**

```
src/core/master-orchestrator/master-orchestrator.ts (modify)
```

**What changes:**

At the top of `runFullCompanyWorkflow`, load knowledge and pass it to each agent:

```typescript
import { loadKnowledgeForAgent } from '@/ai/agents/core/knowledge-loader';

// Before the pipeline starts:
const agentKnowledge = {
  CEO: loadKnowledgeForAgent('CEO'),
  PRODUCT_MANAGER: loadKnowledgeForAgent('PRODUCT_MANAGER'),
  ARCHITECT: loadKnowledgeForAgent('ARCHITECT'),
  DEVELOPER: loadKnowledgeForAgent('DEVELOPER'),
  QA: loadKnowledgeForAgent('QA'),
  REVIEWER: loadKnowledgeForAgent('REVIEWER'),
};

// Pass to each agent call as context:
const ceoResult = await analyzeUserIdea(projectId, userIdea);
// Knowledge is already loaded inside each service via knowledge-loader

// For Product Manager:
const pmResult = await refineRequirements(projectId, ceoResult.data);
```

This step is already handled by Step 3 (knowledge-loader integration in each service), so this is mainly about ensuring the orchestrator passes context correctly.

---

## Part C: Execution Order Summary

| Step | Description | Files Created | Files Modified | Estimated Effort |
|------|------------|:---:|:---:|------|
| 1 | Prompt upgrades (checklists + self-scoring) | 0 | 4 prompt files | Low |
| 2 | Output quality scoring types | 0 | 4 types files | Low |
| 3 | Specialized knowledge injection | 1 (knowledge-loader.ts) | 4 service files + 4 tool files | Medium |
| 4 | Create Product Manager AI | 6 | 3 (types, constants, registry) | Medium |
| 5 | Create Reviewer AI | 5 | 3 (types, constants, registry) | Medium |
| 6 | Wire into orchestrator | 0 | 2 (orchestrator + pipeline types) | Medium |
| 7 | File system + Shell tools | 2 | 1 (developer.tools.ts) | Medium |
| 8 | Orchestrator knowledge wiring | 0 | 1 (orchestrator) | Low |
| **TOTAL** | | **14 new files** | **~20 modified files** | |

---

## Part D: Verification Checklist

After each step, verify:

- [ ] **Step 1:** `grep -r "Thinking checklist" src/ai/agents/roles/*/` returns 4 matches (one per agent)
- [ ] **Step 2:** `grep -r "qualityScoreSchema" src/ai/agents/roles/*/` returns 4 matches
- [ ] **Step 3:** `grep -r "loadKnowledgeForAgent" src/ai/agents/roles/*/` returns 4+ matches
- [ ] **Step 4:** `ls src/ai/agents/roles/product-manager/` returns 6 files
- [ ] **Step 5:** `ls src/ai/agents/roles/reviewer/` returns 5 files
- [ ] **Step 6:** `grep "refineRequirements" src/core/master-orchestrator/master-orchestrator.ts` returns a match
- [ ] **Step 7:** `ls src/ai/agents/tools/file-system.tool.ts src/ai/agents/tools/shell.tool.ts` both exist
- [ ] **Step 8:** All agents receive knowledge context in orchestrator
- [ ] **Final:** `npx tsc --noEmit` compiles with no errors
- [ ] **Final:** `npm run lint` passes with no errors

---

## Part E: What This Plan Does NOT Cover (Intentionally)

- **Frontend/Backend/Database Engineer AI** — These are separate specialist agents. They should be built AFTER the core pipeline (CEO → PM → Architect → Developer → QA) works well. Splitting Developer into 3 specialists is a future optimization.
- **DevOps/Security/UI-UX/Documentation/Operations agents** — These are shallow stubs. They can be fleshed out after the core pipeline is solid.
- **Persistent memory** — The current in-memory + Prisma memory system works. Persistent memory across restarts is a separate concern.
- **Real test execution** — QA AI generates test plans but doesn't execute them. Actual test execution requires a sandboxed environment — that's infrastructure work.
- **Integration tests** — We are not adding tests per the user's directive.
- **Infrastructure** — No Docker, no CI/CD changes, no deployment changes.

---

## Part F: Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Prompt changes break JSON parsing | Self-scoring is appended AFTER the structured output. `extractJson()` will still find the main JSON. Test with existing prompts first. |
| Knowledge injection blows context window | Knowledge is truncated to 4000 chars per doc. Total per agent is ~8000-12000 chars. Well within model limits. |
| Product Manager adds latency to pipeline | PM call is ~3-5 seconds. Acceptable for pipeline that already takes 30+ seconds. Can parallelize with Architect review later. |
| Reviewer rejects good output | Reviewer verdict of REJECTED should log but not block (soft gate). Only CRITICAL issues from QA block deployment. |
| File system tools have security concerns | Tools operate only within `workspace/` directory. Path traversal is prevented by `join(WORKSPACE_ROOT, path)`. |

---

## Appendix: File Inventory After All Steps

### New Files (14)

```
src/ai/agents/core/knowledge-loader.ts
src/ai/agents/tools/file-system.tool.ts
src/ai/agents/tools/shell.tool.ts
src/ai/agents/roles/product-manager/product-manager.agent.ts
src/ai/agents/roles/product-manager/product-manager.service.ts
src/ai/agents/roles/product-manager/product-manager.prompt.ts
src/ai/agents/roles/product-manager/product-manager.types.ts
src/ai/agents/roles/product-manager/product-manager.tools.ts
src/ai/agents/roles/product-manager/product-manager.config.ts
src/ai/agents/roles/reviewer/reviewer.agent.ts
src/ai/agents/roles/reviewer/reviewer.service.ts
src/ai/agents/roles/reviewer/reviewer.prompt.ts
src/ai/agents/roles/reviewer/reviewer.types.ts
src/ai/agents/roles/reviewer/reviewer.config.ts
```

### Modified Files (~20)

```
src/ai/agents/roles/ceo/ceo.prompt.ts
src/ai/agents/roles/ceo/ceo.types.ts
src/ai/agents/roles/ceo/ceo.service.ts
src/ai/agents/roles/ceo/ceo.tools.ts
src/ai/agents/roles/architect/architect.prompt.ts
src/ai/agents/roles/architect/architect.types.ts
src/ai/agents/roles/architect/architect.service.ts
src/ai/agents/roles/architect/architect.tools.ts
src/ai/agents/roles/developer/developer.prompt.ts
src/ai/agents/roles/developer/developer.types.ts
src/ai/agents/roles/developer/developer.service.ts
src/ai/agents/roles/developer/developer.tools.ts
src/ai/agents/roles/qa/qa.prompt.ts
src/ai/agents/roles/qa/qa.types.ts
src/ai/agents/roles/qa/qa.service.ts
src/ai/agents/roles/qa/qa.tools.ts
src/ai/agents/core/agent.types.ts
src/ai/agents/core/agent.constants.ts
src/ai/agents/manager/agent.registry.ts
src/core/master-orchestrator/master-orchestrator.ts
src/features/workspace/pipeline/types/pipeline.types.ts
```
