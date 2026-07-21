import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import type { EditorPreferences } from '../types';
import { editorPreferencesSchema } from '../schemas/editor.schema';

export async function getFileContent(
  fileId: string,
): Promise<ApiResult<{ fileId: string; content: string; language: string; path: string }>> {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: { id: true, content: true, language: true, path: true },
    });

    if (!file) {
      return {
        success: false,
        error: { message: 'File not found', code: 'NOT_FOUND' },
      };
    }

    return {
      success: true,
      data: {
        fileId: file.id,
        content: file.content,
        language: file.language ?? 'plaintext',
        path: file.path,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load file';
    return {
      success: false,
      error: { message, code: 'INTERNAL_ERROR' },
    };
  }
}

export async function saveFileContent(
  fileId: string,
  content: string,
): Promise<ApiResult<{ updatedAt: Date }>> {
  try {
    const file = await prisma.file.findUnique({ where: { id: fileId }, select: { id: true } });
    if (!file) {
      return {
        success: false,
        error: { message: 'File not found', code: 'NOT_FOUND' },
      };
    }

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: { content },
      select: { updatedAt: true },
    });

    return { success: true, data: { updatedAt: updated.updatedAt } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save file';
    return {
      success: false,
      error: { message, code: 'INTERNAL_ERROR' },
    };
  }
}

export async function getEditorPreferences(
  userId: string,
): Promise<ApiResult<EditorPreferences>> {
  try {
    const pref = await prisma.editorPreference.findUnique({
      where: { userId },
      select: { preferences: true },
    });

    if (!pref) {
      const defaults: EditorPreferences = {
        fontSize: 14,
        minimap: true,
        wordWrap: 'off',
        lineNumbers: true,
        tabSize: 2,
        theme: 'vs-dark',
      };
      return { success: true, data: defaults };
    }

    const parsed = editorPreferencesSchema.parse(pref.preferences);
    return { success: true, data: parsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load preferences';
    return {
      success: false,
      error: { message, code: 'INTERNAL_ERROR' },
    };
  }
}

export async function saveEditorPreferences(
  userId: string,
  preferences: EditorPreferences,
): Promise<ApiResult<EditorPreferences>> {
  try {
    const validated = editorPreferencesSchema.parse(preferences);

    const upserted = await prisma.editorPreference.upsert({
      where: { userId },
      create: { userId, preferences: validated },
      update: { preferences: validated },
      select: { preferences: true },
    });

    const parsed = editorPreferencesSchema.parse(upserted.preferences);
    return { success: true, data: parsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save preferences';
    return {
      success: false,
      error: { message, code: 'INTERNAL_ERROR' },
    };
  }
}
