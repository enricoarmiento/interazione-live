'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Poll, PollType, RatingPoll, TextPoll, ChoicePoll, QnAPoll, EmojiPoll, YesNoPoll } from '@/types/poll';
import { QRCodeCard } from '@/components/QRCodeCard';
import {
  getStoredPolls,
  saveStoredPolls,
  getSessionTitle,
  setSessionTitle,
  exportPollsToJson,
  importPollsFromJson,
  setActivePollId,
} from '@/lib/storage';
import { DEFAULT_POLLS } from '@/lib/defaultPolls';
import {
  Plus,
  Play,
  QrCode,
  Edit2,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  X,
  PlusCircle,
  Radio,
  ExternalLink,
  Check,
} from 'lucide-react';

export default function AdminPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [sessionTitle, setTitleState] = useState('');
  const [selectedQrPoll, setSelectedQrPoll] = useState<Poll | null>(null);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [origin, setOrigin] = useState('');

  // New poll form state
  const [newType, setNewType] = useState<PollType>('choice');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newOptions, setNewOptions] = useState<string[]>(['Opzione 1', 'Opzione 2', 'Opzione 3']);
  const [newMinLabel, setNewMinLabel] = useState('Per nulla d\'accordo');
  const [newMaxLabel, setNewMaxLabel] = useState('Totalmente d\'accordo');
  const [newEmojis, setNewEmojis] = useState<string[]>(['🚀', '💡', '🔥', '🤔', '☕', '👏']);
  const [newYesLabel, setNewYesLabel] = useState('Sì');
  const [newNoLabel, setNewNoLabel] = useState('No');
  const [newMaybeLabel, setNewMaybeLabel] = useState('Forse');

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editMinLabel, setEditMinLabel] = useState('');
  const [editMaxLabel, setEditMaxLabel] = useState('');
  const [editEmojis, setEditEmojis] = useState<string[]>([]);
  const [editYesLabel, setEditYesLabel] = useState('');
  const [editNoLabel, setEditNoLabel] = useState('');
  const [editMaybeLabel, setEditMaybeLabel] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      const stored = getStoredPolls();
      setPolls(stored);
      setTitleState(getSessionTitle());

      // Sync all polls to server store
      stored.forEach((p) => {
        fetch(`/api/poll/${p.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p),
        }).catch(() => {});
      });
    }
  }, []);

  const handleUpdateTitle = (val: string) => {
    setTitleState(val);
    setSessionTitle(val);
  };

  const handleDelete = (id: string) => {
    if (confirm('Vuoi davvero eliminare questo sondaggio?')) {
      const filtered = polls.filter((p) => p.id !== id);
      setPolls(filtered);
      saveStoredPolls(filtered);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Vuoi ripristinare i sondaggi di esempio iniziali?')) {
      setPolls(DEFAULT_POLLS);
      saveStoredPolls(DEFAULT_POLLS);
      DEFAULT_POLLS.forEach((p) => {
        fetch(`/api/poll/${p.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p),
        }).catch(() => {});
      });
    }
  };

  const handleExport = () => {
    const jsonStr = exportPollsToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sondaggi-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && importPollsFromJson(content)) {
        const loaded = getStoredPolls();
        setPolls(loaded);
        alert('Sondaggi importati con successo!');
      } else {
        alert('File JSON non valido.');
      }
    };
    reader.readAsText(file);
  };

  // Open Edit Modal
  const openEditModal = (poll: Poll) => {
    setEditingPoll(poll);
    setEditTitle(poll.title);
    setEditDescription(poll.description || '');

    if (poll.type === 'choice') {
      setEditOptions([...(poll.options || [])]);
    } else if (poll.type === 'rating') {
      setEditMinLabel(poll.minLabel || 'Per nulla d\'accordo');
      setEditMaxLabel(poll.maxLabel || 'Totalmente d\'accordo');
    } else if (poll.type === 'emoji') {
      setEditEmojis([...(poll.emojis || [])]);
    } else if (poll.type === 'yesno') {
      setEditYesLabel(poll.yesLabel || 'Sì');
      setEditNoLabel(poll.noLabel || 'No');
      setEditMaybeLabel(poll.maybeLabel || 'Forse');
    }
  };

  // Save Edited Poll
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPoll || !editTitle.trim()) return;

    let updatedPoll: Poll;

    if (editingPoll.type === 'rating') {
      updatedPoll = {
        ...editingPoll,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        minLabel: editMinLabel.trim() || 'Per nulla d\'accordo',
        maxLabel: editMaxLabel.trim() || 'Totalmente d\'accordo',
      };
    } else if (editingPoll.type === 'choice') {
      const cleanOpts = editOptions.map((o) => o.trim()).filter(Boolean);
      if (cleanOpts.length < 2) {
        alert('Inserisci almeno 2 opzioni di risposta');
        return;
      }
      updatedPoll = {
        ...editingPoll,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        options: cleanOpts,
      };
    } else if (editingPoll.type === 'emoji') {
      updatedPoll = {
        ...editingPoll,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        emojis: editEmojis,
      };
    } else if (editingPoll.type === 'yesno') {
      updatedPoll = {
        ...editingPoll,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        yesLabel: editYesLabel.trim() || 'Sì',
        noLabel: editNoLabel.trim() || 'No',
        maybeLabel: editMaybeLabel.trim() || 'Forse',
      };
    } else {
      updatedPoll = {
        ...editingPoll,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      };
    }

    const updatedList = polls.map((p) => (p.id === updatedPoll.id ? updatedPoll : p));
    setPolls(updatedList);
    saveStoredPolls(updatedList);

    // Sync to server
    await fetch(`/api/poll/${updatedPoll.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPoll),
    });

    setEditingPoll(null);
  };

  // Create New Poll
  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Inserisci la domanda o il titolo del sondaggio');
      return;
    }

    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    const newId = `poll-${Date.now()}`;

    let created: Poll;

    if (newType === 'rating') {
      created = {
        id: newId,
        code: randomPin,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        type: 'rating',
        min: 1,
        max: 10,
        minLabel: newMinLabel.trim() || 'Per nulla d\'accordo',
        maxLabel: newMaxLabel.trim() || 'Totalmente d\'accordo',
        createdAt: Date.now(),
      };
    } else if (newType === 'text') {
      created = {
        id: newId,
        code: randomPin,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        type: 'text',
        maxLength: 140,
        allowMultipleSubmissions: true,
        createdAt: Date.now(),
      };
    } else if (newType === 'choice') {
      const cleanOpts = newOptions.map((o) => o.trim()).filter(Boolean);
      if (cleanOpts.length < 2) {
        alert('Inserisci almeno 2 opzioni di risposta');
        return;
      }
      created = {
        id: newId,
        code: randomPin,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        type: 'choice',
        options: cleanOpts,
        createdAt: Date.now(),
      };
    } else if (newType === 'qna') {
      created = {
        id: newId,
        code: randomPin,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        type: 'qna',
        allowUpvotes: true,
        createdAt: Date.now(),
      };
    } else if (newType === 'emoji') {
      created = {
        id: newId,
        code: randomPin,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        type: 'emoji',
        emojis: newEmojis,
        createdAt: Date.now(),
      };
    } else {
      created = {
        id: newId,
        code: randomPin,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        type: 'yesno',
        yesLabel: newYesLabel.trim() || 'Sì',
        noLabel: newNoLabel.trim() || 'No',
        maybeLabel: newMaybeLabel.trim() || 'Forse',
        createdAt: Date.now(),
      };
    }

    const updated = [...polls, created];
    setPolls(updated);
    saveStoredPolls(updated);

    // Sync to server
    await fetch(`/api/poll/${created.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(created),
    });

    setNewTitle('');
    setNewDescription('');
    setIsCreateModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-blue-600/30">
              SP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => handleUpdateTitle(e.target.value)}
                  className="text-lg font-black bg-transparent hover:bg-slate-800 focus:bg-slate-800 px-2 py-0.5 rounded-lg border border-transparent focus:border-slate-700 text-white outline-none transition-all"
                  placeholder="Nome Presentazione..."
                />
              </div>
              <span className="text-xs text-slate-400 px-2 block">
                Pannello Relatore • Zero Database
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* New Poll Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Sondaggio</span>
            </button>

            {/* JSON Export / Import */}
            <button
              onClick={handleExport}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Salva backup sondaggi (JSON)"
            >
              <Download className="w-4 h-4" />
            </button>

            <label
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Carica sondaggi da file JSON"
            >
              <Upload className="w-4 h-4" />
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-6 sm:p-8 flex-1">
        {/* Info Banner */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Come funziona durante la presentazione</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                I sondaggi sono indipendenti: puoi scaricare il QR Code di ciascuno da incollare nelle tue slide PowerPoint, oppure proiettare direttamente quello che desideri al momento giusto.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <code className="text-xs font-mono font-bold bg-slate-950 text-blue-300 px-3 py-1.5 rounded-xl border border-slate-800">
              {origin ? `${origin}/live` : '/live'}
            </code>
            <Link
              href="/live"
              target="_blank"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
              title="Apri link partecipante"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <span>I Tuoi Sondaggi ({polls.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Modifica i testi, scarica il QR code per le tue slide o proietta live quando vuoi
            </p>
          </div>

          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Ripristina esempi
          </button>
        </div>

        {/* Polls Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {polls.map((poll) => {
            return (
              <div
                key={poll.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-5 group"
              >
                {/* Header Info */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                      {poll.type === 'rating' && '⭐ Voto da 1 a 10'}
                      {poll.type === 'text' && '💬 Testo Libero'}
                      {poll.type === 'choice' && `📊 Scelta Multipla (${poll.options?.length} opzioni)`}
                      {poll.type === 'qna' && '❓ Domande & Risposte'}
                      {poll.type === 'emoji' && '🔥 Reazioni Live'}
                      {poll.type === 'yesno' && '👍 Sì / No'}
                    </span>

                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      PIN: {poll.code}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors leading-snug">
                    {poll.title}
                  </h3>

                  {poll.description && (
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {poll.description}
                    </p>
                  )}

                  {poll.type === 'choice' && poll.options && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {poll.options.map((opt, i) => (
                        <span key={i} className="text-[11px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/60 truncate max-w-[200px]">
                          {String.fromCharCode(65 + i)}. {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions Bar */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {/* Project Poll Button */}
                    <Link
                      href={`/projector/${poll.id}`}
                      onClick={() => setActivePollId(poll.id)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Proietta Ora</span>
                    </Link>

                    {/* Edit Text Button */}
                    <button
                      onClick={() => openEditModal(poll)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Modifica Testo</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* QR Code Modal preview */}
                    <button
                      onClick={() => setSelectedQrPoll(poll)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Scarica QR code PNG per PowerPoint"
                    >
                      <QrCode className="w-3.5 h-3.5 text-blue-400" />
                      <span>Scarica QR</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(poll.id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                      title="Elimina sondaggio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-500">
        SlidePulse Live • Pronto per le tue presentazioni PowerPoint
      </footer>

      {/* QR Code Modal preview */}
      {selectedQrPoll && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full relative shadow-2xl animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedQrPoll(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">{selectedQrPoll.title}</h3>
            <p className="text-xs text-slate-400 mb-6">
              Clicca su &quot;Salva PNG&quot; per scaricare l&apos;immagine da incollare direttamente sulla tua slide PowerPoint!
            </p>

            <QRCodeCard
              url={origin ? `${origin}/p/${selectedQrPoll.id}` : `/p/${selectedQrPoll.id}`}
              code={selectedQrPoll.code}
              size={220}
              title="Scansiona con la fotocamera per votare"
            />
          </div>
        </div>
      )}

      {/* Edit Poll Modal */}
      {editingPoll && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full relative shadow-2xl my-8 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setEditingPoll(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white mb-1">Modifica Testo del Sondaggio</h3>
            <p className="text-xs text-slate-400 mb-6">
              Personalizza la domanda, la descrizione e le risposte
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Question Title */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Domanda del Sondaggio *
                </label>
                <textarea
                  required
                  rows={2}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Istruzioni o Descrizione (opzionale)
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Choice options editor */}
              {editingPoll.type === 'choice' && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-300">Opzioni di Risposta</label>
                  {editOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-800 text-xs font-bold flex items-center justify-center text-slate-300 shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...editOptions];
                          updated[idx] = e.target.value;
                          setEditOptions(updated);
                        }}
                        className="flex-1 p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white"
                      />
                      {editOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setEditOptions(editOptions.filter((_, i) => i !== idx))}
                          className="p-2 text-rose-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {editOptions.length < 8 && (
                    <button
                      type="button"
                      onClick={() => setEditOptions([...editOptions, `Nuova Opzione ${editOptions.length + 1}`])}
                      className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-bold mt-1 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Aggiungi un&apos;altra opzione
                    </button>
                  )}
                </div>
              )}

              {/* Rating scale labels editor */}
              {editingPoll.type === 'rating' && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Testo per Voto 1</label>
                    <input
                      type="text"
                      value={editMinLabel}
                      onChange={(e) => setEditMinLabel(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Testo per Voto 10</label>
                    <input
                      type="text"
                      value={editMaxLabel}
                      onChange={(e) => setEditMaxLabel(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* Yes/No labels editor */}
              {editingPoll.type === 'yesno' && (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Pulsante 1</label>
                    <input
                      type="text"
                      value={editYesLabel}
                      onChange={(e) => setEditYesLabel(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Pulsante 2</label>
                    <input
                      type="text"
                      value={editNoLabel}
                      onChange={(e) => setEditNoLabel(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Pulsante 3</label>
                    <input
                      type="text"
                      value={editMaybeLabel}
                      onChange={(e) => setEditMaybeLabel(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPoll(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salva Modifiche</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Poll Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full relative shadow-2xl my-8 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white mb-1">Crea Nuovo Sondaggio</h3>
            <p className="text-xs text-slate-400 mb-6">
              Scegli la tipologia di interazione e scrivi il testo
            </p>

            <form onSubmit={handleCreatePoll} className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Tipologia</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'choice', label: 'Scelta Multipla', icon: '📊' },
                    { id: 'rating', label: '1-10 Accordo', icon: '⭐' },
                    { id: 'text', label: 'Testo Libero', icon: '💬' },
                    { id: 'qna', label: 'Q&A Platea', icon: '❓' },
                    { id: 'emoji', label: 'Emoji Pulse', icon: '🔥' },
                    { id: 'yesno', label: 'Sì / No', icon: '👍' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setNewType(item.id as PollType)}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        newType === item.id
                          ? 'bg-blue-600/20 border-blue-500 text-white ring-2 ring-blue-500/30'
                          : 'bg-slate-850 hover:bg-slate-800 border-slate-700/80 text-slate-400'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Domanda del Sondaggio *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Es: Qual è il principale ostacolo in questo processo?"
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Descrizione o Istruzioni (opzionale)
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Es: Vota pensando al tuo team di lavoro"
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Type specific inputs */}
              {newType === 'choice' && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-300">Opzioni di Risposta</label>
                  {newOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-800 text-xs font-bold flex items-center justify-center text-slate-400 shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...newOptions];
                          updated[idx] = e.target.value;
                          setNewOptions(updated);
                        }}
                        className="flex-1 p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                      />
                      {newOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setNewOptions(newOptions.filter((_, i) => i !== idx))}
                          className="p-2 text-rose-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {newOptions.length < 8 && (
                    <button
                      type="button"
                      onClick={() => setNewOptions([...newOptions, `Opzione ${newOptions.length + 1}`])}
                      className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold mt-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Aggiungi altra opzione
                    </button>
                  )}
                </div>
              )}

              {newType === 'rating' && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Etichetta Voto 1</label>
                    <input
                      type="text"
                      value={newMinLabel}
                      onChange={(e) => setNewMinLabel(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Etichetta Voto 10</label>
                    <input
                      type="text"
                      value={newMaxLabel}
                      onChange={(e) => setNewMaxLabel(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  Crea Sondaggio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
