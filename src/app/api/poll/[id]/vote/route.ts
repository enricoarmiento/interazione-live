import { NextRequest, NextResponse } from 'next/server';
import { recordVote } from '@/lib/serverStore';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const payload = await request.json();
    const result = recordVote(id, payload);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Errore nella registrazione del voto' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      results: result.results,
    });
  } catch (err) {
    console.error('Error recording vote', err);
    return NextResponse.json({ error: 'Errore durante l\'invio del voto' }, { status: 500 });
  }
}
