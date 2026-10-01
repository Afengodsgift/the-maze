import { createStore, useStore } from '../../utils/store';

/**
 * Generic maze state: a flat map of mechanism id -> value (number | boolean).
 * Levers, rotators, gates, traps and checkpoints all read/write through here, so one
 * mechanism can drive any other. Persisted to localStorage; independent of what is loaded.
 */
export type Val = number | boolean;
const KEY = 'the-maze:world:v1';

export const worldStore = createStore<{ values: Record<string, Val> }>({ values: {} });

let hydrated = false;
export function hydrateWorld() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  try { worldStore.set({ values: JSON.parse(localStorage.getItem(KEY) || '{}') }); } catch { /* fresh world */ }
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(worldStore.get().values)); } catch { /* ignore */ } }, 400);
}

export function getValue<T extends Val>(id: string, def: T): T { return (worldStore.get().values[id] as T) ?? def; }
export function setValue(id: string, v: Val) { worldStore.set((s) => ({ values: { ...s.values, [id]: v } })); persist(); }
export function useValue<T extends Val>(id: string, def: T): T { return useStore(worldStore, (s) => (s.values[id] as T) ?? def); }
export function resetWorld() { worldStore.set({ values: {} }); persist(); }
