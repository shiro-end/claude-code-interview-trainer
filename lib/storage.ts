import { SessionData } from './types';

const STORAGE_KEY = 'interview_trainer_sessions';

export function getAllSessions(): SessionData[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getSession(id: string): SessionData | undefined {
  return getAllSessions().find((s) => s.id === id);
}

export function saveSession(session: SessionData): void {
  if (typeof window === 'undefined') return;
  const sessions = getAllSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.unshift(session);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function deleteSession(id: string): void {
  if (typeof window === 'undefined') return;
  const sessions = getAllSessions().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}
