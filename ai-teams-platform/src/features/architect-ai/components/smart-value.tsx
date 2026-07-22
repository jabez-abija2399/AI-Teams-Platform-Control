function tryParseJson(val: string): unknown {
  try {
    const parsed = JSON.parse(val);
    if (parsed !== null && typeof parsed === 'object') return parsed;
    return val;
  } catch {
    return val;
  }
}

function ObjectView({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-1">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex gap-2 text-xs">
          <span className="text-muted-foreground shrink-0 font-medium capitalize">
            {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}:
          </span>
          {typeof value === 'object' && value !== null ? (
            <span className="break-words">{JSON.stringify(value)}</span>
          ) : (
            <span className="break-words">{String(value)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function ArrayView({ data }: { data: unknown[] }) {
  if (data.length === 0) return <span className="text-muted-foreground text-xs">none</span>;
  return (
    <ul className="list-inside list-disc text-xs">
      {data.map((item, i) => (
        <li key={i} className="text-muted-foreground">
          {typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item)}
        </li>
      ))}
    </ul>
  );
}

export function SmartValue({ value, className }: { value: string; className?: string }) {
  const parsed = tryParseJson(value);

  if (typeof parsed === 'object' && parsed !== null) {
    if (Array.isArray(parsed)) {
      return <div className={className}><ArrayView data={parsed} /></div>;
    }
    return <div className={className}><ObjectView data={parsed as Record<string, unknown>} /></div>;
  }

  return <p className={className}>{value}</p>;
}
