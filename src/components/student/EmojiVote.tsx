'use client';

import React, { useState } from 'react';
import { EmojiPoll } from '@/types/poll';
import { Sparkles } from 'lucide-react';

interface EmojiVoteProps {
  poll: EmojiPoll;
  onSubmit: (emoji: string) => Promise<boolean>;
  disabled?: boolean;
}

export const EmojiVote: React.FC<EmojiVoteProps> = ({ poll, onSubmit, disabled }) => {
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [burstCount, setBurstCount] = useState(0);

  const handleTap = async (emoji: string) => {
    if (disabled) return;
    setLastSent(emoji);
    setBurstCount((prev) => prev + 1);
    await onSubmit(emoji);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Tocca l&apos;emoji che rappresenta il tuo stato d&apos;animo!
        </p>
        {lastSent && (
          <p className="text-xs font-semibold text-emerald-400 mt-1 animate-pulse">
            Hai inviato {lastSent} (x{burstCount})
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 w-full">
        {poll.emojis.map((emoji, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => handleTap(emoji)}
            className="h-20 sm:h-24 bg-slate-800/90 hover:bg-slate-700 active:scale-90 text-4xl sm:text-5xl rounded-3xl border border-slate-700/80 shadow-md transition-all duration-150 flex items-center justify-center cursor-pointer select-none"
          >
            {emoji}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-slate-500 mt-6 text-center">
        Puoi toccare più volte per far volare le tue reazioni sullo schermo!
      </p>
    </div>
  );
};
