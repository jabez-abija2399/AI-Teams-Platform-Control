import type { ExecutiveTask, Milestone, WorkPackage } from './types';

export class ProgressEngine {
  /**
   * Calculates completion percentage for a Work Package based on its executive tasks
   */
  public static calculateWorkPackageProgress(packageId: string, tasks: ExecutiveTask[]): number {
    const pkgTasks = tasks.filter((t) => t.workPackageId === packageId);
    if (pkgTasks.length === 0) return 0;

    const total = pkgTasks.reduce((acc, t) => acc + t.completionPercentage, 0);
    return Math.round(total / pkgTasks.length);
  }

  /**
   * Calculates completion percentage for a Milestone based on its work packages and tasks
   */
  public static calculateMilestoneProgress(
    milestoneId: string,
    packages: WorkPackage[],
    tasks: ExecutiveTask[]
  ): number {
    const milestonePkgs = packages.filter((p) => p.milestoneId === milestoneId);
    if (milestonePkgs.length === 0) return 0;

    const total = milestonePkgs.reduce(
      (acc, p) => acc + this.calculateWorkPackageProgress(p.id, tasks),
      0
    );
    return Math.round(total / milestonePkgs.length);
  }

  /**
   * Calculates overall project completion percentage across all milestones
   */
  public static calculateProjectProgress(milestones: Milestone[]): number {
    if (milestones.length === 0) return 0;

    const total = milestones.reduce((acc, m) => acc + m.completionPercentage, 0);
    return Math.round(total / milestones.length);
  }
}
