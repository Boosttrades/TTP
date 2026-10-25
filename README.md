# FPS Game Environment

This repository holds the environment assets and integration code for the FPS game.

## Dense city environment (GLB)

The dense city scene is intended to replace the sparse industrial-yard layout with tightly packed buildings and narrow passages.

### Asset location

Place the generated model at:

```
public/assets/dense_tightly_packed_city.glb
```

The binary GLB still needs to be uploaded to that path. The current repository integration commit adds the loader but does not include the model binary.

### Load it in a Three.js scene

Install/use a Three.js version that supports the `three/addons` import path, then:

```js
import { loadDenseCity } from './src/world/loadDenseCity.js';

// After creating your THREE.Scene:
const city = await loadDenseCity(scene);
```

The helper loads the GLB, adds it to the scene, and enables cast/receive shadows on meshes. It accepts optional `url`, `position`, and `scale` settings. Make sure the camera spawn point and collision system are adjusted to the model's scale and layout; GLB rendering alone does not create walkable interior collision or openable doors.

## Repository status

- `src/world/loadDenseCity.js`: Three.js GLTFLoader helper for the dense city asset.
- `public/assets/dense_tightly_packed_city.glb`: expected model path; upload the generated GLB here to complete the asset integration.
