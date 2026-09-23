'use client';

import React from 'react';
import { YesNoPoll, PollResults } from '@/types/poll';
import { Users, ThumbsUp, ThumbsDown, HelpCircle } from 'lucide-react';

interface YesNoVisualizerProps {
  poll: YesNoPoll;
  results: PollResults;
}

export const YesNoVisualizer: React.FC<YesNoVisualizerProps> = ({ poll, results }) => {
  const total = results.totalVotes || 0;
  const yes = results.yesCount || 0;
  const no = results.noCount || 0;
  const maybe = results.maybeCount || 0;

  const yesPct = total > 0 ? Math.round((yes / total) * 100) : 0;
  const noPct = total > 0 ? Math.round((no / total) * 100) : 0;
  const maybePct = total > 0 ? Math.round((maybe / total) * 100) : 0;

  return (
    <div className="flex flex-col w-full h-full justify-between py-2">
      {/* Top metrics bar */}
      <div className="flex items-center justify-between px-2 mb-4">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
          Esito Votazione Istantanea
        </span>

        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-300">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold">{total} {total === 1 ? 'studente' : 'studenti'}</span>
        </div>
      </div>

      {/* Main Comparison Cards */}
      <div className="flex-1 min-h-[340px] max-h-[460px] p-6 sm:p-8 bg-slate-900/60 backdrop-blur-sm rounded-3xl border border-slate-800 flex flex-col justify-center gap-6">
        {/* Full width stacked bar */}
        {total > 0 && (
          <div className="w-full h-6 rounded-2xl bg-slate-800 overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${yesPct}%` }}
              className="bg-emerald-500 transition-all duration-500 ease-out"
              title={`Sì: ${yesPct}%`}
            />
            {maybe > 0 && (
              <div
                style={{ width: `${maybePct}%` }}
                className="bg-amber-500 transition-all duration-500 ease-out"
                title={`Forse: ${maybePct}%`}
              />
            )}
            <div
              style={{ width: `${noPct}%` }}
              className="bg-rose-500 transition-all duration-500 ease-out"
              title={`No: ${noPct}%`}
            />
          </div>
        )}

        {/* 2 or 3 large cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {/* YES CARD */}
          <div className="p-6 rounded-3xl bg-emerald-950/30 border border-emerald-500/40 shadow-xl flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <ThumbsUp className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-white mb-1">{poll.yesLabel || 'Sì'}</h4>
            <div className="text-4xl font-black text-emerald-400 font-mono my-2">{yesPct}%</div>
            <span className="text-xs text-slate-400 font-mono">{yes} {yes === 1 ? 'voto' : 'voti'}</span>
          </div>

          {/* NO CARD */}
          <div className="p-6 rounded-3xl bg-rose-950/30 border border-rose-500/40 shadow-xl flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
              <ThumbsDown className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-white mb-1">{poll.noLabel || 'No'}</h4>
            <div className="text-4xl font-black text-rose-400 font-mono my-2">{noPct}%</div>
            <span className="text-xs text-slate-400 font-mono">{no} {no === 1 ? 'voto' : 'voti'}</span>
          </div>

          {/* MAYBE CARD (if label provided or votes received) */}
          {(poll.maybeLabel || maybe > 0) && (
            <div className="p-6 rounded-3xl bg-amber-950/30 border border-amber-500/40 shadow-xl flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                <HelpCircle className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-white mb-1">{poll.maybeLabel || 'Forse'}</h4>
              <div className="text-4xl font-black text-amber-400 font-mono my-2">{maybePct}%</div>
              <span className="text-xs text-slate-400 font-mono">{maybe} {maybe === 1 ? 'voto' : 'voti'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
