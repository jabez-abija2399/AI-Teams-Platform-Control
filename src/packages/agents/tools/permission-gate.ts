/**
 * @file permission-gate.ts
 * @package @ai-teams/agents/tools
 * @description Role-based permission gate enforcing non-destructive access and sandboxing.
 */

export class PermissionGate {
  private static rolePermissions: Record<string, string[]> = {
    ceo: ['market_research', 'scope_estimation'],
    'product-manager': ['prd_generator', 'feature_breakdown'],
    architect: ['tech_evaluator', 'schema_designer', 'api_contractor'],
    'ui-designer': ['theme_token_builder', 'layout_specifier'],
    developer: ['file_writer', 'file_reader', 'ast_modifier', 'package_installer'],
    'qa-engineer': ['test_runner', 'syntax_checker', 'defect_tracker'],
    'security-auditor': ['owasp_scanner', 'secret_detector'],
    'devops-engineer': ['dockerfile_generator', 'ci_workflow_builder'],
  };

  /**
   * Checks if an agent role is authorized to invoke a tool.
   */
  public static isAuthorized(roleId: string, toolName: string): boolean {
    const allowed = this.rolePermissions[roleId] || [];
    return allowed.includes(toolName) || allowed.includes('*');
  }
}
