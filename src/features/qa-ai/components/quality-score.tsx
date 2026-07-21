import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function QualityScore({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-4xl font-bold ${color}`}>{score}</p>
        <p className="text-muted-foreground text-xs">out of 100</p>
      </CardContent>
    </Card>
  );
}
