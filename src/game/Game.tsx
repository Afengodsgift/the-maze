'use client';
import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { bindInput } from './input/input';
import { Player } from './player/Player';
import { FollowCamera } from './camera/FollowCamera';
import { InteractionSystem } from './interaction/interaction';
import { Atmosphere } from './visual/Atmosphere';
import { hydrateWorld } from './world/worldState';
import { Hud } from './ui/Hud';
import { TouchControls } from './ui/TouchControls';
import { Maze01 } from '../scenes/Maze01';

hydrateWorld();

export default function Game() {
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => bindInput(wrap.current!), []);
  return (
    <div ref={wrap} style={{ position: 'fixed', inset: 0, touchAction: 'none' }}>
      <Canvas shadows dpr={[1, 1.5]} camera={{ fov: 62, near: 0.1, far: 200 }}>
        <Atmosphere />
        <Suspense fallback={null}>
          <Physics gravity={[0, 0, 0]}>
            <Maze01 />
            <Player />
            <FollowCamera />
            <InteractionSystem />
          </Physics>
        </Suspense>
      </Canvas>
      <Hud />
      <TouchControls />
    </div>
  );
}
