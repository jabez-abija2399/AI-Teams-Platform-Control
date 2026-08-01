import type { ExecutionVisibilityEvent, DeveloperTimelineEntry } from './types';
import type { AgentRole } from '@/ai/agents/core/agent.types';
import { getHumanExperienceService } from '@/ai/evaluation/human-experience.service';
import { EventEmitter } from 'events';
import { prisma } from '@/lib/prisma';

const visibilityEvents = new Map<string, ExecutionVisibilityEvent[]>();
const devTimeline = new Map<string, DeveloperTimelineEntry[]>();

export class ExecutionVisibilityService {
  private humanExperience = getHumanExperienceService();
  public readonly events = new EventEmitter();

  emitEvent(params: {
    projectId: string;
    type: ExecutionVisibilityEvent['type'];
    stepId: string;
    message: string;
    developerDetails?: Record<string, unknown>;
  }): ExecutionVisibilityEvent {
    const progress = this.humanExperience.formatProgressMessage(params.stepId);

    const event: ExecutionVisibilityEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      projectId: params.projectId,
      type: params.type,
      message: params.message,
      creatorModeMessage: progress.userFacingMessage,
      developerDetails: params.developerDetails,
      timestamp: new Date(),
    };

    const list = visibilityEvents.get(params.projectId) ?? [];
    list.push(event);
    visibilityEvents.set(params.projectId, list);

    this.events.emit(`project_event_${params.projectId}`, event);

    // Fire-and-forget persistence to DB
    prisma.aIEventLog.create({
      data: {
        eventType: params.type,
        source: 'ExecutionVisibilityService',
        message: params.message,
        metadata: params.developerDetails as any,
        level: params.type === 'ERROR' ? 'error' : 'info',
      }
    }).catch(err => console.error('[Visibility] Failed to log event', err));

    return event;
  }

  recordTimelineEntry(params: {
    projectId: string;
    taskId?: string;
    agentRole?: AgentRole;
    status: string;
    message: string;
    durationMs?: number;
    qualityScore?: number;
    error?: string;
    retryCount?: number;
  }): DeveloperTimelineEntry {
    const entry: DeveloperTimelineEntry = {
      id: `tle_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      projectId: params.projectId,
      taskId: params.taskId,
      agentRole: params.agentRole,
      status: params.status,
      message: params.message,
      timestamp: new Date(),
      durationMs: params.durationMs,
      qualityScore: params.qualityScore,
      error: params.error,
      retryCount: params.retryCount,
    };

    const list = devTimeline.get(params.projectId) ?? [];
    list.push(entry);
    devTimeline.set(params.projectId, list);

    this.events.emit(`project_timeline_${params.projectId}`, entry);

    prisma.aIEventLog.create({
      data: {
        eventType: 'TIMELINE_ENTRY',
        source: params.agentRole ?? 'SYSTEM',
        message: params.message,
        metadata: {
          taskId: params.taskId,
          status: params.status,
          durationMs: params.durationMs,
          qualityScore: params.qualityScore,
          error: params.error,
          retryCount: params.retryCount,
        } as any,
        level: params.status === 'FAILED' || !!params.error ? 'error' : 'info',
      }
    }).catch(err => console.error('[Visibility] Failed to log timeline', err));

    return entry;
  }

  getCreatorModeEvents(projectId: string): Array<{ message: string; timestamp: Date }> {
    const events = visibilityEvents.get(projectId) ?? [];
    return events.map((e) => ({
      message: e.creatorModeMessage,
      timestamp: e.timestamp,
    }));
  }

  getDeveloperTimeline(projectId: string): DeveloperTimelineEntry[] {
    return devTimeline.get(projectId) ?? [];
  }

  getDeveloperEvents(projectId: string): ExecutionVisibilityEvent[] {
    return visibilityEvents.get(projectId) ?? [];
  }

  clearProject(projectId: string): void {
    visibilityEvents.delete(projectId);
    devTimeline.delete(projectId);
  }
}

let instance: ExecutionVisibilityService | null = null;
export function getExecutionVisibilityService(): ExecutionVisibilityService {
  if (!instance) {
    instance = new ExecutionVisibilityService();
  }
  return instance;
}
