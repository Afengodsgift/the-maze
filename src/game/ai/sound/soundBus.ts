/** AI reacts to sound EVENTS, never to the player's position directly. */
export type SoundKind = 'footstep' | 'door' | 'machinery' | 'glass' | 'water' | 'tool' | 'drop';
export type Vec3 = [number, number, number];
export interface SoundEvent { kind: SoundKind; position: Vec3; loudness: number; time: number }

export const LOUDNESS = { crouch: 0.15, walk: 0.3, jog: 0.55, sprint: 0.9, door: 0.6, machinery: 0.7, glass: 1 } as const;

const listeners = new Set<(e: SoundEvent) => void>();
export function emitSound(kind: SoundKind, position: Vec3, loudness: number) {
  const e: SoundEvent = { kind, position, loudness, time: performance.now() };
  listeners.forEach((l) => l(e));
}
export function onSound(fn: (e: SoundEvent) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
/** Max distance (m) at which a listener can hear an event. */
export const hearingRadius = (loudness: number) => loudness * 35;
