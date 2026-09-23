import { NextRequest, NextResponse } from 'next/server';
import { resetPollResults } from '@/lib/serverStore';

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const emptyResults = resetPollResults(id);
    return NextResponse.json({
      success: true,
      results: emptyResults,
    });
  } catch (err) {
    console.error('Error resetting poll', err);
    return NextResponse.json({ error: 'Errore nel reset dei risultati' }, { status: 500 });
  }
}
