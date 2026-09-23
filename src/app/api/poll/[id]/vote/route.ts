import { NextRequest, NextResponse } from 'next/server';
import { recordVote } from '@/lib/serverStore';

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
    const payload = await request.json();
    const result = await recordVote(id, payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Errore nella registrazione del voto' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        results: result.results,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err) {
    console.error('Error recording vote', err);
    return NextResponse.json(
      { error: 'Errore durante l\'invio del voto' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
