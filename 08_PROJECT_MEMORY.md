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
