import { Queue, JobsOptions } from 'bullmq';
import { redisConnection } from '@/lib/redis';

export interface GeneratedFilePayload {
  path: string;
  content: string;
}

export interface AIBuildJobData {
  projectId: string;
  userPrompt: string;
  filesToGenerate?: GeneratedFilePayload[];
  userId?: string;
}

export const AI_BUILD_QUEUE_NAME = 'ai-code-builds';

export const defaultAIBuildJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: {
    age: 3600, // keep jobs for 1 hour
    count: 100, // keep maximum 100 jobs
  },
  removeOnFail: {
    age: 86400, // keep failed jobs for 24 hours
    count: 500, // keep maximum 500 failed jobs
  },
};

/**
 * BullMQ Queue for AI code compilation and sandbox build tasks.
 */
export const aiBuildQueue = new Queue<AIBuildJobData>(AI_BUILD_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: defaultAIBuildJobOptions,
});
