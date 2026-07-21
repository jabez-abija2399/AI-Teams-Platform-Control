import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Plugin {
  id: string;
  name: string;
  description?: string | null;
  version: string;
  author: string;
  type: string;
  status: string;
}

interface PluginCardProps {
  plugin: Plugin;
  onToggle: () => void;
}

export function PluginCard({ plugin, onToggle }: PluginCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{plugin.name}</CardTitle>
        <Badge variant="outline">{plugin.type}</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {plugin.description && (
          <p className="text-sm text-muted-foreground">{plugin.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            v{plugin.version} by {plugin.author}
          </span>
          <Button
            size="sm"
            variant={plugin.status === 'ENABLED' ? 'outline' : 'default'}
            onClick={onToggle}
          >
            {plugin.status === 'ENABLED' ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
