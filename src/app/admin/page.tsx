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
  AppWindow,
  HelpCircle,
  Copy,
} from 'lucide-react';

export default function AdminPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [sessionTitle, setTitleState] = useState('');
  const [selectedQrPoll, setSelectedQrPoll] = useState<Poll | null>(null);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
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

  const openFloatingWindow = async (pollId: string) => {
    const embedUrl = `${origin || window.location.origin}/embed/${pollId}`;
    if (typeof window !== 'undefined' && 'documentPictureInPicture' in window) {
      try {
        const pip = await (window as any).documentPictureInPicture.requestWindow({
          width: 580,
          height: 700,
        });
        const iframe = pip.document.createElement('iframe');
        iframe.src = embedUrl;
        iframe.style.width = '100vw';
        iframe.style.height = '100vh';
        iframe.style.border = 'none';
        pip.document.body.style.margin = '0';
        pip.document.body.style.padding = '0';
        pip.document.body.style.overflow = 'hidden';
        pip.document.body.appendChild(iframe);
        return;
      } catch (e) {
        console.warn('Document PiP error, falling back to popup', e);
      }
    }
    window.open(
      embedUrl,
      `pip_${pollId}`,
      'width=580,height=700,menubar=no,toolbar=no,location=no,status=no,resizable=yes'
    );
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
                Pannello relatore
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* PowerPoint Zero Add-in Guide Button */}
            <button
              onClick={() => setIsGuideOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-600 font-medium text-xs sm:text-sm border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
              title="Come integrare i sondaggi in PowerPoint senza componenti aggiuntivi"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Guida PowerPoint</span>
            </button>

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
                      {poll.type === 'rating' && 'Scala da 1 a 10'}
                      {poll.type === 'text' && 'Testo libero'}
                      {poll.type === 'choice' && `Scelta multipla · ${poll.options?.length} opzioni`}
                      {poll.type === 'qna' && 'Domande e risposte'}
                      {poll.type === 'emoji' && 'Reazioni'}
                      {poll.type === 'yesno' && 'Sì / No'}
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
        SlidePulse · Pannello relatore
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

            {/* PowerPoint Zero Add-in integration options */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-white">Integrazione PowerPoint (Senza Add-in)</span>
                </div>
                <button
                  onClick={() => setIsGuideOpen(true)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Guida rapida</span>
                </button>
              </div>

              {/* Method 1: Hyperlink on QR code */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                <span className="text-[11px] font-bold text-emerald-400 block mb-1">
                  1. Metodo Consigliato: Clic sul QR durante la presentazione
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                  In PowerPoint seleziona l&apos;immagine del QR code nella slide, premi <kbd className="bg-slate-800 text-white px-1.5 py-0.5 rounded font-mono text-[10px]">Cmd + K</kbd> e incolla questo link del proiettore:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${origin || 'https://interazione-live.vercel.app'}/projector/${selectedQrPoll.id}`}
                    className="flex-1 p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-blue-400 select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${origin || 'https://interazione-live.vercel.app'}/projector/${selectedQrPoll.id}`);
                      alert('Link Proiettore copiato! Incollalo con Cmd+K sul QR code in PowerPoint.');
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copia</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  💡 In presentazione, cliccando sul QR code sullo schermo si apre a tutto schermo il sondaggio live con i voti che arrivano in tempo reale; premendo <kbd className="bg-slate-800 text-slate-300 px-1 py-0.5 rounded font-mono">Cmd + Tab</kbd> torni all&apos;istante alla slide successiva!
                </p>
              </div>

              {/* Method 2: Floating window */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-cyan-400 block">
                    2. Finestra Flottante Always-on-Top
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Galleggia sopra PowerPoint anche a schermo intero
                  </span>
                </div>
                <button
                  onClick={() => openFloatingWindow(selectedQrPoll.id)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <AppWindow className="w-3.5 h-3.5" />
                  <span>Apri Flottante</span>
                </button>
              </div>
            </div>
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
                    { id: 'choice', label: 'Scelta multipla' },
                    { id: 'rating', label: 'Scala da 1 a 10' },
                    { id: 'text', label: 'Testo libero' },
                    { id: 'qna', label: 'Domande e risposte' },
                    { id: 'emoji', label: 'Reazioni' },
                    { id: 'yesno', label: 'Sì / No' },
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

      {/* Comprehensive PowerPoint Zero-Addin Guide Modal */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full relative shadow-2xl my-8 animate-in zoom-in-95 duration-150 text-left">
            <button
              onClick={() => setIsGuideOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Come presentare con PowerPoint</h3>
                <span className="text-xs text-amber-400 font-bold">100% Funzionante senza Componenti Aggiuntivi (Add-in)</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mt-2 mb-6">
              Negli account universitari o aziendali di Office 365, gli amministratori IT spesso <strong>bloccano l&apos;installazione dei componenti aggiuntivi</strong> dallo store di Microsoft. Ecco le <strong>3 migliori soluzioni alternative</strong> usate dai relatori e docenti professionisti:
            </p>

            <div className="space-y-4">
              {/* Solution 1 */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">1</span>
                  <h4 className="text-sm font-bold text-emerald-400">Il Trucco del Clic sul QR (Consigliato, Zero Setup)</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-2">
                  È il metodo più fluido ed elegante durante una presentazione:
                </p>
                <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside ml-1">
                  <li>Incolla l&apos;immagine del <strong>QR Code</strong> sulla tua slide PowerPoint.</li>
                  <li>Fai clic destro sull&apos;immagine in PowerPoint &rarr; seleziona <strong>Collegamento</strong> (o premi <kbd className="bg-slate-800 text-white px-1.5 py-0.5 rounded font-mono text-[11px]">Cmd + K</kbd> su Mac).</li>
                  <li>Incolla l&apos;URL del proiettore di quel sondaggio (es. <code className="text-blue-300">.../projector/poll-1</code>).</li>
                  <li><strong>Durante la presentazione:</strong> mostra la slide, la platea inquadra e vota. Basta <strong>un clic con il mouse sul QR code</strong> e PowerPoint apre all&apos;istante la schermata a tutto schermo con i grafici che si muovono dal vivo!</li>
                  <li>Per andare avanti: premi <kbd className="bg-slate-800 text-white px-1.5 py-0.5 rounded font-mono text-[11px]">Cmd + Tab</kbd> o chiudi la scheda: torni all&apos;istante sulla stessa slide!</li>
                </ol>
              </div>

              {/* Solution 2 */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-black">2</span>
                  <h4 className="text-sm font-bold text-cyan-400">Finestra Flottante Always-on-Top (Sopra PowerPoint)</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-1.5">
                  Cliccando sul pulsante <strong>&quot;Finestra Flottante&quot;</strong> (oppure premendo il tasto <kbd className="bg-slate-800 text-white px-1.5 py-0.5 rounded font-mono text-[11px]">P</kbd> nella vista proiettore), il browser apre un widget compatto con i risultati in diretta che ha una proprietà speciale:
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Rimane <strong>permanentemente visibile sopra a qualsiasi altra finestra</strong>, incluso PowerPoint a tutto schermo. Puoi trascinarlo e posizionarlo sopra la diapositiva come se fosse parte integrante della slide!
                </p>
              </div>

              {/* Solution 3 */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-black">3</span>
                  <h4 className="text-sm font-bold text-white">PowerPoint in Finestra + Swipe Mac (Trackpad)</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-1.5">
                  In PowerPoint su Mac vai in <em>Presentazione &rarr; Imposta presentazione...</em> e seleziona <strong>&quot;Scorsa da un individuo (finestra)&quot;</strong> anziché schermo intero.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  In questo modo PowerPoint non sequestra lo schermo esclusivo del Mac. Puoi passare dalla presentazione ai risultati live con un semplice <strong>swipe a 3 dita sul trackpad</strong> in 0,2 secondi.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsGuideOpen(false)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                Ho Capito, Grazie!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
