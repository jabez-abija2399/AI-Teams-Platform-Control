import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';

interface RatingResult {
  id: string;
  score: number;
  comment: string | null;
}

interface AverageRating {
  average: number;
  count: number;
}

export async function rateItem(
  itemId: string,
  userId: string,
  score: number,
  comment?: string,
): Promise<ApiResult<RatingResult>> {
  if (score < 1 || score > 5) {
    return {
      success: false,
      error: { message: 'Score must be between 1 and 5', code: 'VALIDATION_ERROR' },
    };
  }

  const item = await prisma.marketplaceItem.findUnique({ where: { id: itemId } });
  if (!item) {
    return { success: false, error: { message: 'Marketplace item not found', code: 'NOT_FOUND' } };
  }

  const rating = await prisma.marketplaceRating.upsert({
    where: { itemId_userId: { itemId, userId } },
    create: { itemId, userId, score, comment },
    update: { score, comment },
  });

  return {
    success: true,
    data: { id: rating.id, score: rating.score, comment: rating.comment },
  };
}

export async function getAverageRating(
  itemId: string,
): Promise<ApiResult<AverageRating>> {
  const result = await prisma.marketplaceRating.aggregate({
    where: { itemId },
    _avg: { score: true },
    _count: { score: true },
  });

  return {
    success: true,
    data: {
      average: result._avg.score ?? 0,
      count: result._count.score,
    },
  };
}
