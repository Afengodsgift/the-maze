'use client';
import { useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createStore } from '../../utils/store';
import { input } from '../input/input';
import { playerState } from '../player/playerState';

export interface InteractableDef {
  id: string; pos: THREE.Vector3; verb: string; label: string;
  onUse: () => void; enabled: () => boolean;
}
const registry = new Map<string, InteractableDef>();
export const promptStore = createStore({ verb: '', label: '' });

export function Interactable(p: { id: string; position: [number, number, number]; verb: string; label: string; onUse: () => void; enabled?: () => boolean }) {
  useEffect(() => {
    registry.set(p.id, { id: p.id, pos: new THREE.Vector3(...p.position), verb: p.verb, label: p.label, onUse: p.onUse, enabled: p.enabled ?? (() => true) });
    return () => { registry.delete(p.id); };
  });
  return null;
}

const tmp = new THREE.Vector3();
export function InteractionSystem() {
  useFrame(({ camera }) => {
    let best: InteractableDef | null = null, bestScore = -Infinity;
    const p = playerState.pos;
    camera.getWorldDirection(tmp);
    const cl = Math.hypot(tmp.x, tmp.z) || 1;
    registry.forEach((d) => {
      if (!d.enabled()) return;
      const dx = d.pos.x - p.x, dz = d.pos.z - p.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 2.6 || Math.abs(d.pos.y - p.y) > 2) return;
      const dot = (tmp.x * dx + tmp.z * dz) / (cl * (dist || 1));
      if (dot < 0.3) return;
      const score = dot - dist * 0.25;
      if (score > bestScore) { bestScore = score; best = d; }
    });
    const b = best as InteractableDef | null;
    const cur = promptStore.get();
    const verb = b?.verb ?? '', label = b?.label ?? '';
    if (cur.verb !== verb || cur.label !== label) promptStore.set({ verb, label });
    if (input.interact) { input.interact = false; b?.onUse(); }
  });
  return null;
}
