import { prisma } from '@/lib/prisma';
import type { CreateArtifactInput, StructuredArtifact, ReviewerStatus } from './artifact.types';
import { StructuredArtifactSchema } from './artifact.types';

export class ArtifactManager {
  async createArtifact<T = unknown>(input: CreateArtifactInput<T>): Promise<StructuredArtifact<T>> {
    const existing = await prisma.document.findFirst({
      where: {
        projectId: input.projectId,
        type: input.type,
      },
      orderBy: { version: 'desc' },
    });

    const nextVersion = existing ? existing.version + 1 : 1;
    const contentStr = JSON.stringify(input.content);

    let doc;
    if (existing) {
      // Create previous version snapshot before updating
      await prisma.documentVersion.create({
        data: {
          documentId: existing.id,
          content: existing.content,
          version: existing.version,
        },
      });

      doc = await prisma.document.update({
        where: { id: existing.id },
        data: {
          title: input.title,
          content: contentStr,
          version: nextVersion,
          author: input.owner,
          updatedAt: new Date(),
        },
      });
    } else {
      doc = await prisma.document.create({
        data: {
          projectId: input.projectId,
          type: input.type,
          title: input.title,
          content: contentStr,
          version: 1,
          author: input.owner,
        },
      });
    }

    const artifactObj = {
      id: doc.id,
      projectId: doc.projectId,
      title: doc.title,
      type: doc.type,
      owner: doc.author,
      version: doc.version,
      status: input.status ?? 'DRAFT',
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      content: input.content,
    };

    return StructuredArtifactSchema.parse(artifactObj) as StructuredArtifact<T>;
  }

  async getLatestArtifact<T = unknown>(projectId: string, type: string): Promise<StructuredArtifact<T> | null> {
    const doc = await prisma.document.findFirst({
      where: { projectId, type },
      orderBy: { version: 'desc' },
    });

    if (!doc) return null;

    let parsedContent: unknown;
    try {
      parsedContent = JSON.parse(doc.content);
    } catch {
      parsedContent = doc.content;
    }

    const artifactObj = {
      id: doc.id,
      projectId: doc.projectId,
      title: doc.title,
      type: doc.type,
      owner: doc.author,
      version: doc.version,
      status: 'APPROVED', // Default to approved or infer from content metadata
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      content: parsedContent,
    };

    return StructuredArtifactSchema.parse(artifactObj) as StructuredArtifact<T>;
  }

  async updateReviewerStatus(
    documentId: string,
    reviewerStatus: ReviewerStatus,
  ): Promise<boolean> {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) return false;

    let contentObj: Record<string, unknown> = {};
    try {
      contentObj = JSON.parse(doc.content);
    } catch {
      contentObj = { rawText: doc.content };
    }

    contentObj._reviewerStatus = reviewerStatus;

    await prisma.document.update({
      where: { id: documentId },
      data: {
        content: JSON.stringify(contentObj),
        updatedAt: new Date(),
      },
    });

    return true;
  }

  async listProjectArtifacts(projectId: string): Promise<StructuredArtifact[]> {
    const docs = await prisma.document.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    });

    return docs.map((doc) => {
      let contentObj: unknown;
      let revStatus: ReviewerStatus | undefined;
      try {
        const parsed = JSON.parse(doc.content);
        if (typeof parsed === 'object' && parsed !== null && '_reviewerStatus' in parsed) {
          revStatus = (parsed as Record<string, unknown>)._reviewerStatus as ReviewerStatus;
        }
        contentObj = parsed;
      } catch {
        contentObj = doc.content;
      }

      return StructuredArtifactSchema.parse({
        id: doc.id,
        projectId: doc.projectId,
        title: doc.title,
        type: doc.type,
        owner: doc.author,
        version: doc.version,
        status: revStatus ? (revStatus.verdict === 'APPROVED' ? 'APPROVED' : 'REVIEW') : 'DRAFT',
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        content: contentObj,
        reviewerStatus: revStatus,
      });
    });
  }
}

let artifactManagerInstance: ArtifactManager | null = null;

export function getArtifactManager(): ArtifactManager {
  if (!artifactManagerInstance) {
    artifactManagerInstance = new ArtifactManager();
  }
  return artifactManagerInstance;
}
