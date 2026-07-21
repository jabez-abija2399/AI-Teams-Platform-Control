'use client';

import { useEffect } from 'react';
import { useWorkspaceStore } from '../stores/workspace.store';

export function ProjectInitializer({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const setCurrentProject = useWorkspaceStore((s) => s.setCurrentProject);

  useEffect(() => {
    setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);

  return <>{children}</>;
}
