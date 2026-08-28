# @ai-teams/agents — Package Architecture & Integration Guide

## Overview
`@ai-teams/agents` (`src/packages/agents/`) is the central, modular package powering the autonomous multi-agent workforce for the AI Teams Platform. It replaces legacy scattered agent implementations with a strict, type-safe, layered architecture comprising **Core Runtime**, **Deliverable Contracts**, **Organizational Memory**, **Sandboxed Tools**, and **8 Specialized AI Employee Roles**.

---

## 1. Package File Map & Comprehensive Documentation

```
src/packages/agents/
├── index.ts                                # Master Package Entry Point
│
├── core/                                   # Universal Execution Engine
│   ├── index.ts                            # Core layer exports
│   ├── base-agent.ts                       # Abstract BaseAgent lifecycle class
│   ├── agent-execution-engine.ts           # Autonomous reasoning loop & self-healing
│   ├── llm-stream-bridge.ts                # Real-time SSE token streaming adapter
│   ├── knowledge-loader.ts                 # Constitution & guidelines loader
│   └── model-router.ts                     # BYOK model selection & fallback router
│
├── contracts/                              # Type Contracts & Deliverable Envelopes
│   ├── index.ts                            # Contracts layer exports
│   ├── agent-contract.interface.ts         # Base AgentContract interface
│   ├── deliverable-schemas.ts              # Zod validation schemas for deliverables
│   └── contract-validator.ts               # Strict runtime JSON validator
│
├── memory/                                 # Shared Organizational Memory
│   ├── index.ts                            # Memory layer exports
│   ├── working-memory.ts                   # In-flight multi-tool scratchpad
│   ├── decision-log.ts                     # Architectural Decision Records (ADRs)
│   └── context-compressor.ts               # Token-efficient prompt compressor
│
├── tools/                                  # Sandboxed Capabilities & Permissions
│   ├── index.ts                            # Tools layer exports
│   ├── permission-gate.ts                  # Role-based tool access control
│   ├── file-operations.tool.ts             # Sandboxed workspace repository reader/writer
│   └── tool-registry.ts                    # Central executable tool catalog
│
└── roles/                                  # The 8 AI Employee Role Packages
    ├── index.ts                            # Roles layer exports
    ├── ceo/                                # Chief Executive Officer (Strategy & Scope)
    │   ├── index.ts
    │   ├── ceo.types.ts                    # Input & deliverable types
    │   ├── ceo.prompt.ts                   # System prompt & constitution
    │   ├── ceo.tools.ts                    # Market research & scope tools
    │   ├── ceo.service.ts                  # Business logic & LLM formulation
    │   └── ceo.agent.ts                    # CeoAgent class
    ├── product-manager/                    # Product Manager (PRD & User Stories)
    │   ├── index.ts
    │   ├── product-manager.types.ts
    │   ├── product-manager.prompt.ts
    │   ├── product-manager.tools.ts
    │   ├── product-manager.service.ts
    │   └── product-manager.agent.ts
    ├── architect/                          # Principal System Architect (File Tree & DB)
    │   ├── index.ts
    │   ├── architect.types.ts
    │   ├── architect.prompt.ts
    │   ├── architect.tools.ts
    │   ├── architect.service.ts
    │   └── architect.agent.ts
    ├── ui-designer/                        # Lead UI/UX Designer (Design Tokens)
    │   ├── index.ts
    │   ├── ui-designer.types.ts
    │   ├── ui-designer.prompt.ts
    │   ├── ui-designer.tools.ts
    │   ├── ui-designer.service.ts
    │   └── ui-designer.agent.ts
    ├── developer/                          # Lead Fullstack Engineer (Code Implementation)
    │   ├── index.ts
    │   ├── developer.types.ts
    │   ├── developer.prompt.ts
    │   ├── developer.tools.ts
    │   ├── developer.service.ts
    │   └── developer.agent.ts
    ├── qa-engineer/                        # QA & Test Automation (Defect Triage & Verification)
    │   ├── index.ts
    │   ├── qa-engineer.types.ts
    │   ├── qa-engineer.prompt.ts
    │   ├── qa-engineer.tools.ts
    │   ├── qa-engineer.service.ts
    │   └── qa-engineer.agent.ts
    ├── security-auditor/                   # Security & Compliance (OWASP & Secret Scanning)
    │   ├── index.ts
    │   ├── security-auditor.types.ts
    │   ├── security-auditor.prompt.ts
    │   ├── security-auditor.tools.ts
    │   ├── security-auditor.service.ts
    │   └── security-auditor.agent.ts
    └── devops-engineer/                    # Cloud & Release DevOps (Docker & CI/CD)
        ├── index.ts
        ├── devops-engineer.types.ts
        ├── devops-engineer.prompt.ts
        ├── devops-engineer.tools.ts
        ├── devops-engineer.service.ts
        └── devops-engineer.agent.ts
```

