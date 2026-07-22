'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CEOChat } from '@/features/ceo-ai/components/ceo-chat';
import { ArchitectureChat } from '@/features/architect-ai/components/architecture-chat';
import { DeveloperChat } from '@/features/developer-ai/components/developer-chat';
import { QAChat } from '@/features/qa-ai/components/qa-chat';
import { DeploymentPanel } from '@/features/deployment/components/deployment-panel';
import { WorkspaceBuildSync } from '@/features/workspace/components/workspace-build-sync';
import { Loader2, Rocket, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { CEOAnalysis } from '@/ai/agents/roles/ceo/ceo.types';

interface BuildStatus {
  projectStatus: string;
  running: boolean;
  hasDeployment: boolean;
  deploymentStatus: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: string; icon: typeof Clock }> = {
  PLANNING: { label: 'Planning', variant: 'bg-gray-100 text-gray-800', icon: Clock },
  IN_PROGRESS: { label: 'Building...', variant: 'bg-blue-100 text-blue-800', icon: Loader2 },
  REVIEW: { label: 'Needs Review', variant: 'bg-yellow-100 text-yellow-800', icon: XCircle },
  COMPLETED: { label: 'Complete', variant: 'bg-green-100 text-green-800', icon: CheckCircle },
  ARCHIVED: { label: 'Archived', variant: 'bg-gray-100 text-gray-800', icon: Clock },
};



export function ProjectTabsClient({ projectId, defaultIdea }: { projectId: string; defaultIdea: string }) {
  const [tab, setTab] = useState('ceo');
  const [ceoOutput, setCeoOutput] = useState<CEOAnalysis | null>(null);
  const [building, setBuilding] = useState(false);
  const [buildStatus, setBuildStatus] = useState<BuildStatus | null>(null);


  const fetchBuildStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/build-status`);
      const json = await res.json();
      if (json.success) {
        setBuildStatus(json.data);
        setBuilding(json.data.running);
      }
    } catch {}
  }, [projectId]);

  useEffect(() => {
    const init = setTimeout(fetchBuildStatus, 0);
    return () => clearTimeout(init);
  }, [fetchBuildStatus]);

  function handleDeveloperComplete() {
    setBuilding(false);
    fetchBuildStatus();
  }

  function handleCeoComplete(data: CEOAnalysis) {
    setCeoOutput(data);
    setTab('architect');
  }

  function handleArchitectComplete() {
    setTab('developer');
  }

  async function handleFullBuild() {
    setBuilding(true);
    try {
      await fetch('/api/onboarding/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, idea: defaultIdea }),
      });
    } catch {}
  }

  const statusConf = buildStatus ? STATUS_CONFIG[buildStatus.projectStatus] : null;
  const StatusIcon = statusConf?.icon ?? Clock;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {statusConf && (
            <Badge className={`${statusConf.variant} flex items-center gap-1.5`}>
              <StatusIcon className={`h-3 w-3 ${buildStatus?.projectStatus === 'IN_PROGRESS' ? 'animate-spin' : ''}`} />
              {statusConf.label}
            </Badge>
          )}
          {!building && buildStatus?.projectStatus !== 'COMPLETED' && (
            <Button onClick={handleFullBuild} size="sm">
              <Rocket className="h-3.5 w-3.5" />
              Run Full Build
            </Button>
          )}
        </div>
        {building && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Building...</span>
          </div>
        )}
      </div>

      {building && (
        <div className="rounded-lg border bg-muted/30 p-2 text-center text-xs text-muted-foreground">
          Full build in progress — detailed progress is shown in each AI tab
        </div>
      )}

      <WorkspaceBuildSync projectId={projectId} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ceo">CEO AI</TabsTrigger>
          <TabsTrigger value="architect">Architect AI</TabsTrigger>
          <TabsTrigger value="developer">Developer AI</TabsTrigger>
          <TabsTrigger value="qa">QA AI</TabsTrigger>
          <TabsTrigger value="deploy">Deploy</TabsTrigger>
        </TabsList>
        <TabsContent value="ceo">
          <CEOChat projectId={projectId} defaultIdea={defaultIdea} onComplete={handleCeoComplete} />
        </TabsContent>
        <TabsContent value="architect">
          <ArchitectureChat projectId={projectId} defaultRequirements={ceoOutput?.requirements} onComplete={handleArchitectComplete} />
        </TabsContent>
        <TabsContent value="developer">
          <DeveloperChat projectId={projectId} onComplete={handleDeveloperComplete} />
        </TabsContent>
        <TabsContent value="qa">
          <QAChat projectId={projectId} />
        </TabsContent>
        <TabsContent value="deploy">
          <DeploymentPanel projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
