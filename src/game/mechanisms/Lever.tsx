'use client';
import { Interactable } from '../interaction/interaction';
import { getValue, setValue, useValue } from '../world/worldState';
import { palette } from '../visual/palette';

/** Cycles state `id` through `stops` positions (2 = boolean-like on/off, 3+ = multi-position). */
export function Lever(p: { id: string; position: [number, number, number]; stops?: number; asBool?: boolean; label?: string }) {
  const n = p.stops ?? 2;
  const v = useValue(p.id, p.asBool ? false : 0);
  const idx = typeof v === 'boolean' ? (v ? 1 : 0) : v;
  return (
    <group position={p.position}>
      <mesh castShadow><boxGeometry args={[0.5, 0.25, 0.5]} /><meshStandardMaterial color={palette.stoneDark} flatShading roughness={1} /></mesh>
      <group position={[0, 0.12, 0]} rotation={[0, 0, (idx / Math.max(1, n - 1) - 0.5) * 1.6]}>
        <mesh castShadow position={[0, 0.4, 0]}><boxGeometry args={[0.08, 0.8, 0.08]} /><meshStandardMaterial color="#4b3a2a" roughness={1} /></mesh>
        <mesh position={[0, 0.82, 0]}><sphereGeometry args={[0.1, 10, 10]} /><meshStandardMaterial color={palette.accent} emissive={palette.accent} emissiveIntensity={0.35} /></mesh>
      </group>
      <Interactable id={`lever:${p.id}`} position={[p.position[0], p.position[1] + 0.6, p.position[2]]} verb="Pull" label={p.label ?? 'Lever'}
        onUse={() => {
          const cur = getValue<number | boolean>(p.id, p.asBool ? false : 0);
          const i = typeof cur === 'boolean' ? (cur ? 1 : 0) : cur;
          const next = (i + 1) % n;
          setValue(p.id, p.asBool ? next === 1 : next);
        }} />
    </group>
  );
}
