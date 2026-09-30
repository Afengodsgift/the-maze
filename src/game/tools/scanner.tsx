'use client';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createStore } from '../../utils/store';
import { playerState } from '../player/playerState';

/** The scanner reports information; the player interprets it. */
export const scannerStore = createStore<{ on: boolean; lines: string[] }>({ on: false, lines: [] });
export const toggleScanner = () => scannerStore.set((s) => ({ on: !s.on, lines: [] }));

interface ScannableDef { id: string; pos: THREE.Vector3; range: number; read: () => string[] }
const scannables = new Map<string, ScannableDef>();

export function Scannable(p: { id: string; position: [number, number, number]; range: number; read: () => string[] }) {
  useEffect(() => {
    scannables.set(p.id, { id: p.id, pos: new THREE.Vector3(...p.position), range: p.range, read: p.read });
    return () => { scannables.delete(p.id); };
  });
  return null;
}

// Placeholder for the Hunter's position until the AI exists.
const UNKNOWN_SOURCE = new THREE.Vector3(-55, 0, -80);

export function ScannerSystem() {
  const acc = useRef(0), clock = useRef(0);
  useFrame((_, dtRaw) => {
    if (!scannerStore.get().on) { clock.current = 0; return; }
    const dt = Math.min(dtRaw, 0.1);
    clock.current += dt; acc.current += dt;
    if (acc.current < 0.2) return;
    acc.current = 0;
    const found: { d: number; lines: string[] }[] = [];
    scannables.forEach((s) => { const d = s.pos.distanceTo(playerState.pos); if (d <= s.range) found.push({ d, lines: s.read() }); });
    found.sort((a, b) => a.d - b.d);
    const lines = found.flatMap((f, i) => (i ? ['', ...f.lines] : f.lines));
    // the unknown signal only surfaces briefly
    if (clock.current > 8 && clock.current % 22 < 1.6) {
      const d = UNKNOWN_SOURCE.distanceTo(playerState.pos);
      lines.push('', 'UNKNOWN SIGNAL', `${Math.round(d)}m`);
    }
    if (lines.join('|') !== scannerStore.get().lines.join('|')) scannerStore.set({ lines });
  });
  return null;
}
