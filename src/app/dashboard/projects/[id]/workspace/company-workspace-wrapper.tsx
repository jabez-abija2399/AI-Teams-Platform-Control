'use client';

import dynamic from 'next/dynamic';

const ProjectWorkspaceHub = dynamic(
  () =>
    import('@/features/workspace/components/project-workspace-hub').then(
      (m) => m.ProjectWorkspaceHub,
    ),
  { ssr: false },
);

interface CompanyWorkspaceWrapperProps {
  projectId: string;
  projectName: string;
  projectDescription: string;
  userName: string;
}

export function CompanyWorkspaceWrapper(props: CompanyWorkspaceWrapperProps) {
  return <ProjectWorkspaceHub {...props} />;
}
