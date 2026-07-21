# Project Memory

## Current Phase
Phase 4 — Complete (Prompts 1–27 all built and verified)

## Completed

### Phase 1 — Full Stack Foundation
- Next.js 16 + TypeScript (strict) + Tailwind, ESLint 9 flat config / Prettier
- Feature-first src/ architecture: app, components, features, services, hooks, stores, lib, types, utils, config
- Design system: shadcn/ui v4 (base-ui) primitives + custom Loading/EmptyState/ErrorState
- Prisma 7 schema: User, Project, Task, Agent, Activity + Document, Workflow, Repository, Memory + Auth.js models
- Auth.js v5 (Credentials provider) with bcrypt, JWT sessions, registration rate-limited
- Dashboard, Projects (list/create/detail), Settings — all with loading/empty/error states
- Responsive layout: sidebar (desktop) + MobileMenu (Sheet-based drawer)

### Phase 2 — AI Orchestrator
- **AI Gateway** (`src/ai/gateway/`): generate, generateStructured, stream
- **Provider Adapters**: OpenAI, Anthropic, Ollama, Gemini, Groq, OpenRouter, Together, HuggingFace, **DeepSeek** (added this session)
- **Provider Registry**: name→class mapping, factory with first-available fallback
- **AI Services**: usage.service.ts (Prisma-backed), ai.service.ts (application-facing entry)
- **Agent Framework**: BaseAgent with execute/remember, 9 roles registered (CEO/Architect/Developer/QA/UI_UX/DevOps/Documentation/Security/Operations)
- **Agent Memory**: memory.service.ts (in-memory store), memory.manager.ts, **context-builder.ts** (added this session)
- **Workflow Engine**: in-memory state machine, software-project.template (CEO→Architect→Developer→QA)
- **Monitoring**: ai.logger.ts, agent.monitor.ts, workflow.monitor.ts

### Phase 3 — Real AI Employees (Prompts 1–12)
- Workspace system, Monaco editor integration, Git integration
- Quality engine, documentation engine, deployment engine
- Analytics engine, real-time collaboration

### Phase 4 — Advanced Features (Prompts 13–27)
- **Prompt 13 — Collaboration**: Organization, Team, TeamProject, Membership, MemberPermission, Comment, Mention, Notification models + services + API routes
- **Prompt 14 — Plugins**: Plugin, PluginInstallation, PluginPermission models + SDK, event bus, plugin engine
- **Prompt 15 — Model Router + Fallback**: task-classifier, model-router, fallback.service
- **Prompt 16 — Memory & Context**: importance service, embedding interface, local embedding provider, Memory.importance field
- **Prompt 17 — Workflow Orchestration**: bug-fix workflow template, approval-gate service, ApprovalRequest model
- **Prompt 18 — Security AI**: SecurityIssue, SecurityScan, SecurityRule models; pattern scanner, secret detector, dependency scanner, AI security review, permission auditor, security engine, `/api/security/scan`
- **Prompt 19 — CEO AI Product Management**: ProductStrategy, Requirement, UserStory, Roadmap, ProductDecision models; requirement service, user-story service, priority-score service, roadmap service, product-decision service, `/api/product/requirements`
- **Prompt 20 — UI/UX AI Design System**: DesignSystemConfig, DesignComponent, DesignToken models; token service, ui-generator, accessibility/responsive analyzers, `/api/design/generate`
- **Prompt 21 — Customer Support AI**: SupportConversation, SupportMessage, Feedback, SupportTicket, SentimentResult models; support service, feedback classifier, sentiment analyzer, feedback loop, `/api/support/feedback`
- **Prompt 22 — Enterprise Governance**: OrganizationSettings, CustomRole, Policy, AuditLog models; audit-log service, policy-engine service, custom-role service, `/api/admin/audit`
- **Prompt 23 — Billing & Usage**: CreditAccount, Plan, Subscription, Budget models; cost calculator, credit service, limit checker, billing engine, cost optimizer, `/api/billing/usage`
- **Prompt 24 — Marketplace**: MarketplaceItem, MarketplaceVersion, MarketplaceRating, MarketplaceInstallation models; marketplace engine, rating service, `/api/marketplace/install`
- **Prompt 25 — AI Learning**: AgentPerformance, AgentSkill, LearningRecord, Improvement, Benchmark models; performance evaluator, skill tracker, failure analyzer, pattern detection, improvement engine, benchmark service, `/api/learning/agents`
- **Prompt 26 — Operations Center**: SystemHealth, Incident, Alert, RecoveryAction models; health checker, incident detector, recovery engine, `/api/operations/health`
- **Prompt 27 — Master Orchestrator + Health**: `runFullCompanyWorkflow()` (CEO→Architect→Developer→QA→Security→Deploy), `/api/health`

