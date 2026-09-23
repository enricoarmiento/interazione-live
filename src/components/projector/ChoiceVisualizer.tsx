'use client';

import React, { useState } from 'react';
import { ChoicePoll, PollResults } from '@/types/poll';
import { Users, CheckCircle, Sparkles } from 'lucide-react';
import { triggerConfetti } from '@/lib/confetti';

interface ChoiceVisualizerProps {
  poll: ChoicePoll;
  results: PollResults;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const OPTION_SOLID_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-cyan-500',
];

export const ChoiceVisualizer: React.FC<ChoiceVisualizerProps> = ({ poll, results }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const total = results.totalVotes || 0;
  const counts = results.choiceCounts || {};
  const percentages = results.choicePercentages || {};

  // Find max votes
  let maxVotes = 0;
  let leadingIdx = -1;
  poll.options.forEach((_, idx) => {
    const v = counts[idx] || 0;
    if (v > maxVotes) {
      maxVotes = v;
      leadingIdx = idx;
    }
  });

  const handleRevealAnswer = () => {
    setShowAnswer(true);
    triggerConfetti();
  };

  return (
    <div className="flex flex-col w-full h-full justify-between py-2">
      {/* Top metrics bar */}
      <div className="flex items-center justify-between px-2 mb-4">
        <div>
          {poll.correctOptionIndex !== undefined && poll.correctOptionIndex !== null && (
            <button
              onClick={handleRevealAnswer}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                showAnswer
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md active:scale-95'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{showAnswer ? 'Risposta corretta mostrata' : 'Mostra Risposta Corretta 🎉'}</span>
            </button>
          )}
        </div>

        {/* Total Votes */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-bold">{total} {total === 1 ? 'risposta' : 'risposte ricevute'}</span>
        </div>
      </div>

      {/* Options List */}
      <div className="flex-1 min-h-[340px] flex flex-col justify-center space-y-4 px-4 py-6 bg-slate-900/70 rounded-3xl border border-slate-800">
        {total === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-lg font-bold text-slate-300">In attesa dei voti dell&apos;aula...</p>
            <p className="text-xs text-slate-400 mt-1">Inquadra il codice QR a lato per scegliere la tua opzione</p>
          </div>
        ) : (
          poll.options.map((option, idx) => {
            const voteCount = counts[idx] || 0;
            const pct = percentages[idx] || 0;
            const letter = OPTION_LETTERS[idx] || String(idx + 1);
            const isLeading = total > 0 && idx === leadingIdx;
            const isCorrect = showAnswer && poll.correctOptionIndex === idx;
            const barColor = OPTION_SOLID_COLORS[idx % OPTION_SOLID_COLORS.length];

            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all duration-300 ${
                  isCorrect
                    ? 'bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-400/50 shadow-lg'
                    : isLeading
                    ? 'bg-slate-850 border-slate-600 shadow-md'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                {/* Option Header: Letter + Text + Percentage */}
                <div className="flex items-center justify-between gap-4 mb-2.5">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${
                        isCorrect
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {isCorrect ? <CheckCircle className="w-5 h-5" /> : letter}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-white truncate">
                      {option}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 shrink-0">
                    <span className="text-xs font-semibold text-slate-400">
                      {voteCount} {voteCount === 1 ? 'voto' : 'voti'}
                    </span>
                    <span className="text-2xl font-black text-white font-mono min-w-[50px] text-right">
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Clear Thick Progress Bar */}
                <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className={`h-full ${barColor} transition-all duration-700 ease-out rounded-full`}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
