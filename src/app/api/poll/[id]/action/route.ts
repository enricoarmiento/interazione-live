import { NextRequest, NextResponse } from 'next/server';
import { updatePollAction, getPollResults } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const updatedPoll = await updatePollAction(id, body);

    if (!updatedPoll) {
      return NextResponse.json(
        { error: 'Sondaggio non trovato' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    const results = await getPollResults(id);

    return NextResponse.json(
      {
        success: true,
        poll: updatedPoll,
        results,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err) {
    console.error('Error updating poll action', err);
    return NextResponse.json(
      { error: 'Errore interno' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
