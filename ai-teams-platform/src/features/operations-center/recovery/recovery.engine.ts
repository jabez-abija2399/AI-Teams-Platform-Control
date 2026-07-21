import { prisma } from '@/lib/prisma';

const SAFE_ACTIONS = new Set(['RETRY_WORKFLOW', 'CLEAR_CACHE']);

export interface RecoveryActionResult {
  id: string;
  incidentId: string;
  action: string;
  status: string;
  requiresApproval: boolean;
  result: string | null;
}

export async function proposeRecoveryAction(
  incidentId: string,
  action: string,
): Promise<RecoveryActionResult> {
  const incident = await prisma.incident.findFirst({ where: { id: incidentId } });
  if (!incident) {
    throw new Error(`Incident ${incidentId} not found`);
  }

  const isSafe = SAFE_ACTIONS.has(action);
  const status = isSafe ? 'APPROVED' : 'PENDING';

  const recoveryAction = await prisma.recoveryAction.create({
    data: {
      incidentId,
      action,
      status,
      requiresApproval: !isSafe,
    },
  });

  return {
    id: recoveryAction.id,
    incidentId: recoveryAction.incidentId,
    action: recoveryAction.action,
    status: recoveryAction.status,
    requiresApproval: recoveryAction.requiresApproval,
    result: recoveryAction.result,
  };
}

export async function approveRecoveryAction(
  recoveryActionId: string,
): Promise<RecoveryActionResult> {
  const recoveryAction = await prisma.recoveryAction.findFirst({
    where: { id: recoveryActionId },
  });

  if (!recoveryAction) {
    throw new Error(`Recovery action ${recoveryActionId} not found`);
  }

  if (recoveryAction.status !== 'PENDING') {
    throw new Error(`Recovery action is not PENDING (current status: ${recoveryAction.status})`);
  }

  const updated = await prisma.recoveryAction.update({
    where: { id: recoveryActionId },
    data: { status: 'APPROVED' },
  });

  return {
    id: updated.id,
    incidentId: updated.incidentId,
    action: updated.action,
    status: updated.status,
    requiresApproval: updated.requiresApproval,
    result: updated.result,
  };
}

async function executeRetryWorkflow(recoveryActionId: string): Promise<string> {
  const recoveryAction = await prisma.recoveryAction.findFirst({
    where: { id: recoveryActionId },
    include: { incident: true },
  });

  if (!recoveryAction) throw new Error('Recovery action not found');

  const recentFailedDeployments = await prisma.deployment.findMany({
    where: { status: 'FAILED' },
    orderBy: { updatedAt: 'desc' },
    take: 1,
  });

  if (recentFailedDeployments.length > 0) {
    const deployment = recentFailedDeployments[0]!;
    await prisma.deployment.update({
      where: { id: deployment.id },
      data: { status: 'PENDING' },
    });
    return `Reset deployment ${deployment.id} to PENDING for retry`;
  }

  return 'No failed deployments found to retry';
}

async function executeClearCache(_recoveryActionId: string): Promise<string> {
  return 'Cache cleared successfully (simulated)';
}

async function executeRollbackDeployment(recoveryActionId: string): Promise<string> {
  const recoveryAction = await prisma.recoveryAction.findFirst({
    where: { id: recoveryActionId },
    include: { incident: true },
  });

  if (!recoveryAction) throw new Error('Recovery action not found');

  return `Rollback initiated for incident ${recoveryAction.incidentId} (simulated)`;
}

export async function executeRecoveryAction(
  recoveryActionId: string,
): Promise<RecoveryActionResult> {
  const recoveryAction = await prisma.recoveryAction.findFirst({
    where: { id: recoveryActionId },
  });

  if (!recoveryAction) {
    throw new Error(`Recovery action ${recoveryActionId} not found`);
  }

  if (recoveryAction.status !== 'APPROVED') {
    throw new Error(`Recovery action must be APPROVED before execution (current: ${recoveryAction.status})`);
  }

  let result: string;

  switch (recoveryAction.action) {
    case 'RETRY_WORKFLOW':
      result = await executeRetryWorkflow(recoveryActionId);
      break;
    case 'CLEAR_CACHE':
      result = await executeClearCache(recoveryActionId);
      break;
    case 'ROLLBACK_DEPLOYMENT':
      result = await executeRollbackDeployment(recoveryActionId);
      break;
    default:
      result = `Unknown action: ${recoveryAction.action}`;
  }

  const updated = await prisma.recoveryAction.update({
    where: { id: recoveryActionId },
    data: {
      status: 'EXECUTED',
      result,
    },
  });

  return {
    id: updated.id,
    incidentId: updated.incidentId,
    action: updated.action,
    status: updated.status,
    requiresApproval: updated.requiresApproval,
    result: updated.result,
  };
}
