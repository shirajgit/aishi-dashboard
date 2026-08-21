// Reactive store backed by the Express + Prisma API (Neon Postgres).
// Same public interface as before (useDashboard / addItem / updateItem / …) so
// the pages are unchanged — only the data source moved from localStorage to HTTP.
import { useSyncExternalStore } from 'react';

const BASE = import.meta.env.VITE_API_URL || '';
const EMPTY = { leads: [], customers: [], subscriptions: [], templates: [], outbox: [], notes: [], actions: [], revenue: [], projects: [] };

let state = EMPTY;
let loaded = false;
let error = null;
const listeners = new Set();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function api(path, options) {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
  return res.status === 204 ? null : res.json();
}

async function loadState() {
  try {
    state = await api('/state');
    error = null;
  } catch (e) {
    error = e.message;
    console.error('Failed to load dashboard state:', e);
  } finally {
    loaded = true;
    emit();
  }
}

// Kick off the initial load once, in the browser.
if (typeof window !== 'undefined') loadState();

let counter = 0;
const uid = (p) => `${p}_${Date.now().toString(36)}${(counter++).toString(36)}`;

function replaceCollection(key, list) {
  state = { ...state, [key]: list };
  emit();
}

// ---- optimistic mutations (roll back on failure) --------------------------

export function addItem(key, item) {
  const optimistic = { id: item.id || uid(key.slice(0, 2)), ...item };
  const prev = state[key];
  replaceCollection(key, [optimistic, ...prev]);

  api(`/${key}`, { method: 'POST', body: JSON.stringify(optimistic) })
    .then((saved) => {
      // Reconcile with the server's canonical row (normalised dates etc).
      replaceCollection(key, [saved, ...state[key].filter((it) => it.id !== optimistic.id)]);
    })
    .catch((e) => {
      console.error(e);
      replaceCollection(key, state[key].filter((it) => it.id !== optimistic.id));
    });

  return optimistic;
}

export function updateItem(key, id, patch) {
  const prev = state[key];
  replaceCollection(key, prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  api(`/${key}/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
    .then((saved) => {
      replaceCollection(key, state[key].map((it) => (it.id === id ? saved : it)));
    })
    .catch((e) => {
      console.error(e);
      replaceCollection(key, prev); // revert
    });
}

export function removeItem(key, id) {
  const prev = state[key];
  replaceCollection(key, prev.filter((it) => it.id !== id));

  api(`/${key}/${id}`, { method: 'DELETE' }).catch((e) => {
    console.error(e);
    replaceCollection(key, prev); // revert
  });
}

export async function resetData() {
  await api('/reset', { method: 'POST' });
  await loadState();
}

export async function clearData() {
  await api('/clear', { method: 'POST' });
  await loadState();
}

/** Re-pull the latest snapshot from the API (e.g. after external changes). */
export async function refresh() {
  await loadState();
}

export function exportData() {
  return JSON.stringify(state, null, 2);
}

// ---- hooks ----------------------------------------------------------------

export function useDashboard() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export function useCollection(key) {
  return useSyncExternalStore(
    subscribe,
    () => (key ? state[key] : state),
    () => (key ? state[key] : state),
  );
}

export function useLoaded() {
  return useSyncExternalStore(subscribe, () => loaded, () => loaded);
}

export function useError() {
  return useSyncExternalStore(subscribe, () => error, () => error);
}
