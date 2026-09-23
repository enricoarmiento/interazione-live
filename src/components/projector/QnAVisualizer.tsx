'use client';

import React, { useState } from 'react';
import { QnAPoll, PollResults } from '@/types/poll';
import { Users, ThumbsUp, MessageSquare, Check, Sparkles } from 'lucide-react';

interface QnAVisualizerProps {
  poll: QnAPoll;
  results: PollResults;
}

export const QnAVisualizer: React.FC<QnAVisualizerProps> = ({ results }) => {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());

  const questions = results.qnaQuestions || [];
  const total = results.totalVotes || 0;

  const toggleAnswered = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAnsweredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col w-full h-full justify-between py-2">
      {/* Top metrics bar */}
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Clicca su una domanda per metterla in risalto sul proiettore</span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-300">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold">{questions.length} domande ({total} interazioni)</span>
        </div>
      </div>

      {/* Questions List */}
      <div className="flex-1 min-h-[360px] max-h-[480px] p-6 bg-slate-900/60 backdrop-blur-sm rounded-3xl border border-slate-800 overflow-y-auto space-y-3.5">
        {questions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="w-12 h-12 mb-3 opacity-30 text-blue-400" />
            <p className="text-base font-semibold text-slate-300">Nessuna domanda ricevuta finora</p>
            <p className="text-xs text-slate-400 mt-1">Gli studenti possono fare domande e votare con il QR code</p>
          </div>
        ) : (
          questions.map((q, idx) => {
            const isHighlighted = highlightedId === q.id;
            const isAnswered = answeredIds.has(q.id);

            return (
              <div
                key={q.id}
                onClick={() => setHighlightedId(isHighlighted ? null : q.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 ${
                  isHighlighted
                    ? 'bg-blue-950/60 border-blue-400 ring-2 ring-blue-400/40 shadow-xl scale-[1.01]'
                    : isAnswered
                    ? 'bg-slate-850/40 border-slate-800/50 opacity-60'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 shadow-md'
                }`}
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Rank badge */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-950'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    #{idx + 1}
                  </div>

                  <div className="flex-1">
                    <p
                      className={`text-base sm:text-lg font-semibold leading-relaxed ${
                        isAnswered ? 'line-through text-slate-400' : 'text-slate-100'
                      }`}
                    >
                      {q.text}
                    </p>
                    <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                      {new Date(q.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Right actions: Upvotes count & Answered toggle */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400 font-black text-sm">
                    <ThumbsUp className="w-4 h-4 fill-blue-400/40" />
                    <span>{q.upvotes || 1}</span>
                  </div>

                  <button
                    onClick={(e) => toggleAnswered(q.id, e)}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                      isAnswered
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-700/60 hover:bg-slate-700 border-slate-600 text-slate-400 hover:text-white'
                    }`}
                    title={isAnswered ? 'Contrassegna come non risposta' : 'Contrassegna come risposta completata'}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
