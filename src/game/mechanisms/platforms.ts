/** Moving platforms publish their per-frame rotation so the character controller can carry the player. */
export interface PlatformMotion { cx: number; cz: number; dAngle: number }
export const platforms = new Map<number, PlatformMotion>();
