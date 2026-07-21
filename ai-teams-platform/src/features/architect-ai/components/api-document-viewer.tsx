import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { APISpecification } from '@/ai/agents/roles/architect/architect.types';

function EndpointBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-green-100 text-green-800',
    POST: 'bg-blue-100 text-blue-800',
    PUT: 'bg-yellow-100 text-yellow-800',
    PATCH: 'bg-yellow-100 text-yellow-800',
    DELETE: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 font-mono text-xs ${colors[method] ?? ''}`}>
      {method}
    </span>
  );
}

export function APIDocumentViewer({ api }: { api: APISpecification }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">API Specification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {api.endpoints.map((ep, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <EndpointBadge method={ep.method} />
            <code className="text-xs">{ep.path}</code>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
