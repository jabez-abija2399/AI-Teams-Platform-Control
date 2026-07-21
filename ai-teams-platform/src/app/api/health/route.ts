import { NextResponse } from 'next/server';
import { runHealthChecks } from '@/features/operations-center/monitoring/health-check.service';

const APP_VERSION = process.env.npm_package_version ?? '0.1.0';

export async function GET() {
  const checks = await runHealthChecks();

  const overallStatus = checks.every((r) => r.status === 'UP')
    ? 'HEALTHY'
    : checks.some((r) => r.status === 'DOWN')
      ? 'CRITICAL'
      : 'DEGRADED';

  return NextResponse.json({
    success: true,
    data: {
      status: overallStatus,
      version: APP_VERSION,
      uptime: process.uptime(),
      checks,
      timestamp: new Date().toISOString(),
    },
  });
}
