# Maze — vertical slice foundation

Next.js + React Three Fiber + Rapier. Deploys to Vercel as-is.

Desktop: click to capture mouse. WASD move, Shift sprint, C crouch, Space jump, E interact.
Mobile: left thumb moves, right thumb looks, on-screen buttons for Jump/Sprint/Crouch/Use.
Scanner: Q (or the Scan button) toggles readings near hazards and machines.

## Structure
- `src/game/world/worldState.ts` — source-of-truth flags + `derive()` (power → security/pumps/pressure/flood)

- `src/game/player`, `camera`, `input`, `interaction`, `ui` — reusable systems
- `src/scenes/Maze01.tsx` — proving ground now; Maze 01 is built from the same pieces

## Next
Flooded-corridor hazard, scanner/multitool, Hunter AI, save (Supabase), sector streaming.
