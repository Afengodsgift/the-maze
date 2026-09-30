'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, useRapier, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { input, pollMovement } from '../input/input';
import { emitSound, LOUDNESS } from '../ai/sound/soundBus';
import { playerState } from './playerState';
import { Humanoid } from './Humanoid';

const SPEED = { crouch: 1.4, walk: 2.2, jog: 3.8, sprint: 6.0 };

export function Player() {
  const rb = useRef<RapierRigidBody>(null);
  const model = useRef<THREE.Group>(null);
  const { world, rapier } = useRapier();
  const stride = useRef(0);
  const facing = useRef(0);
  const crouching = useRef(false);

  useFrame((_, dtRaw) => {
    const body = rb.current;
    if (!body) return;
    playerState.body = body;
    const dt = Math.min(dtRaw, 0.05);
    pollMovement();

    const mag = Math.min(1, Math.hypot(input.moveX, input.moveY));
    const yaw = input.yaw;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    let dx = fx * input.moveY + rx * input.moveX, dz = fz * input.moveY + rz * input.moveX;
    const len = Math.hypot(dx, dz);
    if (len > 0) { dx /= len; dz /= len; }

    let mode: keyof typeof SPEED = mag < 0.5 ? 'walk' : 'jog';
    if (input.sprint && mag > 0.6) mode = 'sprint';
    if (input.crouch) mode = 'crouch';
    const target = mag > 0.05 ? SPEED[mode] * (mode === 'walk' ? mag * 2 : 1) : 0;

    const v = body.linvel();
    const accel = target > 0 ? 14 : 20; // acceleration / deceleration, no instant arcade stops
    const approach = (cur: number, tgt: number) => cur + Math.max(-accel * dt, Math.min(accel * dt, tgt - cur));
    const vx = approach(v.x, dx * target), vz = approach(v.z, dz * target);

    const t = body.translation();
    const ray = new rapier.Ray({ x: t.x, y: t.y, z: t.z }, { x: 0, y: -1, z: 0 });
    const hit = world.castRay(ray, 1.15, true, undefined, undefined, undefined, body);
    const grounded = !!hit && v.y < 0.5;
    playerState.grounded = grounded;

    let vy = v.y;
    if (input.jump) { if (grounded && !input.crouch) vy = 5.6; input.jump = false; }
    body.setLinvel({ x: vx, y: vy, z: vz }, true);

    playerState.pos.set(t.x, t.y, t.z);
    const speed = Math.hypot(vx, vz);
    playerState.speed = speed;

    if (speed > 0.3) {
      const want = Math.atan2(-vx, -vz);
      let diff = want - facing.current;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      facing.current += diff * Math.min(1, dt * 10);
    }
    if (model.current) model.current.rotation.y = facing.current;
    crouching.current = input.crouch;

    if (grounded && speed > 0.5) {
      stride.current += speed * dt;
      if (stride.current > 2.0) {
        stride.current = 0;
        emitSound('footstep', [t.x, t.y - 0.9, t.z], LOUDNESS[mode === 'crouch' ? 'crouch' : mode]);
      }
    }
  });

  return (
    <RigidBody ref={rb} colliders={false} position={[0, 1.2, 16]} enabledRotations={[false, false, false]} linearDamping={0} ccd>
      <CapsuleCollider args={[0.5, 0.4]} friction={0} />
      <group ref={model} position={[0, -0.9, 0]}><Humanoid /></group>
    </RigidBody>
  );
}
