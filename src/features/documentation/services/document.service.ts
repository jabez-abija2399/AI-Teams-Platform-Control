import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import type { DocPage, DocVersion } from '../types';
import {
  createDocumentSchema,
  updateDocumentSchema,
  type CreateDocumentInput,
  type UpdateDocumentInput,
} from '../schemas/documentation.schema';

function toDocPage(doc: {
  id: string;
  projectId: string;
  type: string;
  title: string;
  content: string;
  version: number;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}): DocPage {
  return {
    id: doc.id,
    projectId: doc.projectId,
    type: doc.type,
    title: doc.title,
    content: doc.content,
    version: doc.version,
    author: doc.author,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toDocVersion(v: {
  id: string;
  documentId: string;
  content: string;
  version: number;
  createdAt: Date;
}): DocVersion {
  return {
    id: v.id,
    documentId: v.documentId,
    content: v.content,
    version: v.version,
    createdAt: v.createdAt,
  };
}

export async function createDocument(
  projectId: string,
  input: CreateDocumentInput,
): Promise<ApiResult<DocPage>> {
  const parsed = createDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Invalid document data',
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    return {
      success: false,
      error: { message: 'Project not found', code: 'NOT_FOUND' },
    };
  }

  const doc = await prisma.document.create({
    data: {
      projectId,
      type: parsed.data.type,
      title: parsed.data.title,
      content: parsed.data.content,
    },
  });

  return { success: true, data: toDocPage(doc) };
}

export async function getDocument(docId: string): Promise<ApiResult<DocPage>> {
  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (!doc) {
    return {
      success: false,
      error: { message: 'Document not found', code: 'NOT_FOUND' },
    };
  }

  return { success: true, data: toDocPage(doc) };
}

export async function listDocuments(
  projectId: string,
  type?: string,
): Promise<ApiResult<DocPage[]>> {
  const where: Record<string, unknown> = { projectId };
  if (type) where.type = type;

  const docs = await prisma.document.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  });

  return { success: true, data: docs.map(toDocPage) };
}

export async function updateDocument(
  docId: string,
  input: UpdateDocumentInput,
): Promise<ApiResult<DocPage>> {
  const parsed = updateDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Invalid update data',
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const existing = await prisma.document.findUnique({ where: { id: docId } });
  if (!existing) {
    return {
      success: false,
      error: { message: 'Document not found', code: 'NOT_FOUND' },
    };
  }

  const contentChanged =
    parsed.data.content !== undefined && parsed.data.content !== existing.content;

  if (contentChanged) {
    const newVersion = existing.version + 1;

    await prisma.documentVersion.create({
      data: {
        documentId: docId,
        content: existing.content,
        version: existing.version,
      },
    });

    const updated = await prisma.document.update({
      where: { id: docId },
      data: {
        title: parsed.data.title ?? existing.title,
        content: parsed.data.content ?? existing.content,
        version: newVersion,
      },
    });

    return { success: true, data: toDocPage(updated) };
  }

  const updated = await prisma.document.update({
    where: { id: docId },
    data: {
      title: parsed.data.title ?? existing.title,
    },
  });

  return { success: true, data: toDocPage(updated) };
}

export async function deleteDocument(docId: string): Promise<ApiResult<void>> {
  const existing = await prisma.document.findUnique({ where: { id: docId } });
  if (!existing) {
    return {
      success: false,
      error: { message: 'Document not found', code: 'NOT_FOUND' },
    };
  }

  await prisma.document.delete({ where: { id: docId } });
  return { success: true, data: undefined };
}

export async function getDocumentVersions(docId: string): Promise<ApiResult<DocVersion[]>> {
  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (!doc) {
    return {
      success: false,
      error: { message: 'Document not found', code: 'NOT_FOUND' },
    };
  }

  const versions = await prisma.documentVersion.findMany({
    where: { documentId: docId },
    orderBy: { version: 'desc' },
  });

  return { success: true, data: versions.map(toDocVersion) };
}

export async function revertToVersion(
  docId: string,
  versionId: string,
): Promise<ApiResult<DocPage>> {
  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (!doc) {
    return {
      success: false,
      error: { message: 'Document not found', code: 'NOT_FOUND' },
    };
  }

  const version = await prisma.documentVersion.findUnique({ where: { id: versionId } });
  if (!version || version.documentId !== docId) {
    return {
      success: false,
      error: { message: 'Version not found', code: 'NOT_FOUND' },
    };
  }

  const newVersion = doc.version + 1;

  await prisma.documentVersion.create({
    data: {
      documentId: docId,
      content: doc.content,
      version: doc.version,
    },
  });

  const updated = await prisma.document.update({
    where: { id: docId },
    data: {
      content: version.content,
      version: newVersion,
    },
  });

  return { success: true, data: toDocPage(updated) };
}
