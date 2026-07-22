'use client';

import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { Code } from 'lucide-react';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
}

interface FileContent {
  path: string;
  content: string;
}

export function CodeExplorerFallback({ projectId, reason }: { projectId: string; reason?: string }) {
  const [files, setFiles] = useState<FileContent[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/explorer?folderId=`)
      .then((r) => r.json())
      .then(async (res) => {
        if (!res.success) return;
        const nodes: FileNode[] = res.data.filter((n: FileNode) => n.type === 'file');
        const contents: FileContent[] = [];
        for (const node of nodes) {
          try {
            const fileRes = await fetch(`/api/projects/${projectId}/files?path=${encodeURIComponent(node.path)}`);
            const fileData = await fileRes.json();
            if (fileData.success) {
              contents.push({ path: node.path, content: fileData.data.content ?? '' });
            }
          } catch {
            // skip unreadable files
          }
        }
        setFiles(contents);
      })
      .catch(() => {});
  }, [projectId]);

  if (files.length === 0) {
    return <EmptyState icon={Code} title="No files generated yet" description={reason} className="h-full border-0" />;
  }

  return (
    <div className="grid flex-1 grid-cols-[160px_1fr] overflow-hidden">
      <ul className="overflow-y-auto border-r p-2">
        {files.map((f, i) => (
          <li key={f.path}>
            <button
              onClick={() => setActiveIndex(i)}
              className={`w-full truncate rounded px-2 py-1 text-left text-xs ${
                i === activeIndex ? 'bg-secondary' : 'hover:bg-secondary/50'
              }`}
            >
              {f.path.split('/').pop()}
            </button>
          </li>
        ))}
      </ul>
      <pre className="overflow-auto p-3 text-xs">
        <code>{files[activeIndex]?.content}</code>
      </pre>
    </div>
  );
}
