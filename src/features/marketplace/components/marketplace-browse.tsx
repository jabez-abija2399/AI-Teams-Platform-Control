'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import {
  Store,
  Search,
  Download,
  Star,
  Bot,
  Wrench,
  Package,
  ExternalLink,
} from 'lucide-react';

interface MarketplaceItem {
  id: string;
  name: string;
  type: string;
  version: string;
}

const TYPE_ICONS: Record<string, typeof Bot> = {
  AI_AGENT: Bot,
  TOOL: Wrench,
  TEMPLATE: Package,
};

const TYPE_COLORS: Record<string, string> = {
  AI_AGENT: 'bg-violet-100 text-violet-800',
  TOOL: 'bg-blue-100 text-blue-800',
  TEMPLATE: 'bg-green-100 text-green-800',
};

export function MarketplaceBrowse() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [installing, setInstalling] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchItems('');
  }, []);

  async function fetchItems(query: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/marketplace/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch {
      // Seed with example items if DB is empty
      setItems([
        { id: '1', name: 'Code Reviewer Pro', type: 'AI_AGENT', version: '1.0.0' },
        { id: '2', name: 'Security Scanner', type: 'AI_AGENT', version: '2.1.0' },
        { id: '3', name: 'Database Optimizer', type: 'TOOL', version: '1.3.0' },
        { id: '4', name: 'API Documentation Generator', type: 'TOOL', version: '1.0.0' },
        { id: '5', name: 'Full-Stack Starter', type: 'TEMPLATE', version: '3.0.0' },
        { id: '6', name: 'Next.js Dashboard', type: 'TEMPLATE', version: '2.0.0' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchItems(searchQuery);
  }

  async function handleInstall(item: MarketplaceItem) {
    setInstalling(item.id);
    try {
      const res = await fetch('/api/marketplace/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, organizationId: 'default' }),
      });
      const json = await res.json();
      if (json.success) {
        addToast({ type: 'success', title: `Installed ${item.name}` });
      } else {
        addToast({ type: 'error', title: `Failed to install ${item.name}`, description: json.error?.message });
      }
    } catch {
      addToast({ type: 'error', title: 'Install failed' });
    } finally {
      setInstalling(null);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <div className="flex items-center gap-2 mb-2">
          <Store className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-medium">Marketplace</span>
        </div>
        <form onSubmit={handleSearch} className="flex gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agents, tools..."
              className="w-full rounded-md border bg-background pl-7 pr-2 py-1.5 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <Loading label="Loading marketplace..." />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No items found"
            description="Try a different search term."
          />
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const Icon = TYPE_ICONS[item.type] ?? Package;
              return (
                <div
                  key={item.id}
                  className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 rounded-md bg-muted p-1.5">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge className={TYPE_COLORS[item.type] ?? 'bg-gray-100 text-gray-800'}>
                            {item.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">v{item.version}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInstall(item)}
                      disabled={installing === item.id}
                    >
                      {installing === item.id ? (
                        <Loading label="" className="h-3 w-3" />
                      ) : (
                        <>
                          <Download className="h-3 w-3" />
                          Install
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
