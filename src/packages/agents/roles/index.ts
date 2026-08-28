/**
 * @file index.ts
 * @package @ai-teams/agents/roles
 * @description Master public exports for all AI Employee Roles.
 */

export * as CeoRole from './ceo';
export * as ProductManagerRole from './product-manager';
export * as ArchitectRole from './architect';
export * as UIDesignerRole from './ui-designer';
export * as DeveloperRole from './developer';
export * as QaEngineerRole from './qa-engineer';
export * as SecurityAuditorRole from './security-auditor';
export * as DevopsEngineerRole from './devops-engineer';
export * as BackendRole from './backend';
export * as FrontendRole from './frontend';
export * as DatabaseRole from './database';
export * as BusinessAnalystRole from './business-analyst';
export * as UxResearcherRole from './ux-researcher';
export * as ReviewerRole from './reviewer';
export * as ProductDiscoveryRole from './product-discovery';
export * as DocumentationRole from './documentation';
export * as OperationsRole from './operations';

// Direct Agent Classes
export { CeoAgent } from './ceo/ceo.agent';
export { ProductManagerAgent } from './product-manager/product-manager.agent';
export { ArchitectAgent } from './architect/architect.agent';
export { UIDesignerAgent } from './ui-designer/ui-designer.agent';
export { DeveloperAgent } from './developer/developer.agent';
export { QaEngineerAgent } from './qa-engineer/qa-engineer.agent';
export { SecurityAuditorAgent } from './security-auditor/security-auditor.agent';
export { DevopsEngineerAgent } from './devops-engineer/devops-engineer.agent';
export { BackendAgent } from './backend/backend.agent';
export { FrontendAgent } from './frontend/frontend.agent';
export { DatabaseAgent } from './database/database.agent';
export { BusinessAnalystAgent } from './business-analyst/business-analyst.agent';
export { UxResearcherAgent } from './ux-researcher/ux-researcher.agent';
export { ReviewerAgent } from './reviewer/reviewer.agent';
export { ProductDiscoveryAgent } from './product-discovery/product-discovery.agent';
export { DocumentationAgent } from './documentation/documentation.agent';
export { OperationsAgent } from './operations/operations.agent';

// Direct Services
export { CeoService, analyzeUserIdea, buildHeuristicCEOAnalysis, getProductDocuments } from './ceo/ceo.service';
export { ProductManagerService, refineRequirements, generateProductRequirementsSpec, buildHeuristicRefinedRequirements } from './product-manager/product-manager.service';
export { ArchitectService, designArchitecture, buildHeuristicArchitecture, regenerateArchitectureForConfirmedStack } from './architect/architect.service';
export { UIDesignerService, generateUiDesignSpec, buildHeuristicUiDesignSpec } from './ui-designer/ui-designer.service';
export { DeveloperService, implementArchitecture, getLanguageFromPath } from './developer/developer.service';
export { QaEngineerService, reviewImplementation, buildHeuristicQAReport, generateQaReportSpec } from './qa-engineer/qa-engineer.service';
export { SecurityAuditorService, generateSecurityReportSpec, buildHeuristicSecurityReport } from './security-auditor/security-auditor.service';
export { DevopsEngineerService, generateDevopsPlanSpec, buildHeuristicDevopsPlan } from './devops-engineer/devops-engineer.service';
export { generateBackendDesignSpec, buildHeuristicBackendDesignSpec } from './backend/backend.service';
export { generateFrontendDesignSpec, buildHeuristicFrontendDesignSpec } from './frontend/frontend.service';
export { generateDatabaseDesignSpec, buildHeuristicDatabaseDesignSpec } from './database/database.service';
export { generateSoftwareRequirementSpec, buildHeuristicSoftwareRequirementSpec } from './business-analyst/business-analyst.service';
export { generateUxResearchSpec, buildHeuristicUxResearchSpec } from './ux-researcher/ux-researcher.service';
export { reviewArtifact } from './reviewer/reviewer.service';
