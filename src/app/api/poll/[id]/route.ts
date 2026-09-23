import { NextRequest, NextResponse } from 'next/server';
import { getPoll, getPollResults, upsertPoll } from '@/lib/serverStore';
import { Poll } from '@/types/poll';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const poll = await getPoll(id);

  if (!poll) {
    return NextResponse.json(
      { error: 'Sondaggio non trovato' },
      { status: 404, headers: NO_CACHE_HEADERS }
    );
  }

  const results = await getPollResults(id);

  return NextResponse.json(
    { poll, results },
    { headers: NO_CACHE_HEADERS }
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const body = (await request.json()) as Poll;
    if (!body || body.id !== id) {
      return NextResponse.json(
        { error: 'Dati non validi' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const saved = await upsertPoll(body);
    const results = await getPollResults(id);

    return NextResponse.json(
      { success: true, poll: saved, results },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err) {
    console.error('Error syncing poll', err);
    return NextResponse.json(
      { error: 'Errore interno' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
