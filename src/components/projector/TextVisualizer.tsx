'use client';

import React, { useState } from 'react';
import { TextPoll, PollResults } from '@/types/poll';
import { Cloud, LayoutGrid, Users, MessageSquare } from 'lucide-react';

interface TextVisualizerProps {
  poll: TextPoll;
  results: PollResults;
}

export const TextVisualizer: React.FC<TextVisualizerProps> = ({ results }) => {
  const [mode, setMode] = useState<'cloud' | 'cards'>('cloud');
  const responses = results.textResponses || [];
  const words = results.wordCloud || [];
  const total = results.totalVotes || 0;

  // Compute maximum word count for sizing
  const maxWordVal = Math.max(1, ...words.map((w) => w.value));

  const WORD_COLORS = [
    'from-blue-400 to-indigo-300 text-blue-100 border-blue-400/30',
    'from-emerald-400 to-teal-300 text-emerald-100 border-emerald-400/30',
    'from-amber-400 to-orange-300 text-amber-100 border-amber-400/30',
    'from-pink-400 to-rose-300 text-pink-100 border-pink-400/30',
    'from-purple-400 to-violet-300 text-purple-100 border-purple-400/30',
    'from-cyan-400 to-sky-300 text-cyan-100 border-cyan-400/30',
  ];

  return (
    <div className="flex flex-col w-full h-full justify-between py-2">
      {/* Controls & Metrics Header */}
      <div className="flex items-center justify-between px-2 mb-4">
        {/* Toggle Mode buttons */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80">
          <button
            onClick={() => setMode('cloud')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'cloud'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            Nuvola di Parole
          </button>
          <button
            onClick={() => setMode('cards')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'cards'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Tutte le Risposte ({responses.length})
          </button>
        </div>

        {/* Total Votes */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-300">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold">{total} {total === 1 ? 'risposta' : 'risposte'}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-[360px] max-h-[480px] p-6 bg-slate-900/60 backdrop-blur-sm rounded-3xl border border-slate-800 flex items-center justify-center overflow-hidden">
        {total === 0 ? (
          <div className="text-center text-slate-400 animate-pulse">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40 text-blue-400" />
            <p className="text-base font-semibold text-slate-300">In attesa delle prime risposte...</p>
            <p className="text-xs text-slate-400 mt-1">Inquadra il QR code per scrivere dal tuo smartphone</p>
          </div>
        ) : mode === 'cloud' ? (
          /* Word Cloud View */
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 p-4 max-w-4xl max-h-full overflow-y-auto">
            {words.length === 0 ? (
              <p className="text-sm text-slate-400">Elaborazione parole in corso...</p>
            ) : (
              words.map((item, idx) => {
                const ratio = item.value / maxWordVal;
                // Font sizes from 14px up to 48px
                const fontSize = Math.round(14 + ratio * 32);
                const colorClass = WORD_COLORS[idx % WORD_COLORS.length];

                return (
                  <span
                    key={item.text}
                    style={{ fontSize: `${fontSize}px` }}
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-2xl font-black bg-gradient-to-r bg-slate-800/80 border shadow-md transition-all duration-300 hover:scale-110 cursor-default animate-in zoom-in-75 ${colorClass}`}
                  >
                    <span>{item.text}</span>
                    {item.value > 1 && (
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-white/20 text-white font-normal">
                        ×{item.value}
                      </span>
                    )}
                  </span>
                );
              })
            )}
          </div>
        ) : (
          /* Cards Stream View */
          <div className="w-full h-full overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 content-start">
            {responses.map((resp) => (
              <div
                key={resp.id}
                className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md text-slate-100 flex flex-col justify-between animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <p className="text-sm font-medium leading-relaxed break-words">{resp.text}</p>
                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono">Anonimo</span>
                  <span>{new Date(resp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
