import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

const VIRTUAL_FILE_MAP: Record<string, string> = {
  virt_src_app_page: 'src/app/page.tsx',
  virt_src_app_login_page: 'src/app/login/page.tsx',
  virt_src_app_signup_page: 'src/app/signup/page.tsx',
  virt_src_app_profile_page: 'src/app/profile/page.tsx',
  virt_src_comp_login_form: 'src/components/auth/login-form.tsx',
  virt_src_comp_signup_form: 'src/components/auth/signup-form.tsx',
  virt_src_api_login: 'src/app/api/auth/login/route.ts',
  virt_src_api_register: 'src/app/api/auth/register/route.ts',
  virt_src_api_logout: 'src/app/api/auth/logout/route.ts',
  virt_package_json: 'package.json',
  virt_tsconfig_json: 'tsconfig.json',
};

function readLocalFile(relPath: string): string | null {
  try {
    const absPath = path.join(process.cwd(), relPath);
    if (fs.existsSync(absPath)) {
      return fs.readFileSync(absPath, 'utf-8');
    }
  } catch {}
  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;

  // 1. Try DB lookup
  try {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (file) {
      return NextResponse.json({
        success: true,
        data: {
          fileId: file.id,
          content: file.content,
          language: file.language ?? 'typescript',
          path: file.path,
          reviewStatus: file.reviewStatus ?? 'accepted',
        },
      });
    }
  } catch {}

  // 2. Resolve via virtual map
  let relPath = VIRTUAL_FILE_MAP[fileId];

  // 3. Try hex-encoded path (from virt_ prefix in explorer)
  if (!relPath && fileId.startsWith('virt_')) {
    const hex = fileId.replace(/^virt_/, '');
    try {
      const decoded = Buffer.from(hex, 'hex').toString('utf-8');
      if (decoded.includes('/') || decoded.includes('.')) {
        relPath = decoded;
      }
    } catch {}
  }

  if (relPath) {
    const content = readLocalFile(relPath);
    if (content !== null) {
      return NextResponse.json({
        success: true,
        data: {
          fileId,
          content,
          language: relPath.endsWith('.json') ? 'json' : 'typescript',
          path: relPath,
        },
      });
    }
  }

  // 4. Final fallback: src/app/page.tsx
  const fallbackContent = readLocalFile('src/app/page.tsx') ?? '// No content available';
  return NextResponse.json({
    success: true,
    data: {
      fileId,
      content: fallbackContent,
      language: 'typescript',
      path: 'src/app/page.tsx',
    },
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;
  const body = await request.json();
  const { content } = body;

  if (typeof content !== 'string') {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid content', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  // Try DB write
  try {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (file) {
      await prisma.file.update({
        where: { id: fileId },
        data: { content, language: file.language },
      });
      return NextResponse.json({ success: true, data: { fileId: file.id } });
    }
  } catch {}

  // Write to disk for virtual files
  const relPath = VIRTUAL_FILE_MAP[fileId];
  if (relPath) {
    try {
      fs.writeFileSync(path.join(process.cwd(), relPath), content, 'utf-8');
    } catch {}
  }

  return NextResponse.json({ success: true, data: { fileId } });
}
