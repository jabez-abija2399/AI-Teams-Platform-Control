/**
 * @file developer.tools.ts
 * @package @ai-teams/agents/roles/developer
 * @description Code scaffolding and AST modification tools for the Developer Agent.
 */

import { FileOperationsTool } from '../../tools/file-operations.tool';

export class DeveloperTools {
  public static async writeProjectFile(projectId: string, path: string, content: string): Promise<void> {
    await FileOperationsTool.writeFile(projectId, path, content);
  }

  public static async readProjectFile(projectId: string, path: string): Promise<string | null> {
    return FileOperationsTool.readFile(projectId, path);
  }
}
