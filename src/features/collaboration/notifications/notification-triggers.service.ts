import { createNotification } from '@/features/collaboration/notifications/notification.service';

type TriggerEvent =
  | { type: 'workflow.completed'; userId: string; workflowId: string; projectName: string }
  | { type: 'workflow.failed'; userId: string; workflowId: string; projectName: string }
  | { type: 'task.assigned'; userId: string; taskId: string; agentName: string }
  | { type: 'review.ready'; userId: string; projectId: string }
  | { type: 'deploy.success'; userId: string; projectId: string; environment: string };

export async function triggerNotification(event: TriggerEvent): Promise<void> {
  switch (event.type) {
    case 'workflow.completed':
      await createNotification(
        event.userId,
        'workflow.completed',
        `Workflow finished for "${event.projectName}"`,
        `/dashboard/projects/${event.workflowId}`,
      );
      break;
    case 'workflow.failed':
      await createNotification(
        event.userId,
        'workflow.failed',
        `Workflow failed for "${event.projectName}"`,
        `/dashboard/projects/${event.workflowId}`,
      );
      break;
    case 'task.assigned':
      await createNotification(
        event.userId,
        'task.assigned',
        `${event.agentName} assigned you a new task`,
        `/dashboard/projects`,
      );
      break;
    case 'review.ready':
      await createNotification(
        event.userId,
        'review.ready',
        'Code review is ready for your review',
        `/dashboard/projects/${event.projectId}`,
      );
      break;
    case 'deploy.success':
      await createNotification(
        event.userId,
        'deploy.success',
        `Successfully deployed to ${event.environment}`,
        `/dashboard/projects/${event.projectId}`,
      );
      break;
  }
}
