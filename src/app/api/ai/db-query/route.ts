import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { translateToSQL, getProjectSchema, executeSafeQuery } from '@/features/database-assistant/services/db-query.service';
import { dbQuerySchema } from '@/features/database-assistant/schemas/db-query.schema';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const parsed = dbQuerySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid input', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  try {
    const schema = await getProjectSchema(parsed.data.projectId);
    const { query, explanation } = await translateToSQL(parsed.data.question, schema);
    const { columns, rows } = await executeSafeQuery(query);

    return NextResponse.json({
      success: true,
      data: {
        query,
        explanation,
        columns,
        rows,
        rowCount: rows.length,
      },
    });
  } catch (error) {
    console.error('[DB Query] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Query failed',
          code: 'AI_ERROR',
        },
      },
      { status: 500 },
    );
  }
}
