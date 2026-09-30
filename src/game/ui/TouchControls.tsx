'use client';
import { useEffect, useRef, useState } from 'react';
import { input, touch } from '../input/input';
import { toggleScanner } from '../tools/scanner';
import { promptStore } from '../interaction/interaction';
import { useStore } from '../../utils/store';

const R = 55;
const btn: React.CSSProperties = { position: 'absolute', width: 62, height: 62, borderRadius: 31, border: '1px solid #ffffff55', background: '#ffffff14', color: '#e6edf2', fontSize: 12, zIndex: 3, touchAction: 'none' };

export function TouchControls() {
  const [on, setOn] = useState(false);
  const [crouch, setCrouch] = useState(false);
  const hasPrompt = useStore(promptStore, (s) => !!s.verb);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => setOn('ontouchstart' in window || navigator.maxTouchPoints > 0), []);
  if (!on) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, touchAction: 'none' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', touchAction: 'none' }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); origin.current = { x: e.clientX, y: e.clientY }; }}
        onPointerMove={(e) => {
          if (!origin.current) return;
          const dx = (e.clientX - origin.current.x) / R, dy = (e.clientY - origin.current.y) / R;
          const m = Math.hypot(dx, dy) || 1, c = Math.min(1, m);
          touch.moveX = (dx / m) * c; touch.moveY = -(dy / m) * c;
        }}
        onPointerUp={() => { origin.current = null; touch.moveX = 0; touch.moveY = 0; }}
        onPointerCancel={() => { origin.current = null; touch.moveX = 0; touch.moveY = 0; }} />
      <div style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', touchAction: 'none' }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); last.current = { x: e.clientX, y: e.clientY }; }}
        onPointerMove={(e) => {
          if (!last.current) return;
          input.lookDX += (e.clientX - last.current.x) * 0.006; input.lookDY += (e.clientY - last.current.y) * 0.006;
          last.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => { last.current = null; }} onPointerCancel={() => { last.current = null; }} />
      <button style={{ ...btn, right: 18, bottom: 28 }} onPointerDown={(e) => { e.stopPropagation(); input.jump = true; }}>Jump</button>
      <button style={{ ...btn, right: 92, bottom: 28 }} onPointerDown={(e) => { e.stopPropagation(); touch.sprint = true; }}
        onPointerUp={() => { touch.sprint = false; }} onPointerCancel={() => { touch.sprint = false; }}>Sprint</button>
      <button style={{ ...btn, right: 18, bottom: 102, background: crouch ? '#ffffff40' : '#ffffff14' }}
        onPointerDown={(e) => { e.stopPropagation(); touch.crouch = !touch.crouch; setCrouch(touch.crouch); }}>Crouch</button>
      <button style={{ ...btn, right: 166, bottom: 28 }} onPointerDown={(e) => { e.stopPropagation(); toggleScanner(); }}>Scan</button>
      {hasPrompt && <button style={{ ...btn, right: 92, bottom: 102, width: 70, height: 70, borderRadius: 35, background: '#9fe0b433', borderColor: '#9fe0b4' }}
        onPointerDown={(e) => { e.stopPropagation(); input.interact = true; }}>Use</button>}
    </div>
  );
}
