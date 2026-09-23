import { NextRequest, NextResponse } from 'next/server';
import { resetPollResults } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const emptyResults = await resetPollResults(id);
    return NextResponse.json(
      {
        success: true,
        results: emptyResults,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err) {
    console.error('Error resetting poll', err);
    return NextResponse.json(
      { error: 'Errore nel reset dei risultati' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
