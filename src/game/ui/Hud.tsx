'use client';
import { promptStore } from '../interaction/interaction';
import { messageStore, fxStore } from './messages';
import { useStore } from '../../utils/store';

export function Hud() {
  const verb = useStore(promptStore, (s) => s.verb);
  const label = useStore(promptStore, (s) => s.label);
  const lines = useStore(messageStore, (s) => s.lines.join('\n'));
  const flash = useStore(fxStore, (s) => s.flash);
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', color: '#fff6e4', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: flash * 0.5, transition: flash ? 'none' : 'opacity .6s' }} />
      {lines && <div style={{ position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'pre-line', textAlign: 'center', fontSize: 15, lineHeight: 1.6, background: 'rgba(40,28,16,.6)', padding: '10px 16px', borderRadius: 6 }}>{lines}</div>}
      {verb && (
        <div style={{ position: 'absolute', bottom: '26%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', fontSize: 15, textShadow: '0 1px 4px #000a' }}>
          <span style={{ border: '1px solid #fff6e4aa', borderRadius: 3, padding: '1px 7px', marginRight: 8, fontSize: 13 }}>E</span>
          {verb} <span style={{ opacity: 0.7 }}>{label}</span>
        </div>
      )}
    </div>
  );
}
