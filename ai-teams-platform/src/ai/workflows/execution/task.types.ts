import { z } from 'zod';

export const TaskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export type TaskPriorityType = z.infer<typeof TaskPrioritySchema>;

export interface AITask {
  id: string;
  workflowId: string;
  title: string;
  description: string;
  assignedRole: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
  priority: TaskPriorityType;
  input?: string;
  output?: string;
  error?: string;
  dependencies: string[];
  createdAt: Date;
  updatedAt: Date;
}
