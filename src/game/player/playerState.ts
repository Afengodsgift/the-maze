import * as THREE from 'three';
import type { RapierRigidBody } from '@react-three/rapier';
/** Shared snapshot of the player for camera, interaction, traps. `pos` is the capsule center (feet = y - 0.9). */
export const playerState = {
  pos: new THREE.Vector3(0, 1.2, 16), speed: 0, grounded: true,
  body: null as RapierRigidBody | null,
  teleport: null as THREE.Vector3 | null,
};
export function teleportPlayer(x: number, y: number, z: number) { playerState.teleport = new THREE.Vector3(x, y, z); }
