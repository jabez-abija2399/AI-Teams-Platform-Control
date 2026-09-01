export interface ADRItem {
  id: string;
  projectId: string;
  adrNumber: string; // e.g. ADR-001
  title: string;
  ownerRole: string; // ARCHITECT
  decision: string;
  reason: string;
  alternatives?: string;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';
  createdAt: Date;
  updatedAt: Date;
}

export interface DESItem {
  id: string;
  projectId: string;
  desNumber: string; // e.g. DES-001
  title: string;
  ownerRole: string; // DESIGNER
  decision: string;
  reason: string;
  alternatives?: string;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';
  createdAt: Date;
  updatedAt: Date;
}

export interface RequirementTraceItem {
  id: string;
  projectId: string;
  requirementId: string; // REQ-001
  title: string;
  ceoSpecVersion: number;
  architectAdrId?: string;
  designerDesId?: string;
  sourceFiles: string[];
  testCases: string[];
  verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
}

export interface RequirementTraceabilityMatrix {
  projectId: string;
  requirements: RequirementTraceItem[];
  adrs: ADRItem[];
  dess: DESItem[];
  totalRequirements: number;
  verifiedCount: number;
  coveragePercentage: number;
}
