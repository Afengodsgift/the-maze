'use client';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { getDerived } from '../world/worldState';
import { playerState } from '../player/playerState';
import { CABLE } from '../systems/electricity/FloodHazard';

interface Bus { ctx: AudioContext; hum: GainNode; rain: GainNode }

/** Procedural ambience: rain outside, electrical buzz near live cable (audible warning). */
export function AudioSystem() {
  const bus = useRef<Bus | null>(null);
  useEffect(() => {
    const start = () => {
      if (bus.current) { bus.current.ctx.resume(); return; }
      const ctx = new AudioContext();
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
      const rain = ctx.createGain(); rain.gain.value = 0.05;
      src.connect(lp); lp.connect(rain); rain.connect(ctx.destination); src.start();
      const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 100;
      const f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = 420;
      const hum = ctx.createGain(); hum.gain.value = 0;
      osc.connect(f2); f2.connect(hum); hum.connect(ctx.destination); osc.start();
      bus.current = { ctx, hum, rain };
    };
    window.addEventListener('pointerdown', start); window.addEventListener('keydown', start);
    return () => { window.removeEventListener('pointerdown', start); window.removeEventListener('keydown', start); bus.current?.ctx.close(); bus.current = null; };
  }, []);

  useFrame(() => {
    const b = bus.current; if (!b) return;
    const p = playerState.pos;
    const hz = Math.hypot(p.x - CABLE[0], p.z - CABLE[2]);
    const hum = getDerived().corridorElectrified ? Math.max(0, 1 - hz / 14) * 0.14 : 0;
    b.hum.gain.value += (hum - b.hum.gain.value) * 0.1;
    const indoors = p.x > -17 && p.x < -7 && p.z > -19 && p.z < -9;
    b.rain.gain.value += ((indoors ? 0.012 : 0.05) - b.rain.gain.value) * 0.05;
  });
  return null;
}
