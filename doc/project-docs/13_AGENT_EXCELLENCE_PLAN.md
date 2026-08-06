# AI Teams Platform
# Agent Excellence Plan


Version: 1.0

Last Updated: 2026-08-05


# Goal


Make every pipeline agent reliably produce **correct, user-aligned deliverables** — never invent stacks the user rejected, never stall Mission Control, always persist to the DB and Explorer.


# Universal rules (all agents)


1. **Lean-first** — return a solid heuristic package immediately; optional LLM enrichment in background only.
2. **Obey revision feedback** — parse intent (stack, scope, no-backend) and reshape output; never only append a revision note.
3. **Heartbeat** — pulse generation heartbeat at phase start and before long work so UI never shows false “Stalled”.
4. **Persist** — write artifacts/documents + workflow progress to Prisma; Development always `syncFilesToWorkspace`.
5. **Contract** — each agent has Inputs → Output schema → Quality bar → Failure fallback.


---


# Per-agent deep plan


## 1. Product Discovery

| | |
|--|--|
| **Job** | Turn raw idea into a tight product brief |
| **Inputs** | User idea + revision feedback |
| **Output** | ProductSpecification (name, vision, MVP features ≤4 for simple ideas) |
| **Quality bar** | Scope matches request; auth-only ideas stay auth-only |
| **Done when** | Heuristic (or enriched) spec stored; clarification questions only if needed |
| **Next upgrades** | Intent classifier (auth / ecommerce / saas); reject scope creep in sanitize |


## 2. Clarification

| | |
|--|--|
| **Job** | Ask only blocking questions |
| **Inputs** | ProductSpecification |
| **Output** | Clarified spec + answers |
| **Quality bar** | ≤3 questions; defaults applied for autopilot |
| **Next upgrades** | Skip phase when confidence high |


## 3. Proposal

| | |
|--|--|
| **Job** | Sellable proposal for approval |
| **Inputs** | Clarified spec |
| **Output** | Product proposal artifact |
| **Quality bar** | Readable for non-technical owners |
| **Next upgrades** | Diff view when regenerated |


## 4. CEO / Strategy

| | |
|--|--|
| **Job** | Vision + requirements + plan |
| **Status** | Lean-first heuristic + optional LLM enrich |
| **Quality bar** | Features mirror Discovery MVP; no stack invention |
| **Next upgrades** | Pass stack constraints (HTML-only) into vision constraints |


## 5. Product Manager

| | |
|--|--|
| **Job** | Refined stories + feature specs (~25% pipeline) |
| **Status** | Lean-first (was the stall root cause) |
| **Quality bar** | Stories map 1:1 to approved scope |
| **Next upgrades** | Acceptance criteria in Gherkin when BA follows |


## 6. Business Analyst

| | |
|--|--|
| **Job** | SRS / functional specs |
| **Status** | Lean-first |
| **Quality bar** | Respects HTML/CSS / no-backend feedback |
| **Next upgrades** | Traceability matrix Story → Spec → Test |


## 7. UI Designer

| | |
|--|--|
| **Job** | Screens, flows, tokens |
| **Status** | Lean-first |
| **Quality bar** | For static HTML: wireframes for login/signup/home only |
| **Next upgrades** | Emit CSS variable tokens Yacht Club-aligned |


## 8. Architect  ★ critical for your case

| | |
|--|--|
| **Job** | Technical architecture for approval |
| **Status** | HTML/CSS + **static no-backend** path (no invented Express/DB) |
| **Quality bar** | If user says “HTML/CSS only, no backend” → backend/database = None |
| **Next upgrades** | Architecture checklist UI: Frontend / Backend / DB each explicit |
| **User action now** | Request changes once more → new architecture should show None for backend |


## 9. Executive Planning

| | |
|--|--|
| **Job** | Milestones / work order |
| **Quality bar** | Tasks match architecture stack |
| **Next upgrades** | Skip framework tasks when static HTML |


## 10. Software Engineering (Developer)

| | |
|--|--|
| **Job** | Real files in Explorer |
| **Status** | Static HTML package (`login.html`, `signup.html`, `home.html`, `css/styles.css`) when architecture/feedback says so; else Next.js scaffold |
| **Quality bar** | Files match approved architecture; always synced to DB |
| **Next upgrades** | Delete conflicting Next.js files when regenerating as static |


## 11. QA

| | |
|--|--|
| **Job** | Test plan / review |
| **Quality bar** | For static: manual checklist (open pages, form links) not Jest/Next |
| **Next upgrades** | Playwright smoke for static servers |


## 12. Review Committee

| | |
|--|--|
| **Job** | Code/doc review score |
| **Next upgrades** | Fail if stack contradicts Architecture Approval |


## 13. Security

| | |
|--|--|
| **Job** | Security notes |
| **Quality bar** | Static demo → state “no server auth”; don’t invent bcrypt/session plans unless backend exists |


## 14. DevOps / Preview

| | |
|--|--|
| **Job** | Preview plan; Deploy is **user-triggered only** |
| **Quality bar** | Static: serve folder / open HTML; never auto-deploy |
| **Next upgrades** | Preview prefers `index.html` / `login.html` |


---


# Implementation order (recommended)


1. **Done** — Static architecture + Developer HTML files + revision detectors  
2. **Done** — Review Committee rejects stack mismatches (`detectStackMismatch`)  
3. **Done** — Designer/QA/Security/DevOps stack-aware heuristics via `resolveStackIntent`  
4. **Done** — CEO/PM forward stack constraints from idea + feedback  
5. **Done** — Preview prefers `index.html` / `login.html`; skips Next seed when HTML exists  
6. **Done** — Eval harness: `tests/agents/agent-excellence-static-html.test.ts`  
7. **Done** — Executive planner skips Prisma/API milestones for static-html  
8. **Done** — World-class charter injected into every `aiCall` / stream (`world-class-charter.ts`)  
9. **Done** — Quality scoring helper + tests (`output-quality.ts`, `agent-excellence-quality.test.ts`)  
10. **Done** — All roles load `14_AGENT_QUALITY_STANDARD.md` via knowledge-loader  
11. **Done** — Studio vibe: stack-aware Preview (user confirms HTML/CSS · React · Next), smoke check, constraint memory, Accept/Reject  
12. **Done** — Preview no longer forces static-first or Next scaffold; `POST /api/projects/[id]/stack` saves choice  


# Better-than-hire bar


Each role charter in `world-class-charter.ts` encodes senior+ expectations.
Universal rules: obey user constraints, be concrete, ship MVP, handoff-ready, never invent forbidden stacks.


# Canonical modules


- `src/core/company-orchestration/stack-intent.ts` — stack resolution from text  
- `src/core/project-stack/stack-catalog.ts` — stack catalog + file detection  
- `src/core/project-stack/project-stack.service.ts` — user confirm / clear  
- `src/core/memory/persist-stack-constraints.ts` — durable stack memory (won't overwrite confirmed)  
- `src/features/workspace/preview/services/preview-builder.service.ts` — preview by confirmed stack  
- `src/ai/agents/excellence/world-class-charter.ts` — prompt excellence  
- `src/ai/agents/excellence/output-quality.ts` — deliverable scoring


# How to use Preview stacks


1. Open Studio Preview — if stack not saved, pick **HTML/CSS**, **React**, or **Next.js** (honest speed notes shown).  
2. Choice is saved to company memory; Preview runs that strategy only.  
3. Click **Change** anytime to pick again.  
4. Agents respect confirmed stack and will not overwrite it from idea text alone.
