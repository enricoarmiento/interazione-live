'use client';

import React from 'react';
import { RatingPoll, PollResults } from '@/types/poll';
import { Users, TrendingUp, Award } from 'lucide-react';

interface RatingVisualizerProps {
  poll: RatingPoll;
  results: PollResults;
}

export const RatingVisualizer: React.FC<RatingVisualizerProps> = ({ poll, results }) => {
  const distribution = results.ratingDistribution || {};
  const total = results.totalVotes || 0;
  const average = results.ratingAverage || 0;

  const range = Array.from({ length: poll.max - poll.min + 1 }, (_, i) => poll.min + i);

  // Find max votes in any bucket to scale the bar heights
  const maxBucketVotes = Math.max(1, ...Object.values(distribution));

  // Determine sentiment color based on average
  const getAverageColor = (avg: number) => {
    if (avg >= 7.5) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (avg >= 5.5) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  return (
    <div className="flex flex-col w-full h-full justify-between py-2">
      {/* Top metrics bar */}
      <div className="flex items-center justify-between px-2 mb-6">
        <div className="flex items-center gap-6">
          {/* Average Badge */}
          <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border ${getAverageColor(average)} shadow-sm`}>
            <TrendingUp className="w-6 h-6" />
            <div>
              <span className="text-xs uppercase font-bold tracking-wider opacity-80 block">Media Voto</span>
              <span className="text-3xl font-black">{total > 0 ? average.toFixed(1) : '—'}<span className="text-sm font-normal opacity-70"> / {poll.max}</span></span>
            </div>
          </div>

          {/* Top Score Award */}
          {total > 0 && (
            <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <Award className="w-5 h-5 text-amber-400" />
              <div className="text-xs">
                <span className="text-slate-400 block">Punteggio più votato</span>
                <span className="font-bold text-white text-sm">
                  {Object.entries(distribution).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'} su 10
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Total Votes */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-300">
          <Users className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-semibold">{total} {total === 1 ? 'studente' : 'studenti'}</span>
        </div>
      </div>

      {/* Histogram Bars Chart */}
      <div className="flex-1 min-h-[320px] max-h-[460px] flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-6 pb-4 pt-8 bg-slate-900/60 backdrop-blur-sm rounded-3xl border border-slate-800">
        {range.map((score) => {
          const votes = distribution[score] || 0;
          const heightPercent = total > 0 ? (votes / maxBucketVotes) * 85 : 4; // minimum height indicator
          const actualPercent = total > 0 ? Math.round((votes / total) * 100) : 0;

          // Gradient color transition from score 1 to 10
          const barGradients = [
            'from-sky-700 to-sky-500',
            'from-sky-600 to-blue-500',
            'from-blue-600 to-indigo-500',
            'from-indigo-600 to-violet-500',
            'from-violet-600 to-purple-500',
            'from-purple-600 to-pink-500',
            'from-emerald-600 to-teal-500',
            'from-teal-500 to-emerald-400',
            'from-emerald-500 to-green-400',
            'from-emerald-400 to-green-300',
          ];

          const gradient = barGradients[score - 1] || 'from-blue-500 to-indigo-500';

          return (
            <div key={score} className="flex-1 flex flex-col items-center h-full justify-end group">
              {/* Vote count floating on top of bar */}
              <div className="mb-2 flex flex-col items-center transition-transform group-hover:-translate-y-1">
                <span className="text-xs sm:text-sm font-black text-white">{votes > 0 ? votes : ''}</span>
                {votes > 0 && <span className="text-[10px] text-slate-400 font-mono">{actualPercent}%</span>}
              </div>

              {/* Bar itself with smooth height animation */}
              <div
                style={{ height: `${Math.max(8, heightPercent)}%` }}
                className={`w-full max-w-[56px] rounded-2xl bg-gradient-to-t ${gradient} shadow-lg shadow-blue-500/10 transition-all duration-500 ease-out relative overflow-hidden`}
              >
                <div className="absolute inset-x-0 top-0 h-1.5 bg-white/40 rounded-t-2xl" />
              </div>

              {/* Score label at bottom */}
              <div className="mt-3 flex flex-col items-center">
                <span className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-white font-black text-sm flex items-center justify-center shadow-inner group-hover:border-blue-400 group-hover:text-blue-300 transition-colors">
                  {score}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Axis Labels */}
      <div className="flex justify-between text-xs font-semibold text-slate-400 px-4 mt-3">
        <span>← {poll.minLabel || 'Per nulla d\'accordo'} (1)</span>
        <span>(10) {poll.maxLabel || 'Totalmente d\'accordo'} →</span>
      </div>
    </div>
  );
};
