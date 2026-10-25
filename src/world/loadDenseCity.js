/**
 * Loads the dense city GLB into a Three.js scene.
 *
 * Put the generated asset at:
 *   public/assets/dense_tightly_packed_city.glb
 *
 * Usage:
 *   const city = await loadDenseCity(scene);
 */
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function loadDenseCity(scene, {
  url = '/assets/dense_tightly_packed_city.glb',
  position = [0, 0, 0],
  scale = 1,
} = {}) {
  const loader = new GLTFLoader();

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const city = gltf.scene;
        city.name = 'DenseCityEnvironment';
        city.position.set(position[0], position[1], position[2]);
        city.scale.setScalar(scale);
        city.traverse((object) => {
          if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });
        scene.add(city);
        resolve(city);
      },
      undefined,
      (error) => {
        console.error(`Failed to load dense city GLB from "${url}".`, error);
        reject(error);
      },
    );
  });
}
