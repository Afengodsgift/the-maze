'use client';
import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { bindInput } from './input/input';
import { Player } from './player/Player';
import { FollowCamera } from './camera/FollowCamera';
import { InteractionSystem } from './interaction/interaction';
import { Hud } from './ui/Hud';
import { TouchControls } from './ui/TouchControls';
import { OuterGrounds } from '../scenes/OuterGrounds';

export default function Game() {
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => bindInput(wrap.current!), []);
  return (
    <div ref={wrap} style={{ position: 'fixed', inset: 0, touchAction: 'none' }}>
      <Canvas shadows dpr={[1, 1.5]} camera={{ fov: 62, near: 0.1, far: 220 }}>
        <color attach="background" args={['#1c2a3a']} />
        <fogExp2 attach="fog" args={['#1c2a3a', 0.012]} />
        <Suspense fallback={null}>
          <Physics gravity={[0, -18, 0]}>
            <OuterGrounds />
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
