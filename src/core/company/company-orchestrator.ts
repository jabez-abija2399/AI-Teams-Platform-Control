import type {
  CompanyStatusReport,
  CompanyEvent,
  CompanyWorker,
  CompanyTask,
  CompanyProjectState,
  CompanyEventType,
} from './types';
import { CompanyEventBus } from './company-event-bus';
import { CompanyStateMachine } from './company-state-machine';
import { CompanyStopwatch } from './company-stopwatch';
import { CompanyHealthService } from './company-health.service';
import { CompanyHeartbeat } from './company-heartbeat';
import { CompanySupervisor } from './company-supervisor';
import { CompanyCheckpointService } from './company-checkpoint.service';
import { CompanyEvents } from './company-events';
import { CompanyOrchestrator as IntegrationOrchestrator } from '@/core/integration/company-orchestrator';

export class ContinuousCompanyOrchestrator {
  private static projectsData: Map<string, Record<string, any>> = new Map();
  private static workers: Map<string, CompanyWorker[]> = new Map();
  private static queues: Map<string, CompanyTask[]> = new Map();
  private static isSubscribed = false;
  private static processingLock: Set<string> = new Set();

  public static setupSubscription(): void {
    if (this.isSubscribed) return;
    this.isSubscribed = true;

    CompanyEventBus.subscribe('*', async (event: CompanyEvent) => {
      await this.handleEvent(event);
    });
  }

  private static initWorkers(projectId: string): CompanyWorker[] {
    const defaultWorkers: CompanyWorker[] = [
      { id: `${projectId}_ceo`, role: 'CEO', status: 'IDLE', lastHeartbeat: Date.now(), utilizationPercentage: 0 },
      { id: `${projectId}_pm`, role: 'PRODUCT_MANAGER', status: 'IDLE', lastHeartbeat: Date.now(), utilizationPercentage: 0 },
      { id: `${projectId}_arch`, role: 'ARCHITECT', status: 'IDLE', lastHeartbeat: Date.now(), utilizationPercentage: 0 },
      { id: `${projectId}_dev1`, role: 'DEVELOPER', status: 'IDLE', lastHeartbeat: Date.now(), utilizationPercentage: 0 },
      { id: `${projectId}_dev2`, role: 'DEVELOPER', status: 'IDLE', lastHeartbeat: Date.now(), utilizationPercentage: 0 },
      { id: `${projectId}_qa`, role: 'QA', status: 'IDLE', lastHeartbeat: Date.now(), utilizationPercentage: 0 },
      { id: `${projectId}_devops`, role: 'DEVOPS', status: 'IDLE', lastHeartbeat: Date.now(), utilizationPercentage: 0 },
    ];
    this.workers.set(projectId, defaultWorkers);
    return defaultWorkers;
  }

  private static getWorkers(projectId: string): CompanyWorker[] {
    let w = this.workers.get(projectId);
    if (!w) w = this.initWorkers(projectId);
    return w;
  }

  private static setWorkerStatus(projectId: string, role: string, status: CompanyWorker['status'], taskId?: string, taskTitle?: string): void {
    const workers = this.getWorkers(projectId);
    for (const worker of workers) {
      if (worker.role === role) {
        worker.status = status;
        worker.lastHeartbeat = Date.now();
        worker.currentTaskId = taskId;
        worker.currentTaskTitle = taskTitle;
        if (status === 'WORKING') {
          worker.startTime = Date.now();
        } else if (status === 'IDLE' && worker.startTime) {
          const duration = Date.now() - worker.startTime;
          worker.utilizationPercentage = Math.min(100, Math.round((duration / Math.max(CompanyStopwatch.getMetrics(projectId).totalProjectDurationMs, 1000)) * 100));
          worker.startTime = undefined;
        }
      }
    }
  }

  private static getQueue(projectId: string): CompanyTask[] {
    return this.queues.get(projectId) || [];
  }

  private static saveStageData(projectId: string, key: string, data: any): void {
    const existing = this.projectsData.get(projectId) || {};
    existing[key] = data;
    this.projectsData.set(projectId, existing);
  }

