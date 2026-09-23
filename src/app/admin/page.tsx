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
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sparkles,
  Layers,
  X,
  PlusCircle,
  HelpCircle,
  Radio,
  ExternalLink,
} from 'lucide-react';

export default function AdminPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [sessionTitle, setTitleState] = useState('');
  const [selectedQrPoll, setSelectedQrPoll] = useState<Poll | null>(null);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [origin, setOrigin] = useState('');

  // New poll form state
  const [newType, setNewType] = useState<PollType>('rating');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newOptions, setNewOptions] = useState<string[]>(['Opzione 1', 'Opzione 2', 'Opzione 3']);
  const [newCorrectOption, setNewCorrectOption] = useState<number | null>(null);
  const [newMinLabel, setNewMinLabel] = useState('Per nulla d\'accordo');
  const [newMaxLabel, setNewMaxLabel] = useState('Totalmente d\'accordo');
  const [newEmojis, setNewEmojis] = useState<string[]>(['🚀', '💡', '🔥', '🤔', '☕', '👏']);
  const [newYesLabel, setNewYesLabel] = useState('Sì');
  const [newNoLabel, setNewNoLabel] = useState('No');
  const [newMaybeLabel, setNewMaybeLabel] = useState('Forse');

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

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= polls.length) return;

    const newPolls = [...polls];
    const [moved] = newPolls.splice(index, 1);
    newPolls.splice(targetIndex, 0, moved);

    setPolls(newPolls);
    saveStoredPolls(newPolls);
  };

  const handleDelete = (id: string) => {
    if (confirm('Vuoi davvero eliminare questo sondaggio?')) {
      const filtered = polls.filter((p) => p.id !== id);
      setPolls(filtered);
      saveStoredPolls(filtered);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Vuoi ripristinare i 6 sondaggi di esempio iniziali?')) {
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
    a.download = `slidepulse-${new Date().toISOString().slice(0, 10)}.json`;
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
      const p: RatingPoll = {
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
      created = p;
    } else if (newType === 'text') {
      const p: TextPoll = {
        id: newId,
        code: randomPin,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        type: 'text',
        maxLength: 140,
        allowMultipleSubmissions: true,
        createdAt: Date.now(),
      };
      created = p;
    } else if (newType === 'choice') {
      const cleanOpts = newOptions.map((o) => o.trim()).filter(Boolean);
      if (cleanOpts.length < 2) {
        alert('Inserisci almeno 2 opzioni di risposta');
        return;
      }
      const p: ChoicePoll = {
        id: newId,
        code: randomPin,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        type: 'choice',
        options: cleanOpts,
        correctOptionIndex: newCorrectOption,
        createdAt: Date.now(),
      };
      created = p;
    } else if (newType === 'qna') {
      const p: QnAPoll = {
        id: newId,
        code: randomPin,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        type: 'qna',
        allowUpvotes: true,
        createdAt: Date.now(),
      };
      created = p;
    } else if (newType === 'emoji') {
      const p: EmojiPoll = {
        id: newId,
        code: randomPin,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        type: 'emoji',
        emojis: newEmojis,
        createdAt: Date.now(),
      };
      created = p;
    } else {
      const p: YesNoPoll = {
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
      created = p;
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

    // Reset form
    setNewTitle('');
    setNewDescription('');
    setIsCreateModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/20">
              SP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => handleUpdateTitle(e.target.value)}
                  className="text-lg font-black bg-transparent hover:bg-slate-800/60 focus:bg-slate-800 px-2 py-0.5 rounded-lg border border-transparent focus:border-slate-700 text-white transition-all outline-none"
                  placeholder="Nome Presentazione PowerPoint..."
                />
              </div>
              <span className="text-xs text-slate-400 px-2 block">
                Pannello di Controllo Relatore • Zero Database
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Launch Projector Presentation View */}
            <Link
              href={polls.length > 0 ? `/projector/${polls[0].id}` : '/projector'}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Avvia Vista Proiettore</span>
            </Link>

            {/* New Poll Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-400" />
              <span>Nuovo Sondaggio</span>
            </button>

            {/* JSON Export / Import */}
            <button
              onClick={handleExport}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Esporta sessione in JSON"
            >
              <Download className="w-4 h-4" />
            </button>

            <label
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Importa sessione da JSON"
            >
              <Upload className="w-4 h-4" />
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-6 sm:p-8 flex-1">
        {/* Info banner with Master live URL */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border border-blue-500/30 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Link Generale per l&apos;intera presentazione</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Gli studenti possono aprire questo link o scansionare il QR: quando cambi slide, la domanda si aggiorna in automatico sul loro telefono!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono font-bold bg-slate-900/80 text-blue-300 px-3 py-1.5 rounded-xl border border-slate-800">
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
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              <span>Scaletta Sondaggi ({polls.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Organizza l&apos;ordine dei sondaggi da mostrare durante le slide PowerPoint
            </p>
          </div>

          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Ripristina sondaggi di esempio
          </button>
        </div>

        {/* Polls Cards Grid */}
        <div className="space-y-3.5">
          {polls.map((poll, index) => {
            const studentUrl = origin ? `${origin}/p/${poll.id}` : `/p/${poll.id}`;

            return (
              <div
                key={poll.id}
                className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800/90 shadow-md hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 group"
              >
                {/* Left info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-sm flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                        {poll.type === 'rating' && '1-10 Accordo'}
                        {poll.type === 'text' && 'Testo Libero'}
                        {poll.type === 'choice' && `Scelta Multipla (${poll.options?.length} opz.)`}
                        {poll.type === 'qna' && 'Q&A Platea'}
                        {poll.type === 'emoji' && 'Emoji Pulse'}
                        {poll.type === 'yesno' && 'Sì / No'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60 font-bold">
                        PIN: {poll.code}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                      {poll.title}
                    </h3>

                    {poll.description && (
                      <p className="text-xs text-slate-400 line-clamp-1">{poll.description}</p>
                    )}
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {/* Reorder Buttons */}
                  <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className={`p-1 rounded-lg ${
                        index === 0 ? 'text-slate-600' : 'text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                      title="Sposta su"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === polls.length - 1}
                      className={`p-1 rounded-lg ${
                        index === polls.length - 1 ? 'text-slate-600' : 'text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                      title="Sposta giù"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* QR Code Modal preview */}
                  <button
                    onClick={() => setSelectedQrPoll(poll)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Mostra e scarica QR code per PowerPoint"
                  >
                    <QrCode className="w-4 h-4 text-blue-400" />
                    <span>QR Code</span>
                  </button>

                  {/* Project specific poll */}
                  <Link
                    href={`/projector/${poll.id}`}
                    onClick={() => setActivePollId(poll.id)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-bold border border-blue-500/40 flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Proietta</span>
                  </Link>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(poll.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-colors cursor-pointer"
                    title="Elimina sondaggio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-400">
        SlidePulse • Creato per Enrico Armiento • Pronto al deploy su Vercel e GitHub
      </footer>

      {/* QR Code Inspector Modal */}
      {selectedQrPoll && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedQrPoll(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">{selectedQrPoll.title}</h3>
            <p className="text-xs text-slate-400 mb-6">
              Scarica questo QR code come immagine PNG ad alta risoluzione per incollarlo direttamente nella tua slide PowerPoint!
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

      {/* Create New Poll Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full relative shadow-2xl my-8 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white mb-2">Crea Nuovo Sondaggio Live</h3>
            <p className="text-xs text-slate-400 mb-6">
              Scegli la tipologia di interazione da mostrare agli studenti durante la presentazione
            </p>

            <form onSubmit={handleCreatePoll} className="space-y-5">
              {/* Poll Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Tipologia di Interazione</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'rating', label: '1-10 Accordo', icon: '⭐' },
                    { id: 'text', label: 'Testo Libero', icon: '💬' },
                    { id: 'choice', label: 'Scelta Multipla', icon: '📊' },
                    { id: 'qna', label: 'Q&A con Voti', icon: '❓' },
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

              {/* Title / Question */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Domanda o Titolo del Sondaggio *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Es: Quanto sei d'accordo con questa conclusione?"
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Subtitle / Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Descrizione o Istruzioni (opzionale)
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Es: Vota pensando all'ultimo case study analizzato"
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Rating Type Customization */}
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

              {/* Multiple Choice Customization */}
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
                  {newOptions.length < 6 && (
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

              {/* Submit / Cancel Buttons */}
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
