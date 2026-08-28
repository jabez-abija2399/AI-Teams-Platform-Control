/**
 * @file architect.tools.ts
 * @package @ai-teams/agents/roles/architect
 * @description Architecture evaluation tools for the System Architect Agent.
 */

export class ArchitectTools {
  public static async evaluateStack(projectType: string): Promise<string[]> {
    return [
      'Next.js 16 (App Router, Turbopack)',
      'TypeScript 5.x with strict mode',
      'Tailwind CSS for responsive styling',
      'Prisma ORM with PostgreSQL',
    ];
  }
}
