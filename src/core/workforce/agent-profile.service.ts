import { prisma } from '@/lib/prisma';
import type { AIAgentProfile, CompanyRole } from './types';

const inMemoryProfiles = new Map<string, AIAgentProfile[]>();

export class AgentProfileService {
  /**
   * Returns default AI company agent profiles across all 10 roles
   */
  public static getDefaultProfiles(): AIAgentProfile[] {
    return [
      {
        id: 'prof_ceo',
        role: 'CEO',
        name: 'Alexander Vance',
        avatar: '/avatars/ceo.webp',
        title: 'Chief Executive Officer AI',
        skills: ['Strategic Vision', 'Executive Alignment', 'Resource Allocation', 'Company Governance'],
        personality: 'Visionary, strategic, decisive, and calm under ambiguity.',
        responsibilities: ['Define strategic objectives', 'Authorize architectural roadmaps', 'Manage company performance'],
        experienceLevel: 'Executive',
      },
      {
        id: 'prof_pm',
        role: 'PRODUCT_MANAGER',
        name: 'Elena Rostova',
        avatar: '/avatars/pm.webp',
        title: 'Lead Product Manager AI',
        skills: ['Product Requirements SRS', 'User Story Mapping', 'Backlog Prioritization', 'Market Research'],
        personality: 'Empathetic, organized, detail-oriented, and user-centric.',
        responsibilities: ['Transform natural language ideas into SRS', 'Conduct clarification interviews', 'Craft product proposals'],
        experienceLevel: 'Principal',
      },
      {
        id: 'prof_architect',
        role: 'SOFTWARE_ARCHITECT',
        name: 'Marcus Thorne',
        avatar: '/avatars/architect.webp',
        title: 'Principal Software Architect AI',
        skills: ['Fullstack System Design', 'Next.js App Router', 'Modular Monoliths', 'Quality Scoring'],
        personality: 'Analytical, pragmatic, uncompromising on technical excellence.',
        responsibilities: ['Formulate architecture proposals', 'Evaluate scalability/security metrics', 'Enforce code boundaries'],
        experienceLevel: 'Principal',
      },
      {
        id: 'prof_db',
        role: 'DATABASE_ENGINEER',
        name: 'David Chen',
        avatar: '/avatars/database.webp',
        title: 'Database Specialist AI',
        skills: ['PostgreSQL', 'Prisma ORM', 'Relational Schema Design', 'Query Optimization'],
        personality: 'Rigorous, precise, and obsessed with data integrity.',
        responsibilities: ['Draft Prisma models', 'Execute migration pushes', 'Optimize relational indexes'],
        experienceLevel: 'Staff',
      },
      {
        id: 'prof_backend',
        role: 'BACKEND_ENGINEER',
        name: 'Sarah Jenkins',
        avatar: '/avatars/backend.webp',
        title: 'Staff Backend Engineer AI',
        skills: ['Node.js', 'REST API Routes', 'Authentication & JWT', 'Server Controllers'],
        personality: 'Methodical, performance-focused, and security-minded.',
        responsibilities: ['Develop backend route handlers', 'Integrate database ORM layer', 'Enforce strict API types'],
        experienceLevel: 'Staff',
      },
      {
        id: 'prof_frontend',
        role: 'FRONTEND_ENGINEER',
        name: 'Lucas Wright',
        avatar: '/avatars/frontend.webp',
        title: 'Lead Frontend Engineer AI',
        skills: ['React 18', 'Next.js Client Components', 'Vanilla CSS', 'State Management'],
        personality: 'Creative, visual, responsive, and performance-conscious.',
        responsibilities: ['Build interactive dashboard UI', 'Implement responsive layouts', 'Wire real-time client polling'],
        experienceLevel: 'Senior',
      },
      {
        id: 'prof_ui',
        role: 'UI_ENGINEER',
        name: 'Aria Sterling',
        avatar: '/avatars/ui.webp',
        title: 'Senior UI/UX Engineer AI',
        skills: ['Glassmorphism Design System', 'Typography & Palette Design', 'Micro-animations', 'Accessibility'],
        personality: 'Aesthetic perfectionist, detail-obsessed, and design-forward.',
        responsibilities: ['Maintain modern dark-mode palette', 'Design glassmorphic panels', 'Ensure high contrast ratios'],
        experienceLevel: 'Senior',
      },
      {
        id: 'prof_qa',
        role: 'QA_ENGINEER',
        name: 'Viktor Krum',
        avatar: '/avatars/qa.webp',
        title: 'Senior QA Automation Engineer AI',
        skills: ['Vitest Suite Execution', 'E2E Testing', 'Regression Testing', 'Bug Classification'],
        personality: 'Skeptical, thorough, systematic, and relentless.',
        responsibilities: ['Execute unit test suites', 'Validate automated reviews', 'Verify boundary edge cases'],
        experienceLevel: 'Senior',
      },
      {
        id: 'prof_security',
        role: 'SECURITY_ENGINEER',
        name: 'Kaelen Voss',
        avatar: '/avatars/security.webp',
        title: 'Security Lead AI',
        skills: ['Vulnerability Auditing', 'JWT & Auth Inspection', 'OWASP Standards', 'RBAC Enforcement'],
        personality: 'Vigilant, defensive, cautious, and methodical.',
        responsibilities: ['Audit protected API endpoints', 'Verify session token integrity', 'Perform security code reviews'],
        experienceLevel: 'Staff',
      },
      {
        id: 'prof_devops',
        role: 'DEVOPS_ENGINEER',
        name: 'Jordan Miller',
        avatar: '/avatars/devops.webp',
        title: 'Staff DevOps Engineer AI',
        skills: ['CI/CD Pipelines', 'Docker Packaging', 'Environment Configs', 'Deployment Orchestration'],
        personality: 'Reliable, automation-driven, and calm under pressure.',
        responsibilities: ['Automate build pipelines', 'Monitor worker pool health', 'Ensure zero downtime deployments'],
        experienceLevel: 'Staff',
      },
    ];
  }

