'use client';

import React, { useState } from 'react';
import { RatingPoll } from '@/types/poll';
import { CheckCircle2, ArrowRight } from 'lucide-react';

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

  const handleSelect = (val: number) => {
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
      <div className="text-center py-10 px-6 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl animate-in fade-in duration-300">
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-3" />
        <h3 className="text-2xl font-black text-white">Voto Inviato!</h3>
        <p className="text-base text-slate-300 mt-2">
          Hai votato <strong className="text-emerald-400 text-xl font-black">{selected}</strong> su 10.
        </p>
        <p className="text-xs text-slate-400 mt-3">
          Guarda lo schermo del proiettore per vedere la media aggiornarsi!
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-6 text-xs text-slate-400 hover:text-white underline cursor-pointer"
        >
          Vuoi cambiare voto?
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Question prompt guidance */}
      <div className="w-full text-center mb-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Tocca un numero da 1 a 10:
        </span>
      </div>

      {/* 1-10 Buttons Grid */}
      <div className="grid grid-cols-5 gap-3 w-full mb-6">
        {range.map((num) => {
          const isSelected = selected === num;

          return (
            <button
              key={num}
              type="button"
              disabled={disabled || loading}
              onClick={() => handleSelect(num)}
              className={`h-16 text-2xl font-black rounded-2xl transition-all duration-150 cursor-pointer flex items-center justify-center border-2 ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-400 scale-105 shadow-xl shadow-blue-600/40 ring-4 ring-blue-500/30'
                  : 'bg-slate-850 hover:bg-slate-800 text-white border-slate-700/80 active:scale-95'
              } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {num}
            </button>
          );
        })}
      </div>

      {/* Clear scale legend */}
      <div className="w-full flex justify-between text-xs font-bold text-slate-400 px-1 mb-6">
        <span>1 = {poll.minLabel || 'Per nulla'}</span>
        <span>10 = {poll.maxLabel || 'Completamente'}</span>
      </div>

      {/* Big Action Confirm Button */}
      <button
        type="button"
        disabled={selected === null || disabled || loading}
        onClick={handleConfirm}
        className={`w-full py-4 px-6 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer ${
          selected !== null && !disabled && !loading
            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 active:scale-98'
            : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
        }`}
      >
        <span>
          {loading
            ? 'Invio in corso...'
            : selected !== null
            ? `Conferma Voto: ${selected} / 10`
            : 'Seleziona un numero'}
        </span>
        {selected !== null && !loading && <ArrowRight className="w-5 h-5" />}
      </button>
    </div>
  );
};
