'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { input } from '../input/input';
import { playerState } from './playerState';

const JACKET = '#5d6647', PANTS = '#262b31', SKIN = '#c79f84', GEAR = '#3b3a34';
const M = (c: string, r = 0.9) => <meshStandardMaterial color={c} roughness={r} />;

/** Jointed placeholder humanoid, animated procedurally (walk/sprint cycle, crouch, idle, airborne). */
export function Humanoid() {
  const root = useRef<THREE.Group>(null), hips = useRef<THREE.Group>(null), torso = useRef<THREE.Group>(null), head = useRef<THREE.Group>(null);
  const lT = useRef<THREE.Group>(null), rT = useRef<THREE.Group>(null), lS = useRef<THREE.Group>(null), rS = useRef<THREE.Group>(null);
  const lA = useRef<THREE.Group>(null), rA = useRef<THREE.Group>(null), lE = useRef<THREE.Group>(null), rE = useRef<THREE.Group>(null);
  const phase = useRef(0), crouchT = useRef(0), airT = useRef(0), t = useRef(0);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    t.current += dt;
    const sp = playerState.speed;
    crouchT.current += ((input.crouch ? 1 : 0) - crouchT.current) * Math.min(1, dt * 9);
    airT.current += ((playerState.grounded ? 0 : 1) - airT.current) * Math.min(1, dt * 12);
    const c = crouchT.current, air = airT.current;
    const moving = Math.min(1, sp / 1.2);
    phase.current += dt * (1.5 + sp * 1.7) * (sp > 0.2 ? 1 : 0);
    const amp = Math.min(1, sp / 3.6) * (1 - c * 0.45) * 0.95;
    const sw = Math.sin(phase.current) * amp;
    const kneeL = Math.max(0, Math.cos(phase.current)) * amp * 1.1;
    const kneeR = Math.max(0, -Math.cos(phase.current)) * amp * 1.1;
    const sprint = Math.max(0, Math.min(1, (sp - 3.8) / 2.2));

    if (root.current) root.current.position.y = -0.29 * c + Math.abs(Math.sin(phase.current)) * 0.04 * moving * (1 - c) * (1 - air);
    if (torso.current) {
      torso.current.rotation.x = sprint * 0.35 + c * 0.45 + air * 0.1;
      torso.current.rotation.y = Math.sin(phase.current) * 0.12 * moving;
      torso.current.scale.y = 1 + Math.sin(t.current * 2) * 0.012 * (1 - moving);
    }
    if (head.current) head.current.rotation.x = -(sprint * 0.3 + c * 0.35);
    const tuck = air;
    const set = (g: THREE.Group | null, x: number) => { if (g) g.rotation.x = x; };
    set(lT.current, sw * (1 - tuck) + c * 1.0 + tuck * 0.7);
    set(rT.current, -sw * (1 - tuck) + c * 1.0 + tuck * 0.4);
    set(lS.current, -(kneeL * (1 - tuck)) - c * 1.6 - tuck * 0.9);
    set(rS.current, -(kneeR * (1 - tuck)) - c * 1.6 - tuck * 0.6);
    set(lA.current, -sw * 0.9 * (1 - tuck) + c * 0.5 - tuck * 1.2);
    set(rA.current, sw * 0.9 * (1 - tuck) + c * 0.5 - tuck * 1.2);
    set(lE.current, -0.25 - sprint * 0.9 - c * 0.4);
    set(rE.current, -0.25 - sprint * 0.9 - c * 0.4);
  });

  const leg = (side: number, thigh: React.RefObject<THREE.Group | null>, shin: React.RefObject<THREE.Group | null>) => (
    <group ref={thigh} position={[side * 0.11, 0, 0]}>
      <mesh castShadow position={[0, -0.225, 0]}><boxGeometry args={[0.17, 0.45, 0.2]} />{M(PANTS)}</mesh>
      <group ref={shin} position={[0, -0.45, 0]}>
        <mesh castShadow position={[0, -0.225, 0]}><boxGeometry args={[0.15, 0.45, 0.17]} />{M(PANTS)}</mesh>
        <mesh castShadow position={[0, -0.47, -0.04]}><boxGeometry args={[0.16, 0.08, 0.27]} />{M(GEAR, 0.7)}</mesh>
      </group>
    </group>
  );
  const arm = (side: number, upper: React.RefObject<THREE.Group | null>, elbow: React.RefObject<THREE.Group | null>) => (
    <group ref={upper} position={[side * 0.3, 0.52, 0]}>
      <mesh castShadow position={[0, -0.15, 0]}><boxGeometry args={[0.12, 0.3, 0.14]} />{M(JACKET)}</mesh>
      <group ref={elbow} position={[0, -0.3, 0]}>
        <mesh castShadow position={[0, -0.14, 0]}><boxGeometry args={[0.1, 0.28, 0.12]} />{M(JACKET)}</mesh>
        <mesh position={[0, -0.3, 0]}><boxGeometry args={[0.09, 0.09, 0.1]} />{M(SKIN, 0.8)}</mesh>
      </group>
    </group>
  );

  return (
    <group ref={root}>
      <group ref={hips} position={[0, 0.9, 0]}>
        {leg(-1, lT, lS)}
        {leg(1, rT, rS)}
        <group ref={torso}>
          <mesh castShadow position={[0, 0.3, 0]}><boxGeometry args={[0.46, 0.6, 0.26]} />{M(JACKET)}</mesh>
          <mesh castShadow position={[0, 0.32, 0.2]}><boxGeometry args={[0.34, 0.42, 0.14]} />{M(GEAR)}</mesh>
          {arm(-1, lA, lE)}
          {arm(1, rA, rE)}
          <group ref={head} position={[0, 0.62, 0]}>
            <mesh castShadow position={[0, 0.14, 0]}><sphereGeometry args={[0.14, 14, 12]} />{M(SKIN, 0.7)}</mesh>
            <mesh position={[0, 0.2, 0]}><sphereGeometry args={[0.15, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />{M('#2d3238')}</mesh>
            <mesh position={[0, 0.15, -0.13]}><boxGeometry args={[0.2, 0.05, 0.04]} /><meshStandardMaterial color="#e8c35a" emissive="#e8c35a" emissiveIntensity={0.4} /></mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
