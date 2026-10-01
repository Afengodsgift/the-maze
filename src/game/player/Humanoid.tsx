'use client';
import { useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { input } from '../input/input';
import { playerState } from './playerState';

const URL = '/models/character/scene.gltf';
// The model is authored facing +Z with Y up. A = axis where a POSITIVE angle swings a hanging limb forward.
const UP = new THREE.Vector3(0, 1, 0), FWD = new THREE.Vector3(0, 0, 1), A = FWD.clone().cross(UP);

interface B { bone: THREE.Bone; wp: THREE.Quaternion; wpInv: THREE.Quaternion; rest: THREE.Quaternion; base: THREE.Quaternion }
const NAMES = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Head', 'LeftArm', 'LeftForeArm', 'RightArm', 'RightForeArm', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg', 'RightLeg', 'RightFoot'] as const;
type Name = (typeof NAMES)[number];

/** Finds the skeleton, records rest orientations, and converts the T-pose into a relaxed arms-down stance. */
function buildRig(scene: THREE.Object3D) {
  const root = cloneSkinned(scene) as THREE.Object3D;
  root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = false; m.frustumCulled = false; } });
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const bones = new Map<string, THREE.Bone>();
  root.traverse((o) => { if ((o as THREE.Bone).isBone) bones.set(o.name.replace(/_\d+$/, ''), o as THREE.Bone); });

  const worldQ = (o: THREE.Object3D) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
  const worldP = (o: THREE.Object3D) => new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
  const rig = {} as Record<Name, B>;
  for (const n of NAMES) {
    const bone = bones.get(n); if (!bone) continue;
    const wp = bone.parent ? worldQ(bone.parent) : new THREE.Quaternion();
    rig[n] = { bone, wp, wpInv: wp.clone().invert(), rest: bone.quaternion.clone(), base: new THREE.Quaternion() };
  }
  for (const [arm, fore] of [['LeftArm', 'LeftForeArm'], ['RightArm', 'RightForeArm']] as const) {
    if (!rig[arm] || !rig[fore]) continue;
    const dir = worldP(rig[fore].bone).sub(worldP(rig[arm].bone)).normalize();
    const target = new THREE.Vector3(Math.sign(dir.x) * 0.2, -1, 0.05).normalize();
    rig[arm].base.setFromUnitVectors(dir, target);
  }
  return { root, rig };
}

const tmp = new THREE.Quaternion(), d = new THREE.Quaternion();
function pose(b: B | undefined, angle: number, withBase = false) {
  if (!b) return;
  d.setFromAxisAngle(A, angle);
  if (withBase) d.multiply(b.base);
  b.bone.quaternion.copy(tmp.copy(b.wpInv).multiply(d).multiply(b.wp).multiply(b.rest));
}

/** Skinned character, animated procedurally (no clips needed): walk/sprint cycle, crouch, idle, airborne. */
export function Humanoid() {
  const gltf = useLoader(GLTFLoader, URL);
  const { root, rig } = useMemo(() => buildRig(gltf.scene), [gltf]);
  const holder = useRef<THREE.Group>(null);
  const phase = useRef(0), crouchT = useRef(0), airT = useRef(0), t = useRef(0);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05); t.current += dt;
    const sp = playerState.speed;
    crouchT.current += ((input.crouch ? 1 : 0) - crouchT.current) * Math.min(1, dt * 9);
    airT.current += ((playerState.grounded ? 0 : 1) - airT.current) * Math.min(1, dt * 12);
    const c = crouchT.current, air = airT.current, moving = Math.min(1, sp / 1.2);
    phase.current += dt * (1.5 + sp * 1.7) * (sp > 0.2 ? 1 : 0);
    const amp = Math.min(1, sp / 3.6) * (1 - c * 0.45) * 0.95;
    const sw = Math.sin(phase.current) * amp;
    const kneeL = Math.max(0, Math.cos(phase.current)) * amp * 1.1, kneeR = Math.max(0, -Math.cos(phase.current)) * amp * 1.1;
    const sprint = Math.max(0, Math.min(1, (sp - 3.8) / 2.2));
    const lean = sprint * 0.35 + c * 0.45 + air * 0.1;

    if (holder.current) holder.current.position.y = -0.29 * c + Math.abs(Math.sin(phase.current)) * 0.03 * moving * (1 - c) * (1 - air);

    const lUp = sw * (1 - air) + c * 1.0 + air * 0.7, rUp = -sw * (1 - air) + c * 1.0 + air * 0.4;
    const lKn = -(kneeL * (1 - air)) - c * 1.6 - air * 0.9, rKn = -(kneeR * (1 - air)) - c * 1.6 - air * 0.6;
    pose(rig.LeftUpLeg, lUp); pose(rig.RightUpLeg, rUp);
    pose(rig.LeftLeg, lKn); pose(rig.RightLeg, rKn);
    pose(rig.LeftFoot, -(lUp + lKn) * 0.7); pose(rig.RightFoot, -(rUp + rKn) * 0.7);

    pose(rig.LeftArm, -sw * 0.9 * (1 - air) + c * 0.5 + air * 1.0, true);
    pose(rig.RightArm, sw * 0.9 * (1 - air) + c * 0.5 + air * 1.0, true);
    const elbow = 0.25 + sprint * 0.9 + c * 0.4;
    pose(rig.LeftForeArm, elbow); pose(rig.RightForeArm, elbow);

    pose(rig.Spine, -lean * 0.4); pose(rig.Spine1, -lean * 0.3); pose(rig.Spine2, -lean * 0.3);
    pose(rig.Head, lean * 0.8 + Math.sin(t.current * 1.6) * 0.01);
  });

  return <group ref={holder}><group rotation={[0, Math.PI, 0]}><primitive object={root} /></group></group>;
}
