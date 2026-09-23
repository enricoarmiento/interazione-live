import { NextRequest, NextResponse } from 'next/server';
import { getPoll, getPollResults, upsertPoll } from '@/lib/serverStore';
import { Poll } from '@/types/poll';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const poll = getPoll(id);

  if (!poll) {
    return NextResponse.json({ error: 'Sondaggio non trovato' }, { status: 404 });
  }

  const results = getPollResults(id);

  return NextResponse.json({
    poll,
    results,
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const body = (await request.json()) as Poll;
    if (!body || body.id !== id) {
      return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
    }

    const saved = upsertPoll(body);
    const results = getPollResults(id);

    return NextResponse.json({
      success: true,
      poll: saved,
      results,
    });
  } catch (err) {
    console.error('Error syncing poll', err);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