---

## 2. Deep File-by-File Breakdown

### Layer 1: Core Runtime Engine (`src/packages/agents/core/`)

#### [`base-agent.ts`](file:///home/jabez/Documents/software/project/myproduct/AI-Teams-Platform-Control/ai-teams-platform/src/packages/agents/core/base-agent.ts)
- **What it is:** Abstract base class that standardizes execution lifecycle, deliverable typing, logging, and validation across all AI agents.
- **How it works:** Defines required properties (`roleId`, `displayName`, `department`, `contract`) and abstract method `execute(context: AgentExecutionContext)`.
- **Where it is integrated:** Inherited by `CeoAgent`, `ProductManagerAgent`, `ArchitectAgent`, `UIDesignerAgent`, `DeveloperAgent`, `QaEngineerAgent`, `SecurityAuditorAgent`, and `DevopsEngineerAgent`.
- **How it is integrated:** The Company Pipeline Orchestrator executes agents polymorphically via `AgentExecutionEngine.executeAgent()`.

#### [`agent-execution-engine.ts`](file:///home/jabez/Documents/software/project/myproduct/AI-Teams-Platform-Control/ai-teams-platform/src/packages/agents/core/agent-execution-engine.ts)
- **What it is:** Central execution coordinator managing single-agent and multi-agent workflow dispatches with error trapping and self-healing.
- **How it works:** Maintains an in-memory agent registry (`Map<string, BaseAgent>`). When `executeAgent(roleId, context)` is called, it initializes the agent, runs the execution loop, handles timing benchmarks, and catches runtime errors gracefully.
- **Where it is integrated:** Used in API routes (`/api/ai/ceo`, `/api/ai/developer`, etc.) and BullMQ background workers.
- **How it is integrated:** Invoked with `projectId`, `visionPrompt`, and optional token/status callback functions.

#### [`llm-stream-bridge.ts`](file:///home/jabez/Documents/software/project/myproduct/AI-Teams-Platform-Control/ai-teams-platform/src/packages/agents/core/llm-stream-bridge.ts)
- **What it is:** Streaming utility converting raw token chunks from LLM providers into structured Server-Sent Events (SSE) for the frontend UI.
- **How it works:** Formats JSON payloads (`type: 'TOKEN' | 'THOUGHT' | 'TOOL_CALL' | 'STATUS' | 'DONE'`) with `data: ...\n\n` protocol.
- **Where it is integrated:** Used in Next.js streaming route handlers (`src/app/api/ai/*/route.ts`).
- **How it is integrated:** Feeds live token streams directly into Mission Control terminal logs and Monaco Editor live typing indicators.

#### [`knowledge-loader.ts`](file:///home/jabez/Documents/software/project/myproduct/AI-Teams-Platform-Control/ai-teams-platform/src/packages/agents/core/knowledge-loader.ts)
- **What it is:** Context assembly utility that reads project constitutions and coding standards from markdown files.
- **How it works:** Reads `doc/project-docs/00_PROJECT_CONSTITUTION.md` and prepends organizational guidelines to agent system prompts.
- **Where it is integrated:** Called during agent prompt preparation in `CeoService`, `ArchitectService`, `DeveloperService`, etc.
- **How it is integrated:** Guarantees every LLM request enforces non-destructive file edits and zero placeholders.

