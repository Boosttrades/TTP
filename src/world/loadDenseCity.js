/**
 * Loads the dense city GLB into a Three.js scene.
 *
 * Put the generated asset at:
 *   public/assets/dense_tightly_packed_city.glb
 *
 * Usage:
 *   const city = await loadDenseCity(scene);
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

function makeCrackedPlasterBump() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);
  // Fine, low-contrast branching hairline cracks for worn plaster walls.
  ctx.strokeStyle = '#4e4e4e';
  ctx.lineWidth = 1.1;
  const cracks = [
    [[24, 4], [31, 26], [23, 42], [38, 60], [35, 81]],
    [[31, 26], [49, 35], [57, 52]],
    [[128, 0], [120, 18], [132, 34], [119, 51], [126, 72], [111, 89]],
    [[132, 34], [151, 43], [158, 59]],
    [[211, 9], [203, 28], [218, 45], [209, 66], [225, 83]],
    [[203, 28], [185, 38], [179, 53]],
    [[62, 117], [78, 132], [69, 151], [83, 169], [76, 192], [91, 214]],
    [[78, 132], [99, 124], [110, 139]],
    [[166, 105], [153, 123], [166, 142], [155, 161], [170, 181], [163, 202]],
    [[153, 123], [135, 115], [126, 130]],
    [[226, 150], [211, 169], [223, 188], [208, 209], [217, 235]],
    [[211, 169], [193, 158], [181, 172]],
    [[18, 223], [35, 207], [28, 190], [42, 177]],
  ];
  for (const path of cracks) {
    ctx.beginPath();
    ctx.moveTo(path[0][0], path[0][1]);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i][0], path[i][1]);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.5, 1.5);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

export function loadDenseCity(scene, {
  url = '/assets/dense_tightly_packed_city.glb',
  position = [0, 0, 0],
  scale = 1,
} = {}) {
  const loader = new GLTFLoader();
  const crackedPlaster = makeCrackedPlasterBump();

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const city = gltf.scene;
        city.name = 'DenseCityEnvironment';
        city.position.set(position[0], position[1], position[2]);
        city.scale.setScalar(scale);
        city.traverse((object) => {
          if (!object.isMesh) return;
          object.castShadow = true;
          object.receiveShadow = true;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) {
            if (!material) continue;
            const name = (material.name || object.name || '').toLowerCase();
            const wallLike = /wall|building|concrete|plaster|brick|facade|stucco|cement/.test(name);
            if (material.color) {
              const c = material.color;
              const brightness = (c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722);
              // Gently lift neutral wall finishes toward pale, sun-faded concrete without recolouring props.
              if ((wallLike || brightness > 0.18) && brightness > 0.18) {
                c.lerp(new THREE.Color(0xe2ddd3), wallLike ? 0.48 : 0.12);
                material.roughness = Math.max(material.roughness ?? 0.8, 0.82);
                material.metalness = Math.min(material.metalness ?? 0, 0.08);
                if (!material.bumpMap) {
                  material.bumpMap = crackedPlaster;
                  material.bumpScale = 0.045;
                }
                material.needsUpdate = true;
              }
            }
          }
        });
        // Derive the playable city perimeter from the loaded model's actual bounds.
        city.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(city);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const w = Math.max(size.x, 24), d = Math.max(size.z, 24), h = Math.max(55, size.y + 40);
        const barrierMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
        const specs = [
          [center.x, bounds.min.y + h / 2, bounds.min.z - 1, w + 4, h, 1],
          [center.x, bounds.min.y + h / 2, bounds.max.z + 1, w + 4, h, 1],
          [bounds.min.x - 1, bounds.min.y + h / 2, center.z, 1, h, d + 4],
          [bounds.max.x + 1, bounds.min.y + h / 2, center.z, 1, h, d + 4]
        ];
        for (const [x, y, z, bw, bh, bd] of specs) {
          const wall = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), barrierMat);
          wall.name = 'InvisibleSolidWorldBoundary';
          wall.position.set(x, y, z);
          city.add(wall);
        }
        // Tile scenery directly against every side of the playable city so there is no visible gap.
        // The main city's invisible perimeter walls remain in place, so the player cannot enter these tiles.
        const offsets = [
          [-w, 0, 0], [w, 0, 0], [0, 0, -d], [0, 0, d],
          [-w, 0, -d], [w, 0, -d], [-w, 0, d], [w, 0, d],
        ];
        offsets.forEach((offset, index) => {
          const mirage = city.clone(true);
          const boundaryMeshes = [];
          mirage.traverse(node => { if (node.name === 'InvisibleSolidWorldBoundary') boundaryMeshes.push(node); });
          boundaryMeshes.forEach(node => node.parent?.remove(node));
          mirage.name = 'DistantCityMirage_' + (index + 1);
          mirage.position.set(position[0] + offset[0], position[1], position[2] + offset[2]);
          mirage.traverse(node => {
            if (!node.isMesh) return;
            node.castShadow = false;
            node.receiveShadow = false;
            node.material = Array.isArray(node.material) ? node.material.map(mat => mat?.clone()) : node.material?.clone();
            // Keep scenery materials fully opaque; fog in the main scene should soften the
            // far edges naturally instead of making the adjacent city tiles look like ghosts.
          });
          scene.add(mirage);
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
