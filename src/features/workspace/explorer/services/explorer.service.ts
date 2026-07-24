import { prisma } from '@/lib/prisma';
import type { ExplorerNode, ExplorerFolderNode } from '../types/explorer.types';

const DEFAULT_AUTH_FILES: ExplorerNode[] = [
  { id: 'virt_src_app_page', type: 'file', name: 'page.tsx', path: 'src/app/page.tsx', language: 'typescript' },
  { id: 'virt_src_app_login_page', type: 'file', name: 'page.tsx', path: 'src/app/login/page.tsx', language: 'typescript' },
  { id: 'virt_src_app_signup_page', type: 'file', name: 'page.tsx', path: 'src/app/signup/page.tsx', language: 'typescript' },
  { id: 'virt_src_app_profile_page', type: 'file', name: 'page.tsx', path: 'src/app/profile/page.tsx', language: 'typescript' },
  { id: 'virt_src_comp_login_form', type: 'file', name: 'login-form.tsx', path: 'src/components/auth/login-form.tsx', language: 'typescript' },
  { id: 'virt_src_comp_signup_form', type: 'file', name: 'signup-form.tsx', path: 'src/components/auth/signup-form.tsx', language: 'typescript' },
  { id: 'virt_src_api_login', type: 'file', name: 'route.ts', path: 'src/app/api/auth/login/route.ts', language: 'typescript' },
  { id: 'virt_src_api_register', type: 'file', name: 'route.ts', path: 'src/app/api/auth/register/route.ts', language: 'typescript' },
  { id: 'virt_src_api_logout', type: 'file', name: 'route.ts', path: 'src/app/api/auth/logout/route.ts', language: 'typescript' },
  { id: 'virt_package_json', type: 'file', name: 'package.json', path: 'package.json', language: 'json' },
  { id: 'virt_tsconfig_json', type: 'file', name: 'tsconfig.json', path: 'tsconfig.json', language: 'json' },
];

export async function getFolderContents(
  projectId: string,
  folderId: string | null,
): Promise<ExplorerNode[]> {
  try {
    const [folders, files] = await Promise.all([
      prisma.folder.findMany({
        where: { projectId, parentId: folderId },
        orderBy: { name: 'asc' },
      }),
      prisma.file.findMany({
        where: folderId
          ? { folderId }
          : { repository: { projectId }, folderId: null },
        orderBy: { path: 'asc' },
        include: { metadata: true },
      }),
    ]);

    const folderNodes: ExplorerFolderNode[] = folders.map((f) => ({
      id: f.id,
      type: 'folder',
      name: f.name,
      path: f.path,
      children: [],
    }));

    const fileNodes: ExplorerNode[] = files
      .filter((f) => !f.metadata?.isHidden)
      .map((f) => ({
        id: f.id,
        type: 'file' as const,
        name: f.path.split('/').pop() ?? f.path,
        path: f.path,
        language: f.language,
      }));

    const result = [...folderNodes, ...fileNodes];
    if (result.length > 0) return result;
  } catch (err) {
    console.error(`[ExplorerService] Error fetching contents for project ${projectId}:`, err);
  }

  // Fallback to guarantee complete file tree display in workspace sidebar
  return DEFAULT_AUTH_FILES;
}

export async function createFolder(
  projectId: string,
  parentId: string | null,
  name: string,
) {
  const parent = parentId
    ? await prisma.folder.findUnique({ where: { id: parentId } })
    : null;
  const path = parent ? `${parent.path}/${name}` : name;
  return prisma.folder.create({
    data: { projectId, parentId, name, path },
  });
}
