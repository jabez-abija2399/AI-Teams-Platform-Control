import { prisma } from '@/lib/prisma';
import type { HealthCheckResult } from '@/features/operations-center/monitoring/health-check.service';

export interface DetectedIncident {
  id: string;
  type: string;
  severity: string;
  description: string;
  isNew: boolean;
}

function determineSeverity(status: HealthCheckResult['status'], service: string): string {
  if (status === 'DOWN') {
    return service === 'database' ? 'CRITICAL' : 'HIGH';
  }
  return 'MEDIUM';
}

function buildIncidentType(service: string, status: HealthCheckResult['status']): string {
  return `SERVICE_${status}_${service.toUpperCase()}`;
}

export async function detectIncidents(
  healthResults: HealthCheckResult[],
): Promise<DetectedIncident[]> {
  const unhealthy = healthResults.filter((r) => r.status !== 'UP');
  const detected: DetectedIncident[] = [];

  for (const result of unhealthy) {
    const type = buildIncidentType(result.service, result.status);
    const severity = determineSeverity(result.status, result.service);

    const existingOpen = await prisma.incident.findFirst({
      where: {
        type,
        status: 'OPEN',
      },
    });

    if (existingOpen) {
      detected.push({
        id: existingOpen.id,
        type: existingOpen.type,
        severity: existingOpen.severity,
        description: existingOpen.description,
        isNew: false,
      });
      continue;
    }

    const incident = await prisma.incident.create({
      data: {
        type,
        severity,
        description: `[${result.service.toUpperCase()}] ${result.status}: ${result.message}`,
        status: 'OPEN',
      },
    });

    detected.push({
      id: incident.id,
      type: incident.type,
      severity: incident.severity,
      description: incident.description,
      isNew: true,
    });
  }

  return detected;
}
