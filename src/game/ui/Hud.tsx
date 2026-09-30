'use client';
import { promptStore } from '../interaction/interaction';
import { messageStore } from './messages';
import { useStore } from '../../utils/store';

export function Hud() {
  const verb = useStore(promptStore, (s) => s.verb);
  const label = useStore(promptStore, (s) => s.label);
  const lines = useStore(messageStore, (s) => s.lines.join('\n'));
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', color: '#d8e0e6', fontFamily: 'system-ui, sans-serif' }}>
      {lines && (
        <div style={{ position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'pre-line', textAlign: 'center',
          fontFamily: 'Courier New, monospace', fontSize: 15, lineHeight: 1.6, background: 'rgba(6,12,10,.72)', color: '#9fe0b4', padding: '12px 18px', borderRadius: 2 }}>
          {lines}
        </div>
      )}
      {verb && (
        <div style={{ position: 'absolute', bottom: '26%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', fontSize: 15, textShadow: '0 1px 4px #000' }}>
          <span style={{ border: '1px solid #d8e0e6aa', borderRadius: 3, padding: '1px 7px', marginRight: 8, fontSize: 13 }}>E</span>
          {verb} <span style={{ opacity: 0.6 }}>{label}</span>
        </div>
      )}
    </div>
  );
}
