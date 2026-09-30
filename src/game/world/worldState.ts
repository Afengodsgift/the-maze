import { createStore, useStore } from '../../utils/store';

/**
 * Source-of-truth flags. Everything else is DERIVED, so systems affect each
 * other through one function instead of ad-hoc wiring:
 *   power -> security -> doors      power -> pumps -> pressure / flood
 * World state lives here, independent of which sectors are loaded.
 */
export interface WorldFlags {
  mainPower: boolean;
  auxPower: boolean;
  pumpBJammed: boolean;
  corridorLive: boolean; // breaker for the flooded corridor circuit
}

export const worldStore = createStore<WorldFlags>({ mainPower: false, auxPower: false, pumpBJammed: true, corridorLive: true });

export interface Derived {
  anyPower: boolean;
  securityOn: boolean;
  pumpBRunning: boolean;
  pressure: number; // 0..1
  hydraulicDoorOpen: boolean;
  floodRising: boolean;
  corridorElectrified: boolean;
}

export function derive(f: WorldFlags): Derived {
  const anyPower = f.mainPower || f.auxPower;
  const securityOn = f.mainPower;
  const pumpBRunning = anyPower && !f.pumpBJammed;
  const pressure = pumpBRunning ? 1 : 0;
  return { anyPower, securityOn, pumpBRunning, pressure, hydraulicDoorOpen: pressure >= 1, floodRising: !pumpBRunning, corridorElectrified: anyPower && f.corridorLive };
}

export const getDerived = () => derive(worldStore.get());
export function useDerived<S>(sel: (d: Derived) => S): S {
  return useStore(worldStore, (f) => sel(derive(f)));
}
