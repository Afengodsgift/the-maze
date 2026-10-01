'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { playerState } from '../player/playerState';
import { palette } from './palette';

/** Cheap mobile lighting: one shadowed sun that follows the player + hemisphere fill. No point lights. */
export function Atmosphere() {
  const sun = useRef<THREE.DirectionalLight>(null);
  useFrame(() => {
    const l = sun.current; if (!l) return; const p = playerState.pos;
    l.position.set(p.x + 22, p.y + 20, p.z + 12); l.target.position.set(p.x, p.y, p.z); l.target.updateMatrixWorld();
  });
  return (
    <>
      <color attach="background" args={[palette.sky]} />
      <fogExp2 attach="fog" args={[palette.fog, 0.011]} />
      <hemisphereLight args={['#cfe2ff', '#8a7650', 1.0]} />
      <directionalLight ref={sun} intensity={2.4} color="#ffd9a2" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004}
        shadow-camera-left={-24} shadow-camera-right={24} shadow-camera-top={24} shadow-camera-bottom={-24} shadow-camera-near={1} shadow-camera-far={80} />
      {sun.current && <primitive object={sun.current.target} />}
    </>
  );
}