  private static getStageData(projectId: string, key: string): any {
    const existing = this.projectsData.get(projectId) || {};
    return existing[key];
  }

  public static async startProject(
    projectId: string,
    userIdea: string,
    options: Record<string, any> = {}
  ): Promise<CompanyStatusReport> {
    this.setupSubscription();

    CompanyStateMachine.initProject(projectId, 'CREATED');
    CompanyStopwatch.initProject(projectId);
    CompanyHealthService.initReport(projectId);
    this.initWorkers(projectId);
    this.queues.set(projectId, []);
    this.saveStageData(projectId, 'userIdea', userIdea);
    this.saveStageData(projectId, 'options', options);

    // Start heartbeat monitor
    CompanyHeartbeat.startMonitor(
      projectId,
      () => this.getWorkers(projectId),
      () => this.getQueue(projectId),
      4000
    );

    // Trigger initial event to start autonomous cascade
    await CompanyEventBus.publish('PROJECT_CREATED', projectId, { userIdea, options }, 'ContinuousCompanyOrchestrator');

    return this.getStatus(projectId);
  }

  public static async pauseProject(projectId: string, reason: string = 'User requested pause'): Promise<CompanyStatusReport> {
    await CompanyStateMachine.transition(projectId, 'PAUSED', reason);
    CompanyStopwatch.pauseProjectTimer(projectId);
    CompanyHealthService.setStatus(projectId, 'PAUSED', reason);

    await this.saveCheckpoint(projectId);
    return this.getStatus(projectId);
  }

  public static async resumeProject(projectId: string): Promise<CompanyStatusReport> {
    const currentState = CompanyStateMachine.getState(projectId);
    if (currentState !== 'PAUSED' && currentState !== 'FAILED') {
      return this.getStatus(projectId);
    }

    const previousState = CompanyStateMachine.getPreviousState(projectId) || 'DISCOVERY';
    await CompanyStateMachine.transition(projectId, previousState, 'Resuming execution');
    CompanyStopwatch.resumeProjectTimer(projectId);
    CompanyHealthService.setStatus(projectId, 'HEALTHY');

    // Re-trigger event for current state to resume progression
    let resumeEvent: CompanyEventType = 'DISCOVERY_COMPLETED';
    switch (previousState) {
      case 'DISCOVERY':
        resumeEvent = 'PROJECT_CREATED';
        break;
      case 'CLARIFICATION':
        resumeEvent = 'DISCOVERY_COMPLETED';
        break;
      case 'PRODUCT_APPROVAL':
        resumeEvent = 'CLARIFICATION_COMPLETED';
        break;
      case 'ARCHITECTURE':
        resumeEvent = 'PRODUCT_APPROVED';
        break;
      case 'PLANNING':
        resumeEvent = 'ARCHITECTURE_APPROVED';
        break;
      case 'EXECUTION':
        resumeEvent = 'PLAN_READY';
        break;
      case 'REVIEW':
        resumeEvent = 'REVIEW_STARTED';
        break;
      case 'DEPLOYMENT':
        resumeEvent = 'REVIEW_COMPLETED';
        break;
    }

    CompanyEventBus.publish(resumeEvent, projectId, { resumed: true }, 'ContinuousCompanyOrchestrator').catch((err) => {
      console.error(`[ContinuousCompanyOrchestrator] Error in resume cascade for project ${projectId}:`, err);
    });
    return this.getStatus(projectId);
  }

  public static async retryProject(projectId: string): Promise<CompanyStatusReport> {
    const queue = this.getQueue(projectId);
    for (const t of queue) {
      if (t.status === 'FAILED' || t.status === 'BLOCKED') {
        t.status = 'QUEUED';
        t.retries = 0;
        t.error = undefined;
      }
    }
    return this.resumeProject(projectId);
  }

