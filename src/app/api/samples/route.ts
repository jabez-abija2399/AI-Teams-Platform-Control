import { NextResponse } from 'next/server';
import { listSamples } from '@/features/onboarding/services/sample.service';

export async function GET() {
  const samples = await listSamples();
  return NextResponse.json({ success: true, data: samples });
}
