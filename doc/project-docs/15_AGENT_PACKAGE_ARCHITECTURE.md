# Agent Package Architecture Documentation

**Path:** `src/packages/agents/`

This document provides a deep, comprehensive overview of the `agents` package—the core "brain" of the AI Teams Platform. It explains what each folder does, how files interact, the lifecycle of an AI agent's execution, and why the architecture is designed this way.

---

## 1. Overview & Goal

The `packages/agents` directory contains the complete ecosystem required to instantiate, execute, and govern AI agents. The platform simulates a virtual software company where specialized AI personas (e.g., CEO, Developer, QA) collaborate to build software. 

This package is responsible for:
- **Defining** agent personas, prompts, and schemas.
- **Governing** agent behavior via strict structural contracts.
- **Executing** LLM calls with streaming and tool-calling capabilities.
- **Managing** memory (context) across multiple agent interactions.

---

## 2. Directory Structure

```text
src/packages/agents/
├── core/            # The execution engine, base classes, and LLM bridges
├── contracts/       # Strict input/output schemas (Zod) and validation logic
├── roles/           # Individual agent implementations (CEO, PM, Dev, etc.)
├── memory/          # Short-term and long-term context management
├── tools/           # Callable functions provided to the LLMs
├── manager/         # Agent lifecycle and registry management
├── artifacts/       # Handlers for persistent AI deliverables
├── permissions/     # Security checks for agent actions
└── excellence/      # Quality guidelines and rules
```

---

## 3. Deep Dive into Folders

### `core/` (The Engine)
**What it is:** The foundational infrastructure that makes agents run.
- **`agent.base.ts` / `base-agent.ts`:** Abstract base classes that all specific agents (like `DeveloperAgent`) extend. They provide standard methods for initialization and capability checking.
- **`ai-call.ts` / `ai-call-stream.ts`:** The actual bridge to the OpenAI/Anthropic APIs. These files handle prompt formatting, tool injection, and parsing LLM responses.
- **`agent-execution-engine.ts`:** The orchestration layer that wraps an AI call, manages retries, and records execution metrics.
- **`model-router.ts`:** Logic to decide which LLM (e.g., GPT-4 vs Claude 3.5 Sonnet) should be used based on the task's complexity.

### `contracts/` (The Guardrails)
**What it is:** The strict boundaries that prevent AI hallucinations and ensure usable data.
- **`deliverable-schemas.ts`:** Zod definitions for exactly what every agent must return (e.g., a `ProductRequirementsDoc` must have `featureEpics`).
- **`contract-validator.ts`:** A strict validation engine that parses the LLM's output against the Zod schemas and checks for `forbiddenActions` (e.g., "Developer cannot approve their own PR").

### `roles/` (The Employees)
**What it is:** The specific agent personas. Each role folder (e.g., `devops-engineer/`) contains:
- **`*.agent.ts`:** The class definition representing the agent.
- **`*.config.ts`:** The metadata (name, role, tools allowed, temperature settings).
- **`*.prompt.ts`:** The system prompt that gives the agent its identity and instructions.
- **`*.service.ts`:** The business logic wrapper that invokes the agent, validates the output, and updates the global `ProjectStateManager` and database.
- **`*.types.ts`:** TypeScript interfaces specific to that role.

**Key Roles Included:**
- **CEO / Product Discovery:** Analyzes initial user ideas.
- **Product Manager:** Writes PRDs and User Stories.
- **Architect:** Designs system architecture and tech stacks.
- **UI Designer:** Creates design tokens and component hierarchies.
- **Developer:** Writes code and implementation logic.
- **QA Engineer:** Generates test plans and performs verification.
- **Security Auditor:** Analyzes vulnerabilities.
- **DevOps Engineer:** Creates CI/CD pipelines and deployment plans.

### `memory/` (The Brain)
**What it is:** How agents remember what happened previously.
- **`memory.service.ts` & `memory.manager.ts`:** Manages vector embeddings or simple contextual arrays to retrieve past decisions.
- **`working-memory.ts`:** Short-term memory specific to a single execution context or project phase.
- **`organizational-intelligence.service.ts`:** Long-term memory that spans across multiple projects, allowing agents to learn from past mistakes.
- **`context-builder.ts`:** Assembles the final prompt by injecting relevant past memories before calling the LLM.

### `tools/` (The Hands)
**What it is:** The functions the LLM can trigger to interact with the real world.
- **`file-system.tool.ts` / `file-operations.tool.ts`:** Allows agents (like the Developer) to read and write files to the disk.
- **`shell.tool.ts`:** Allows agents to execute terminal commands (e.g., running `npm install`).
- **`tool-permission.guard.ts`:** Ensures agents don't run dangerous commands (e.g., `rm -rf /`).

---

## 4. How It Works (The Execution Lifecycle)

When a user asks the platform to "build a feature," the following sequence occurs:

1. **Assignment (`manager/agent.manager.ts`)**
   The system determines which agent is needed (e.g., the Developer) and retrieves its configuration.

2. **Context Assembly (`memory/context-builder.ts`)**
   The system pulls the PRD (from the PM) and the Architecture (from the Architect) out of memory to give the Developer the context they need.

3. **Execution (`core/ai-call.ts`)**
   The LLM is invoked with the System Prompt (from `roles/developer/developer.prompt.ts`) and the assembled context.

4. **Tool Use (`tools/`)**
   If the LLM decides to write a file, it calls a tool. The `AgentExecutionEngine` intercepts this, runs the actual Node.js file system code, and feeds the result back to the LLM.

5. **Validation (`contracts/contract-validator.ts`)**
   Once the LLM finishes, its JSON output is strictly validated against the Developer's Zod schema. If it fails, an error is thrown (or a retry is triggered).

6. **State & Artifact Update (`roles/...service.ts`)**
   The valid output is passed back to the `DeveloperService`, which saves the code to the disk, registers an `Artifact` in the database, and updates the `ProjectStateManager` to move the project to the next phase (e.g., QA).

---

## 5. Why This Architecture?

1. **Separation of Concerns:** Prompts, business logic, and strict types are completely isolated. This means tweaking an AI's personality (`prompt.ts`) doesn't accidentally break database updates (`service.ts`).
2. **Deterministic Fallbacks:** The `.service.ts` files include `buildHeuristic...` functions. If the LLM is down, offline, or heavily mocked in tests, the system can fall back to hardcoded, deterministic outputs based on heuristics, allowing massive end-to-end tests to run instantly without real LLM calls.
3. **Safety and Contracts:** LLMs are unpredictable. The `contracts` folder acts as an absolute boundary layer. No output from an LLM ever touches the database or the user without passing strict Zod validation and forbidden-action checks.
4. **Reusability:** By structuring everything as packages, agents can be easily reused in CLI scripts, background workers, or interactive chat APIs without rewriting the execution logic.
