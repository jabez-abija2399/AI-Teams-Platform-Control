export class RulesLoader {
  public static loadDevelopmentRules(): string {
    return `[DEVELOPMENT RULES]\nNever break backward compatibility. All interactive elements must have unique descriptive IDs. Write unit tests for new components.`;
  }
}
