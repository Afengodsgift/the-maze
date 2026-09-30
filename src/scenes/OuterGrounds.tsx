'use client';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { Interactable } from '../game/interaction/interaction';
import { playerState } from '../game/player/playerState';
import { getDerived, useDerived, worldStore } from '../game/world/worldState';
import { emitSound, LOUDNESS } from '../game/ai/sound/soundBus';
import { showMessage } from '../game/ui/messages';

type V3 = [number, number, number];

function Block({ pos, size, color = '#3a4148', rough = 0.92, emissive }: { pos: V3; size: V3; color?: string; rough?: number; emissive?: string }) {
  return (
    <RigidBody type="fixed" colliders={false} position={pos}>
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
      <mesh castShadow receiveShadow><boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={rough} emissive={emissive ?? '#000'} emissiveIntensity={emissive ? 1 : 0} /></mesh>
    </RigidBody>
  );
}

function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function Forest() {
  const trees = useMemo(() => {
    const r = rng(7), out: { x: number; z: number; h: number; s: number }[] = [];
    while (out.length < 140) {
      const x = (r() - 0.5) * 180, z = (r() - 0.5) * 180 - 20;
      if (x > -22 && x < 26 && z > -36 && z < 30) continue; // keep the approach & building area open
      if (Math.abs(x - 35) < 8 && Math.abs(z + 55) < 8) continue; // tower base
      out.push({ x, z, h: 5 + r() * 5, s: 1.6 + r() * 1.4 });
    }
    return out;
  }, []);
  const trunk = useRef<THREE.InstancedMesh>(null), crown = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion();
    trees.forEach((t, i) => {
      m.compose(new THREE.Vector3(t.x, t.h / 2, t.z), q, new THREE.Vector3(1, t.h, 1)); trunk.current!.setMatrixAt(i, m);
      m.compose(new THREE.Vector3(t.x, t.h + t.s, t.z), q, new THREE.Vector3(t.s, t.s * 3.2, t.s)); crown.current!.setMatrixAt(i, m);
    });
    trunk.current!.instanceMatrix.needsUpdate = true; crown.current!.instanceMatrix.needsUpdate = true;
  }, [trees]);
  return (
    <>
      <instancedMesh ref={trunk} args={[undefined, undefined, trees.length]} castShadow><cylinderGeometry args={[0.22, 0.32, 1, 6]} /><meshStandardMaterial color="#2b2118" roughness={1} /></instancedMesh>
      <instancedMesh ref={crown} args={[undefined, undefined, trees.length]} castShadow><coneGeometry args={[1, 1, 7]} /><meshStandardMaterial color="#14241b" roughness={1} /></instancedMesh>
      <RigidBody type="fixed" colliders={false}>{trees.map((t, i) => <CuboidCollider key={i} args={[0.3, 3, 0.3]} position={[t.x, 3, t.z]} />)}</RigidBody>
    </>
  );
}

function Rain() {
  const ref = useRef<THREE.Points>(null);
  const N = 1800, H = 20;
  const positions = useMemo(() => { const a = new Float32Array(N * 3); for (let i = 0; i < N; i++) { a[i * 3] = (Math.random() - 0.5) * 40; a[i * 3 + 1] = Math.random() * H; a[i * 3 + 2] = (Math.random() - 0.5) * 40; } return a; }, []);
  useFrame((_, dt) => {
    const pts = ref.current; if (!pts) return;
    const attr = pts.geometry.attributes.position as THREE.BufferAttribute, arr = attr.array as Float32Array;
    for (let i = 0; i < N; i++) { arr[i * 3 + 1] -= 22 * Math.min(dt, 0.05); if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] += H; }
    attr.needsUpdate = true; pts.position.set(playerState.pos.x, 0, playerState.pos.z);
  });
  return (<points ref={ref} frustumCulled={false}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
    <pointsMaterial color="#8fa3b5" size={0.05} transparent opacity={0.55} depthWrite={false} /></points>);
}

function MoonLight() {
  const light = useRef<THREE.DirectionalLight>(null);
  useFrame(() => {
    const l = light.current; if (!l) return; const p = playerState.pos;
    l.position.set(p.x + 18, p.y + 40, p.z + 10); l.target.position.set(p.x, p.y, p.z); l.target.updateMatrixWorld();
  });
  return (<>
    <directionalLight ref={light} intensity={0.55} color="#8aa4c8" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-far={90} />
    {light.current && <primitive object={light.current.target} />}
  </>);
}