  /**
   * Retrieves all profiles for a project or defaults
   */
  public static async getProfiles(projectId?: string): Promise<AIAgentProfile[]> {
    const key = projectId || 'global';
    if (inMemoryProfiles.has(key)) return inMemoryProfiles.get(key)!;

    const defaults = this.getDefaultProfiles();
    inMemoryProfiles.set(key, defaults);

    // Non-blocking database sync attempt
    prisma.aIAgentProfile.findMany({
      where: projectId ? { projectId } : {},
    }).then((records) => {
      if (records.length > 0) {
        const mapped: AIAgentProfile[] = records.map((r) => ({
          id: r.id,
          projectId: r.projectId || undefined,
          role: r.role as CompanyRole,
          name: r.name,
          avatar: r.avatar,
          title: r.title,
          skills: typeof r.skills === 'string' ? JSON.parse(r.skills) : (r.skills as unknown as string[]),
          personality: r.personality,
          responsibilities: typeof r.responsibilities === 'string' ? JSON.parse(r.responsibilities) : (r.responsibilities as unknown as string[]),
          experienceLevel: r.experienceLevel as AIAgentProfile['experienceLevel'],
        }));
        inMemoryProfiles.set(key, mapped);
      }
    }).catch(() => {});

    return defaults;
  }

  /**
   * Retrieves profile by role
   */
  public static async getProfileByRole(role: CompanyRole, projectId?: string): Promise<AIAgentProfile | undefined> {
    const profiles = await this.getProfiles(projectId);
    return profiles.find((p) => p.role === role);
  }

  /**
   * Seeds default profiles into database for a project
   */
  public static async seedDefaultProfiles(projectId?: string): Promise<AIAgentProfile[]> {
    const defaults = this.getDefaultProfiles();
    const key = projectId || 'global';
    inMemoryProfiles.set(key, defaults);

    // Non-blocking database insertion
    Promise.all(
      defaults.map((prof) =>
        prisma.aIAgentProfile.create({
          data: {
            projectId,
            role: prof.role,
            name: prof.name,
            avatar: prof.avatar,
            title: prof.title,
            skills: JSON.stringify(prof.skills),
            personality: prof.personality,
            responsibilities: JSON.stringify(prof.responsibilities),
            experienceLevel: prof.experienceLevel,
          },
        }).catch(() => null)
      )
    ).catch(() => {});

    return defaults;
  }
}
