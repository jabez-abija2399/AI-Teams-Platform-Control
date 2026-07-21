export type { DocPage, DocVersion, KnowledgeEntry, AgentDecisionEntry, DocTreeNode } from './types';

export {
  createDocumentSchema,
  updateDocumentSchema,
  createKnowledgeSchema,
  recordDecisionSchema,
} from './schemas/documentation.schema';

export type {
  CreateDocumentInput,
  UpdateDocumentInput,
  CreateKnowledgeInput,
  RecordDecisionInput,
} from './schemas/documentation.schema';

export {
  createDocument,
  getDocument,
  listDocuments,
  updateDocument,
  deleteDocument,
  getDocumentVersions,
  revertToVersion,
} from './services/document.service';

export {
  recordKnowledge,
  searchKnowledge,
  listKnowledge,
  deleteKnowledge,
} from './services/knowledge.service';

export { recordDecision, listDecisions } from './services/agent-decision.service';

export {
  useDocuments,
  useDocument,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
  useDocumentVersions,
  useRevertToVersion,
} from './hooks/use-documents';

export {
  useKnowledgeList,
  useKnowledgeSearch,
  useRecordKnowledge,
  useDeleteKnowledge,
} from './hooks/use-knowledge';

export { DocEditor } from './components/doc-editor';
export { DocTree } from './components/doc-tree';
export { DocList } from './components/doc-list';
export { KnowledgePanel } from './components/knowledge-panel';
export { DocumentationPanel } from './components/documentation-panel';