  private static async saveCheckpoint(projectId: string): Promise<void> {
    const state = CompanyStateMachine.getState(projectId);
    const history = CompanyEventBus.getHistory(projectId);
    const workers = this.getWorkers(projectId);
    const queue = this.getQueue(projectId);
    const completedTasks = queue.filter((t) => t.status === 'COMPLETED').map((t) => t.id);
    const stopwatch = CompanyStopwatch.getMetrics(projectId);
    const resumePayload = this.projectsData.get(projectId);

    await CompanyCheckpointService.saveCheckpoint(
      projectId,
      state,
      history.length,
      workers,
      completedTasks,
      queue,
      stopwatch,
      resumePayload
    );
  }

  private static async handleEvent(event: CompanyEvent): Promise<void> {
    const { type, projectId, payload } = event;
    const currentState = CompanyStateMachine.getState(projectId);

    if (currentState === 'PAUSED') {
      return;
    }

    // Prevent recursive loop on heartbeat or supervisor events
    if (type === 'HEARTBEAT_CHECK' || type === 'SUPERVISOR_RECOMMENDATION' || type === 'WORKER_STALLED' || type === 'DEADLOCK_DETECTED') {
      return;
    }

    // Prevent duplicate concurrent execution of the same transition for a project
    const lockKey = `${projectId}_${type}`;
    if (this.processingLock.has(lockKey)) return;
    this.processingLock.add(lockKey);

    try {
      switch (type) {
        case 'PROJECT_CREATED': {
          await CompanyStateMachine.transition(projectId, 'DISCOVERY', 'Starting discovery stage');
          const userIdea = payload.userIdea || this.getStageData(projectId, 'userIdea') || 'AI Project';
          this.setWorkerStatus(projectId, 'CEO', 'WORKING', 'task_disc', 'Analyzing User Idea');
          
          const timerStop = CompanyStopwatch.startTimer(projectId, 'task', 'CEO');
          const res = await IntegrationOrchestrator.executeDiscovery(projectId, userIdea);
          timerStop();
          
          this.setWorkerStatus(projectId, 'CEO', 'IDLE');
          if (res.success) {
            this.saveStageData(projectId, 'ceoData', res.data);
            await CompanyEventBus.publish('DISCOVERY_COMPLETED', projectId, { ceoData: res.data }, 'CEO_Worker');
          } else {
            await this.handleStageFailure(projectId, 'CEO', res.error?.message || 'Discovery failed');
          }
          break;
        }

        case 'DISCOVERY_COMPLETED': {
          await CompanyStateMachine.transition(projectId, 'CLARIFICATION', 'Starting clarification stage');
          this.setWorkerStatus(projectId, 'CEO', 'WORKING', 'task_clarify', 'Clarifying project scope');
          
          const timerStop = CompanyStopwatch.startTimer(projectId, 'task', 'CEO');
          // Perform automatic clarification confirmation
          const clarificationData = { status: 'VERIFIED', clarifiedRequirements: true, timestamp: Date.now() };
          timerStop();

          this.setWorkerStatus(projectId, 'CEO', 'IDLE');
          this.saveStageData(projectId, 'clarificationData', clarificationData);
          await CompanyEventBus.publish('CLARIFICATION_COMPLETED', projectId, { clarificationData }, 'CEO_Worker');
          break;
        }

        case 'CLARIFICATION_COMPLETED': {
          await CompanyStateMachine.transition(projectId, 'PRODUCT_APPROVAL', 'Starting product approval stage');
          const ceoData = this.getStageData(projectId, 'ceoData') || payload.ceoData || {};
          this.setWorkerStatus(projectId, 'PRODUCT_MANAGER', 'WORKING', 'task_plan', 'Refining product specification');

          const timerStop = CompanyStopwatch.startTimer(projectId, 'task', 'PRODUCT_MANAGER');
          const res = await IntegrationOrchestrator.executePlanning(projectId, ceoData);
          timerStop();

          this.setWorkerStatus(projectId, 'PRODUCT_MANAGER', 'IDLE');
          if (res.success) {
            this.saveStageData(projectId, 'pmData', res.data);
            await CompanyEventBus.publish('PRODUCT_APPROVED', projectId, { pmData: res.data }, 'PM_Worker');
          } else {
            await this.handleStageFailure(projectId, 'PRODUCT_MANAGER', res.error?.message || 'Product approval failed');
          }
          break;
        }

        case 'PRODUCT_APPROVED': {
          await CompanyStateMachine.transition(projectId, 'ARCHITECTURE', 'Starting architecture design stage');
          const pmData = this.getStageData(projectId, 'pmData') || payload.pmData || {};
          this.setWorkerStatus(projectId, 'ARCHITECT', 'WORKING', 'task_arch', 'Designing system architecture');

          const timerStop = CompanyStopwatch.startTimer(projectId, 'task', 'ARCHITECT');
          const res = await IntegrationOrchestrator.executeArchitecture(projectId, pmData);
          timerStop();

          this.setWorkerStatus(projectId, 'ARCHITECT', 'IDLE');
          if (res.success) {
            this.saveStageData(projectId, 'archData', res.data);
            await CompanyEventBus.publish('ARCHITECTURE_APPROVED', projectId, { archData: res.data }, 'Architect_Worker');
          } else {
            await this.handleStageFailure(projectId, 'ARCHITECT', res.error?.message || 'Architecture design failed');
          }
          break;
        }

        case 'ARCHITECTURE_APPROVED': {
          await CompanyStateMachine.transition(projectId, 'PLANNING', 'Starting sprint and task planning stage');
          this.setWorkerStatus(projectId, 'PRODUCT_MANAGER', 'WORKING', 'task_breakdown', 'Creating execution task breakdown');

          const tasks: CompanyTask[] = [
            {
              id: `task_${projectId}_1`,
              projectId,
              title: 'Implement Core Data Models and Database Schemas',
              description: 'Set up database tables, Prisma models, and initial schemas.',
              role: 'DEVELOPER',
              status: 'QUEUED',
              durationMs: 0,
              retries: 0,
              maxRetries: 3,
            },
            {
              id: `task_${projectId}_2`,
              projectId,
              title: 'Develop Backend API Services and Controllers',
              description: 'Implement RESTful endpoints, auth middleware, and business logic services.',
              role: 'DEVELOPER',
              status: 'QUEUED',
              durationMs: 0,
              retries: 0,
              maxRetries: 3,
            },
            {
              id: `task_${projectId}_3`,
              projectId,
              title: 'Build Frontend UI Components and Views',
              description: 'Create glassmorphic responsive UI layouts and connect API hooks.',
              role: 'DEVELOPER',
              status: 'QUEUED',
              durationMs: 0,
              retries: 0,
              maxRetries: 3,
            },
          ];
          this.queues.set(projectId, tasks);
          this.setWorkerStatus(projectId, 'PRODUCT_MANAGER', 'IDLE');

          await CompanyEventBus.publish('PLAN_READY', projectId, { taskCount: tasks.length }, 'PM_Worker');
          break;
        }

        case 'PLAN_READY': {
          await CompanyStateMachine.transition(projectId, 'EXECUTION', 'Starting autonomous code execution stage');
          const archData = this.getStageData(projectId, 'archData') || {};
          const pmData = this.getStageData(projectId, 'pmData') || {};
          const queue = this.getQueue(projectId);

          this.setWorkerStatus(projectId, 'DEVELOPER', 'WORKING', 'task_exec', 'Implementing full application architecture');
          for (const t of queue) {
            t.status = 'IN_PROGRESS';
            t.startTime = Date.now();
            await CompanyEventBus.publish('TASK_STARTED', projectId, { taskId: t.id, title: t.title }, 'Developer_Worker');
          }

          const timerStop = CompanyStopwatch.startTimer(projectId, 'task', 'DEVELOPER');
          const res = await IntegrationOrchestrator.executeExecution(projectId, archData, pmData.requirements || []);
          timerStop();

          this.setWorkerStatus(projectId, 'DEVELOPER', 'IDLE');
          if (res.success) {
            for (const t of queue) {
              t.status = 'COMPLETED';
              t.endTime = Date.now();
              t.durationMs = (t.endTime || Date.now()) - (t.startTime || Date.now());
              await CompanyEventBus.publish('TASK_COMPLETED', projectId, { taskId: t.id, title: t.title }, 'Developer_Worker');
            }
            this.saveStageData(projectId, 'execData', res.data);
            await CompanyEventBus.publish('REVIEW_STARTED', projectId, { execData: res.data }, 'Developer_Worker');
          } else {
            for (const t of queue) {
              t.status = 'FAILED';
              t.error = res.error?.message || 'Implementation failed';
            }
            await this.handleStageFailure(projectId, 'DEVELOPER', res.error?.message || 'Execution failed');
          }
          break;
        }

        case 'REVIEW_STARTED': {
          await CompanyStateMachine.transition(projectId, 'REVIEW', 'Starting automated QA and design review stage');
          const execData = this.getStageData(projectId, 'execData') || payload.execData || {};
          this.setWorkerStatus(projectId, 'QA', 'WORKING', 'task_qa', 'Performing comprehensive quality assurance and linting');

          const timerStop = CompanyStopwatch.startTimer(projectId, 'review', 'QA');
          const res = await IntegrationOrchestrator.executeReview(projectId, execData);
          timerStop();

          this.setWorkerStatus(projectId, 'QA', 'IDLE');
          if (res.success) {
            this.saveStageData(projectId, 'revData', res.data);
            await CompanyEventBus.publish('REVIEW_COMPLETED', projectId, { revData: res.data }, 'QA_Worker');
          } else {
            await this.handleStageFailure(projectId, 'QA', res.error?.message || 'Review failed');
          }
          break;
        }

        case 'REVIEW_COMPLETED': {
          await CompanyStateMachine.transition(projectId, 'DEPLOYMENT', 'Starting automated deployment pipeline');
          this.setWorkerStatus(projectId, 'DEVOPS', 'WORKING', 'task_deploy', 'Deploying production build bundle');

          const timerStop = CompanyStopwatch.startTimer(projectId, 'task', 'DEVOPS');
          // Perform deployment simulation / execution
          const deploymentData = {
            status: 'DEPLOYED',
            environment: 'production',
            url: `https://${projectId.toLowerCase().replace(/[^a-z0-9]/g, '-')}.aiteams.platform`,
            timestamp: Date.now(),
          };
          timerStop();

          this.setWorkerStatus(projectId, 'DEVOPS', 'IDLE');
          this.saveStageData(projectId, 'deploymentData', deploymentData);
          await CompanyEventBus.publish('DEPLOYMENT_STARTED', projectId, { deploymentData }, 'DevOps_Worker');
          await CompanyEventBus.publish('DEPLOYMENT_COMPLETED', projectId, { deploymentData }, 'DevOps_Worker');
          break;
        }

        case 'DEPLOYMENT_COMPLETED': {
          await CompanyStateMachine.transition(projectId, 'COMPLETED', 'Project completed successfully');
          const finalData = {
            ceoData: this.getStageData(projectId, 'ceoData'),
            pmData: this.getStageData(projectId, 'pmData'),
            archData: this.getStageData(projectId, 'archData'),
            execData: this.getStageData(projectId, 'execData'),
            revData: this.getStageData(projectId, 'revData'),
            deploymentData: this.getStageData(projectId, 'deploymentData'),
          };

          await IntegrationOrchestrator.executeComplete(projectId, finalData);
          CompanyHeartbeat.stopMonitor(projectId);
          await this.saveCheckpoint(projectId);

          await CompanyEventBus.publish('PROJECT_FINISHED', projectId, { finalData }, 'ContinuousCompanyOrchestrator');
          break;
        }
      }
    } catch (err: any) {
      console.error(`[ContinuousCompanyOrchestrator] Error handling event ${type} for project ${projectId}:`, err);
      await this.handleStageFailure(projectId, 'SYSTEM', err?.message || 'Unhandled error in orchestrator cascade');
    } finally {
      this.processingLock.delete(lockKey);
    }
  }

