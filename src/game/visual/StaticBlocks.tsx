'use client';
import { useMemo } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { palette } from './palette';

export interface BlockDef { pos: [number, number, number]; size: [number, number, number]; color?: string; rotY?: number; rotZ?: number }

/** Many static blocks -> ONE draw call (merged geometry, vertex colors) with matching colliders. */
export function StaticBlocks({ blocks }: { blocks: BlockDef[] }) {
  const geometry = useMemo(() => {
    const parts = blocks.map((b, i) => {
      const g = new THREE.BoxGeometry(...b.size);
      const m = new THREE.Matrix4().compose(new THREE.Vector3(...b.pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, b.rotY ?? 0, b.rotZ ?? 0)), new THREE.Vector3(1, 1, 1));
      g.applyMatrix4(m);
      const c = new THREE.Color(b.color ?? palette.stone);
      c.offsetHSL(0, 0, ((i * 37) % 11) / 11 * 0.06 - 0.03); // subtle per-block variation, no textures
      const n = g.attributes.position.count, arr = new Float32Array(n * 3);
      for (let k = 0; k < n; k++) { arr[k * 3] = c.r; arr[k * 3 + 1] = c.g; arr[k * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
      return g;
    });
    return parts.length ? mergeGeometries(parts, false) : null;
  }, [blocks]);
  return (
    <>
      {geometry && <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial vertexColors flatShading roughness={1} /></mesh>}
      <RigidBody type="fixed" colliders={false}>
        {blocks.map((b, i) => <CuboidCollider key={i} args={[b.size[0] / 2, b.size[1] / 2, b.size[2] / 2]} position={b.pos} rotation={[0, b.rotY ?? 0, b.rotZ ?? 0]} />)}
      </RigidBody>
    </>
  );
}
