'use client';

import React, { useState } from 'react';
import { ChoicePoll } from '@/types/poll';
import { CheckCircle2, Send } from 'lucide-react';

interface ChoiceVoteProps {
  poll: ChoicePoll;
  onSubmit: (optionIndex: number) => Promise<boolean>;
  disabled?: boolean;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const OPTION_COLORS = [
  'from-blue-600/20 to-blue-500/10 border-blue-500/40 text-blue-300 hover:border-blue-400',
  'from-emerald-600/20 to-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:border-emerald-400',
  'from-amber-600/20 to-amber-500/10 border-amber-500/40 text-amber-300 hover:border-amber-400',
  'from-purple-600/20 to-purple-500/10 border-purple-500/40 text-purple-300 hover:border-purple-400',
  'from-pink-600/20 to-pink-500/10 border-pink-500/40 text-pink-300 hover:border-pink-400',
  'from-cyan-600/20 to-cyan-500/10 border-cyan-500/40 text-cyan-300 hover:border-cyan-400',
];

export const ChoiceVote: React.FC<ChoiceVoteProps> = ({ poll, onSubmit, disabled }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelect = (idx: number) => {
    if (disabled || loading) return;
    setSelected(idx);
  };

  const handleConfirm = async () => {
    if (selected === null || disabled || loading) return;
    setLoading(true);
    const success = await onSubmit(selected);
    setLoading(false);
    if (success) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    const chosenText = selected !== null ? poll.options[selected] : '';
    return (
      <div className="text-center py-10 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl animate-in fade-in zoom-in-95 duration-300">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-emerald-400">Scelta Registrata!</h3>
        <p className="text-sm text-slate-300 mt-2">
          Hai votato l&apos;opzione <strong className="text-white">{selected !== null ? OPTION_LETTERS[selected] : ''}</strong>:
        </p>
        <p className="text-sm text-white font-medium bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 max-w-sm mx-auto mt-2">
          {chosenText}
        </p>
        <p className="text-xs text-slate-400 mt-4">
          Guarda lo schermo del proiettore per vedere le percentuali live!
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-6 text-xs text-slate-400 hover:text-white underline cursor-pointer"
        >
          Modifica opzione
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-md mx-auto space-y-3">
      {poll.options.map((option, idx) => {
        const isSelected = selected === idx;
        const letter = OPTION_LETTERS[idx] || String(idx + 1);
        const colorClass = OPTION_COLORS[idx % OPTION_COLORS.length];

        return (
          <button
            key={idx}
            type="button"
            disabled={disabled || loading}
            onClick={() => handleSelect(idx)}
            className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-3.5 relative overflow-hidden ${
              isSelected
                ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 scale-[1.01] ring-2 ring-blue-400/50'
                : `bg-gradient-to-r ${colorClass} bg-slate-850 hover:bg-slate-800 text-slate-200 active:scale-[0.99]`
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
                isSelected
                  ? 'bg-white text-blue-600'
                  : 'bg-slate-800 text-white border border-slate-700'
              }`}
            >
              {letter}
            </div>
            <span className="text-sm sm:text-base font-medium leading-snug flex-1">
              {option}
            </span>
          </button>
        );
      })}

      <button
        type="button"
        disabled={selected === null || disabled || loading}
        onClick={handleConfirm}
        className={`mt-4 w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
          selected !== null && !disabled && !loading
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 hover:shadow-blue-600/50 active:scale-[0.98]'
            : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
        }`}
      >
        <Send className="w-5 h-5" />
        <span>{loading ? 'Invio in corso...' : selected !== null ? `Conferma Scelta (${OPTION_LETTERS[selected]})` : 'Seleziona un\'opzione'}</span>
      </button>
    </div>
  );
};
