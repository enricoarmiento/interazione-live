import { NextRequest, NextResponse } from 'next/server';
import { updatePollAction, getPollResults } from '@/lib/serverStore';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const updatedPoll = updatePollAction(id, body);

    if (!updatedPoll) {
      return NextResponse.json({ error: 'Sondaggio non trovato' }, { status: 404 });
    }

    const results = getPollResults(id);

    return NextResponse.json({
      success: true,
      poll: updatedPoll,
      results,
    });
  } catch (err) {
    console.error('Error updating poll action', err);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
