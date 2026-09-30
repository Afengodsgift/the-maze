import * as THREE from 'three';
import type { RapierRigidBody } from '@react-three/rapier';
/** Shared read-only-ish snapshot of the player for camera, interaction, AI. */
export const playerState = { pos: new THREE.Vector3(0, 1, 16), speed: 0, body: null as RapierRigidBody | null };
