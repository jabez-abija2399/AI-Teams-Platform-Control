# Project Memory

## Current Phase
Phase 2 — AI Orchestrator (complete)

## Completed
### Phase 1 — Full Stack Foundation
- Next.js 16 + TypeScript (strict) + Tailwind foundation, ESLint 9 flat config/Prettier configured
- Full src/ architecture: app, components, features, services, hooks, stores, lib, types, utils, config
- Feature module pattern documented (src/features/README.md), features/projects as reference implementation
- Design system: shadcn/ui v4 (base-ui) primitives + custom Loading/EmptyState/ErrorState, neutral grayscale theme
- Application providers: ThemeProvider, QueryProvider
- Prisma 7 schema: User, Project, Task, Agent, Activity + Document, Workflow, Repository, File, Memory + Auth.js models
- Auth.js v5 (Credentials provider) with bcrypt hashing, JWT sessions, registration rate-limited
- Middleware protecting /dashboard/*
- Dashboard, Projects (list/create/detail), Settings (profile) — all with loading/empty/error states
- Responsive layout: sidebar (desktop) + MobileMenu (Sheet-based drawer)
- API layer: /api/auth/*, /api/projects, /api/projects/[id], /api/projects/[id]/tasks, /api/users/me

### Phase 2 — AI Orchestrator
- **AI Gateway** (`src/ai/gateway/`): ai.types.ts, ai.constants.ts, ai.gateway.ts (generate, generateStructured, stream)
- **AI Errors** (`src/ai/errors/`): AIError, ProviderNotFoundError, ProviderRequestError, ProviderConfigError, RateLimitError, TokenLimitError
- **AI Config** (`src/ai/config/`): ai.config.ts (env-based provider configuration)
- **Provider Adapters** (`src/ai/providers/`): BaseProvider, OpenAICompatProvider base class, OpenAI, Anthropic, Ollama, Gemini, Groq, OpenRouter, Together, HuggingFace adapters
- **Provider Registry** (`src/ai/providers/`): provider.registry.ts (name→class mapping), provider.factory.ts (cached creation + first-available)
- **AI Services** (`src/ai/services/`): usage.service.ts (in-memory usage logging), model.service.ts (model catalog), ai.service.ts (application-facing entry point)
- **Agent Framework** (`src/ai/agents/`): agent.types.ts, agent.constants.ts (system prompts), agent.interface.ts, agent.base.ts (BaseAgent with execute/remember)
- **Agent Roles** (`src/ai/agents/roles/`): CEO, Architect, Developer, QA agents (UI_UX, DEVOPS blocked — no real classes)
- **Agent Management** (`src/ai/agents/manager/`): agent.registry.ts (role→class), agent.manager.ts (create/get/list)
- **Agent Memory** (`src/ai/agents/memory/`): memory.service.ts (in-memory store), memory.manager.ts
- **Agent Tools** (`src/ai/agents/tools/`): tool.interface.ts, tool.registry.ts
- **Agent Permissions** (`src/ai/agents/permissions/`): permission.service.ts (role-based grants)
- **Workflow Engine** (`src/ai/workflows/core/`): workflow.types.ts, workflow.interface.ts, workflow.engine.ts (in-memory state machine)
- **Workflow Templates** (`src/ai/workflows/templates/`): software-project.template.ts (CEO→Architect→Developer→QA)
- **Workflow Execution** (`src/ai/workflows/execution/`): workflow.executor.ts (chains step outputs), workflow.manager.ts (fire-and-forget start)
- **Task Management** (`src/ai/workflows/execution/`): task.types.ts, task.engine.ts, task.manager.ts
- **Communication** (`src/ai/communication/`): message.types.ts, message.service.ts, conversation.manager.ts
- **Monitoring** (`src/ai/monitoring/`): ai.logger.ts, agent.monitor.ts, workflow.monitor.ts
- **AI Dashboard** (`src/features/ai-dashboard/`): AgentOverview, WorkflowProgress, TaskBoard, ConversationPanel components
- **AI Routes**: `/api/projects/[id]/workflows` (GET/POST), `/api/workflows/[id]` (GET/PATCH)
- **AI Teams Page**: `/dashboard/ai-teams`
- **Prisma additions**: AIProvider, AIModel, AIUsageLog, AgentConfiguration, AgentPermission, WorkflowStep, Conversation, Message, AIEventLog; updated Agent/Workflow models, enums

## Decisions Made
- Task/schema validation lives inside each feature's schemas/ folder, not a shared src/lib/validation/ — avoids two sources of truth for the same shape.
- In-memory rate limiter (lru-cache) is a known single-instance limitation; needs Redis before horizontal scaling.
- Role/permission fields intentionally not added to User yet — no current requirement for them.
- Vector DB for Agent memory deferred; Memory.embedding is a Float[] placeholder.
- `ai.service.ts` is the sole application-facing AI entry point; no feature/agent calls gateway or providers directly.
- Workflow execution is fire-and-forget (no job queue yet) — flagged as known gap.
- UI_UX and DEVOPS agent roles exist in enums but are explicitly blocked from instantiation (no real classes).
- All workflow state is in-memory (Map-based) — not persisted to DB despite Prisma models being defined.

## Architecture Notes
- `src/ai/` is the AI subsystem root; everything follows feature-based organization within it.
- Providers extend BaseProvider or OpenAICompatProvider (for OpenAI-compatible APIs).
- Agent roles follow a registry pattern: createAgent(role) returns the correct class.
- Workflow engine chains step outputs: each step receives the previous step's output as context.

## Current Problems
- No OAuth providers (Credentials-only)
- Rate limiting is in-memory, single-instance only
- No organizations/teams model yet (single-owner projects only)
- All AI subsystem state is in-memory — no DB persistence yet
- No job queue for workflow execution — fire-and-forget only
- No real-time updates (no WebSocket/SSE for live workflow progress)

## Next Tasks
- Phase 3: Harden workflow execution (job queue, DB persistence, retry logic)
- Phase 4: Real-time agent communication (WebSocket/SSE)
- Phase 5: OAuth providers + team management
