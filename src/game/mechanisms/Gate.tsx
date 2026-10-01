'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import { useValue } from '../world/worldState';
import { palette } from '../visual/palette';

/** Slides straight down into the floor when `id` is true. */
export function Gate(p: { id: string; position: [number, number, number]; size: [number, number, number] }) {
  const rb = useRef<RapierRigidBody>(null);
  const open = useValue(p.id, false);
  const y = useRef(p.position[1]);
  useFrame((_, dt) => {
    y.current += ((open ? p.position[1] - p.size[1] - 0.1 : p.position[1]) - y.current) * Math.min(1, dt * 2.5);
    rb.current?.setNextKinematicTranslation({ x: p.position[0], y: y.current, z: p.position[2] });
  }, -2);
  return (
    <RigidBody ref={rb} type="kinematicPosition" colliders={false} position={p.position}>
      <CuboidCollider args={[p.size[0] / 2, p.size[1] / 2, p.size[2] / 2]} />
      <mesh castShadow receiveShadow><boxGeometry args={p.size} /><meshStandardMaterial color={palette.stoneDark} roughness={1} flatShading /></mesh>
    </RigidBody>
  );
}
