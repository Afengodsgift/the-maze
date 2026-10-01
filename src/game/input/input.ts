export const input = {
  moveX: 0, moveY: 0, lookDX: 0, lookDY: 0, yaw: 0, pitch: 0.3,
  sprint: false, crouch: false, jump: false, interact: false,
};
export const touch = { moveX: 0, moveY: 0, sprint: false, crouch: false };
const keys = new Set<string>();

export function bindInput(el: HTMLElement) {
  const kd = (e: KeyboardEvent) => {
    keys.add(e.code);
    if (e.code === 'KeyE') input.interact = true;
    if (e.code === 'Space') input.jump = true;
  };
  const ku = (e: KeyboardEvent) => keys.delete(e.code);
  const mm = (e: MouseEvent) => {
    if (document.pointerLockElement === el) { input.lookDX += e.movementX * 0.0022; input.lookDY += e.movementY * 0.0022; }
  };
  const click = () => { if (!('ontouchstart' in window)) el.requestPointerLock?.(); };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  window.addEventListener('mousemove', mm); el.addEventListener('click', click);
  return () => {
    window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
    window.removeEventListener('mousemove', mm); el.removeEventListener('click', click);
  };
}

export function pollMovement() {
  const k = (c: string) => (keys.has(c) ? 1 : 0);
  let x = k('KeyD') - k('KeyA'), y = k('KeyW') - k('KeyS');
  if (touch.moveX || touch.moveY) { x = touch.moveX; y = touch.moveY; }
  input.moveX = x; input.moveY = y;
  input.sprint = keys.has('ShiftLeft') || keys.has('ShiftRight') || touch.sprint;
  input.crouch = keys.has('KeyC') || keys.has('ControlLeft') || touch.crouch;
}
