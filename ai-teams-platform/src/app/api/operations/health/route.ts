import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { runHealthChecks } from '@/features/operations-center/monitoring/health-check.service';
import { detectIncidents } from '@/features/operations-center/incidents/incident-detector.service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const healthResults = await runHealthChecks();
  const incidents = await detectIncidents(healthResults);

  const overallStatus = healthResults.every((r) => r.status === 'UP')
    ? 'HEALTHY'
    : healthResults.some((r) => r.status === 'DOWN')
      ? 'CRITICAL'
      : 'DEGRADED';

  return NextResponse.json({
    success: true,
    data: {
      status: overallStatus,
      checks: healthResults,
      incidents,
      checkedAt: new Date().toISOString(),
    },
  });
}
