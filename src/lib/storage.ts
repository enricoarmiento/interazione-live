'use client';

import { Poll, PresentationSession } from '@/types/poll';
import { DEFAULT_POLLS } from './defaultPolls';

const STORAGE_KEY_POLLS = 'slidepulse_polls_v1';
const STORAGE_KEY_ACTIVE = 'slidepulse_active_poll_v1';
const STORAGE_KEY_TITLE = 'slidepulse_session_title_v1';

export function getStoredPolls(): Poll[] {
  if (typeof window === 'undefined') return DEFAULT_POLLS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_POLLS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_POLLS, JSON.stringify(DEFAULT_POLLS));
      return DEFAULT_POLLS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_POLLS;
  } catch (e) {
    console.error('Error loading stored polls', e);
    return DEFAULT_POLLS;
  }
}

export function saveStoredPolls(polls: Poll[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_POLLS, JSON.stringify(polls));
  } catch (e) {
    console.error('Error saving polls to localStorage', e);
  }
}

export function getActivePollId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY_ACTIVE) || (DEFAULT_POLLS[0]?.id ?? null);
}

export function setActivePollId(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_ACTIVE, id);
}

export function getSessionTitle(): string {
  if (typeof window === 'undefined') return 'Presentazione Interattiva';
  return localStorage.getItem(STORAGE_KEY_TITLE) || 'Presentazione Interattiva';
}

export function setSessionTitle(title: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_TITLE, title);
}

export function exportPollsToJson(): string {
  const polls = getStoredPolls();
  const session: PresentationSession = {
    id: `session-${Date.now()}`,
    title: getSessionTitle(),
    currentPollId: getActivePollId(),
    polls,
    updatedAt: Date.now(),
  };
  return JSON.stringify(session, null, 2);
}

export function importPollsFromJson(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.polls && Array.isArray(parsed.polls)) {
      saveStoredPolls(parsed.polls);
      if (parsed.title) setSessionTitle(parsed.title);
      if (parsed.currentPollId) setActivePollId(parsed.currentPollId);
      return true;
    }
    if (Array.isArray(parsed)) {
      saveStoredPolls(parsed);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to import JSON', e);
    return false;
  }
}
