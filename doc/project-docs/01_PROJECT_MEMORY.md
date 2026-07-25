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

Task Name: Workspace Creator Mode & Developer Mode Split (UX Architecture)
Status: Completed

### What Changed
- Repurposed `SimpleWorkspaceView` to act as "Creator Mode".
- Configured Creator Mode to hide the file explorer, Monaco editor, and terminal output.
- Structured Creator Mode layout as a 2-pane grid (AI Team Assistant Chat on the left, Live Preview on the right).
- Added `isCreatorMode` prop to `LivePreview` component to hide technical diagnostic UI (HUD, server logs).
- Replaced technical WebContainer booting logs (e.g. `INSTALLING`, `STARTING`) with non-technical, friendly language (e.g. "Gathering supplies...", "Architecting the environment...") when `isCreatorMode` is true.

### Why it Changed
- To fulfill the requirement of hiding technical jargon and complexity from non-technical users while preserving the full engineering IDE for developers. 

### Files Affected
- `src/features/workspace/components/layouts/simple-workspace-view.tsx`
- `src/features/workspace/preview/components/live-preview.tsx`

# Next Recommended Work

Create:
- Timeout Fallback Service for Creator Mode to gracefully handle silent WebContainer boot failures.
- Additional specialized agent worker loops for QA and Architect roles.


