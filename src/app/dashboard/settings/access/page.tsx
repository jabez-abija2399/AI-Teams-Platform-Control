import { WorkspaceAccessSettings } from '@/features/settings/components/workspace-access-settings';

export const metadata = {
  title: 'Workspace Access & RBAC | HibirDev AI',
  description: 'Manage workspace identity, team roles, and member permissions.',
};

export default function WorkspaceAccessPage() {
  return <WorkspaceAccessSettings />;
}
