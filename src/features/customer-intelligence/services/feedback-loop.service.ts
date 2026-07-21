import type { ApiResult } from '@/types/common.types';

export interface FeatureRequestTrend {
  keyword: string;
  count: number;
  sampleFeedbackIds: string[];
}

export async function detectFeatureRequestTrends(
  projectId: string,
  minCount = 3,
): Promise<ApiResult<FeatureRequestTrend[]>> {
  const { prisma } = await import('@/lib/prisma');

  const featureRequests = await prisma.feedback.findMany({
    where: {
      projectId,
      type: 'FEATURE_REQUEST',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (featureRequests.length < minCount) {
    return { success: true, data: [] };
  }

  const wordCounts = new Map<string, { count: number; ids: string[] }>();
  const stopwords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
    'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
    'that', 'this', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you',
    'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them',
    'their', 'what', 'which', 'who', 'whom', 'and', 'but', 'or', 'if',
    'because', 'while', 'although', 'about', 'up', 'like', 'also', 'want',
    'please', 'make', 'add', 'it\'s', 'don\'t', 'i\'m', 'i\'d', 'i\'ll',
    'we\'re', 'let', 'us', 'get', 'got', 'think', 'really', 'much',
  ]);

  for (const fb of featureRequests) {
    const words = fb.content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopwords.has(w));

    const seen = new Set<string>();
    for (const word of words) {
      if (seen.has(word)) continue;
      seen.add(word);
      const existing = wordCounts.get(word);
      if (existing) {
        existing.count++;
        existing.ids.push(fb.id);
      } else {
        wordCounts.set(word, { count: 1, ids: [fb.id] });
      }
    }
  }

  const trends: FeatureRequestTrend[] = [];
  for (const [keyword, { count, ids }] of wordCounts) {
    if (count >= minCount) {
      trends.push({ keyword, count, sampleFeedbackIds: ids.slice(0, 5) });
    }
  }

  trends.sort((a, b) => b.count - a.count);

  if (trends.length > 0) {
    const topTrend = trends[0];
    if (!topTrend) return { success: true, data: trends };

    const { prisma: p } = await import('@/lib/prisma');
    await p.productDecision.create({
      data: {
        projectId,
        title: `Feature trend detected: "${topTrend.keyword}" mentioned in ${topTrend.count} requests`,
        reason: `Automated trend detection found that "${topTrend.keyword}" is a recurring theme across ${topTrend.count} feature requests. This suggests strong customer demand for this capability.`,
        impact: `HIGH: ${topTrend.count} customers have requested this. Consider prioritizing in product roadmap.`,
      },
    });
  }

  return { success: true, data: trends };
}
