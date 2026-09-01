"use client";

import { DiscoveryRoom } from "./discovery-room";
import { ClarificationRoom } from "./clarification-room";
import { ProposalRoom } from "./proposal-room";
import { StrategyRoom } from "./strategy-room";
import { ProductRoom } from "./product-room";
import { ArchitectureRoom } from "./architecture-room";
import { DesignRoom } from "./design-room";
import { PlanningRoom } from "./planning-room";
import { DevelopmentRoom } from "./development-room";
import { ReviewRoom } from "./review-room";
import { DeploymentRoom } from "./deployment-room";
import { FinalRoom } from "./final-room";

export type PipelinePhaseId =
  | "discovery"
  | "clarification"
  | "proposal"
  | "strategy"
  | "product"
  | "architecture"
  | "design"
  | "planning"
  | "development"
  | "testing"
  | "review"
  | "security"
  | "deployment"
  | "completed";

interface RoomRouterProps {
  phase: PipelinePhaseId;
  projectId: string;
  projectName: string;
  projectDescription: string;
}

export function RoomRouter({
  phase,
  projectId,
  projectName,
  projectDescription,
}: RoomRouterProps) {
  switch (phase) {
    case "discovery":
      return <DiscoveryRoom projectId={projectId} projectName={projectName} projectDescription={projectDescription} />;
    case "clarification":
      return <ClarificationRoom projectId={projectId} />;
    case "proposal":
      return <ProposalRoom projectId={projectId} />;
    case "strategy":
      return <StrategyRoom projectId={projectId} />;
    case "product":
      return <ProductRoom projectId={projectId} />;
    case "architecture":
      return <ArchitectureRoom projectId={projectId} />;
    case "design":
      return <DesignRoom projectId={projectId} />;
    case "planning":
      return <PlanningRoom projectId={projectId} />;
    case "development":
    case "testing":
    case "security":
      return <DevelopmentRoom projectId={projectId} />;
    case "review":
      return <ReviewRoom projectId={projectId} />;
    case "deployment":
      return <DeploymentRoom projectId={projectId} />;
    case "completed":
      return <FinalRoom projectId={projectId} projectName={projectName} />;
    default:
      return <DiscoveryRoom projectId={projectId} projectName={projectName} projectDescription={projectDescription} />;
  }
}
