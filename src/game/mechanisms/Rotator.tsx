'use client';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useValue } from '../world/worldState';
import { platforms } from './platforms';

const UP = new THREE.Vector3(0, 1, 0);

/** A kinematic rotating section. Its angle is the stop (index) stored under `id`. */
export function Rotator(p: { id: string; center: [number, number, number]; stops: number[]; speed?: number; children: React.ReactNode }) {
  const rb = useRef<RapierRigidBody>(null);
  const stop = useValue(p.id, 0);
  const angle = useRef(p.stops[stop] ?? 0);
  const q = useRef(new THREE.Quaternion());

  useEffect(() => () => { if (rb.current) platforms.delete(rb.current.handle); }, []);
  useFrame((_, dtRaw) => {
    const body = rb.current; if (!body) return;
    const dt = Math.min(dtRaw, 0.05), target = p.stops[stop] ?? 0, max = (p.speed ?? 0.6) * dt;
    const d = Math.max(-max, Math.min(max, target - angle.current));
    angle.current += d;
    q.current.setFromAxisAngle(UP, angle.current);
    body.setNextKinematicRotation(q.current);
    platforms.set(body.handle, { cx: p.center[0], cz: p.center[2], dAngle: d });
  }, -2);

  return <RigidBody ref={rb} type="kinematicPosition" colliders={false} position={p.center}>{p.children}</RigidBody>;
}