### This Session's Work
- **DeepSeek provider**: Added as first-class provider (`deepseek-v4-flash` model), gateway fallback chain updated
- **Runtime verified**: Signup → Create project → CEO AI → 3 usage logs in Prisma `ai_usage_logs`
- **agentId threading fixed**: All 4 agent tool chains (CEO/Architect/Developer/QA) now pass `agentId` through to `generate()` → `logUsage()`
- **buildContext wired into BaseAgent.execute()**: Memory-aware context automatically injected for all agents
- **Project↔Organization gap resolved**: Added `organizationId` to Project schema + Zod validation + form picker
- **Git repo initialized**: Pushed to `https://github.com/jabez-abija2399/AI-Teams-Platform-Control`

## Decisions Made
- Task/schema validation lives inside each feature's schemas/ folder
- In-memory rate limiter (lru-cache) is single-instance; needs Redis before horizontal scaling
- `ai.service.ts` is the sole application-facing AI entry point; no feature/agent calls gateway directly
- Workflow execution is fire-and-forget (no job queue yet) — flagged as known gap
- All workflow state is in-memory (Map-based) — not persisted to DB
- Memory service is in-memory (array-based) — not persisted to DB yet
- Support AI is not a real Agent/team member (deliberate — customer-facing utility)
- Feedback submission API has no auth (customer-facing, needs per-project scoped API key before production)
- DeepSeek account needs credits — provider integration verified working but 402 on actual calls (use Groq/Gemini as fallback)
- `channel_binding=require` removed from DATABASE_URL (incompatible with `pg` driver)
- `dotenv/config` in `prisma.config.ts` reads `.env` not `.env.local`
- Next.js 16 uses `proxy.ts` not `middleware.ts`
- Prisma 7: `provider = "prisma-client"`, `output = "./generated/prisma"`, `PrismaPg` adapter required

## Architecture Notes
- `src/ai/` is the AI subsystem root; feature-first organization
- Providers extend OpenAICompatProvider (for OpenAI-compatible APIs)
- Agent roles follow registry pattern: createAgent(role) → correct class
- Workflow engine chains step outputs: each step receives previous step's output as context
- `buildContext()` in `src/ai/agents/memory/context-builder.ts` provides reusable memory-aware prompt enrichment
- AgentRole enum has 9 values: CEO, ARCHITECT, DEVELOPER, QA, UI_UX, DEVOPS, DOCUMENTATION, SECURITY, OPERATIONS
- AI Provider fallback chain: groq → deepseek → gemini → openrouter → anthropic → openai → ollama → together → huggingface

## Infrastructure
- **PostgreSQL**: Local on port 5433, database `ai_teams_platform`, user `jabez`, trust auth
  - Socket dir: `/tmp/pgdata/socket`; Cluster data: `/tmp/pgdata`
  - `scripts/pg-local.sh` for start/stop/status/connect
- **DATABASE_URL**: `postgresql://jabez@localhost:5433/ai_teams_platform` (both `.env` and `.env.local`)
- **Prisma 7**: `provider = "prisma-client"`, `output = "./generated/prisma"`, `prisma.config.ts`

## Complete File Listing (~280 source files)

All paths relative to `ai-teams-platform/`.

### Root Config
| File | Description |
|------|-------------|
| `package.json` | Dependencies, scripts (dev/build/lint/format) |
| `tsconfig.json` | TypeScript strict mode, ES2022, path aliases |
| `next.config.ts` | Next.js config: React strict mode |
| `postcss.config.mjs` | PostCSS: `@tailwindcss/postcss` plugin |
| `eslint.config.mjs` | ESLint 9 flat config: core-web-vitals + TypeScript |
| `prisma.config.ts` | Prisma config loader: reads `.env`, points to schema |
| `components.json` | shadcn/ui config: base-nova style, RSC, Lucide |
| `scripts/pg-local.sh` | PostgreSQL dev instance manager (start/stop/status/connect) |

### `src/ai/gateway/` — AI Gateway
| File | Description |
|------|-------------|
| `ai.gateway.ts` | Main gateway: retry, backoff, fallback chain, generate/stream/structured |
| `ai.types.ts` | Zod-validated types: messages, responses, usage, providers, streaming |
| `ai.constants.ts` | Model catalog: per-provider definitions with token limits and pricing |

### `src/ai/config/`
| File | Description |
|------|-------------|
| `ai.config.ts` | Env-based provider configuration builder |

