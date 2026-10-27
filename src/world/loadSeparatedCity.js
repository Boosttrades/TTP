/**
 * Safe opt-in loader for a separated city asset pack.
 *
 * This file is intentionally NOT wired into the active game yet. The current
 * loadDenseCity.js remains the production path until the separated GLBs and
 * manifest have been committed and tested.
 *
 * Manifest URL: /assets/separated/manifest.json
 *
 * Expected manifest:
 * {
 *   "version": 1,
 *   "assets": [{
 *     "id": "building_001",
 *     "category": "buildings",
 *     "url": "/assets/separated/buildings/building_001.glb",
 *     "position": [0, 0, 0],
 *     "rotation": [0, 0, 0],
 *     "scale": [1, 1, 1]
 *   }]
 * }
 *
 * position/rotation/scale are optional; omitted values use identity transform.
 * Use the exact original transform recorded by the extraction manifest.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { loadDenseCity } from './loadDenseCity.js';

const DEFAULT_MANIFEST_URL = '/assets/separated/manifest.json';

function applyTransform(object, asset) {
  const p = Array.isArray(asset.position) ? asset.position : [0, 0, 0];
  const r = Array.isArray(asset.rotation) ? asset.rotation : [0, 0, 0];
  const s = Array.isArray(asset.scale) ? asset.scale : [1, 1, 1];

  object.position.set(Number(p[0]) || 0, Number(p[1]) || 0, Number(p[2]) || 0);
  object.rotation.set(Number(r[0]) || 0, Number(r[1]) || 0, Number(r[2]) || 0);
  object.scale.set(
    Number.isFinite(Number(s[0])) ? Number(s[0]) : 1,
    Number.isFinite(Number(s[1])) ? Number(s[1]) : 1,
    Number.isFinite(Number(s[2])) ? Number(s[2]) : 1,
  );
}

function loadGLB(loader, url) {
  return new Promise((resolve, reject) => {
    loader.load(url, gltf => resolve(gltf.scene), undefined, reject);
  });
}

async function fetchManifest(url) {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Separated asset manifest returned HTTP ${response.status}`);
  const manifest = await response.json();
  if (manifest?.version !== 1 || !Array.isArray(manifest.assets) || manifest.assets.length === 0) {
    throw new Error('Separated asset manifest is missing version 1 assets.');
  }
  for (const [index, asset] of manifest.assets.entries()) {
    if (!asset || typeof asset.url !== 'string' || !asset.url.startsWith('/assets/')) {
      throw new Error(`Invalid asset URL at manifest index ${index}.`);
    }
  }
  return manifest;
}

/**
 * Load the separated environment without changing the existing production
 * loader. By default, missing/broken manifest or any missing GLB safely falls
 * back to the original combined city.
 *
 * Set fallbackToCombined:false only for deliberate debugging; it will reject
 * rather than load a partially assembled world.
 */
export async function loadSeparatedCity(scene, {
  manifestUrl = DEFAULT_MANIFEST_URL,
  position = [0, 0, 0],
  scale = 1,
  fallbackToCombined = true,
  addToScene = true,
} = {}) {
  const loader = new GLTFLoader();
  let city;

  try {
    const manifest = await fetchManifest(manifestUrl);
    const separatedRoot = new THREE.Group();
    separatedRoot.name = 'SeparatedCityEnvironment';
    separatedRoot.position.set(position[0], position[1], position[2]);
    separatedRoot.scale.setScalar(scale);

    // Fail the entire separated load if any asset is missing. This avoids
    // silently presenting an incomplete city with holes in the environment.
    const loaded = await Promise.all(manifest.assets.map(async asset => {
      const object = await loadGLB(loader, asset.url);
      object.name = asset.id || object.name || 'SeparatedEnvironmentAsset';
      applyTransform(object, asset);
      object.traverse(node => {
        if (!node.isMesh) return;
        node.castShadow = true;
        node.receiveShadow = true;
        // Preserve imported materials and collision geometry. The existing
        // game collision system can be wired to these named nodes after
        // asset parity has been verified.
      });
      return { asset, object };
    }));

    for (const { asset, object } of loaded) {
      object.userData.environmentAssetId = asset.id || object.name;
      object.userData.environmentCategory = asset.category || 'other';
      separatedRoot.add(object);
    }

    separatedRoot.updateMatrixWorld(true);
    separatedRoot.userData.separatedAssetCount = loaded.length;
    separatedRoot.userData.separatedManifestUrl = manifestUrl;
    if (addToScene) scene.add(separatedRoot);
    return separatedRoot;
  } catch (error) {
    console.error('[loadSeparatedCity] Separated pack unavailable; keeping original city loader as fallback.', error);
    if (!fallbackToCombined) throw error;
    // Existing loader retains the current collision boundaries, red barrier,
    // facade details and distant-city scenery. No partially loaded root was
    // added to the scene above, so fallback does not duplicate the environment.
    city = await loadDenseCity(scene, { position, scale });
    city.userData.separatedLoaderFallback = true;
    city.userData.separatedLoaderError = String(error?.message || error);
    return city;
  }
}
