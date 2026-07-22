'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { EnvironmentManager } from '@/features/deployment/components/environment-manager';
import { DeploymentList } from '@/features/deployment/components/deployment-list';
import { DeployDialog } from '@/features/deployment/components/deploy-dialog';
import { OneClickDeploy } from '@/features/deployment/components/one-click-deploy';
import { FolderTree, Rocket, Plus } from 'lucide-react';

export function DeploymentPanel({ projectId }: { projectId: string }) {
  const [deployOpen, setDeployOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <OneClickDeploy projectId={projectId} />
      </div>

      <Tabs defaultValue="deployments" className="flex flex-col h-full">
        <TabsList variant="line" className="w-full justify-start px-4">
          <TabsTrigger value="deployments">
            <Rocket className="h-4 w-4" />
            Deployments
          </TabsTrigger>
          <TabsTrigger value="environments">
            <FolderTree className="h-4 w-4" />
            Environments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deployments" className="flex-1 overflow-auto p-4">
          <div className="mb-3 flex justify-end">
            <Button size="xs" onClick={() => setDeployOpen(true)}>
              <Plus className="h-3 w-3" />
              Custom Deploy
            </Button>
          </div>
          <DeploymentList projectId={projectId} />
        </TabsContent>

        <TabsContent value="environments" className="flex-1 overflow-auto p-4">
          <EnvironmentManager projectId={projectId} />
        </TabsContent>
      </Tabs>

      <DeployDialog
        projectId={projectId}
        open={deployOpen}
        onOpenChange={setDeployOpen}
      />
    </div>
  );
}
