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
const BAR_COLORS = [
  'from-blue-600 to-indigo-500',
  'from-emerald-600 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-purple-600 to-pink-500',
  'from-cyan-600 to-blue-500',
  'from-rose-600 to-pink-500',
];

export const ChoiceVisualizer: React.FC<ChoiceVisualizerProps> = ({ poll, results }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const total = results.totalVotes || 0;
  const counts = results.choiceCounts || {};
  const percentages = results.choicePercentages || {};

  // Find max votes to highlight leading option
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
        <div className="flex items-center gap-3">
          {poll.correctOptionIndex !== undefined && poll.correctOptionIndex !== null && (
            <button
              onClick={handleRevealAnswer}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                showAnswer
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/20 active:scale-95'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{showAnswer ? 'Risposta Corretta Mostrata' : 'Svela Risposta Corretta 🎉'}</span>
            </button>
          )}
        </div>

        {/* Total Votes */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-300">
          <Users className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-semibold">{total} {total === 1 ? 'voto' : 'voti'}</span>
        </div>
      </div>

      {/* Progress Bars List */}
      <div className="flex-1 min-h-[340px] max-h-[460px] flex flex-col justify-center space-y-3.5 px-4 py-6 bg-slate-900/60 backdrop-blur-sm rounded-3xl border border-slate-800 overflow-y-auto">
        {poll.options.map((option, idx) => {
          const voteCount = counts[idx] || 0;
          const pct = percentages[idx] || 0;
          const letter = OPTION_LETTERS[idx] || String(idx + 1);
          const isLeading = total > 0 && idx === leadingIdx;
          const isCorrect = showAnswer && poll.correctOptionIndex === idx;
          const gradient = BAR_COLORS[idx % BAR_COLORS.length];

          return (
            <div
              key={idx}
              className={`relative p-4 rounded-2xl border transition-all duration-300 overflow-hidden ${
                isCorrect
                  ? 'bg-emerald-950/40 border-emerald-400/80 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/30'
                  : isLeading
                  ? 'bg-slate-800/90 border-slate-600/80 shadow-md'
                  : 'bg-slate-800/50 border-slate-700/50'
              }`}
            >
              {/* Dynamic filled background bar */}
              <div
                style={{ width: `${pct}%` }}
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${gradient} opacity-25 rounded-2xl transition-all duration-700 ease-out`}
              />

              {/* Foreground content */}
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shrink-0 shadow-sm ${
                      isCorrect
                        ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    {isCorrect ? <CheckCircle className="w-6 h-6" /> : letter}
                  </div>
                  <span className="text-base sm:text-lg font-semibold text-slate-100 truncate">
                    {option}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-semibold text-slate-400 font-mono">
                    {voteCount} {voteCount === 1 ? 'voto' : 'voti'}
                  </span>
                  <div className="min-w-[54px] text-right">
                    <span className="text-xl sm:text-2xl font-black text-white font-mono">
                      {pct}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
