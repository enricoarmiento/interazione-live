'use client';

import React from 'react';
import { RatingPoll, PollResults } from '@/types/poll';
import { Users, TrendingUp } from 'lucide-react';

interface RatingVisualizerProps {
  poll: RatingPoll;
  results: PollResults;
}

export const RatingVisualizer: React.FC<RatingVisualizerProps> = ({ poll, results }) => {
  const distribution = results.ratingDistribution || {};
  const total = results.totalVotes || 0;
  const average = results.ratingAverage || 0;

  const range = Array.from({ length: poll.max - poll.min + 1 }, (_, i) => poll.min + i);
  const maxBucketVotes = Math.max(1, ...Object.values(distribution));

  return (
    <div className="flex flex-col w-full h-full justify-between py-2">
      {/* Top metrics bar */}
      <div className="flex items-center justify-between px-2 mb-6">
        <div className="flex items-center gap-4">
          {/* Average Badge */}
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <TrendingUp className="w-7 h-7" />
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider opacity-85 block">Media Risposte</span>
              <span className="text-3xl font-black">{total > 0 ? average.toFixed(1) : '—'}<span className="text-sm font-normal opacity-80"> / {poll.max}</span></span>
            </div>
          </div>
        </div>

        {/* Total Votes */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200">
          <Users className="w-5 h-5 text-blue-400" />
          <span className="text-base font-bold">{total} {total === 1 ? 'voto' : 'voti ricevuti'}</span>
        </div>
      </div>

      {/* Histogram Bars Chart */}
      <div className="flex-1 min-h-[320px] max-h-[460px] flex items-end justify-between gap-2 sm:gap-4 px-4 sm:px-8 pb-4 pt-10 bg-slate-900/70 rounded-3xl border border-slate-800">
        {range.map((score) => {
          const votes = distribution[score] || 0;
          const heightPercent = total > 0 ? (votes / maxBucketVotes) * 85 : 4;
          const actualPercent = total > 0 ? Math.round((votes / total) * 100) : 0;

          return (
            <div key={score} className="flex-1 flex flex-col items-center h-full justify-end">
              {/* Vote count on top of bar */}
              <div className="mb-2 text-center">
                <span className="text-sm font-black text-white block">{votes > 0 ? votes : ''}</span>
                {votes > 0 && <span className="text-[11px] text-slate-400 font-bold">{actualPercent}%</span>}
              </div>

              {/* Solid bar with high visibility */}
              <div
                style={{ height: `${Math.max(8, heightPercent)}%` }}
                className={`w-full max-w-[50px] rounded-xl transition-all duration-500 ${
                  votes > 0 ? 'bg-blue-500 shadow-md shadow-blue-500/30' : 'bg-slate-800'
                }`}
              />

              {/* Score number button at bottom */}
              <div className="mt-3">
                <span className={`w-8 h-8 rounded-lg font-black text-sm flex items-center justify-center ${
                  votes > 0 ? 'bg-white text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}>
                  {score}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Clear Axis Labels */}
      <div className="flex justify-between text-sm font-bold text-slate-300 px-4 mt-4">
        <span>← 1 = {poll.minLabel || 'Per nulla d\'accordo'}</span>
        <span>10 = {poll.maxLabel || 'Totalmente d\'accordo'} →</span>
      </div>
    </div>
  );
};
