# HibirDev AI — Competitive Research & Product Strategy
**Version:** 1.0  
**Date:** September 2026  
**Status:** Approved Direction  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Competitive Landscape Deep-Dive](#2-competitive-landscape-deep-dive)
3. [Market Convergence Pattern](#3-market-convergence-pattern)
4. [The Real Competitive Gap](#4-the-real-competitive-gap)
5. [HibirDev AI Product Model](#5-hibirdev-ai-product-model)
6. [Artifact System Architecture](#6-artifact-system-architecture)
7. [Full Screen Architecture — 16 Screens](#7-full-screen-architecture--16-screens)
8. [Core Data Model](#8-core-data-model)
9. [Traceability System](#9-traceability-system)
10. [Feedback Loop Architecture](#10-feedback-loop-architecture)
11. [Workspace UX Principles](#11-workspace-ux-principles)
12. [MVP Definition](#12-mvp-definition)
13. [Post-MVP Roadmap](#13-post-mvp-roadmap)
14. [Positioning & Messaging](#14-positioning--messaging)
15. [What NOT to Build (Yet)](#15-what-not-to-build-yet)
16. [Architectural Decisions Confirmed](#16-architectural-decisions-confirmed)

---

## 1. Executive Summary

**The conclusion that drives everything else:**

> Do not build another Lovable.

Lovable, Bolt, Replit Agent, Anything, Emergent, Base44, and v0 are all converging toward the same workflow:

```
User describes app → AI plans/builds → code appears → preview → user keeps prompting → deploy
```

That market is becoming commoditized. Our opportunity is structurally different:

```
User idea
  → CEO defines the product (Product Specification)
  → Architect designs the system (Architecture Specification)
  → Designer defines the experience (Design Specification)
  → Developer implements it (Implementation)
  → Every artifact is traceable and approved
  → Software is verified against requirements
```

**HibirDev AI = AI Software Engineering Company, not AI App Builder.**

The four-agent architecture (CEO → Architect → Designer → Developer) is confirmed as permanent. It is not a chatbot wrapper. It is a structured engineering pipeline with contractual responsibilities, versioned artifacts, approval gates, and traceability.

---

## 2. Competitive Landscape Deep-Dive

### 2.1 Lovable

**What they do now:**  
Lovable has evolved significantly beyond prompt-to-code. Its current Agent mode can:
- Inspect a codebase
- Modify files across the project
- Debug logs and network activity
- Fetch documentation and external assets
- Generate media
- Verify results after changes

It also has a separate **Plan mode** — AI decides what to do before Agent mode executes it.

**Their workflow today:**
```
Prompt → Plan → Agent execution → Verification
```

**Scale:** As of August 2026, Lovable was reported at a **$13.3B valuation** with more than 60M projects created.

**What to learn:**
- Don't compete on: "Our AI can write code." They already do this extremely well.
- Compete on: **"Our system makes software decisions before code is written."**

---

### 2.2 Bolt

**Core strength:** Combines prompting with a browser-based development environment.

**Their workflow:**
```
Describe → Generate → Inspect → Edit → Deploy
```

- Generates the application
- Provides live preview
- Lets users edit code directly
- Supports backend generation
- One-click deployment

**What to learn:**  
Your Developer agent eventually needs to feel this capable. But the Developer should be the **last stage of a much larger engineering pipeline**, not the whole product.

---

### 2.3 Anything (anythingapp.ai)

**What makes them different:**  
Explicitly expanding beyond web apps. Combines: AI, data, files, UI, notifications, publishing, persistent user data, integrations, web search, multimodal AI, **mobile apps**.

Their workflow is iterative:
```
Describe → Generate → Test → Fix → Publish → Version/Restore
```

**What to learn:**  
Anything is attacking: *"Give me a complete product."*  
We should attack: **"Give me a professionally engineered product."**  
That is a much more defensible distinction.

---

### 2.4 Emergent

**Directly relevant** because it explicitly describes itself as an *agentic vibe-coding platform* for full-stack web and mobile applications. Supports:
- Frontend, backend, authentication, deployment
- GitHub integration
- Testing and integrations
- **Custom agents**

This means simply claiming "We have multiple AI agents" is not enough differentiation. Emergent can already make that claim.

**Our difference must be architectural:**

| Emergent | HibirDev AI |
|----------|-------------|
| Multiple capabilities inside an agentic building platform | Four explicitly separated professional roles with contractual responsibility |

That is substantially different.

---

### 2.5 Replit Agent

Replit has pushed strongly toward an autonomous engineering agent. It can:
- Plan and write code
- Explain behavior and debug
- Improve applications
- Use built-in database/auth
- Integrate third-party services

Replit explicitly recommends: **planning, adding context, reviewing/testing, and using checkpoints.**

**What to learn:**  
HibirDev AI cannot merely be four chat windows. That would be weak. It needs to become a **software-production environment**.

---

### 2.6 v0 (Vercel)

v0 is increasingly a complete development environment, not just a UI generator. Their 2026 updates added:
- Git integration
- Projects and folders
- Full code editor
- AI agent
- Deployment/configuration
- Production-like previews
- Server-side features and databases

**What to learn:**  
This validates having a dedicated **Designer Agent**. But our Designer shouldn't just generate screens — it must produce a **formal design artifact** that the Developer consumes. That's the key difference.

---

### 2.7 Base44

**Positioning:** Complete application platform — generates screens, backend logic, authentication, permissions, integrations, and deployment from natural language.

Emphasizes that the output is a *working application*, not a prototype.

**What to learn:**  
"Working application" is becoming table stakes. Our differentiation must be **how the application gets engineered**, not just that it gets built.

---

### 2.8 Firebase Studio (Google)

Firebase Studio's App Prototyping agent used multimodal prompts to generate blueprints, code and previews, with Firebase service provisioning. However:

> Google announced that creating new workspaces with the Prototyping agent was disabled on June 22, 2026.

**What this signals:**  
Don't build your product around a single model or platform. Our architecture must allow agents to use different models/providers interchangeably. This is already supported by our multi-provider BYOK system.

---

## 3. Market Convergence Pattern

| Platform | Main Strength |
|----------|--------------|
| Lovable | Product-oriented AI building |
| Bolt | Browser-based full-stack building |
| Replit | AI engineering environment |
| Anything | Complete app/product generation |
| Emergent | Agentic full-stack development |
| Base44 | Managed full application platform |
| v0 | UI/frontend + increasingly full-stack |
| Firebase Studio | Google/Firebase-integrated prototyping |

**The common workflow is becoming:**
```
Prompt → AI → Code → Preview → Iteration → Deployment
```

This is becoming **commoditized**. Competing here means fighting well-funded incumbents on their own turf.

---

## 4. The Real Competitive Gap

### Existing AI builders optimize for:
**Time to first application**

### HibirDev AI should optimize for:
**Quality and traceability from idea to software**

### Our competitive thesis:
> HibirDev AI does not generate software in one step.  
> It engineers software through controlled stages.

That single idea differentiates almost everything else.

### Supporting evidence from academia:
A 2026 academic study compared generated code from Lovable, v0, and Replit using static analysis. It found meaningful differences in code smells, severity, and complexity — proving that "AI generated the application" does not mean the engineering quality is equivalent.

This strengthens our concept. Our Developer should not simply ask "Can I generate this?" It should ask:

```
Does implementation satisfy requirements?         ✓
Does it follow architecture?                      ✓
Does it match design?                             ✓
Are important states handled?                     ✓
Are errors handled?                               ✓
Is accessibility considered?                      ✓
Was it actually tested?                           ✓
Can I prove it?                                   ✓
```

### Research alignment:
Recent work on "loop engineering" emphasizes:
- Persistent state
- Machine-checkable stop conditions
- Verification
- Bounded agent runs
- Explicit escalation (rather than endless autonomous prompting)

Recent AppLooper research ties owner intent, requirements, development changes, testing, and release decisions to specific versions — extremely close to what our artifact system delivers.

---

## 5. HibirDev AI Product Model

### Core concept:
HibirDev AI is a software-building workspace where one project moves through four specialized AI departments, with the user approving important outputs between stages.

```
HIBIRDEV AI
     │
     Project Workspace
     │
  ┌──┴──────────────────────────┐
  │                             │
Project Context          Project Artifacts
  │                             │
  ├── Original idea           ├── CEO Specification
  ├── Requirements            ├── Architecture
  ├── Decisions               ├── Design System
  ├── Constraints             └── Implementation
  ├── Assumptions
  └── Open Questions
     │
     ▼
  ORCHESTRATOR (infrastructure, not an agent)
     │
  ┌──┼──────────────┐
  ▼  ▼              ▼
 CEO  Architect   Designer
  │      │            │
  └──────┴────────────┘
              │
           Developer
              │
              ▼
        FINAL SOFTWARE
```

### The Orchestrator is infrastructure, not a fifth agent
This preserves the required four-agent architecture. The Orchestrator:
- Determines current project stage
- Provides correct context to the active agent
- Validates agent output against its contracts
- Saves artifacts and creates versions
- Pauses for required approvals
- Advances the project
- Handles controlled feedback
- Records activity
- Maintains traceability

### The persistent pipeline indicator
At every point in the workspace the user must always see:
```
CEO ✓ → Architect ✓ → Designer ● → Developer ○
```
This is not decorative — it communicates where the project is in a single glance.

---

## 6. Artifact System Architecture

### Why artifacts are the backbone

Do not treat agent responses as disposable chat messages. Every important output is a **versioned project artifact**.

```
CEO Product Specification
    v1 → v2 → v3 (after revision)

Architecture Specification
    v1 → v2

Design Specification
    v1

Implementation
    v1
```

### Artifact schema
```
Artifact {
  id
  type              // PRODUCT_SPEC | ARCHITECTURE | DESIGN_SPEC | IMPLEMENTATION
  version           // 1, 2, 3...
  status            // DRAFT | IN_REVIEW | APPROVED | SUPERSEDED | REJECTED
  created_by        // CEO | ARCHITECT | DESIGNER | DEVELOPER
  created_at
  based_on          // artifact_id of input artifact
  requirements[]    // REQ-xxx references
  decisions[]       // ADR-xxx, DES-xxx references
  assumptions[]
  constraints[]
  unresolved_questions[]
  validation        // pass/fail/pending
}
```

### Artifact ownership by domain
```
CEO           → ProductSpecification
Architect     → ArchitectureSpecification
Designer      → DesignSpecification
Developer     → ImplementationReport
```

The latest **approved** artifact in each domain becomes the source of truth for downstream agents. The source explicitly requires this model.

---

## 7. Full Screen Architecture — 16 Screens

### Screen 01 — Landing Page

**Purpose:** Explain what HibirDev AI does and why it's different.

**Layout:**
```
HibirDev AI

Build software with an AI team, not a single AI assistant.

  CEO → Architect → Designer → Developer

One workflow. One project context.
One traceable path from idea to software.

[ Start Building ]
```

**Primary action:** Start Building → Sign Up  
**Agent interaction:** None  
**Key message:** Four specialized roles, not one chatbot

---

### Screen 02 — Authentication

**Purpose:** Allow the user to enter HibirDev AI.

**Screens:**
- Sign In
- Sign Up

**Routing logic:**
- New user (0 projects) → `/welcome` → Create First Project
- Returning user → `/dashboard/projects`

**Authentication methods:** Credentials (email + password). Social providers are a separate architecture decision.

---

### Screen 03 — Onboarding (Welcome)

**Purpose:** Introduce the product concept before the first project. Short — 3 steps.

```
Step 1: Meet your AI team
  CEO → Architect → Designer → Developer

Step 2: How HibirDev works
  Idea → Product → Architecture → Design → Software

Step 3: You stay in control.
  Review and approve important decisions before
  the project moves forward.

[ Create My First Project ]
```

**Key:** Reinforces the actual pipeline architecture before the user builds anything.

---

### Screen 04 — Projects

**Purpose:** User's home. Overview of all projects.

**Layout:**
```
Projects                          [ + New Project ]

┌────────────────────────────┐
│ SaaS Dashboard             │
│ ● Design                   │
│ Last updated 10 min ago    │
│ CEO ✓  Architect ✓         │
│ Designer ●  Developer ○    │
└────────────────────────────┘

┌────────────────────────────┐
│ Mobile Marketplace         │
│ ✓ Completed                │
└────────────────────────────┘
```

**Each card shows:** name, current stage, pipeline progress, last activity, status  
**No analytics dashboard** — the source warns against unnecessary dashboards.

---

### Screen 05 — Create Project

**Purpose:** Capture the user's idea. Extremely simple.

```
Create a new project

What do you want to build?

┌────────────────────────────────────┐
│ Describe your software idea...     │
│                                    │
└────────────────────────────────────┘

Project name (optional)

[ Start with CEO ]
```

**Important:** The only required input is the idea. Everything else — name, stack, tech choices — belongs to the agents.

---

### Screen 06 — Project Setup

**Purpose:** Transition screen between submission and CEO workspace.

```
Your project
"Restaurant Booking Platform"

Preparing your AI team...

✓ Project created
✓ Original idea captured
○ CEO preparing product definition...
```

Auto-advances to CEO Workspace when ready.

---

### Screen 07 — CEO Workspace

**Purpose:** CEO agent defines the product.

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ Restaurant Booking Platform                     CEO ●      │
├──────────────┬─────────────────────────────────────────────┤
│ PIPELINE     │                                             │
│              │  CEO — Product Definition                   │
│ ● CEO        │                                             │
│ ○ Architect  │  Understanding your product...             │
│ ○ Designer   │                                             │
│ ○ Developer  │  ┌─────────────────────────────────────┐   │
│              │  │ Product Goal                        │   │
│              │  │ ...                                 │   │
│              │  ├─────────────────────────────────────┤   │
│              │  │ Target Users                        │   │
│              │  │ ...                                 │   │
│              │  ├─────────────────────────────────────┤   │
│              │  │ MVP Features                        │   │
│              │  │ ...                                 │   │
│              │  └─────────────────────────────────────┘   │
└──────────────┴─────────────────────────────────────────────┘
```

**CEO artifact must cover:**
- Product vision
- Problem statement
- Target users
- User goals and journeys
- MVP features
- Constraints and assumptions
- Out-of-scope items
- Acceptance criteria

---

### Screen 08 — CEO Review (Checkpoint)

**Purpose:** User inspects and approves the Product Specification before architecture begins.

```
CEO — Product Definition
Ready for review

Problem
  ...

Target Users
  ...

Core Value Proposition
  ...

MVP Features
  1. ...
  2. ...
  3. ...

Out of Scope
  ...

Assumptions
  ...

Acceptance Criteria
  ...

───────────────────────────────
[ Request Revision ]    [ Approve Product Definition → ]
```

**States:** Loading | Reviewing | Revision requested | Approved  
**On approve:** Advance to Architect  
**On revision:** CEO regenerates with feedback, returns to review

---

### Screen 09 — Architect Workspace

**Purpose:** Architect receives approved CEO artifact and designs the system.

**Pipeline state:**
```
CEO ✓ → Architect ● → Designer ○ → Developer ○
```

**Architect receives:** Approved ProductSpecification (not chat history)

**Architect artifact must cover:**
- Application structure
- Frontend architecture
- Backend architecture
- Database schema
- API design
- Authentication approach
- State management
- Data flow
- Technology decisions (stack)
- Technical constraints
- Implementation plan (ordered tasks)

---

### Screen 10 — Architect Review (Checkpoint)

```
Architecture Review

System Architecture
  ...

Technology Stack
  Frontend: ...
  Backend: ...
  Database: ...

Data Flow
  ...

API Endpoints
  ...

Technical Constraints
  ...

Implementation Plan
  1. ...
  2. ...

───────────────────────────────
[ Request Revision ]    [ Approve Architecture → ]
```

**This creates a clean transition:**
```
Product truth (CEO)
    ↓
Technical truth (Architect)
```

---

### Screen 11 — Designer Workspace

**Purpose:** Designer receives approved CEO + Architect artifacts and creates the experience.

**Pipeline state:**
```
CEO ✓ → Architect ✓ → Designer ● → Developer ○
```

**Designer receives:** Approved ProductSpecification + ArchitectureSpecification

**Designer artifact must cover:**
- Design system tokens (colors, typography, spacing, radius)
- Component hierarchy
- Page-by-page layouts
- Responsive behavior (mobile/tablet/desktop)
- Interaction states (loading, error, empty, success)
- Accessibility rules
- Navigation structure

---

### Screen 12 — Designer Review (Checkpoint)

```
Design Review

┌──────────────┐   Design System
│ Page preview │   Typography: ...
│              │   Colors: ...
│              │   Spacing: ...
└──────────────┘   Components: ...

Responsive
  Mobile | Tablet | Desktop

States
  Loading | Error | Empty | Success

Accessibility
  ...

───────────────────────────────
[ Request Revision ]    [ Approve Design → ]
```

**Visual emphasis:** This screen should show component/page previews, not just text.

---

### Screen 13 — Developer Workspace

**Purpose:** Developer receives all three approved artifacts and implements.

**Pipeline state:**
```
CEO ✓ → Architect ✓ → Designer ✓ → Developer ●
```

**Developer receives:** All three approved artifacts + project context

**Progress display:**
```
Building your software...

✓ Project structure initialized
✓ Authentication routes created
✓ Dashboard components created
● Implementing booking flow
○ Connecting API layer
○ Handling error states
○ Responsive behavior
○ Testing
```

**Key principle:** Expose meaningful progress, not a fake "AI is thinking" spinner.

---

### Screen 14 — Verification

**Purpose:** Prove that software meets requirements. Developer completion ≠ verified software.

```
Verification

Requirements
  ✓ REQ-001  User can create account
  ✓ REQ-002  User can log in
  ✓ REQ-003  User can create booking
  ✓ REQ-004  User can view bookings

Implementation
  ✓ Architecture followed
  ✓ Design specification implemented
  ✓ Responsive behavior verified
  ✓ Error states implemented

Testing
  ✓ Unit tests passed (18/18)
  ✓ Integration tests passed

Known Issues
  None

[ Open Software ]
```

**Important honesty rule:** Only show tests that were actually run. Never fabricate verification results.

---

### Screen 15 — Final Software

**Purpose:** The user sees and interacts with the generated application.

```
┌─────────────────────────────────────────────────────────┐
│ HibirDev AI      Restaurant Booking Platform            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                   LIVE APPLICATION                      │
│                                                         │
│              [ Application Preview ]                    │
│                                                         │
│  [ Open Studio ]   [ View Artifacts ]   [ History ]    │
└─────────────────────────────────────────────────────────┘
```

**Deployment:** Not a requirement yet. Deployment is a separate architecture decision made by Architect in future iteration.

---

### Screen 16 — Project History

**Purpose:** Let the user understand how the software was created. This is the traceability layer.

```
Project History

Sep 1, 2026
  ✓ 09:42  Idea submitted
  ✓ 09:43  CEO started Product Specification
  ✓ 09:45  Product Specification v1 ready for review
  ✓ 09:47  User approved Product Specification
  ✓ 09:48  Architect started Architecture Specification
  ✓ 09:52  Architecture v1 ready for review
  ✓ 09:54  User approved Architecture
  ✓ 09:55  Designer started Design Specification
  ✓ 10:04  Design Specification v1 ready for review
  ✓ 10:06  User approved Design
  ✓ 10:07  Developer started Implementation
  ✓ 10:18  REQ-014 implemented
  ✓ 10:20  Tests executed
  ✓ 10:21  18/18 checks passed
  ✓ 10:22  Application ready
```

Selecting any item opens the associated artifact or decision. This makes HibirDev AI the only AI builder where the full engineering history is inspectable.

---

## 8. Core Data Model

```
User
  └── Project
        ├── ProjectContext
        │     ├── originalIdea
        │     ├── requirements[]      (REQ-xxx)
        │     ├── decisions[]         (ADR-xxx)
        │     ├── assumptions[]
        │     ├── constraints[]
        │     └── openQuestions[]
        │
        ├── Artifact[]
        │     └── ArtifactVersion[]
        │           ├── ProductSpecification
        │           ├── ArchitectureSpecification
        │           ├── DesignSpecification
        │           └── ImplementationReport
        │
        ├── Approval[]
        ├── FeedbackRequest[]
        ├── ActivityEvent[]
        └── ProjectLifecycleState
```

### Project lifecycle states
```
DRAFT
  ↓
CEO_IN_PROGRESS
  ↓
CEO_REVIEW
  ↓
CEO_APPROVED
  ↓
ARCHITECT_IN_PROGRESS
  ↓
ARCHITECT_REVIEW
  ↓
ARCHITECT_APPROVED
  ↓
DESIGN_IN_PROGRESS
  ↓
DESIGN_REVIEW
  ↓
DESIGN_APPROVED
  ↓
DEVELOPMENT
  ↓
VERIFICATION
  ↓
COMPLETED
```

**Failure states (can occur at any stage):**
```
BLOCKED
NEEDS_REVISION
FAILED
```

---

## 9. Traceability System

### The killer differentiator

A user should be able to follow any element of the final software all the way back to the original idea:

```
REQ-003  User can create an account
    ↓
CEO Decision: Authentication is MVP functionality
    ↓
Architect: Authentication service required
           /auth routes, JWT, password hashing
    ↓
Designer: Signup screen + Login screen
          Forms, validation states, error states
    ↓
Developer: Auth routes + form components + validation logic
    ↓
Verification: REQ-003 verified ✓
```

### Architecture Decision Records (ADRs)

Every important technical decision is recorded:

```
ADR-004
  Decision: Use PostgreSQL
  Owner: Architect
  Reason: Relational data model + transactional requirements
  Alternatives considered: MongoDB, Firebase
  Status: Approved
  Consumed by: Developer
```

### Design Decision Records

```
DES-009
  Decision: Single-theme dark interface
  Owner: Designer
  Reason: Target audience + product positioning
  Alternatives: Light/dark toggle
  Status: Approved
  Consumed by: Developer
```

### Requirement traceability matrix

```
REQ → ARCH → DESIGN → CODE → TEST
```

This is what makes HibirDev AI fundamentally different from every competitor. No one else makes this traceable.

---

## 10. Feedback Loop Architecture

### The controlled feedback model

Feedback flows **up the chain, not sideways**. Agents cannot override each other arbitrarily.

**Developer discovers technical problem:**
```
Developer
    │ technical issue requires architecture change
    ▼
Architect
    │ revised architecture (Architecture v2)
    ▼
Developer (resumes with Architecture v2)
```

**Developer finds design conflict:**
```
Developer
    │ design implementation conflict
    ▼
Designer
    │ revised design (Design Spec v2)
    ▼
Developer (resumes with Design Spec v2)
```

**Developer hits impossible requirement:**
```
Developer
    │ requirement cannot be satisfied
    ▼
CEO
    │ revised product decision (Product Spec v2)
    ▼
Architect (Architecture v2)
    ↓
Designer (Design Spec v2, if needed)
    ↓
Developer (resumes)
```

**All feedback loops create new artifact versions.** No silent overrides. The source explicitly defines this controlled feedback model.

---

## 11. Workspace UX Principles

### Principle 1: The user always knows where they are

The persistent pipeline indicator is always visible:
```
CEO ✓ → Architect ✓ → Designer ● → Developer ○
```

### Principle 2: Every stage answers three questions

```
1. What did the AI produce?
2. Why did it make these decisions?
3. What happens if I approve it?
```

### Principle 3: The project context is always accessible

A persistent artifact/context drawer:
```
PROJECT CONTEXT

Original Idea         ✓
Product Specification ✓  v2
Architecture          ✓  v1
Design Specification  ●  (in review)
Implementation        ○

Decisions     12
Open Questions  2
Requirements  18
```

### Principle 4: Hide internal complexity

The user should NOT see:
- Agent prompt token counts
- LLM temperature or model internals
- Tool invocation details
- Raw JSON or internal chain-of-thought
- Internal orchestration state

The user SHOULD see:
- Decision
- Reason
- Impact
- Assumption
- Status

### Principle 5: The workspace feels like a software company, not a chatbot

Main workspace layout:
```
┌─────────────────────────────────────────────────────────┐
│ HibirDev AI                         Project: MyApp      │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  PROJECT     │           CURRENT STAGE                  │
│              │                                          │
│ ● CEO        │            ARCHITECT                     │
│ ✓ Product    │                                          │
│              │  Architecture Specification              │
│ ● Architect  │  ────────────────────────────            │
│ ◐ Working    │                                          │
│              │  System Architecture ...                 │
│ ○ Designer   │  Database ...                            │
│              │  API ...                                 │
│ ○ Developer  │  Data Flow ...                           │
│              │                                          │
│              │  [ Approve Architecture ]                │
│              │                                          │
├──────────────┴──────────────────────────────────────────┤
│  Activity · Decisions · Requirements · Versions         │
└─────────────────────────────────────────────────────────┘
```

### Principle 6: The Project Timeline is a product feature

```
PROJECT TIMELINE

09:42  User submitted idea
09:43  CEO completed Product Specification v1
09:45  User approved MVP scope
09:47  Architect completed Architecture v1
09:49  User approved architecture
09:54  Designer completed Design System v1
10:03  Developer started implementation
10:18  REQ-014 implemented
10:20  Tests executed
10:21  18/18 checks passed
10:22  Application ready for review
```

Most AI builders show the final application. We make the **engineering process itself visible**.

---

## 12. MVP Definition

### What the MVP must prove:
The unique thesis: **structured AI engineering pipeline with artifacts, approvals, and verified output.**

### MVP workflow — 12 steps:
```
1.  User creates project
       ↓
2.  User explains idea
       ↓
3.  CEO analyzes and structures it
       ↓
4.  CEO produces structured Product Specification
       ↓
5.  User reviews and approves
       ↓
6.  Architect produces Architecture Specification
       ↓
7.  User reviews and approves
       ↓
8.  Designer produces Design Specification
       ↓
9.  User reviews and approves
       ↓
10. Developer implements
       ↓
11. Developer validates against requirements
       ↓
12. User sees working software
```

That is enough to prove the concept.

### MVP screens required:
01 Landing → 02 Auth → 03 Welcome → 04 Projects → 05 Create → 06 Setup → 07 CEO → 08 CEO Review → 09 Architect → 10 Architect Review → 11 Designer → 12 Designer Review → 13 Developer → 14 Verification → 15 Final Software → 16 History

### MVP explicitly excludes:
- Deployment infrastructure
- Mobile app generation
- Payments
- External integrations
- Enterprise SSO
- Marketplace
- Dozens of templates
- Team collaboration
- Version control integration
- Custom agent builder

---

## 13. Post-MVP Roadmap

### V1 — Artifact Version System
```
Product Spec    v1 → v2 → v3
Architecture    v1 → v2
Design Spec     v1
Implementation  v1
```

### V1.5 — Requirement Traceability
```
REQ → ARCH → DESIGN → CODE → TEST
```
Every implementation element traceable to its origin.

### V2 — Controlled Feedback Loops
```
Developer → Architect → Architecture v2 → Developer
Developer → Designer → Design v2 → Developer
Developer → CEO → Product Spec v2 → full chain
```

### V2.5 — Verification System
```
Requirements verification     ✓/✗
Architecture compliance        ✓/✗
Design implementation          ✓/✗
Tests                          ✓/✗
Browser/preview validation     ✓/✗
Final status                   VERIFIED | ISSUES FOUND
```

### V3 — Compete more directly
Only after MVP+V1+V2+V2.5 proves the thesis, then add:
- External integrations
- Deployment infrastructure
- Databases and auth provisioning
- Production infrastructure
- Larger project support
- Team collaboration

---

## 14. Positioning & Messaging

### What NOT to say:
❌ "Build apps with AI." — Too generic, everyone says this.  
❌ "Four AI agents build your app." — Emergent already says this.  
❌ "The best AI code generator." — Lovable/Bolt own this.  

### What TO say:
✅ "From idea to software, through an AI engineering team."  
✅ "Your AI software company."  
✅ "Turn an idea into software through a team of AI specialists."  
✅ "AI software engineering, not AI vibe coding."  

### Internal product principle (not for marketing):
> HibirDev AI does not generate software in one step.  
> It engineers software through controlled stages.

### The moat in one sentence:
> Competitors compete on generation speed.  
> We compete on engineering quality, traceability, and controlled development.

---

## 15. What NOT to Build (Yet)

These are features that belong to later stages or separate architecture decisions:

| Feature | Reason to defer |
|---------|----------------|
| Deployment infrastructure | Separate architecture decision. Don't couple to one provider. |
| GitHub integration | V3 feature. Requires additional orchestration. |
| Mobile app generation | Out of scope for MVP thesis proof. |
| Payment systems | Not required to prove the concept. |
| Team collaboration | Single-user MVP first. |
| Enterprise SSO | Enterprise feature, not MVP. |
| Marketplace | Requires ecosystem that doesn't exist yet. |
| Plugin system | Premature extensibility. |
| Custom agent builder | Would undermine the four-agent contract system. |
| Browser automation | Separate capability, not core to pipeline. |
| Voice input | Nice-to-have, not differentiating. |
| Dozens of templates | Shortcuts the CEO step, which is the core value. |

---

## 16. Architectural Decisions Confirmed

### Confirmed by project source (non-negotiable):
- ✅ Exactly four primary agents: CEO → Architect → Designer → Developer
- ✅ Shared project context
- ✅ Structured artifacts with explicit schemas
- ✅ Agent contracts (each agent validates its own output)
- ✅ Approval/checkpoint workflow
- ✅ Domain source-of-truth (each agent owns its domain artifact)
- ✅ Traceability (requirements → decisions → implementation)
- ✅ Controlled feedback loops (not arbitrary overrides)
- ✅ Validation and implementation verification
- ✅ Responsive and accessibility considerations
- ✅ Self-contained agent packages with explicit inputs/outputs
- ✅ Multi-provider BYOK AI credentials

### Product decisions recommended (not yet in source):
- ✅ Project-centric workspace (not agent-centric)
- ✅ Five primary navigation areas
- ✅ 16-screen journey (documented above)
- ✅ Versioned artifact model
- ✅ Explicit project lifecycle states
- ✅ Persistent pipeline indicator
- ✅ Dedicated checkpoint review screens
- ✅ Project History / Timeline as a product feature
- ✅ Context/Artifact drawer
- ✅ Orchestrator as infrastructure (not a fifth agent)
- ✅ ADR and DES decision record format

### Explicitly NOT requirements yet:
- Deployment infrastructure
- Hosting provider specifics
- GitHub/Git integration
- Payment system
- Team collaboration
- Mobile app generation
- Browser automation
- Testing infrastructure specifics (belongs to Architect/Developer decisions)
- Additional AI agents beyond the four
- External marketplace or plugin system

---

## Appendix A — Full Agent Responsibility Matrix

| Agent | Receives | Produces | Validates |
|-------|----------|----------|-----------|
| CEO | Original idea + context | Product Specification | Requirements completeness, MVP clarity, no conflicting goals |
| Architect | Product Specification | Architecture Specification | Technical feasibility, no architecture conflicts, all requirements mapped |
| Designer | Product Spec + Architecture | Design Specification | Design completeness, all pages covered, all states defined |
| Developer | All three specs | Implementation + Verification Report | All requirements implemented, architecture followed, design matched, tests passed |

---

## Appendix B — Requirement Traceability Example

```
Original idea:
  "Restaurant booking platform where restaurants manage tables
   and customers can reserve them online"

CEO → REQ-003
  Users must be able to create an account and log in

Architect → ARCH-007
  Authentication service: JWT + bcrypt, /api/auth/* routes
  Based on: REQ-001, REQ-002, REQ-003

Designer → DES-012
  Signup page: /signup
  Login page: /login
  Password reset page: /reset
  States: default, loading, error, success
  Based on: ARCH-007

Developer → impl.auth
  src/app/api/auth/register/route.ts
  src/app/api/auth/login/route.ts
  src/components/auth/signup-form.tsx
  src/components/auth/login-form.tsx
  Based on: ARCH-007, DES-012

Verification → REQ-003 VERIFIED
  Test: user can register with email/password ✓
  Test: user can log in ✓
  Test: invalid credentials rejected ✓
```

---

*Document saved: `doc/plans/COMPETITIVE_RESEARCH_AND_PRODUCT_STRATEGY.md`*  
*Next step: Screen-by-screen UX specification for all 16 screens.*
