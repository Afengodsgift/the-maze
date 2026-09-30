import { createStore } from '../../utils/store';
export const messageStore = createStore<{ lines: string[] }>({ lines: [] });
let timer: ReturnType<typeof setTimeout> | undefined;
export function showMessage(lines: string[], ms = 5000) {
  messageStore.set({ lines });
  clearTimeout(timer);
  timer = setTimeout(() => messageStore.set({ lines: [] }), ms);
}

export const fxStore = createStore({ flash: 0 });
export function flashScreen() { fxStore.set({ flash: 1 }); setTimeout(() => fxStore.set({ flash: 0 }), 90); }
