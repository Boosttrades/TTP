# Invisible-player city movement prototype

This branch adds `src/controls/invisiblePlayerController.js`, a Three.js controller with an invisible player collider, mobile analog joystick, drag-to-look camera, keyboard fallback, run and jump controls.

## Integration

1. Load the city with `loadDenseCity(scene)` from `src/world/loadDenseCity.js`.
2. Ensure the city GLB is served at `/assets/dense_tightly_packed_city.glb`.
3. Create the controller after the scene, camera, renderer, and city are ready:

```js
import { InvisiblePlayerController } from './controls/invisiblePlayerController.js';
const controller = new InvisiblePlayerController({ scene, camera, renderer, city });
```

4. In the animation loop, call `controller.update(deltaSeconds)`.

## Current limitations

This repository currently contains the city loader only, not the full game app or the binary city asset. The controller is an integration module, not yet wired into an application entry point. Mesh raycast collision needs in-game validation against the actual GLB; the flat-ground assumption is `y = 0`. Do not treat this branch as a tested playable build yet.
