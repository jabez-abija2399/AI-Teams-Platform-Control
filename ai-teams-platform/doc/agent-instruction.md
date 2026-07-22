# Agent Instruction: Create Implementation Plan

## Your Task

You are an OpenCode agent. Your ONLY job is to read all project documentation and create a comprehensive implementation plan file at `doc/implementationplan.md`.

## Instructions

### Step 1: Read Everything

Read these files and directories to understand the full project:

1. **Project structure:** `ls -la src/features/` — list all 33 feature modules
2. **AI agents:** Read all files in `src/ai/agents/roles/` — CEO, Architect, Developer, QA
3. **AI gateway:** Read `src/ai/gateway/ai.gateway.ts` — how AI calls work
4. **Prisma schema:** Read `prisma/schema.prisma` — all 100+ database models
5. **Workspace shell:** Read `src/features/workspace/components/workspace-shell.tsx`
6. **Editor:** Read `src/features/editor/components/editor-container.tsx`
7. **Deployment:** Read `src/features/deployment/services/deployment.service.ts`
8. **Onboarding:** Read `src/features/onboarding/components/onboarding-flow.tsx`
9. **Dashboard:** Read `src/app/dashboard/projects/[id]/page.tsx`
10. **All API routes:** `find src/app/api -name "route.ts"` — list all endpoints
11. **Types:** Read `src/types/common.types.ts`
12. **Auth:** Read `src/lib/auth.ts`

### Step 2: Analyze Gaps

For each feature module, ask:
- Is it fully implemented or a placeholder?
- What UI components exist vs what's missing?
- What services are connected vs stubbed?
- What would make this feature amazing for users?

### Step 3: Research Best Practices

Search the web for:
- "best AI code editor features 2026"
- "VS Code Copilot features list"
- "Cursor AI editor features"
- "best developer experience tools"
- "AI-powered software development platform features"

### Step 4: Create the Plan

Write `doc/implementationplan.md` with this structure:

```
# AI Teams Platform — Implementation Plan

## Executive Summary
(2-3 paragraphs about the current state and what features will make it the best)

## Current Feature Inventory
(Table of all 33 modules, their status: complete/placeholder/missing)

## Gap Analysis
(What's missing that competitors have)

## Feature Proposals (20 features)
For each feature:
- Feature name
- Why it matters (user impact)
- What to build (components, services, API routes)
- Files to create
- Files to modify
- Implementation complexity (Low/Medium/High)

## Priority Matrix
(Table: Feature | Impact | Effort | Priority | Phase)

## Implementation Order
(Week-by-week plan)

## Technical Architecture Notes
(How key features should work architecturally)
```

### Step 5: Save and Verify

1. Save the file at `doc/implementationplan.md`
2. Verify the file exists: `ls -la doc/implementationplan.md`
3. Report back what you created

## Rules

- Do NOT modify any existing source code
- Do NOT create any new source code files
- Do NOT run the dev server or build
- ONLY create the `doc/implementationplan.md` file
- Be thorough — this plan drives the entire product roadmap
- Think from the user's perspective — what would make them say "wow"?
- Consider what makes this platform better than Cursor, GitHub Copilot, Replit, and Vercel v0