### `src/ai/providers/` — Provider Adapters
| File | Description |
|------|-------------|
| `provider.interface.ts` | Abstract BaseProvider: constructor, model resolution, availability |
| `provider.registry.ts` | Singleton registry: role→class mapping, lazy instantiation |
| `provider.factory.ts` | Factory: cached creation, first-available fallback |
| `openai-compat.base.ts` | Base adapter for OpenAI-compatible endpoints |
| `openai.adapter.ts` | OpenAI adapter (GPT-4o) |
| `anthropic.adapter.ts` | Anthropic adapter (Claude) |
| `gemini.adapter.ts` | Google Gemini adapter |
| `groq.adapter.ts` | Groq adapter |
| `openrouter.adapter.ts` | OpenRouter adapter |
| `together.adapter.ts` | Together AI adapter |
| `huggingface.adapter.ts` | HuggingFace adapter |
| `ollama.adapter.ts` | Ollama adapter (local) |
| `deepseek.adapter.ts` | DeepSeek adapter (deepseek-v4-flash) |

### `src/ai/services/` — AI Services
| File | Description |
|------|-------------|
| `ai.service.ts` | Application-facing entry: generate, generateStructured with error translation |
| `model.service.ts` | Model catalog: list, filter by provider, resolve info |
| `usage.service.ts` | Usage tracking: logs AI calls to Prisma, aggregates stats |
| `fallback.service.ts` | Fallback executor: tries providers in sequence |

### `src/ai/router/` — Task Routing
| File | Description |
|------|-------------|
| `task-classifier.service.ts` | Maps AgentRole → TaskCategory for model routing |
| `model-router.service.ts` | Maps TaskCategory → preferred provider/model chains |

### `src/ai/agents/core/` — Agent Framework
| File | Description |
|------|-------------|
| `agent.interface.ts` | IAgent contract: execute, getStatus, pause, resume, reset |
| `agent.base.ts` | BaseAgent: task execution with memory context, status management |
| `agent.types.ts` | AgentRole (9 values), AgentStatus, AgentCapability, AgentExecutionResult |
| `agent.constants.ts` | System prompts, capabilities for all 9 roles |

### `src/ai/agents/manager/`
| File | Description |
|------|-------------|
| `agent.registry.ts` | Maps roles to concrete agent classes |
| `agent.manager.ts` | Create, retrieve, list, get summaries for running instances |

### `src/ai/agents/permissions/`
| File | Description |
|------|-------------|
| `permission.service.ts` | Grant/revoke/check role-based permissions on resources |

### `src/ai/agents/tools/`
| File | Description |
|------|-------------|
| `tool.interface.ts` | ITool<TInput,TOutput> contract and ToolDefinition schema |
| `tool.registry.ts` | Register, lookup, filter tools by capability |

### `src/ai/agents/memory/`
| File | Description |
|------|-------------|
| `memory.service.ts` | In-memory store for episodic/semantic/procedural memories |
| `memory.manager.ts` | High-level API: add, recall, search, manage memories |
| `context-builder.ts` | Assembles memory context bundles for agent prompts |

### `src/ai/agents/roles/ceo/` — CEO Agent
| File | Description |
|------|-------------|
| `ceo.agent.ts` | BaseAgent subclass: PLANNING/ANALYSIS/DOCUMENTATION capabilities |
| `ceo.service.ts` | Orchestrates requirement analysis, feature planning, roadmap generation |
| `ceo.types.ts` | Zod schemas: ProductVision, ProductRequirement, DevelopmentPlan, CEOAnalysis |
| `ceo.prompt.ts` | System prompt: product thinking, requirements, MVP scoping |
| `ceo.config.ts` | Model config: preferred/fallback providers, temperature, max tokens |
| `ceo.tools.ts` | Tools: requirementBuilder, featurePlanner, roadmapGenerator |

### `src/ai/agents/roles/architect/` — Architect Agent
| File | Description |
|------|-------------|
| `architect.agent.ts` | BaseAgent subclass: ARCHITECTURE/PLANNING/ANALYSIS |
| `architect.service.ts` | Orchestrates architecture, DB, and API design with DB persistence |
| `architect.types.ts` | Zod schemas: TechnicalArchitecture, DatabaseDesign, APIDesign |
| `architect.prompt.ts` | System prompt: system design, tech stack, API spec |
| `architect.config.ts` | Model config: providers, temperature, max tokens |
| `architect.tools.ts` | Tools: architectureDesigner, databaseDesigner, apiDesigner |

### `src/ai/agents/roles/developer/` — Developer Agent
| File | Description |
|------|-------------|
| `developer.agent.ts` | BaseAgent subclass: CODING/DEBUGGING/IMPLEMENTATION |
| `developer.service.ts` | Orchestrates development planning and code generation |
| `developer.types.ts` | Zod schemas: DeveloperPlan, CodeChange, ImplementationReport |
| `developer.prompt.ts` | System prompt: code generation, file structure, implementation |
| `developer.config.ts` | Model config: providers, temperature, max tokens |
| `developer.tools.ts` | Tools: developmentPlanner, codeGenerator |