function HydraulicDoor() {
  const rb = useRef<RapierRigidBody>(null);
  const y = useRef(1.6);
  const open = useDerived((d) => d.hydraulicDoorOpen);
  useLayoutEffect(() => { if (open) emitSound('door', [-12, 1, -15], LOUDNESS.machinery); }, [open]);
  useFrame((_, dt) => {
    y.current += ((open ? -1.75 : 1.6) - y.current) * Math.min(1, dt * 1.6);
    rb.current?.setNextKinematicTranslation({ x: -12, y: y.current, z: -15 });
  });
  return (
    <RigidBody ref={rb} type="kinematicPosition" colliders={false} position={[-12, 1.6, -15]}>
      <CuboidCollider args={[1, 1.6, 0.15]} />
      <mesh castShadow><boxGeometry args={[2, 3.2, 0.3]} /><meshStandardMaterial color="#4a4f52" metalness={0.6} roughness={0.5} /></mesh>
    </RigidBody>
  );
}

function MaintenanceBuilding() {
  const power = useDerived((d) => d.anyPower);
  const pumpOn = useDerived((d) => d.pumpBRunning);
  const jammed = useDerived((d) => !d.pumpBRunning && worldStore.get().pumpBJammed);
  const flick = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => { if (flick.current) flick.current.intensity = power ? 9 + Math.sin(clock.elapsedTime * 41) * Math.sin(clock.elapsedTime * 13) * 1.5 : 0; });
  const W = '#454b50';
  return (
    <group>
      <Block pos={[-12, 1.6, -19]} size={[10.4, 3.2, 0.4]} color={W} />
      <Block pos={[-17, 1.6, -14]} size={[0.4, 3.2, 10]} color={W} />
      <Block pos={[-7, 1.6, -14]} size={[0.4, 3.2, 10]} color={W} />
      <Block pos={[-14.95, 1.6, -9]} size={[4.1, 3.2, 0.4]} color={W} />
      <Block pos={[-9.05, 1.6, -9]} size={[4.1, 3.2, 0.4]} color={W} />
      <Block pos={[-12, 2.7, -9]} size={[1.8, 1, 0.4]} color={W} />
      <Block pos={[-12, 3.3, -14]} size={[10.8, 0.2, 10.8]} color="#2c3236" />
      <Block pos={[-15, 1.6, -15]} size={[4, 3.2, 0.3]} color={W} />
      <Block pos={[-9, 1.6, -15]} size={[4, 3.2, 0.3]} color={W} />
      <HydraulicDoor />
      <pointLight ref={flick} position={[-12, 2.8, -12]} color="#ffd9a0" distance={12} decay={1.6} />
      <pointLight position={[-12, 2.8, -17]} color="#5a9bff" intensity={power ? 3 : 0.6} distance={7} decay={1.6} />

      {/* electrical panel */}
      <mesh position={[-16.75, 1.4, -12]}><boxGeometry args={[0.15, 0.9, 0.6]} /><meshStandardMaterial color="#5b6a5f" /></mesh>
      <Interactable id="panel" position={[-16.5, 1.4, -12]} verb="Open panel" label="Electrical panel"
        enabled={() => !worldStore.get().auxPower}
        onUse={() => { worldStore.set({ auxPower: true }); emitSound('machinery', [-16.5, 1.4, -12], LOUDNESS.machinery);
          showMessage(['Multitool: bypass damaged breaker', 'Auxiliary power restored']); }} />

      {/* maintenance terminal */}
      <mesh position={[-15.6, 1.0, -10.2]}><boxGeometry args={[0.7, 0.9, 0.4]} /><meshStandardMaterial color="#2a3a30" emissive={power ? '#2f7a4a' : '#000'} emissiveIntensity={0.8} /></mesh>
      <Interactable id="maint-terminal" position={[-15.6, 1.0, -10.2]} verb="Read" label="Maintenance terminal"
        onUse={() => { const d = getDerived(); const on = (b: boolean) => (b ? 'ON' : 'OFF');
          showMessage(['OUTER GROUNDS  ' + on(worldStore.get().mainPower), 'MAIN FACILITY  ' + on(worldStore.get().mainPower), 'MAINTENANCE    ' + on(worldStore.get().auxPower), 'FLOOD CONTROL  ' + on(d.pumpBRunning)], 6000); }} />

      {/* pump B + debris */}
      <mesh castShadow position={[-9, 0.6, -11]}><cylinderGeometry args={[0.5, 0.6, 1.2, 12]} /><meshStandardMaterial color="#5a4a2a" metalness={0.5} roughness={0.6} /></mesh>
      <mesh position={[-9, 1.3, -11]}><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color={pumpOn ? '#3cff7a' : '#ff3c3c'} emissive={pumpOn ? '#3cff7a' : '#ff3c3c'} emissiveIntensity={1.5} /></mesh>
      {jammed && <mesh position={[-9, 0.25, -12]} rotation={[0.3, 0.5, 0.2]}><boxGeometry args={[0.9, 0.4, 0.5]} /><meshStandardMaterial color="#6b6358" roughness={1} /></mesh>}
      <Interactable id="pump-debris" position={[-9, 0.4, -11.8]} verb="Clear obstruction" label="Pump B"
        enabled={() => worldStore.get().pumpBJammed}
        onUse={() => { worldStore.set({ pumpBJammed: false }); emitSound('drop', [-9, 0.4, -12], LOUDNESS.jog);
          showMessage(getDerived().anyPower ? ['Pump B running', 'Pressure rising'] : ['Pump B is clear', 'No power to the motor']); }} />

      {/* flooded corridor beyond the door (hazard hookup comes next) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-12, 0.3, -17]}><planeGeometry args={[9.6, 3.6]} /><meshStandardMaterial color="#1c3a4a" transparent opacity={0.75} roughness={0.15} metalness={0.3} /></mesh>
      <mesh position={[-12, 2.2, -17.5]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.03, 0.03, 4, 6]} /><meshStandardMaterial color="#111" /></mesh>
    </group>
  );
}

export function OuterGrounds() {
  return (
    <>
      <ambientLight intensity={0.35} color="#5a6f8c" />
      <hemisphereLight args={['#4a5f7a', '#10140f', 0.35]} />
      <MoonLight />
      <Rain />
      <RigidBody type="fixed" colliders={false}><CuboidCollider args={[150, 0.5, 150]} position={[0, -0.5, 0]} /></RigidBody>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[300, 300]} /><meshStandardMaterial color="#1a231c" roughness={1} /></mesh>
      <Forest />

      {/* crashed security vehicle at spawn */}
      <Block pos={[2.5, 0.9, 20]} size={[2.2, 1.6, 4.6]} color="#2f4a3a" />
      <mesh position={[2.5, 0.7, 17.6]}><boxGeometry args={[1.6, 0.25, 0.1]} /><meshStandardMaterial color="#fff2c2" emissive="#fff2c2" emissiveIntensity={1.2} /></mesh>

      {/* perimeter fence with a broken stretch, dead main gate, terminal */}
      {[-30, -22, -14, -6].map((x) => <Block key={x} pos={[x - 1, 1.2, -26]} size={[7, 2.4, 0.12]} color="#2b3035" />)}
      {[6, 14, 26].map((x) => <Block key={x} pos={[x + 1, 1.2, -26]} size={[x === 14 ? 4 : 7, 2.4, 0.12]} color="#2b3035" />)}
      <Block pos={[0, 1.6, -26]} size={[8, 3.2, 0.3]} color="#23282c" />
      <mesh position={[3.4, 1.0, -24.6]}><boxGeometry args={[0.6, 1.0, 0.4]} /><meshStandardMaterial color="#2a3a30" emissive="#0e2a18" /></mesh>
      <Interactable id="gate-terminal" position={[3.4, 1.0, -24.6]} verb="Read" label="Gate terminal"
        onUse={() => showMessage(['FACILITY POWER OFFLINE', 'SECURITY OFFLINE', 'COMMUNICATION OFFLINE', '', 'ACCESS DENIED'])} />

      <MaintenanceBuilding />

      {/* landmarks: facility mass + communication tower */}
      <Block pos={[0, 12, -70]} size={[70, 24, 20]} color="#20262b" />
      {[-24, -8, 8, 24].map((x) => <mesh key={x} position={[x, 14, -59.9]}><boxGeometry args={[4, 2, 0.1]} /><meshStandardMaterial color="#0a1014" emissive="#22313a" emissiveIntensity={0.6} /></mesh>)}
      <mesh position={[35, 22, -55]} castShadow><cylinderGeometry args={[0.35, 1, 44, 8]} /><meshStandardMaterial color="#2a2f33" metalness={0.5} roughness={0.6} /></mesh>
      <mesh position={[35, 44.5, -55]}><sphereGeometry args={[0.35, 8, 8]} /><meshStandardMaterial color="#ff2a2a" emissive="#ff2a2a" emissiveIntensity={2} /></mesh>
    </>
  );
}
