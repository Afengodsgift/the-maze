'use client';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, useRapier, type RapierCollider, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { input, pollMovement } from '../input/input';
import { platforms } from '../mechanisms/platforms';
import { playerState } from './playerState';
import { Humanoid } from './Humanoid';

const SPEED = { crouch: 1.4, walk: 2.2, jog: 3.8, sprint: 6.0 };
const GRAVITY = 18;
type World = ReturnType<typeof useRapier>['world'];
type KCC = ReturnType<World['createCharacterController']>;

/** Kinematic character controller: steps up stairs, slides on slopes, rides moving platforms. */
export function Player() {
  const rb = useRef<RapierRigidBody>(null), col = useRef<RapierCollider>(null), model = useRef<THREE.Group>(null);
  const { world } = useRapier();
  const ctrl = useRef<KCC | null>(null);
  const pos = useRef(playerState.pos.clone());
  const vel = useRef(new THREE.Vector3());
  const grounded = useRef(false), standingOn = useRef<number | null>(null), facing = useRef(0);

  useEffect(() => {
    const c = world.createCharacterController(0.02);
    c.enableAutostep(0.45, 0.15, false);
    c.enableSnapToGround(0.35);
    c.setMaxSlopeClimbAngle((55 * Math.PI) / 180);
    c.setMinSlopeSlideAngle((60 * Math.PI) / 180);
    c.setSlideEnabled(true);
    ctrl.current = c;
    return () => { world.removeCharacterController(c); ctrl.current = null; };
  }, [world]);

  useFrame((_, dtRaw) => {
    const body = rb.current, collider = col.current, c = ctrl.current;
    if (!body || !collider || !c) return;
    playerState.body = body;
    const dt = Math.min(dtRaw, 0.05);
    if (playerState.teleport) { pos.current.copy(playerState.teleport); vel.current.set(0, 0, 0); playerState.teleport = null; body.setNextKinematicTranslation(pos.current); return; }
    pollMovement();

    const mag = Math.min(1, Math.hypot(input.moveX, input.moveY)), yaw = input.yaw;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    let dx = fx * input.moveY + rx * input.moveX, dz = fz * input.moveY + rz * input.moveX;
    const len = Math.hypot(dx, dz);
    if (len > 0) { dx /= len; dz /= len; }
    let mode: keyof typeof SPEED = mag < 0.5 ? 'walk' : 'jog';
    if (input.sprint && mag > 0.6) mode = 'sprint';
    if (input.crouch) mode = 'crouch';
    const target = mag > 0.05 ? SPEED[mode] * (mode === 'walk' ? mag * 2 : 1) : 0;

    const v = vel.current, accel = target > 0 ? 14 : 20;
    const approach = (cur: number, tgt: number) => cur + Math.max(-accel * dt, Math.min(accel * dt, tgt - cur));
    v.x = approach(v.x, dx * target); v.z = approach(v.z, dz * target);
    if (grounded.current && v.y <= 0) v.y = -1;
    else v.y = Math.max(-25, v.y - GRAVITY * dt);
    if (input.jump) { if (grounded.current && !input.crouch) v.y = 5.6; input.jump = false; }

    // carry the player with whatever rotating section they stand on
    let px = 0, pz = 0;
    const plat = standingOn.current !== null ? platforms.get(standingOn.current) : undefined;
    if (plat && plat.dAngle !== 0) {
      const rxp = pos.current.x - plat.cx, rzp = pos.current.z - plat.cz, cs = Math.cos(plat.dAngle), sn = Math.sin(plat.dAngle);
      px = rxp * cs + rzp * sn - rxp; pz = -rxp * sn + rzp * cs - rzp;
    }

    const desired = { x: v.x * dt + px, y: v.y * dt, z: v.z * dt + pz };
    c.computeColliderMovement(collider, desired);
    const m = c.computedMovement();
    pos.current.x += m.x; pos.current.y += m.y; pos.current.z += m.z;
    body.setNextKinematicTranslation(pos.current);

    grounded.current = c.computedGrounded();
    if (grounded.current && v.y < 0) v.y = 0;
    if (v.y > 0 && m.y < desired.y - 1e-3) v.y = 0;
    standingOn.current = null;
    if (grounded.current) {
      for (let i = 0; i < c.numComputedCollisions(); i++) {
        const h = c.computedCollision(i)?.collider?.parent()?.handle;
        if (h !== undefined && platforms.has(h)) { standingOn.current = h; break; }
      }
    }

    playerState.pos.copy(pos.current); playerState.grounded = grounded.current;
    const speed = Math.hypot(v.x, v.z); playerState.speed = speed;
    if (speed > 0.3) {
      let diff = Math.atan2(-v.x, -v.z) - facing.current;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      facing.current += diff * Math.min(1, dt * 10);
    }
    if (model.current) model.current.rotation.y = facing.current;
  });

  return (
    <RigidBody ref={rb} type="kinematicPosition" colliders={false} position={[0, 1.2, 16]}>
      <CapsuleCollider ref={col} args={[0.5, 0.4]} />
      <group ref={model} position={[0, -0.9, 0]}><Humanoid /></group>
    </RigidBody>
  );
}
