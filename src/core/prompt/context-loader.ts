export class ContextLoader {
  public static async loadProjectContext(projectId: string): Promise<string> {
    return `[PROJECT CONTEXT]\nProject ID: ${projectId}\nEnvironment: Production Next.js 15 App Router\nDatabase: PostgreSQL via Prisma ORM\nStyling: Tailwind CSS v3 with Glassmorphism System.`;
  }
}