### `src/ai/agents/roles/qa/` — QA Agent
| File | Description |
|------|-------------|
| `qa.agent.ts` | BaseAgent subclass: TESTING/ANALYSIS |
| `qa.service.ts` | Orchestrates test generation and bug analysis |
| `qa.types.ts` | Zod schemas: TestPlan, BugReport, QAOutput |
| `qa.prompt.ts` | System prompt: test planning, code review, QA |
| `qa.config.ts` | Model config: providers, temperature, max tokens |
| `qa.tools.ts` | Tools: testGenerator, bugAnalyzer |

### `src/ai/agents/roles/` (Lightweight agents)
| File | Description |
|------|-------------|
| `ceo.agent.ts` | Lightweight CEO BaseAgent subclass |
| `architect.agent.ts` | Lightweight Architect BaseAgent subclass |
| `developer.agent.ts` | Lightweight Developer BaseAgent subclass |
| `qa.agent.ts` | Lightweight QA BaseAgent subclass |
| `devops.agent.ts` | DevOps BaseAgent subclass |
| `documentation.agent.ts` | Documentation BaseAgent subclass |
| `security/security.agent.ts` | Security BaseAgent subclass |
| `ui-ux/design.agent.ts` | UI/UX Design BaseAgent subclass |
| `operations/operations.agent.ts` | Operations BaseAgent subclass |

### `src/ai/workflows/` — Workflow Engine
| File | Description |
|------|-------------|
| `core/workflow.types.ts` | WorkflowStatus, StepStatus, WorkflowInstance, WorkflowDefinition |
| `core/workflow.interface.ts` | IWorkflowEngine: create, start, pause, resume, cancel, query |
| `core/workflow.engine.ts` | State machine: step-by-step execution with status tracking |
| `execution/workflow.executor.ts` | Dispatches steps to correct agent service |
| `execution/workflow.manager.ts` | Convenience: start software-project and bug-fix workflows |
| `execution/task.engine.ts` | In-memory CRUD for AITask records with dependencies |
| `execution/task.manager.ts` | Create, complete, fail, query workflow-level tasks |
| `execution/task.types.ts` | AITask interface, TaskPriorityType |
| `templates/software-project.template.ts` | 4-step: Requirements → Architecture → Implementation → QA |
| `templates/bug-fix.workflow.ts` | 2-step: Fix Bug → Verify Fix |
| `approvals/approval-gate.service.ts` | Request, resolve, query human approval gates via Prisma |

### `src/ai/communication/`
| File | Description |
|------|-------------|
| `message.types.ts` | Message, Conversation interfaces, MessageType enum |
| `message.service.ts` | In-memory CRUD for messages and conversations |
| `conversation.manager.ts` | Create conversations, add messages, manage participants |

### `src/ai/monitoring/`
| File | Description |
|------|-------------|
| `ai.logger.ts` | Structured logging with levels, in-memory ring buffer (1000) |
| `agent.monitor.ts` | Agent health tracking: status, heartbeat, error count |
| `workflow.monitor.ts` | Workflow health: progress, step completion, error count |

### `src/ai/errors/`
| File | Description |
|------|-------------|
| `AIError.ts` | AIError, ProviderNotFoundError, ProviderRequestError, ProviderConfigError |

### `src/ai/memory/`
| File | Description |
|------|-------------|
| `importance.service.ts` | Memory importance classifier from content patterns |
| `embeddings/embedding-provider.interface.ts` | Contract for createEmbedding and searchSimilarity |
| `embeddings/local-embedding.provider.ts` | Cosine similarity search implementation |

### `src/app/` — Next.js App Router

#### Pages
| File | Description |
|------|-------------|
| `layout.tsx` | Root layout: Inter font, Providers, Toaster |
| `page.tsx` | Landing page: hero with Sign In / Register |
| `globals.css` | Tailwind imports and base styles |
| `login/page.tsx` | Login page |
| `register/page.tsx` | Registration page |
| `dashboard/layout.tsx` | Dashboard layout: auth guard, Sidebar + Navbar |
| `dashboard/page.tsx` | Dashboard home |
| `dashboard/projects/page.tsx` | Projects list |
| `dashboard/projects/new/page.tsx` | Create new project |
| `dashboard/projects/[id]/page.tsx` | Project detail |
| `dashboard/projects/[id]/workspace/page.tsx` | Project workspace (IDE-style) |
| `dashboard/projects/[id]/project-tabs-client.tsx` | Client-side tab switcher |
| `dashboard/ai-teams/page.tsx` | AI Teams overview |
| `dashboard/ai-teams/actions.ts` | Server actions: fetchAgentSummaries |
| `dashboard/settings/page.tsx` | User settings |

