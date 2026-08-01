import type { CompanyRole } from '../types';

export type MessageType =
  | 'QUESTION'
  | 'ANSWER'
  | 'REQUEST'
  | 'DELEGATION'
  | 'REVIEW'
  | 'WARNING'
  | 'APPROVAL'
  | 'ESCALATION';

export type MessagePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AgentMessage {
  id: string;
  projectId?: string;
  senderRole: CompanyRole;
  receiverRole?: CompanyRole;
  messageType: MessageType;
  content: string;
  priority?: MessagePriority;
  isRead?: boolean;
  createdAt: string;
}

export interface AgentConversationState {
  id: string;
  projectId?: string;
  topic: string;
  participants: CompanyRole[];
  status: 'active' | 'resolved' | 'escalated';
  messages: AgentMessage[];
  createdAt: string;
}

export interface AgentDelegationRecord {
  id: string;
  parentTaskId: string;
  fromAgent: CompanyRole;
  toAgent: CompanyRole;
  subtaskTitle: string;
  subtaskDescription: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'failed';
  createdAt: string;
}

export interface ConflictResolutionResult {
  conflictId: string;
  topic: string;
  conflictingRoles: CompanyRole[];
  winningResolution: string;
  rationale: string;
  createdDecisionId?: string;
}
