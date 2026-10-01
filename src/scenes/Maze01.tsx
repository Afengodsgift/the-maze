'use client';
import { CuboidCollider } from '@react-three/rapier';
import { Gate } from '../game/mechanisms/Gate';
import { Lever } from '../game/mechanisms/Lever';
import { Rotator } from '../game/mechanisms/Rotator';
import { palette } from '../game/visual/palette';
import { StaticBlocks, type BlockDef } from '../game/visual/StaticBlocks';

/**
 * PROVING GROUND for the new controller + mechanisms (steps 1-4).
 * Maze 01 itself (step 5) replaces this using the same pieces.
 */
const steps: BlockDef[] = Array.from({ length: 6 }, (_, i) => ({ pos: [-6, 0.125 * (i + 1), 8 - i * 0.9], size: [3, 0.25 * (i + 1), 0.9], color: palette.stone }));
const blocks: BlockDef[] = [
  { pos: [0, -0.25, 0], size: [160, 0.5, 160], color: palette.grass },
  ...steps,
  { pos: [-6, 1.5, 1.6], size: [3, 0.1, 4], color: palette.stoneLight },
  { pos: [6, 0.5, 6], size: [4, 0.15, 6], rotZ: 0.3, color: palette.stoneLight },
  { pos: [0, 1.5, -10], size: [1, 3, 1], color: palette.stoneDark },
  { pos: [4, 1.5, -10], size: [1, 3, 1], color: palette.stoneDark },
];

export function Maze01() {
  return (
    <>
      <StaticBlocks blocks={blocks} />
      <Rotator id="ring" center={[0, 0.2, 0]} stops={[0, Math.PI / 2, Math.PI]} speed={0.5}>
        <CuboidCollider args={[3.5, 0.2, 1.2]} />
        <mesh castShadow receiveShadow><boxGeometry args={[7, 0.4, 2.4]} /><meshStandardMaterial color={palette.stoneLight} flatShading roughness={1} /></mesh>
      </Rotator>
      <Lever id="ring" stops={3} position={[0, 0.25, 6]} label="Ring lever" />
      <Gate id="gate" position={[2, 1.5, -10]} size={[3, 3, 0.6]} />
      <Lever id="gate" asBool position={[2, 0.25, -7]} label="Gate lever" />
    </>
  );
}
