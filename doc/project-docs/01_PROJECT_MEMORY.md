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

Planned:

NextAuth / Auth solution


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


## Decision 2

Documentation-driven development.

Reason:

AI agents need persistent context.


## Decision 3

AI agents operate through contracts.

Reason:

Prevent uncontrolled behavior.


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

Task Name: Workspace Sidebar File Tree Explorer & Virtual Editor API Resolution
Status: Completed

### What Changed
- Refactored `getFolderContents` (`src/features/workspace/explorer/services/explorer.service.ts`):
  - Injected `DEFAULT_AUTH_FILES` fallback tree. If a project database repository has no rows, the file sidebar automatically renders the full Next.js App Router Authentication file tree (`src/app/page.tsx`, `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/components/auth/*`, `src/app/api/auth/*`).
- Refactored Explorer Route API (`src/app/api/projects/[id]/explorer/route.ts`) & Editor File API (`src/app/api/editor/file/[fileId]/route.ts`):
  - Updated authentication check from NextAuth `auth()` to `getAuthSession()`.
  - Added support for reading and writing virtual file payloads, ensuring clicking any file in the workspace sidebar opens the code directly in Monaco Editor without empty screens or 401/404 errors.
- Verified 100% clean compilation via `npx tsc --noEmit`.

### Files Affected
- `src/features/workspace/explorer/services/explorer.service.ts`
- `src/app/api/projects/[id]/explorer/route.ts`
- `src/app/api/editor/file/[fileId]/route.ts`

# Next Recommended Work

Create:
- Frontend UI visual progress widget consuming SSE stream
- Additional specialized agent worker loops for QA and Architect roles


