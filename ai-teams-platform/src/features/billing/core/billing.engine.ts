export { checkUsageLimit } from '../limits/limit-checker.service';
export { getOrganizationCost, getProjectCost } from '../cost/cost-calculator.service';
export { consumeCredits, addCredits, getOrCreateCreditAccount } from '../credits/credit.service';
export { getCostRecommendations } from '../services/cost-optimizer.service';
export { checkUsageLimit as checkLimit } from '../limits/limit-checker.service';

import { getOrganizationCost } from '../cost/cost-calculator.service';
import { checkUsageLimit } from '../limits/limit-checker.service';
import { prisma } from '@/lib/prisma';

export async function generateInvoiceData(organizationId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [cost, limitCheck, creditAccount] = await Promise.all([
    getOrganizationCost(organizationId, startOfMonth),
    checkUsageLimit(organizationId),
    prisma.creditAccount.findUnique({ where: { organizationId } }),
  ]);

  return {
    organizationId,
    period: { start: startOfMonth, end: now },
    totalCostUsd: cost,
    plan: limitCheck.success ? limitCheck.data.planName : 'UNKNOWN',
    creditBalance: creditAccount?.balance ?? 0,
  };
}