#### API Routes
| File | Description |
|------|-------------|
| `api/auth/[...nextauth]/route.ts` | NextAuth catch-all |
| `api/auth/register/route.ts` | POST: user registration |
| `api/users/me/route.ts` | GET/PUT: user profile |
| `api/health/route.ts` | GET: health check |
| `api/projects/route.ts` | GET/POST: list and create projects |
| `api/projects/recent/route.ts` | GET: recently accessed projects |
| `api/projects/[id]/route.ts` | GET/PUT/DELETE: single project |
| `api/projects/[id]/tasks/route.ts` | GET/POST: project tasks |
| `api/projects/[id]/workflows/route.ts` | GET/POST: project workflows |
| `api/projects/[id]/explorer/route.ts` | GET: file explorer |
| `api/projects/[id]/favorite/route.ts` | POST: toggle favorite |
| `api/workflows/[id]/route.ts` | GET/PUT: single workflow |
| `api/ai/ceo/route.ts` | POST: CEO AI analysis |
| `api/ai/architect/route.ts` | POST: Architect AI analysis |
| `api/ai/developer/route.ts` | POST: Developer AI implementation |
| `api/ai/qa/route.ts` | POST: QA AI review |
| `api/design/generate/route.ts` | POST: UI design generation |
| `api/security/scan/route.ts` | POST: security scan |
| `api/plugins/route.ts` | GET/POST: plugin marketplace |
| `api/organizations/route.ts` | GET/POST: organization CRUD |
| `api/organizations/members/route.ts` | GET/POST: org members |
| `api/organizations/teams/route.ts` | GET/POST: org teams |
| `api/comments/route.ts` | GET/POST: collaboration comments |
| `api/notifications/route.ts` | GET: user notifications |
| `api/learning/agents/route.ts` | GET: agent learning records |
| `api/product/requirements/route.ts` | GET/POST: product requirements |
| `api/billing/usage/route.ts` | GET: billing usage |
| `api/admin/audit/route.ts` | GET: admin audit log |
| `api/support/feedback/route.ts` | POST: feedback submission |
| `api/workspace/preferences/route.ts` | GET/PUT: workspace preferences |
| `api/marketplace/install/route.ts` | POST: install marketplace item |
| `api/operations/health/route.ts` | GET: operations health |

### `src/features/auth/`
| File | Description |
|------|-------------|
| `schemas/auth.schema.ts` | Login, register, confirmPassword Zod schemas |
| `services/auth.service.ts` | Registration with bcrypt, duplicate email detection |
| `services/user.service.ts` | Get and update user profile |

### `src/features/projects/`
| File | Description |
|------|-------------|
| `types/project.types.ts` | TypeScript interfaces for project data |
| `schemas/project.schema.ts` | Zod: project create/update (includes `organizationId`) |
| `services/project.service.ts` | CRUD, listing, favoriting via Prisma |
| `services/task.service.ts` | Task CRUD for projects |
| `components/project-card.tsx` | Project summary in grid/list |
| `components/project-form.tsx` | Create/edit form with org picker |
| `components/project-details.tsx` | Full project info display |

### `src/features/ceo-ai/`
| File | Description |
|------|-------------|
| `components/ceo-chat.tsx` | CEO AI analysis chat panel |
| `components/requirement-viewer.tsx` | Displays structured product requirements |
| `components/roadmap-viewer.tsx` | Displays phased development roadmap |
| `components/product-vision-card.tsx` | Displays problem/solution/target/users/goal |

### `src/features/architect-ai/`
| File | Description |
|------|-------------|
| `components/architecture-chat.tsx` | Architect AI chat panel |
| `components/system-diagram.tsx` | Visual system architecture display |
| `components/technology-decision-card.tsx` | Technology stack decisions |
| `components/api-document-viewer.tsx` | Generated API specifications |
| `components/database-viewer.tsx` | Database schema design display |

### `src/features/developer-ai/`
| File | Description |
|------|-------------|
| `components/implementation-viewer.tsx` | Developer AI output display |
| `components/code-task-viewer.tsx` | Individual code generation tasks |
| `components/file-change-viewer.tsx` | Diffs/changes for generated files |

### `src/features/qa-ai/`
| File | Description |
|------|-------------|
| `components/quality-score.tsx` | Overall quality metrics |
| `components/test-report.tsx` | Test plan results |
| `components/bug-list.tsx` | Discovered bugs with severity |

### `src/features/ai-dashboard/`
| File | Description |
|------|-------------|
| `services/dashboard.service.ts` | Aggregates agent status, workflow progress, metrics |
| `components/agent-overview.tsx` | All agents' statuses |
| `components/task-board.tsx` | Kanban-style task display |
| `components/conversation-panel.tsx` | AI team conversations |
| `components/workflow-progress.tsx` | Visual progress for active workflows |

