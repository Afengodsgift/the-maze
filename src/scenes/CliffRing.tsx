'use client';
import { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';
import { palette } from '../game/visual/palette';

const base = '/models/cliffs/';
const URLS = ['clifftile-straight-1', 'clifftile-straight-2', 'clifftile-straight-3', 'rocktile-straight-1', 'rocktile-straight-2'].map((n) => `${base}${n}.dae`);
const rand = (i: number) => { const x = Math.sin(i * 127.1) * 43758.5453; return x - Math.floor(x); };

/**
 * Cliff walls enclosing the site (cliff face looks inward), plus boulders at their foot.
 * Tiles are Y-up despite the file's Z_UP tag, so the loader's rotation is reset.
 * Straight tile: 20 m wide along local +x, cliff face toward local +z.
 */
export function CliffRing({ half = 54 }: { half?: number }) {
  const loaded = useLoader(ColladaLoader, URLS);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c4ae86', flatShading: true, roughness: 1 }), []);
  const tiles = useMemo(() => loaded.map((c) => {
    const s = c.scene; s.rotation.set(0, 0, 0);
    s.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.material = material; m.castShadow = true; m.receiveShadow = true; } });
    return s;
  }), [loaded, material]);

  const placed = useMemo(() => {
    const out: { obj: THREE.Object3D; pos: [number, number, number]; rotY: number }[] = [];
    const sides: { rot: number; start: (i: number) => [number, number, number] }[] = [
      { rot: 0, start: (i) => [-half - 20 + 20 * i, 0, -half] },
      { rot: -Math.PI / 2, start: (i) => [half, 0, -half - 20 + 20 * i] },
      { rot: Math.PI, start: (i) => [half + 20 - 20 * i, 0, half] },
      { rot: Math.PI / 2, start: (i) => [-half, 0, half + 20 - 20 * i] },
    ];
    let k = 0;
    sides.forEach((s) => { for (let i = 0; i < 7; i++) { out.push({ obj: tiles[k % 3].clone(), pos: s.start(i), rotY: s.rot }); k++; } });
    for (let i = 0; i < 10; i++) { // boulders just inside the cliffs
      const a = rand(i + 1) * Math.PI * 2, r = half - 6 - rand(i + 20) * 4;
      out.push({ obj: tiles[3 + (i % 2)].clone(), pos: [Math.cos(a) * r, 0, Math.sin(a) * r], rotY: rand(i + 40) * Math.PI * 2 });
    }
    return out;
  }, [tiles, half]);

  const w = half - 1, hh = 12;
  return (
    <>
      {placed.map((p, i) => <primitive key={i} object={p.obj} position={p.pos} rotation={[0, p.rotY, 0]} />)}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[w, hh, 1]} position={[0, hh, -w - 1]} />
        <CuboidCollider args={[w, hh, 1]} position={[0, hh, w + 1]} />
        <CuboidCollider args={[1, hh, w]} position={[-w - 1, hh, 0]} />
        <CuboidCollider args={[1, hh, w]} position={[w + 1, hh, 0]} />
      </RigidBody>
    </>
  );
}
