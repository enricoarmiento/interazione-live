'use client';

import React, { useState } from 'react';
import { RatingPoll } from '@/types/poll';
import { CheckCircle2, Send } from 'lucide-react';

interface RatingVoteProps {
  poll: RatingPoll;
  onSubmit: (val: number) => Promise<boolean>;
  disabled?: boolean;
}

export const RatingVote: React.FC<RatingVoteProps> = ({ poll, onSubmit, disabled }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const range = Array.from({ length: poll.max - poll.min + 1 }, (_, i) => poll.min + i);

  const handleSelect = async (val: number) => {
    if (disabled || loading) return;
    setSelected(val);
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
    return (
      <div className="text-center py-10 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl animate-in fade-in zoom-in-95 duration-300">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-emerald-400">Voto Registrato!</h3>
        <p className="text-sm text-slate-300 mt-2">
          Hai votato <strong className="text-white text-lg font-bold">{selected}</strong> su 10.
        </p>
        <p className="text-xs text-slate-400 mt-4">
          Guarda lo schermo del proiettore per vedere i risultati aggiornarsi in diretta!
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-6 text-xs text-slate-400 hover:text-white underline cursor-pointer"
        >
          Modifica il tuo voto
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Min & Max Labels */}
      <div className="w-full flex justify-between text-xs text-slate-400 mb-3 px-1">
        <span>{poll.minLabel || 'Per nulla'}</span>
        <span>{poll.maxLabel || 'Completamente'}</span>
      </div>

      {/* 1-10 Buttons Grid */}
      <div className="grid grid-cols-5 gap-2.5 w-full mb-6">
        {range.map((num) => {
          const isSelected = selected === num;
          return (
            <button
              key={num}
              type="button"
              disabled={disabled || loading}
              onClick={() => handleSelect(num)}
              className={`h-14 sm:h-16 text-xl sm:text-2xl font-black rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center border ${
                isSelected
                  ? 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white border-blue-400 scale-105 shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/20'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/70 hover:border-slate-600 active:scale-95'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {num}
            </button>
          );
        })}
      </div>

      {/* Confirm Button */}
      <button
        type="button"
        disabled={selected === null || disabled || loading}
        onClick={handleConfirm}
        className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
          selected !== null && !disabled && !loading
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 hover:shadow-blue-600/50 active:scale-[0.98]'
            : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
        }`}
      >
        <Send className="w-5 h-5" />
        <span>{loading ? 'Invio in corso...' : selected ? `Invia Voto (${selected}/10)` : 'Seleziona un valore'}</span>
      </button>
    </div>
  );
};