### `src/features/workspace/` — IDE-style Workspace
| File | Description |
|------|-------------|
| `types/workspace.types.ts` | Workspace shell state interfaces |
| `stores/workspace.store.ts` | Global state: active panels, layouts, mode |
| `constants/workspace.constants.ts` | Default panel sizes, layout presets |
| `hooks/use-resizable-panel.ts` | Drag-to-resize logic |
| `components/workspace-shell.tsx` | Top-level workspace layout |
| `components/workspace-sidebar-content.tsx` | Sidebar navigation items |
| `components/project-initializer.tsx` | Sets up workspace on project load |
| `components/layouts/top-nav.tsx` | Workspace header |
| `components/layouts/activity-bar.tsx` | Vertical icon bar (VS Code-style) |
| `components/layouts/sidebar-panel.tsx` | Left panel container |
| `components/layouts/editor-area.tsx` | Main content area |
| `components/layouts/ai-panel.tsx` | Right panel for AI conversations |
| `components/layouts/bottom-panel.tsx` | Terminal/output/logs area |
| `components/layouts/status-bar.tsx` | Bottom status bar |
| `navigation/components/breadcrumb.tsx` | File path breadcrumb |
| `search/types/search.types.ts` | Search result interfaces |
| `search/services/search-preparation.service.ts` | Content indexing for search |
| `explorer/types/explorer.types.ts` | File/folder node interfaces |
| `explorer/stores/explorer.store.ts` | File tree state |
| `explorer/services/explorer.service.ts` | File tree and content fetching |
| `explorer/hooks/use-explorer.ts` | File tree interaction logic |
| `explorer/components/explorer-tree.tsx` | Recursive file/folder tree |
| `explorer/components/file-node.tsx` | Individual file entry |
| `explorer/components/folder-node.tsx` | Collapsible folder entry |
| `explorer/components/explorer-toolbar.tsx` | Search, new file, new folder buttons |
| `explorer/components/explorer-node-context-menu.tsx` | Right-click menu |
| `project-manager/types/project-manager.types.ts` | Project switching interfaces |
| `project-manager/hooks/use-projects.ts` | Fetch and cache project list |
| `project-manager/hooks/use-recent-projects.ts` | Recent projects fetch |
| `project-manager/services/project-manager.service.ts` | Recent projects, switching logic |
| `project-manager/schemas/project-manager.schema.ts` | Zod validation for project switcher |
| `project-manager/components/project-card.tsx` | Compact project display |
| `project-manager/components/recent-projects.tsx` | Recent projects list |
| `project-manager/components/project-switcher.tsx` | Dropdown/modal project switcher |

### `src/features/editor/`
| File | Description |
|------|-------------|
| `types/index.ts` | Editor state, language, theme interfaces |
| `schemas/editor.schema.ts` | Zod: editor settings |
| `services/editor.service.ts` | File operations, content management |
| `utils/language-detector.ts` | File extension → language mapping |
| `hooks/use-editor.ts` | Monaco editor instance management |
| `hooks/use-command-palette-actions.ts` | Command palette item registration |
| `components/monaco-editor.tsx` | Monaco Editor integration |
| `components/editor-container.tsx` | Manages tabs, split views |
| `components/editor-toolbar.tsx` | File actions (save, format) |
| `components/command-palette.tsx` | Cmd+K search/actions overlay |
| `components/language-selector.tsx` | Syntax highlighting selector |
| `components/providers/command-palette-provider.tsx` | Command registration context |

### `src/features/git/`
| File | Description |
|------|-------------|
| `types/index.ts` | Branch, commit, diff, status interfaces |
| `schemas/git.schema.ts` | Zod: git operations |
| `services/git.service.ts` | Branch, commit, diff, status operations |
| `hooks/use-git.ts` | Reactive git state and operations |
| `components/git-panel.tsx` | Source control sidebar |
| `components/branch-manager.tsx` | Branch creation/switching UI |
| `components/status-indicator.tsx` | Git status badge |
| `components/diff-viewer.tsx` | Side-by-side/inline diff display |
| `components/commit-history.tsx` | Scrollable commit log |

### `src/features/collaboration/`
| File | Description |
|------|-------------|
| `types/collaboration.types.ts` | Org, team, member, comment interfaces |
| `organizations/organization.service.ts` | Org CRUD and membership |
| `teams/team.service.ts` | Team CRUD within orgs |
| `members/member.service.ts` | Add/remove/update members |
| `comments/comment.service.ts` | Threaded comments on artifacts |
| `notifications/notification.service.ts` | Create and query notifications |
| `components/member-list.tsx` | Team members with roles |
| `components/comment-thread.tsx` | Threaded comment display and reply |

### `src/features/product-management/`
| File | Description |
|------|-------------|
| `requirements/requirement.service.ts` | Product requirement CRUD |
| `stories/user-story.service.ts` | User story CRUD |
| `roadmap/roadmap.service.ts` | Phased roadmap management |
| `prioritization/priority-score.service.ts` | Priority score calculation |
| `decisions/product-decision.service.ts` | Record and query decisions |
| `components/requirement-board.tsx` | Kanban-style requirement management |