#### [`model-router.ts`](file:///home/jabez/Documents/software/project/myproduct/AI-Teams-Platform-Control/ai-teams-platform/src/packages/agents/core/model-router.ts)
- **What it is:** Intelligent model selection engine matching tasks to optimal AI models (Gemini 2.5 Pro, Flash, Groq LLaMA, OpenAI, Anthropic).
- **How it works:** Evaluates task complexity: deep reasoning tasks (Architecture, Strategy) get high-parameter models; fast coding loops get low-latency models.
- **Where it is integrated:** Integrated into AI gateway dispatches and BYOK credential lookups.
- **How it is integrated:** Called before any LLM inference call to obtain model parameters (`temperature`, `maxTokens`, `modelName`).

---

### Layer 2: Contracts & Deliverables (`src/packages/agents/contracts/`)

#### [`agent-contract.interface.ts`](file:///home/jabez/Documents/software/project/myproduct/AI-Teams-Platform-Control/ai-teams-platform/src/packages/agents/contracts/agent-contract.interface.ts)
- **What it is:** Type definition of the formal contract governing each AI agent's inputs, allowed tools, and deliverable schemas.
- **How it works:** Enforces `allowedTools`, `requiredInputKeys`, and a Zod `schema`.
- **Where it is integrated:** Implemented by every agent class in `roles/`.
- **How it is integrated:** Validated by `PermissionGate` and `ContractValidator` before and after execution.

#### [`deliverable-schemas.ts`](file:///home/jabez/Documents/software/project/myproduct/AI-Teams-Platform-Control/ai-teams-platform/src/packages/agents/contracts/deliverable-schemas.ts)
- **What it is:** Zod schemas for all project deliverables produced by the platform.
- **How it works:** Defines strict type schemas for `BusinessStrategy`, `ProductRequirementsDoc`, `ArchitectureSpec`, `UIDesignSpec`, `ImplementationDeliverable`, `QAVerificationReport`, and `SecurityAuditReport`.
- **Where it is integrated:** Used across agent services, UI view components, and database artifact storage.
- **How it is integrated:** Ensures zero malformed JSON responses and 100% type safety.

#### [`contract-validator.ts`](file:///home/jabez/Documents/software/project/myproduct/AI-Teams-Platform-Control/ai-teams-platform/src/packages/agents/contracts/contract-validator.ts)
- **What it is:** Runtime JSON cleaner and Zod validation utility.
- **How it works:** Strips markdown backticks (````json ... ````) and runs `schema.parse()`.
- **Where it is integrated:** Called at the end of every agent execution step.
- **How it is integrated:** Rejects invalid outputs and triggers self-healing retries.

---

### Layer 3: Memory & Context (`src/packages/agents/memory/`)

#### [`working-memory.ts`](file:///home/jabez/Documents/software/project/myproduct/AI-Teams-Platform-Control/ai-teams-platform/src/packages/agents/memory/working-memory.ts)
- **What it is:** In-memory key-value scratchpad for maintaining active agent state across multi-step tool calls.
- **How it works:** Provides `get()`, `set()`, `has()`, and `toJSON()` over a private `Map`.
- **Where it is integrated:** Instantiated during multi-turn pipeline operations.
- **How it is integrated:** Prevents context bloat while preserving intermediate tool results.

#### [`decision-log.ts`](file:///home/jabez/Documents/software/project/myproduct/AI-Teams-Platform-Control/ai-teams-platform/src/packages/agents/memory/decision-log.ts)
- **What it is:** Architectural Decision Record (ADR) storage and query interface.
- **How it works:** Records decisions with rationale and consequences; queries them by `projectId`.
- **Where it is integrated:** Written to by Architect and Developer agents; read by QA and Security agents.
- **How it is integrated:** Maintains long-term architectural consistency across project iterations.

#### [`context-compressor.ts`](file:///home/jabez/Documents/software/project/myproduct/AI-Teams-Platform-Control/ai-teams-platform/src/packages/agents/memory/context-compressor.ts)
- **What it is:** Token trimmer summarizing long conversation logs and documentation before LLM dispatch.
- **How it works:** Strips comments, removes redundant blank lines, and limits character length.
- **Where it is integrated:** Called prior to LLM API dispatches in `AgentExecutionEngine`.
- **How it is integrated:** Reduces LLM token costs and prevents context-window overflow.

