'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import * as THREE from 'three';
import { input } from '../input/input';
import { playerState } from '../player/playerState';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function FollowCamera() {
  const { world, rapier } = useRapier();
  const dist = useRef(4.6);
  const focus = useRef(new THREE.Vector3(0, 2.5, 16));
  const dir = useRef(new THREE.Vector3());

  useFrame(({ camera }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    input.yaw -= input.lookDX;
    input.pitch = clamp(input.pitch + input.lookDY, -0.35, 1.15);
    input.lookDX = 0; input.lookDY = 0;

    const target = new THREE.Vector3(playerState.pos.x, playerState.pos.y + 0.7, playerState.pos.z);
    focus.current.lerp(target, Math.min(1, dt * 14));

    const cp = Math.cos(input.pitch);
    dir.current.set(Math.sin(input.yaw) * cp, Math.sin(input.pitch), Math.cos(input.yaw) * cp);

    // sit slightly wider when moving fast in the open, closer when walls push in
    const want = 4.4 + Math.min(playerState.speed, 6) * 0.12;
    const d = dir.current;
    const ray = new rapier.Ray({ x: focus.current.x, y: focus.current.y, z: focus.current.z }, { x: d.x, y: d.y, z: d.z });
    const hit = world.castRay(ray, want + 0.3, true, rapier.QueryFilterFlags.EXCLUDE_SENSORS, undefined, undefined, playerState.body ?? undefined);
    const allowed = hit ? Math.max(0.8, hit.timeOfImpact - 0.35) : want;
    const k = allowed < dist.current ? 22 : 2.5; // snap in fast, ease out slowly
    dist.current += (Math.min(allowed, want) - dist.current) * Math.min(1, dt * k);

    camera.position.copy(focus.current).addScaledVector(d, dist.current);
    camera.lookAt(focus.current);
  });
  return null;
}