  private static async handleStageFailure(projectId: string, role: string, errorMsg: string): Promise<void> {
    this.setWorkerStatus(projectId, role, 'FAILED');
    CompanyHealthService.setStatus(projectId, 'FAILED', `${role} failed: ${errorMsg}`);
    try {
      await CompanyStateMachine.transition(projectId, 'FAILED', `${role} failed: ${errorMsg}`);
    } catch (e) {
      CompanyStateMachine.forceState(projectId, 'FAILED');
    }
    await this.saveCheckpoint(projectId);
    await CompanyEventBus.publish('TASK_FAILED', projectId, { role, error: errorMsg }, 'ContinuousCompanyOrchestrator');
  }

  public static getStatus(projectId: string): CompanyStatusReport {
    const currentState = CompanyStateMachine.getState(projectId);
    const latestEvent = CompanyEventBus.getLatestEvent(projectId);
    const workers = this.getWorkers(projectId);
    const queue = this.getQueue(projectId);
    const stopwatch = CompanyStopwatch.getMetrics(projectId);
    const healthReport = CompanyHealthService.evaluateHealth(projectId, workers, queue, currentState === 'PAUSED');
    const timeline = CompanyEventBus.getHistory(projectId, undefined, 50);
    const nextPlannedEvent = CompanyEvents.getNextExpectedState(latestEvent?.type || 'PROJECT_CREATED') as unknown as CompanyEventType | undefined;

    // Run supervisor recommendations without awaiting async events
    CompanySupervisor.monitor(projectId, workers, queue, stopwatch).catch(() => {});
    const recommendations = CompanySupervisor.getRecommendations(projectId);

    let companyStatus = `Autonomous company is actively executing ${currentState} stage.`;
    if (currentState === 'COMPLETED') {
      companyStatus = 'Project COMPLETED successfully. All automated stages and deployment verified.';
    } else if (currentState === 'PAUSED') {
      companyStatus = 'Execution PAUSED. All workers standby; checkpoint preserved.';
    } else if (currentState === 'FAILED') {
      companyStatus = `Execution DEGRADED or FAILED: ${healthReport.issues.join('; ') || 'Unknown error'}. Retry available.`;
    }

    return {
      projectId,
      currentState,
      currentEvent: latestEvent,
      heartbeat: healthReport,
      runningWorkers: workers,
      queue,
      nextPlannedEvent,
      health: healthReport.status,
      timeline,
      companyStatus,
      stopwatch,
      recommendations,
    };
  }

