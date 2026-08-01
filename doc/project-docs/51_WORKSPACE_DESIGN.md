# AI Software Company Workspace — Complete Design

## Vision

The user is a CEO operating an AI software company. The workspace is a premium, futuristic mission control center where they can see everything happening in real-time. It should feel like commanding a team of world-class AI engineers, not using a developer dashboard.

---

## Core Design Principles

1. **Simplicity First** — Never expose technical complexity to the user
2. **Real-Time Visibility** — The user should always know what's happening
3. **Premium Aesthetic** — Dark mode, glass panels, soft gradients, smooth animations
4. **Room-Based Flow** — Each pipeline phase is a "room" the user occupies
5. **Autonomous by Default** — The AI company works on its own; the user approves decisions

---

## Design Language

### Colors
- **Background**: Near-black (#09090b / #0c0c0f)
- **Panels**: Translucent dark glass (rgba(255,255,255,0.03))
- **Borders**: Subtle white (rgba(255,255,255,0.06))
- **Primary Accent**: Gold/Amber (#D4AF37) — premium, AI company feel
- **Secondary Accent**: Sky blue (#38bdf8) — for active states
- **Success**: Emerald (#10b981)
- **Warning**: Amber (#f59e0b)
- **Error**: Rose (#f43f5e)
- **Text Primary**: White (#fafafa)
- **Text Secondary**: Gray (#a1a1aa)
- **Text Muted**: Gray (#71717a)

### Typography
- **Headings**: Inter/SF Pro Display, bold
- **Body**: Inter/SF Pro, regular
- **Mono**: JetBrains Mono/Fira Code (for code artifacts only)

### Components
- **Cards**: Rounded-xl, glass effect, subtle border
- **Buttons**: Rounded-lg, gradient backgrounds
- **Inputs**: Dark background, focus ring
- **Animations**: Smooth transitions, pulse for live indicators

---

## User Journey — 12 Rooms

### Room 0: Project Creation (Onboarding)

**Screen**: Full-page creation form
**Layout**: Centered card on dark background

**Fields**:
- Project Name (required)
- Description (required)
- Business Goal (required)
- Target Users (required)
- Technology Preference (optional, dropdown)

**CTA**: "START YOUR AI COMPANY" (gold gradient button)

**Animation**: After click → "Your AI software company is being created..." with team assembly animation showing AI employees joining

**Backend**: Creates project, initializes all AI employees, starts lifecycle

---

### Room 1: Discovery Room

**Phase**: DISCOVERY_RUNNING
**AI Employee**: CEO AI

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│  🏢 DISCOVERY ROOM                    [Phase 1/12]  │
├──────────┬──────────────────────────┬───────────────┤
│          │                          │               │
│ Project  │    CEO AI Chat           │  AI Team      │
│ Vision   │                          │  Status       │
│          │  "Analyzing your idea..."│               │
│ [Card]   │                          │  [Cards]      │
│          │                          │               │
├──────────┴──────────────────────────┴───────────────┤
│  Activity Feed: "CEO is analyzing market..."        │
└─────────────────────────────────────────────────────┘
```

**Left Panel — Project Vision**:
- Project name, description, goal
- User's original idea text

**Center Panel — CEO AI Conversation**:
- CEO's analysis in progress
- Shows thinking state with animation
- Output: Product Vision document

**Right Panel — AI Team Status**:
- All 11 AI employees listed
- Status: Initializing / Ready / Working / Waiting
- Current task description

**Artifact Produced**: Product Specification
- Product Vision
- Target Users
- Main Problem
- MVP Features
- Future Roadmap

**Approval Gate**: User can approve or request changes

---

### Room 2: Clarification Room

**Phase**: CLARIFICATION_RUNNING
**AI Employee**: Product Manager AI

**Layout**: Three-column (same as Discovery)

**Center Panel — Interactive Q&A**:
- PM asks clarifying questions
- Displayed as interactive cards with options
- User clicks to answer

**Questions shown as cards**:
```
┌─────────────────────────────┐
│  Who are your primary users?│
│                             │
│  [Students] [Businesses]    │
│  [General Users] [Enterprise]│
└─────────────────────────────┘
```

**Artifact Produced**: Complete Requirements Document

**Approval Gate**: Review and approve requirements

---

### Room 3: Product Proposal Room

**Phase**: PROPOSAL_RUNNING
**AI Employee**: Product Manager AI + Business Analyst AI

**Layout**: Full-width premium proposal

**Design**: Like an investor pitch deck

**Sections**:
1. Product Vision
2. Problem Statement
3. Proposed Solution
4. Key Features
5. User Experience Flow
6. MVP Scope
7. Timeline
8. Risks & Mitigations

**Special Element**: AI Quality Score
```
┌─────────────────────────────┐
│  Product Quality Score      │
│                             │
│         92/100              │
│  ████████████████████░░     │
│                             │
│  ✓ Clear vision             │
│  ✓ Defined audience         │
│  ✓ Feasible scope           │
│  ⚠ Missing metrics          │
└─────────────────────────────┘
```

**Approval Gates**: "Approve Product Plan" / "Request Changes"

---

### Room 4: Strategy Room

**Phase**: STRATEGY_RUNNING
**AI Employee**: CEO AI

**Layout**: CEO Desk Interface

**Center Panel — CEO Creates**:
- Business Strategy document
- Technical Direction
- Execution Strategy
- Team Allocation

**Shows**: CEO organizing resources, assigning roles

**Artifact**: Strategy Document

---

### Room 5: Product Management Room

**Phase**: PRODUCT_RUNNING
**AI Employee**: Product Manager AI

**Layout**: Kanban-style board

**Columns**:
| Ideas | Planned | Building | Testing | Completed |
|-------|---------|----------|---------|-----------|

**Cards in each column**:
- Feature name
- Priority (High/Medium/Low)
- Assigned AI employee
- Status

**Artifact**: PRD, User Stories, Feature Priorities

---

### Room 6: Architecture Room

**Phase**: ARCHITECTURE_RUNNING
**AI Employee**: Software Architect AI

**Layout**: Architecture Studio

**Center Panel — System Diagram**:
```
┌─────────────────────────────────────────┐
│           System Architecture           │
│                                         │
│    [Frontend] ←→ [API Gateway]          │
│                        ↓                │
│              [Backend Services]          │
│                        ↓                │
│              [Database Layer]            │
│                        ↓                │
│              [External APIs]             │
└─────────────────────────────────────────┘
```

**Architect's Explanation**:
- "I selected this architecture because..."
- Technology choices explained
- Trade-offs documented

**Artifact**: Architecture Decision Record

**Approval Gate**: User approves architecture

---

### Room 7: Planning Room

**Phase**: PLANNING_RUNNING
**AI Employee**: CEO AI + Executive Planner

**Layout**: Timeline view

**Company Roadmap**:
```
Week 1: Design Phase
  ├── UI/UX Designer: Creating wireframes
  └── Architect: Finalizing tech stack

Week 2: Development Phase
  ├── Frontend Engineer: Building UI components
  ├── Backend Engineer: Creating APIs
  └── Database Engineer: Schema design

Week 3: Testing & Deployment
  ├── QA Engineer: Writing test suites
  ├── Security Engineer: Security audit
  └── DevOps: Deployment setup
```

**Artifact**: Execution Plan with assignments

---

### Room 8: Development Room (Mission Control) ★

**Phase**: DEVELOPMENT_RUNNING → TESTING_RUNNING → REVIEW_RUNNING
**AI Employees**: ALL (this is the main event)

**Layout**: Mission Control Dashboard
```
┌─────────────────────────────────────────────────────┐
│  🚀 MISSION CONTROL               [Phase 9/12]     │
├─────────────────────────────────────────────────────┤
│  Progress: ████████████░░░░░░ 65%  │ Health: 94    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Live Timeline          │  AI Employee Cards        │
│                         │                           │
│  ✓ CEO Strategy         │  ┌─────┐ ┌─────┐         │
│  ✓ Architect Design     │  │ CEO │ │ PM  │         │
│  ● Frontend Building    │  │ 👁  │ │ 📋  │         │
│  ○ QA Waiting           │  └─────┘ └─────┘         │
│  ○ Security Waiting     │                           │
│                         │  ┌─────┐ ┌─────┐         │
│  Current: Frontend      │  │Arch │ │ Dev │         │
│  "Building homepage..." │  │ 🏗  │ │ 💻  │         │
│                         │  └─────┘ └─────┘         │
├─────────────────────────────────────────────────────┤
│  Activity Feed                                    │
│  "Frontend Engineer created navigation component"  │
│  "QA Engineer found accessibility issue"           │
│  "Security Engineer reviewing authentication"      │
└─────────────────────────────────────────────────────┘
```

**Top Bar — Project Health**:
- Progress percentage
- Current phase
- Health score (0-100)
- Active agents count
- Time elapsed

**Center — Live Timeline**:
- Vertical timeline showing completed/active/pending phases
- Each phase shows: status icon, phase name, responsible AI, description
- Current phase highlighted with pulse animation

**Right — AI Employee Cards**:
- Grid of all AI employees
- Each card shows: Avatar, Name, Role, Status (active/idle/completed), Current task
- Active employees have pulsing indicator

**Bottom — Activity Feed**:
- Real-time stream of actions
- Timestamps
- Agent attribution
- Action type (created, reviewed, fixed, deployed)

---

### Room 9: Review Committee Room

**Phase**: REVIEW_RUNNING
**AI Employees**: Review Board (5 reviewers)

**Layout**: Review Board Interface

**Review Board Members**:
```
┌─────────────────────────────────────────────────────┐
│              REVIEW COMMITTEE                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Architecture    Code         Security              │
│  Reviewer        Reviewer     Reviewer              │
│  ┌─────┐        ┌─────┐      ┌─────┐              │
│  │ 94  │        │ 91  │      │ 98  │              │
│  └─────┘        └─────┘      └─────┘              │
│                                                     │
│  UX            Performance                          │
│  Reviewer      Reviewer                             │
│  ┌─────┐      ┌─────┐                              │
│  │ 89  │      │ 92  │                              │
│  └─────┘      └─────┘                              │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Overall Score: 92.8/100                            │
│  Status: ✓ APPROVED                                 │
└─────────────────────────────────────────────────────┘
```

**Each reviewer gives**:
- Score (0-100)
- Written feedback
- Specific issues found
- Recommendations

**Final Status**: APPROVED / NEEDS REVISION

---

### Room 10: Deployment Room

**Phase**: DEPLOYMENT_RUNNING
**AI Employee**: DevOps Engineer AI

**Layout**: Deployment Pipeline

**Pipeline visualization**:
```
Development → Testing → Security Scan → Production
    ✓           ✓            ✓              ●
```

**Shows**:
- Build logs (optional, in developer mode)
- Deployment progress
- Environment status
- URL when live

---

### Room 11: Final Product Room

**Phase**: COMPLETED

**Layout**: Delivery Dashboard

**Software Company Report**:
```
┌─────────────────────────────────────────────────────┐
│           🎉 PROJECT COMPLETE                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  What Was Built:                                    │
│  Hotel Booking Website with full functionality      │
│                                                     │
│  Architecture:                                      │
│  Next.js + Node.js + PostgreSQL                     │
│                                                     │
│  Features Delivered:                                │
│  ✓ User authentication                              │
│  ✓ Hotel search & booking                           │
│  ✓ Payment processing                               │
│  ✓ Admin dashboard                                  │
│                                                     │
│  Performance:                                       │
│  ✓ Lighthouse Score: 95                             │
│  ✓ Load Time: 1.2s                                  │
│  ✓ Test Coverage: 87%                               │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Deliverables:                                      │
│  [Production URL]  [Documentation]  [Source Code]   │
└─────────────────────────────────────────────────────┘
```

---

## Shared Components

### AIEmployeeCard
```
┌─────────────────────┐
│  👤  CEO AI          │
│  Status: ● Active    │
│  Task: Analyzing...  │
│  Confidence: 94%     │
│  [████████░░] 82%    │
└─────────────────────┘
```

### ActivityFeedItem
```
┌─────────────────────────────────────────────┐
│  ● Frontend Engineer    2 min ago           │
│  Created navigation component               │
│  Artifact: navigation.tsx                   │
└─────────────────────────────────────────────┘
```

### ArtifactCard
```
┌─────────────────────────────────────────────┐
│  📄 Product Specification                   │
│  Created by: CEO AI                         │
│  Status: ✓ Approved                         │
│                                             │
│  [View Artifact]  [Download]                │
└─────────────────────────────────────────────┘
```

### ApprovalDialog
```
┌─────────────────────────────────────────────┐
│  ⚠ Approval Required                        │
│                                             │
│  The CEO has completed the product          │
│  specification. Please review and approve.  │
│                                             │
│  [Approve]  [Request Changes]  [Reject]     │
└─────────────────────────────────────────────┘
```

### ProgressIndicator
```
Phase 4/12: Architecture
████████░░░░░░░░░░░░ 35%
```

---

## Mode System

### Creator Mode (Default)
- Simple language
- No technical details
- Focus on business outcomes
- Clean, minimal UI

### Developer Mode
- Shows logs, tokens, API calls
- Agent reasoning metadata
- Performance metrics
- Technical architecture details

Toggle in top-right corner of workspace.

---

## Real-Time Updates

All rooms use SSE (Server-Sent Events) for:
- Agent status changes
- Activity feed updates
- Artifact generation progress
- Approval gate triggers
- Pipeline phase transitions

---

## Implementation Priority

1. **Project Creation Flow** (Room 0) — Enhanced form + animation
2. **Room Shell** — Navigation between rooms, phase-based routing
3. **Discovery Room** (Room 1) — CEO analysis with real-time updates
4. **Development Room** (Room 8) — Mission Control (most complex)
5. **Review Room** (Room 9) — Review committee with scores
6. **Final Room** (Room 11) — Delivery dashboard
7. **Remaining Rooms** — Fill in as needed
