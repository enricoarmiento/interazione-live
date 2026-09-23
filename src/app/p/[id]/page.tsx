'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { Poll, PollResults } from '@/types/poll';
import { RatingVote } from '@/components/student/RatingVote';
import { TextVote } from '@/components/student/TextVote';
import { ChoiceVote } from '@/components/student/ChoiceVote';
import { QnAVote } from '@/components/student/QnAVote';
import { EmojiVote } from '@/components/student/EmojiVote';
import { YesNoVote } from '@/components/student/YesNoVote';
import { ShieldCheck, Lock, Radio, AlertCircle } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StudentPollPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const pollId = resolvedParams.id;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getVoterId = useCallback((): string => {
    if (typeof window === 'undefined') return 'anon';
    let id = localStorage.getItem('slidepulse_voter_id');
    if (!id) {
      id = 'voter_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem('slidepulse_voter_id', id);
    }
    return id;
  }, []);

  const fetchPoll = useCallback(async () => {
    try {
      const res = await fetch(`/api/poll/${pollId}?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error('Sondaggio non trovato');
      }
      const data = await res.json();
      setPoll(data.poll);
      setResults(data.results);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Errore nel caricamento del sondaggio');
    } finally {
      setLoading(false);
    }
  }, [pollId]);

  useEffect(() => {
    fetchPoll();
    // Poll every 2.5 seconds to refresh status (e.g. if locked or if new Q&A questions arrive)
    const interval = setInterval(fetchPoll, 2500);
    return () => clearInterval(interval);
  }, [fetchPoll]);

  // Vote submit handler with persistent voterId
  const handleVoteSubmit = async (payload: any): Promise<boolean> => {
    try {
      const fullPayload = {
        ...payload,
        voterId: getVoterId(),
      };
      const res = await fetch(`/api/poll/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Errore durante l\'invio del voto');
        return false;
      }

      const data = await res.json();
      if (data.results) {
        setResults(data.results);
      }
      return true;
    } catch (err) {
      console.error('Vote error', err);
      alert('Errore di connessione. Riprova.');
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold">Accesso al sondaggio live...</h2>
        <p className="text-xs text-slate-400 mt-1">Caricamento dell&apos;interazione</p>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Sondaggio non trovato</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-sm">
          Il link o il codice QR potrebbe essere scaduto o non ancora attivato dal relatore.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6">
      <div className="w-full max-w-md mx-auto">
        {/* Top Header */}
        <header className="flex items-center justify-between pb-5 border-b border-slate-800/80 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-blue-500/30">
              SP
            </div>
            <span className="text-sm font-bold tracking-tight text-white">SlidePulse Live</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700/60 text-slate-300 text-[11px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Anonimo al 100%</span>
          </div>
        </header>

        {/* Live Indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Sondaggio attivo in aula</span>
          </div>
          <span className="text-xs font-mono text-slate-400 font-bold bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
            PIN: {poll.code}
          </span>
        </div>

        {/* Question Title Card */}
        <div className="p-5 rounded-3xl bg-slate-850/90 border border-slate-800 shadow-xl mb-6">
          <h1 className="text-xl sm:text-2xl font-black text-white leading-snug">
            {poll.title}
          </h1>
          {poll.description && (
            <p className="mt-2 text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
              {poll.description}
            </p>
          )}
        </div>

        {/* Locked Banner if disabled */}
        {poll.isLocked && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2.5 mb-6">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Il relatore ha momentaneamente bloccato le risposte. Guarda lo schermo.</span>
          </div>
        )}

        {/* Interaction Type Form */}
        <main className="mb-8">
          {poll.type === 'rating' && (
            <RatingVote
              poll={poll}
              disabled={poll.isLocked}
              onSubmit={(val) => handleVoteSubmit({ value: val })}
            />
          )}

          {poll.type === 'text' && (
            <TextVote
              poll={poll}
              disabled={poll.isLocked}
              onSubmit={(txt) => handleVoteSubmit({ text: txt })}
            />
          )}

          {poll.type === 'choice' && (
            <ChoiceVote
              poll={poll}
              disabled={poll.isLocked}
              onSubmit={(idx) => handleVoteSubmit({ optionIndex: idx })}
            />
          )}

          {poll.type === 'qna' && (
            <QnAVote
              poll={poll}
              questions={results?.qnaQuestions || []}
              disabled={poll.isLocked}
              onSubmitQuestion={(txt) => handleVoteSubmit({ questionText: txt })}
              onUpvoteQuestion={(qId) => handleVoteSubmit({ action: 'upvote', questionId: qId })}
            />
          )}

          {poll.type === 'emoji' && (
            <EmojiVote
              poll={poll}
              disabled={poll.isLocked}
              onSubmit={(em) => handleVoteSubmit({ emoji: em })}
            />
          )}

          {poll.type === 'yesno' && (
            <YesNoVote
              poll={poll}
              disabled={poll.isLocked}
              onSubmit={(choice) => handleVoteSubmit({ choice })}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-400 py-3 border-t border-slate-900 w-full max-w-md mx-auto">
        Partecipazione live senza registrazione • Powered by SlidePulse
      </footer>
    </div>
  );
}
