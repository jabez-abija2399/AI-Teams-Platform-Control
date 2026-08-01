export class ArchitectureLoader {
  public static loadArchitectureRules(): string {
    return `[ARCHITECTURE RULES]\n1. Strict TypeScript mode enabled (no 'any').\n2. Follow SOLID principles.\n3. Validate all request payloads using Zod schemas.`;
  }
}
