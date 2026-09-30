'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getDerived } from '../../world/worldState';
import { playerState } from '../../player/playerState';
import { flashScreen, showMessage } from '../../ui/messages';

export const FLOOD = { x0: -17, x1: -7, z0: -19, z1: -15 };
export const CABLE: [number, number, number] = [-12, 0, -17];

function jolt() {
  flashScreen();
  showMessage(['Current in the water.', 'Get out.'], 3500);
  const b = playerState.body, p = playerState.pos;
  if (!b) return;
  // throw the player back toward the doorway so the first shock is a warning, not a death
  const dx = -12 - p.x, dz = -14.2 - p.z, l = Math.hypot(dx, dz) || 1;
  b.setLinvel({ x: (dx / l) * 8, y: 3, z: (dz / l) * 8 }, true);
}

function die() {
  flashScreen();
  const b = playerState.body;
  b?.setTranslation({ x: -12, y: 1.2, z: -11.5 }, true);
  b?.setLinvel({ x: 0, y: 0, z: 0 }, true);
  showMessage(['You stayed in live water.', 'The cable was sparking, and the scanner reads current.'], 6000);
}

export function FloodHazard() {
  const spark = useRef<THREE.PointLight>(null), tip = useRef<THREE.Mesh>(null);
  const shock = useRef(0), jolted = useRef(false), dry = useRef(0);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05), p = playerState.pos;
    const inside = p.x > FLOOD.x0 + 0.2 && p.x < FLOOD.x1 - 0.2 && p.z > FLOOD.z0 + 0.2 && p.z < FLOOD.z1 && p.y < 1.7;
    playerState.inWater = inside;
    const live = getDerived().corridorElectrified;
    if (spark.current) spark.current.intensity = live ? (Math.random() < 0.25 ? 6 + Math.random() * 10 : 1.2) : 0;
    if (tip.current) tip.current.visible = live && Math.random() < 0.6;

    if (inside && live) {
      dry.current = 0; shock.current += dt;
      if (!jolted.current && shock.current > 0.25) { jolted.current = true; jolt(); }
      if (shock.current > 1.6) { die(); shock.current = 0; jolted.current = false; }
    } else {
      shock.current = Math.max(0, shock.current - dt * 0.8);
      if (!inside) { dry.current += dt; if (dry.current > 1) jolted.current = false; }
    }
  });

  return (
    <group>
      <mesh position={[-12, 2.1, -17]}><cylinderGeometry args={[0.035, 0.035, 2.2, 6]} /><meshStandardMaterial color="#141414" roughness={0.6} /></mesh>
      <mesh ref={tip} position={[-12, 0.95, -17]}><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color="#bfe4ff" emissive="#8fd0ff" emissiveIntensity={4} /></mesh>
      <pointLight ref={spark} position={[-12, 0.9, -17]} color="#8fd0ff" distance={7} decay={1.6} intensity={0} />
    </group>
  );
}