---

### Layer 4: Sandboxed Tools & Security (`src/packages/agents/tools/`)

#### [`permission-gate.ts`](file:///home/jabez/Documents/software/project/myproduct/AI-Teams-Platform-Control/ai-teams-platform/src/packages/agents/tools/permission-gate.ts)
- **What it is:** Security permission gate enforcing role-based access control (RBAC) over tools.
- **How it works:** Checks if an agent role has permission to execute a specific tool (e.g. `ceo` cannot invoke `file_writer`).
- **Where it is integrated:** Intercepts every tool call in `ToolRegistry.execute()`.
- **How it is integrated:** Guarantees sandboxed, non-destructive execution.

#### [`file-operations.tool.ts`](file:///home/jabez/Documents/software/project/myproduct/AI-Teams-Platform-Control/ai-teams-platform/src/packages/agents/tools/file-operations.tool.ts)
- **What it is:** Virtual repository file reader and writer interacting with the database.
- **How it works:** Reads/writes files in `prisma.file` associated with `prisma.repository`.
- **Where it is integrated:** Called by Developer, QA, and Refactoring agents.
- **How it is integrated:** Persists generated project files for Monaco Editor and Live Preview without touching host machine disk.

#### [`tool-registry.ts`](file:///home/jabez/Documents/software/project/myproduct/AI-Teams-Platform-Control/ai-teams-platform/src/packages/agents/tools/tool-registry.ts)
- **What it is:** Central catalog of registered tools.
- **How it works:** Stores tool descriptors and handlers; authorizes execution via `PermissionGate`.
- **Where it is integrated:** Called during LLM tool-calling loops.
- **How it is integrated:** Standardizes tool execution across all agents.

---

### Layer 5: Specialized Role Subpackages (`src/packages/agents/roles/`)

Each role package follows a standardized 6-file structure:
1. `index.ts` — Public re-exports
2. `<role>.types.ts` — Input parameters and deliverable types
3. `<role>.prompt.ts` — System prompt and behavioral rules
4. `<role>.tools.ts` — Role-specific domain tools
5. `<role>.service.ts` — Business logic and formulation algorithms
6. `<role>.agent.ts` — Class implementing `BaseAgent`

| Role | Primary Deliverable | Key Tools | Upstream Input | Downstream Hand-off |
|---|---|---|---|---|
| **CEO (`ceo/`)** | `BusinessStrategy` | Market scope analyzer | User Vision Prompt | Product Manager |
| **Product Manager (`product-manager/`)** | `ProductRequirementsDoc` | Feature breakdown | `BusinessStrategy` | System Architect |
| **Architect (`architect/`)** | `ArchitectureSpec` | Stack evaluator, schema designer | `ProductRequirementsDoc` | UI Designer & Developer |
| **UI Designer (`ui-designer/`)** | `UIDesignSpec` | Color palette generator | `ArchitectureSpec` | Developer & UI Viewers |
| **Developer (`developer/`)** | `ImplementationDeliverable` | File writer/reader, AST modifier | `ArchitectureSpec`, `UIDesignSpec` | Live Preview & QA Engineer |
| **QA Engineer (`qa-engineer/`)** | `QAVerificationReport` | Syntax checker, test runner | `ImplementationDeliverable` | Security Auditor & Release Gate |
| **Security Auditor (`security-auditor/`)** | `SecurityAuditReport` | Secret detector, SAST scanner | `ImplementationDeliverable` | Release Gate |
| **DevOps Engineer (`devops-engineer/`)** | `DeploymentRecipe` | Dockerfile generator, CI builder | `ArchitectureSpec` | Cloud Deployments in Studio |

---

## 3. Integration & Removal Plan for Legacy Files

1. **Clean Legacy Code:** Remove duplicated legacy files under `src/ai/agents/roles/` that have been replaced by the `@ai-teams/agents` package.
2. **Re-route Imports:** Update all orchestrators, API routes, and feature components to import cleanly from `@/packages/agents`.
3. **Verify:** Ensure all 106 test suites pass with 0 errors and zero broken imports.
