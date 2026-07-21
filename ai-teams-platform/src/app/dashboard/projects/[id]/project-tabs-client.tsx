'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CEOChat } from '@/features/ceo-ai/components/ceo-chat';
import { ArchitectureChat } from '@/features/architect-ai/components/architecture-chat';
import type { CEOAnalysis } from '@/ai/agents/roles/ceo/ceo.types';

export function ProjectTabsClient({ projectId, defaultIdea }: { projectId: string; defaultIdea: string }) {
  const [tab, setTab] = useState('ceo');
  const [ceoOutput, setCeoOutput] = useState<CEOAnalysis | null>(null);

  function handleCeoComplete(data: CEOAnalysis) {
    setCeoOutput(data);
    setTab('architect');
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="ceo">CEO AI</TabsTrigger>
        <TabsTrigger value="architect">Architect AI</TabsTrigger>
      </TabsList>
      <TabsContent value="ceo">
        <CEOChat
          projectId={projectId}
          defaultIdea={defaultIdea}
          onComplete={handleCeoComplete}
        />
      </TabsContent>
      <TabsContent value="architect">
        <ArchitectureChat
          projectId={projectId}
          defaultRequirements={ceoOutput?.requirements}
        />
      </TabsContent>
    </Tabs>
  );
}
