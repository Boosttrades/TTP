# Separated city environment pack

The separated asset pack is generated from `public/assets/dense_tightly_packed_city.glb`.

Download the generated pack from the ChatGPT conversation and extract its `fps_city_separated_assets/` contents into the repository at `public/assets/separated/`, preserving the category folders and `manifest.json`.

Expected layout:

- `public/assets/separated/manifest.json`
- `public/assets/separated/buildings/*.glb`
- `public/assets/separated/containers/*.glb`
- `public/assets/separated/doors/*.glb`
- `public/assets/separated/ground/*.glb`

The pack contains 86 source objects (60 building meshes/parts, 3 containers, 20 doors, and 3 ground/alley objects). The source GLB's geometry already contains its city-space placement, so the extracted meshes keep that placement baked into their vertices and the manifest uses identity transforms. Keep this convention when swapping an asset, or update its manifest transform accordingly.

## Safe rollout

`src/world/loadSeparatedCity.js` is opt-in and is not wired into the active game. It checks that every manifest entry loads, and falls back to `loadDenseCity.js` if the pack is unavailable. Do not switch the active game loader until the separated files are present and visual/collision parity has been checked.
