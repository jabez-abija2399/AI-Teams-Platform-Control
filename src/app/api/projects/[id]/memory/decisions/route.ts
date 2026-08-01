import { NextResponse } from 'next/server';
import { DecisionIntelligenceEngine } from '@/core/memory/decision-intelligence.engine';

export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const decisions = await DecisionIntelligenceEngine.getDecisions(projectId);

    return NextResponse.json({
      success: true,
      decisions,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch decisions' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const body = await request.json();

    const decision = await DecisionIntelligenceEngine.recordDecision(
      projectId,
      body.category,
      body.title,
      body.selectedOption,
      body.alternatives || [],
      body.rationale,
      body.createdByAgent || 'USER',
      body.confidenceScore || 0.9,
      body.status || 'approved'
    );

    return NextResponse.json({
      success: true,
      decision,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record decision' },
      { status: 500 }
    );
  }
}
