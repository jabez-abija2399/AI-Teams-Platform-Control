"use client";

import dynamic from "next/dynamic";

const CompanyWorkspace = dynamic(
  () => import("@/features/workspace/components/company-workspace").then((m) => m.CompanyWorkspace),
  { ssr: false }
);

interface CompanyWorkspaceWrapperProps {
  projectId: string;
  projectName: string;
  projectDescription: string;
  userName: string;
}

export function CompanyWorkspaceWrapper({
  projectId,
  projectName,
  projectDescription,
  userName,
}: CompanyWorkspaceWrapperProps) {
  return (
    <CompanyWorkspace
      projectId={projectId}
      projectName={projectName}
      projectDescription={projectDescription}
      userName={userName}
    />
  );
}
