import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';

export async function getOrCreateCreditAccount(
  organizationId: string,
): Promise<ApiResult<{ id: string; balance: number; monthlyLimit: number }>> {
  const account = await prisma.creditAccount.upsert({
    where: { organizationId },
    create: { organizationId, balance: 0, monthlyLimit: 0 },
    update: {},
  });

  return {
    success: true,
    data: { id: account.id, balance: account.balance, monthlyLimit: account.monthlyLimit },
  };
}

export async function addCredits(
  organizationId: string,
  amount: number,
): Promise<ApiResult<{ balance: number }>> {
  if (amount <= 0) {
    return { success: false, error: { message: 'Amount must be positive', code: 'VALIDATION_ERROR' } };
  }

  const account = await prisma.creditAccount.upsert({
    where: { organizationId },
    create: { organizationId, balance: amount, monthlyLimit: 0 },
    update: { balance: { increment: amount } },
  });

  return { success: true, data: { balance: account.balance } };
}

export async function consumeCredits(
  organizationId: string,
  amount: number,
): Promise<ApiResult<{ balance: number }>> {
  if (amount <= 0) {
    return { success: false, error: { message: 'Amount must be positive', code: 'VALIDATION_ERROR' } };
  }

  const account = await prisma.creditAccount.findUnique({ where: { organizationId } });
  if (!account) {
    return { success: false, error: { message: 'Credit account not found', code: 'NOT_FOUND' } };
  }

  if (account.balance < amount) {
    return {
      success: false,
      error: { message: 'Insufficient credits', code: 'VALIDATION_ERROR' },
    };
  }

  const updated = await prisma.creditAccount.update({
    where: { organizationId },
    data: { balance: { decrement: amount } },
  });

  return { success: true, data: { balance: updated.balance } };
}