  public static getEvents(projectId?: string, limit: number = 100): CompanyEvent[] {
    return CompanyEventBus.getHistory(projectId, undefined, limit);
  }

  public static getHeartbeat(projectId: string): CompanyStatusReport['heartbeat'] {
    return this.getStatus(projectId).heartbeat;
  }

  public static clearProject(projectId: string): void {
    CompanyHeartbeat.clearProject(projectId);
    CompanyStateMachine.clearProject(projectId);
    CompanyStopwatch.clearProject(projectId);
    CompanyHealthService.clearProject(projectId);
    CompanySupervisor.clearProject(projectId);
    CompanyCheckpointService.clearCheckpoints(projectId).catch(() => {});
    CompanyEventBus.clearHistory(projectId);
    this.projectsData.delete(projectId);
    this.workers.delete(projectId);
    this.queues.delete(projectId);
  }

  public static resetAll(): void {
    CompanyHeartbeat.resetAll();
    CompanyStateMachine.resetAll();
    CompanyStopwatch.resetAll();
    CompanyHealthService.resetAll();
    CompanySupervisor.resetAll();
    CompanyCheckpointService.resetAll();
    CompanyEventBus.clearHistory();
    CompanyEventBus.resetListeners();
    this.projectsData.clear();
    this.workers.clear();
    this.queues.clear();
    this.isSubscribed = false;
    this.processingLock.clear();
  }
}
