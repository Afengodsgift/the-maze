import { useSyncExternalStore } from 'react';

export interface Store<T> {
  get(): T;
  set(patch: Partial<T> | ((s: T) => Partial<T>)): void;
  subscribe(l: () => void): () => void;
}

export function createStore<T extends object>(init: T): Store<T> {
  let s = init;
  const ls = new Set<() => void>();
  return {
    get: () => s,
    set(p) { s = { ...s, ...(typeof p === 'function' ? p(s) : p) }; ls.forEach((l) => l()); },
    subscribe(l) { ls.add(l); return () => { ls.delete(l); }; },
  };
}

/** Selector must return a primitive (or stable reference). */
export function useStore<T extends object, S>(st: Store<T>, sel: (s: T) => S): S {
  return useSyncExternalStore(st.subscribe, () => sel(st.get()), () => sel(st.get()));
}
