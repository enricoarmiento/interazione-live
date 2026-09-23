'use client';

import React, { useEffect, useState } from 'react';
import { EmojiPoll, PollResults } from '@/types/poll';
import { Users, Sparkles, Flame } from 'lucide-react';

interface EmojiVisualizerProps {
  poll: EmojiPoll;
  results: PollResults;
}

interface FloatingEmoji {
  id: string;
  emoji: string;
  left: number; // percentage
  size: number;
}

export const EmojiVisualizer: React.FC<EmojiVisualizerProps> = ({ poll, results }) => {
  const counts = results.emojiCounts || {};
  const total = results.totalVotes || 0;
  const recent = results.recentEmojis || [];

  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);

  // When recent emojis change, spawn animated floating emojis across screen
  useEffect(() => {
    if (recent.length > 0) {
      const latest = recent[0];
      const newFloating: FloatingEmoji = {
        id: `${latest.id}-${Math.random()}`,
        emoji: latest.emoji,
        left: 15 + Math.random() * 70, // random horizontal position
        size: 36 + Math.random() * 24, // random size
      };

      setFloatingEmojis((prev) => [...prev.slice(-15), newFloating]);

      const timer = setTimeout(() => {
        setFloatingEmojis((prev) => prev.filter((item) => item.id !== newFloating.id));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [recent]);

  return (
    <div className="flex flex-col w-full h-full justify-between py-2 relative overflow-hidden">
      {/* Floating live emojis layer */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            style={{
              left: `${item.left}%`,
              fontSize: `${item.size}px`,
              bottom: '20px',
            }}
            className="absolute animate-in fade-in slide-in-from-bottom-20 duration-1000 transition-transform"
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Top metrics bar */}
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Reazioni visive in tempo reale dalla platea</span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-300">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold">{total} {total === 1 ? 'reazione' : 'reazioni'}</span>
        </div>
      </div>

      {/* Grid of Emojis with live counters */}
      <div className="flex-1 min-h-[340px] max-h-[460px] p-8 bg-slate-900/60 backdrop-blur-sm rounded-3xl border border-slate-800 flex items-center justify-center">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full max-w-3xl">
          {poll.emojis.map((emoji, idx) => {
            const count = counts[emoji] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-slate-800/90 border border-slate-700/80 shadow-lg flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 hover:scale-105 group"
              >
                {/* Background percentage fill */}
                <div
                  style={{ height: `${pct}%` }}
                  className="absolute bottom-0 inset-x-0 bg-blue-500/10 rounded-b-3xl transition-all duration-500"
                />

                <span className="text-5xl sm:text-6xl mb-3 transform group-hover:scale-110 transition-transform select-none">
                  {emoji}
                </span>

                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-2xl font-black text-white font-mono">{count}</span>
                  <span className="text-xs font-semibold text-slate-400 font-mono mt-0.5">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Pulse indicator */}
      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-400/90 mt-3">
        <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
        <span>Tocca continuamente sul telefono per inviare impulsi energetici</span>
      </div>
    </div>
  );
};