### `src/features/design-system/`
| File | Description |
|------|-------------|
| `tokens/token.service.ts` | Design tokens (colors, spacing, typography) |
| `generator/ui-generator.service.ts` | AI-powered UI component generation |
| `services/responsive-analyzer.service.ts` | Responsive design suggestions |
| `accessibility/accessibility-analyzer.service.ts` | WCAG compliance checking |

### `src/features/customer-intelligence/`
| File | Description |
|------|-------------|
| `support-agent/support.service.ts` | AI-powered support response generation |
| `services/feedback-classifier.service.ts` | Categorize user feedback |
| `services/feedback-loop.service.ts` | Feedback → product improvement pipeline |
| `sentiment/sentiment-analyzer.service.ts` | Customer sentiment analysis |

### `src/features/security-engine/`
| File | Description |
|------|-------------|
| `core/security.engine.ts` | Orchestrates full security scan |
| `core/security-score.service.ts` | Security score from open issues |
| `scanner/pattern-scanner.service.ts` | Regex vulnerability detection |
| `secrets/secret-detector.service.ts` | Scan for leaked keys/passwords/tokens |
| `dependencies/dependency-scanner.service.ts` | Check for vulnerable packages |
| `analysis/ai-security-review.service.ts` | AI deep code security analysis |
| `services/permission-auditor.service.ts` | Audit agent permissions |
| `components/security-score-card.tsx` | Security scan results display |

### `src/features/plugins/`
| File | Description |
|------|-------------|
| `sdk/plugin.interface.ts` | IPlugin contract for extending platform |
| `core/plugin.engine.ts` | Load, init, enable/disable plugins |
| `core/event-bus.ts` | Pub/sub for plugin-to-platform communication |
| `permissions/plugin-permission.service.ts` | Plugin access scopes |
| `marketplace/marketplace.types.ts` | Plugin listing, version, rating interfaces |
| `components/plugin-card.tsx` | Plugin info in marketplace listing |

### `src/features/marketplace/`
| File | Description |
|------|-------------|
| `core/marketplace.engine.ts` | Plugin discovery, installation, version management |
| `ratings/rating.service.ts` | Submit and query plugin ratings |

### `src/features/enterprise/`
| File | Description |
|------|-------------|
| `audit/audit-log.service.ts` | Record and query audit trail |
| `roles/custom-role.service.ts` | Custom RBAC role management |
| `policies/policy-engine.service.ts` | Evaluate and enforce policies |
| `components/audit-viewer.tsx` | Audit log display |

### `src/features/billing/`
| File | Description |
|------|-------------|
| `core/billing.engine.ts` | Facade: re-exports billing services + invoices |
| `cost/cost-calculator.service.ts` | Aggregate costs per org/project |
| `limits/limit-checker.service.ts` | Validate usage against plan limits |
| `credits/credit.service.ts` | Credit account management |
| `services/cost-optimizer.service.ts` | Usage analysis and cost-saving suggestions |

### `src/features/ai-learning/`
| File | Description |
|------|-------------|
| `evaluation/performance-evaluator.service.ts` | Score agent task execution |
| `analysis/failure-analyzer.service.ts` | AI analysis of agent failures |
| `services/pattern-detection.service.ts` | Find recurring lessons |
| `improvement/improvement-engine.service.ts` | Generate improvement proposals |
| `benchmarks/benchmark.service.ts` | Standardized benchmark tasks |
| `skills/skill-tracker.service.ts` | Exponential moving average scoring |

### `src/features/operations-center/`
| File | Description |
|------|-------------|
| `incidents/incident-detector.service.ts` | Identify and categorize incidents |
| `monitoring/health-check.service.ts` | System health monitoring |
| `recovery/recovery.engine.ts` | Automated incident response |

### `src/features/dashboard/`
| File | Description |
|------|-------------|
| `services/dashboard.service.ts` | Aggregates stats, activity, quick actions |
| `components/stat-card.tsx` | Metric display with label |
| `components/recent-activity.tsx` | Timeline of recent events |
| `components/quick-actions.tsx` | Common operation shortcuts |

### `src/features/documentation/`
| File | Description |
|------|-------------|
| `types/index.ts` | Document and knowledge base interfaces |
| `schemas/documentation.schema.ts` | Zod: document validation |
| `services/document.service.ts` | Project documentation CRUD |
| `services/knowledge.service.ts` | Knowledge base management |
| `services/agent-decision.service.ts` | Record AI agent decisions |
| `hooks/use-documents.ts` | Document list fetch/cache |
| `hooks/use-knowledge.ts` | Knowledge base fetch/cache |
| `components/documentation-panel.tsx` | Main documentation sidebar |
| `components/doc-list.tsx` | Browseable document list |
| `components/doc-editor.tsx` | Rich text/markdown editor |
| `components/doc-tree.tsx` | Hierarchical document navigator |
| `components/knowledge-panel.tsx` | Knowledge base display |

### `src/components/ui/` — Shared UI
| File | Description |
|------|-------------|
| `button.tsx` | Button: variants (default, outline, ghost, etc.) |
| `input.tsx` | Text input with label/error |
| `card.tsx` | Container: header, content, footer |
| `badge.tsx` | Status/label indicator |
| `avatar.tsx` | User image with fallback initials |
| `dialog.tsx` | Modal dialog |
| `dropdown-menu.tsx` | Context/action menu |
| `sheet.tsx` | Slide-in panel (sidebar drawer) |
| `tabs.tsx` | Tabbed content switcher |
| `loading.tsx` | Spinner/skeleton |
| `empty-state.tsx` | Empty list/panel placeholder |
| `error-state.tsx` | Error display with retry |

### `src/components/layout/`
| File | Description |
|------|-------------|
| `sidebar.tsx` | Main navigation sidebar |
| `navbar.tsx` | Top bar with user info |
| `mobile-menu.tsx` | Responsive hamburger menu |
| `page-container.tsx` | Max-width wrapper |

### `src/components/providers/`
| File | Description |
|------|-------------|
| `providers.tsx` | Composes Query + Theme + Session providers |
| `query-provider.tsx` | TanStack Query client |
| `theme-provider.tsx` | next-themes dark/light mode |

### `src/lib/` — Utilities
| File | Description |
|------|-------------|
| `prisma.ts` | Prisma singleton: PostgreSQL via PrismaPg adapter |
| `auth.ts` | NextAuth: JWT, Credentials, bcrypt verification |
| `api-response.ts` | `toResponse`: ApiResult → NextResponse with HTTP codes |
| `rate-limit.ts` | LRU-cache sliding window rate limiter (5000 keys, 60s TTL) |
| `utils.ts` | `cn()`: Tailwind class merging via clsx + tailwind-merge |

### `src/config/`
| File | Description |
|------|-------------|
| `constants.ts` | APP_NAME, ROUTES, PROJECT_STATUS, TASK_STATUS, TASK_PRIORITY |
| `env.ts` | Zod-validated env loader |

### `src/types/`
| File | Description |
|------|-------------|
| `common.types.ts` | Nullable<T>, PaginatedResult<T>, ApiError, ApiResult<T> |

### `prisma/`
| File | Description |
|------|-------------|
| `schema.prisma` | Full schema (~1700 lines): 100+ models, all enums, all relations |

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — JWT signing secret
- `GROQ_API_KEY` — Primary AI provider (free tier available)
- `GEMINI_API_KEY` — Secondary AI provider
- `OPENROUTER_API_KEY` — Tertiary AI provider
- `DEEPSEEK_API_KEY` — DeepSeek provider (account needs credits)

## Key API Routes
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/callback/credentials` | Login (NextAuth) |
| GET/POST | `/api/projects` | List/create projects |
| POST | `/api/projects` | Create project (accepts `organizationId`) |
| POST | `/api/ai/ceo` | Run CEO AI analysis |
| POST | `/api/ai/architect` | Run Architect AI |
| POST | `/api/ai/developer` | Run Developer AI |
| POST | `/api/ai/qa` | Run QA AI |
| POST | `/api/projects/[id]/workflows` | Start full workflow |
| GET | `/api/organizations` | List user's organizations |
| GET | `/api/health` | Public health check |
| GET | `/api/security/scan` | Security scan |
| GET | `/api/product/requirements` | Product requirements |
| POST | `/api/design/generate` | Generate UI design |
| GET | `/api/support/feedback` | Support feedback |
| GET | `/api/admin/audit` | Audit log |
| GET | `/api/billing/usage` | Billing usage |
| POST | `/api/marketplace/install` | Install marketplace item |
| GET | `/api/learning/agents` | Agent learning |
| GET | `/api/operations/health` | Operations health |

## Current Problems
- **Zero automated tests** across the entire codebase
- All workflow state is in-memory (Map-based) — not persisted to DB
- No job queue for workflow execution — fire-and-forget only
- No real-time updates (no WebSocket/SSE for live workflow progress)
- Memory service is in-memory (array-based) — not persisted to DB
- DeepSeek provider: HTTP 402 (account needs credits)
- Rate limiting is in-memory, single-instance only
- No OAuth providers (Credentials-only)
- Project↔Organization structural gap partially resolved (orgId field added, but project creation doesn't auto-assign org)

## Next Tasks
- **Fund DeepSeek account** or use existing Groq/Gemini for continued testing
- **Write integration tests** — signup → project → AI agent flow
- **Persist workflow state to DB** — replace in-memory Map with Prisma
- **Persist memory to DB** — replace in-memory array with Prisma
- **Add job queue** for workflow execution (BullMQ + Redis)
- **Add WebSocket/SSE** for real-time workflow progress
- **Add OAuth providers** (Google, GitHub)
- **Resolve remaining structural gaps** — Project↔Organization auto-assignment
