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
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  // A fine plaster grain prevents walls from looking like smooth, flat plastic.
  const image = ctx.createImageData(512, 512);
  for (let i = 0; i < image.data.length; i += 4) {
    const grain = 116 + Math.random() * 24;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = grain;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  // Irregular branching hairline cracks, with a few deeper fracture segments.
  const paths = [
    [[18,0],[30,34],[22,58],[42,81],[37,112],[54,137]],
    [[30,34],[55,45],[70,66]], [[22,58],[7,77]],
    [[119,0],[107,31],[126,55],[111,82],[124,111],[101,138]],
    [[126,55],[153,67],[166,91]], [[111,82],[88,91],[80,112]],
    [[246,0],[232,29],[251,53],[238,83],[258,106]],
    [[232,29],[209,43],[198,66]], [[238,83],[266,93]],
    [[344,0],[330,28],[348,53],[334,79],[351,105],[339,131]],
    [[348,53],[375,63],[388,87]], [[334,79],[310,89],[302,111]],
    [[455,14],[438,39],[455,64],[440,91],[461,118]],
    [[438,39],[414,49],[401,70]], [[440,91],[418,107]],
    [[45,210],[67,231],[55,257],[76,283],[68,316],[89,342]],
    [[67,231],[91,221],[109,239]], [[55,257],[34,270]],
    [[180,190],[162,216],[181,241],[165,268],[185,296],[176,327]],
    [[181,241],[208,253],[220,277]], [[165,268],[140,280],[130,301]],
    [[300,205],[281,230],[301,254],[286,281],[307,307],[296,338]],
    [[301,254],[326,265],[340,286]], [[286,281],[263,293]],
    [[410,211],[392,236],[411,259],[396,286],[416,311],[404,339]],
    [[411,259],[438,271],[450,292]], [[396,286],[372,298]],
    [[19,405],[40,382],[33,356],[52,336]], [[40,382],[63,395],[78,416]],
    [[151,414],[169,388],[158,362],[178,341]], [[169,388],[193,402],[207,424]],
    [[276,420],[295,396],[284,370],[303,350]], [[295,396],[318,410]],
    [[433,420],[451,397],[440,371],[460,349]], [[451,397],[475,408]]
  ];
  ctx.lineCap = 'round';
  for (const path of paths) {
    ctx.strokeStyle = 'rgba(48,45,39,0.72)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(path[0][0], path[0][1]);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i][0], path[i][1]);
    ctx.stroke();
    // Hairline edge highlights give the fractures a shallow, chipped-plaster relief.
    ctx.strokeStyle = 'rgba(224,216,201,0.7)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  // Subtle, broken-up weather staining rather than a uniform wall finish.
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * 512, y = Math.random() * 512;
    const radius = 2 + Math.random() * 13;
    ctx.fillStyle = i % 3 ? 'rgba(82,91,74,0.08)' : 'rgba(104,82,62,0.07)';
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * (1.2 + Math.random()), Math.random(), 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.8, 1.8);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

function addFacadeIvy(mesh, index) {
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  const b = mesh.geometry.boundingBox;
  if (!b) return;
  const width = b.max.x - b.min.x, height = b.max.y - b.min.y, depth = b.max.z - b.min.z;
  if (height < 2.4 || width < 1.8 || height < width * 0.65) return;
  // Only a portion of facade pieces receive ivy, so greenery feels naturally irregular.
  if (index % 4 !== 0) return;
  const leafMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x365d32, roughness: 0.92, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: 0x527b3d, roughness: 0.9, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: 0x78914a, roughness: 0.92, side: THREE.DoubleSide })
  ];
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.12, 0.2, 0, 0.34);
  leafShape.quadraticCurveTo(-0.13, 0.19, 0, 0);
  const leafGeo = new THREE.ShapeGeometry(leafShape);
  const vine = new THREE.Group();
  vine.name = 'NaturalFacadeIvy';
  const faceZ = depth > 0.12 ? b.max.z + 0.025 : b.max.z + 0.015;
  const count = Math.max(10, Math.min(28, Math.floor(height * 2.2)));
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const x = b.min.x + width * (0.18 + 0.64 * (0.5 + 0.5 * Math.sin(t * 8 + index)));
    const y = b.min.y + height * t;
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.025, height / count * 1.5, 0.018),
      new THREE.MeshStandardMaterial({ color: 0x465c30, roughness: 1 }));
    stem.position.set(x, y, faceZ);
    vine.add(stem);
    for (const side of [-1, 1]) {
      const leaf = new THREE.Mesh(leafGeo, leafMaterials[(i + (side > 0 ? 1 : 0)) % leafMaterials.length]);
      leaf.position.set(x + side * (0.06 + (i % 3) * 0.025), y + (side * 0.04), faceZ + 0.02);
      leaf.rotation.z = side * (0.5 + (i % 4) * 0.2);
      leaf.scale.setScalar(0.45 + (i % 4) * 0.13);
      vine.add(leaf);
    }
  }
  mesh.add(vine);
}

function addArchitecturalFacadeDetails(mesh) {
  if (!/building-[a-z]$/.test((mesh.name || '').toLowerCase())) return;
  mesh.geometry.computeBoundingBox();
  const b = mesh.geometry.boundingBox;
  if (!b) return;
  const width = b.max.x - b.min.x, height = b.max.y - b.min.y, depth = b.max.z - b.min.z;
  if (width < 0.7 || height < 0.7 || depth < 0.35) return;
  const frontZ = b.max.z + 0.018;
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x333b46, roughness: 0.76, metalness: 0.12 });
  const sillMat = new THREE.MeshStandardMaterial({ color: 0xb8b4aa, roughness: 0.9 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x557e9e, emissive: 0x142a3a, emissiveIntensity: 0.12, roughness: 0.24, metalness: 0.16, side: THREE.DoubleSide });
  const addBox = (w, h, d, x, y, z, material, label) => {
    const part = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    part.name = label; part.position.set(x, y, z); part.castShadow = true; part.receiveShadow = true; mesh.add(part);
  };
  const cols = width > 1.45 ? 2 : 1, rows = height > 1.55 ? 2 : 1;
  const winW = Math.min(0.27, width * 0.66 / (cols * 1.55));
  const winH = Math.min(0.24, height / (rows * 4.2));
  const topY = b.min.y + height * (rows > 1 ? 0.72 : 0.68);
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    const x = b.min.x + width * (0.5 + (col - (cols - 1) / 2) * 0.42);
    const y = topY - row * height * 0.34, frame = 0.035;
    addBox(winW + frame * 2, winH + frame * 2, 0.045, x, y, frontZ, frameMat, 'DetailedWindowFrame');
    addBox(winW, winH, 0.048, x, y, frontZ + 0.025, glassMat, 'DetailedWindowGlass');
    addBox(winW + frame * 2.2, 0.035, 0.07, x, y - winH / 2 - frame, frontZ + 0.025, sillMat, 'WindowSill');
    addBox(0.018, winH, 0.012, x, y, frontZ + 0.052, frameMat, 'WindowMullion');
  }
  addBox(width + 0.06, 0.055, depth + 0.04, (b.min.x + b.max.x) / 2, b.max.y - 0.018,
    (b.min.z + b.max.z) / 2, frameMat, 'RoofEdgeFascia');
  for (const x of [b.min.x + 0.035, b.max.x - 0.035]) {
    addBox(0.025, height * 0.82, 0.022, x, b.min.y + height * 0.52, frontZ + 0.012, sillMat, 'FacadeCornerTrim');
  }
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
          addArchitecturalFacadeDetails(object);
          object.castShadow = true;
          object.receiveShadow = true;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) {
            if (!material) continue;
            const name = `${material.name || ''} ${object.name || ''}`.toLowerCase();
            const wallLike = /wall|building|concrete|plaster|brick|facade|stucco|cement|masonry|exterior|structure/.test(name);
            if (material.color) {
              const c = material.color;
              const brightness = (c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722);
              // Gently lift neutral wall finishes toward pale, sun-faded concrete without recolouring props.
              const saturation = Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b);
              const likelyPlaster = wallLike || (brightness > 0.34 && saturation < 0.12 &&
                !/glass|window|door|roof|metal|leaf|plant|wood|road|asphalt|sign|light|frame|trim/.test(name));
              if (likelyPlaster) {
                // Apply to existing maps too: many GLB materials already have a bump map,
                // which previously prevented the cracked-plaster detail from appearing.
                if (wallLike) c.lerp(new THREE.Color(0xe2ddd3), 0.34);
                material.roughness = Math.max(material.roughness ?? 0.8, 0.92);
                material.metalness = Math.min(material.metalness ?? 0, 0.04);
                material.bumpMap = crackedPlaster;
                material.bumpScale = wallLike ? 0.11 : 0.055;
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
          [-size.x, 0, 0], [size.x, 0, 0], [0, 0, -size.z], [0, 0, size.z],
          [-size.x, 0, -size.z], [size.x, 0, -size.z], [-size.x, 0, size.z], [size.x, 0, size.z],
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
        // Visible red safe-zone boundary at the edge of the playable city.
        // This is visual-only; the existing invisible boundary meshes still handle collision.
        const barrierHeight = Math.max(12, Math.min(24, size.y * 0.72));
        const barrierY = bounds.min.y + barrierHeight / 2;
        const barrierMaterial = new THREE.MeshStandardMaterial({
          color: 0xff2525,
          emissive: 0xff1010,
          emissiveIntensity: 1.65,
          transparent: true,
          opacity: 0.48,
          roughness: 0.28,
          metalness: 0.08,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        const edgeMaterial = new THREE.MeshBasicMaterial({
          color: 0xff4545,
          transparent: true,
          opacity: 0.92,
          depthWrite: false,
          side: THREE.DoubleSide
        });
        const barriers = [
          { x: center.x, z: bounds.min.z + 0.35, width: size.x, depth: 0.12, rotation: 0 },
          { x: center.x, z: bounds.max.z - 0.35, width: size.x, depth: 0.12, rotation: 0 },
          { x: bounds.min.x + 0.35, z: center.z, width: size.z, depth: 0.12, rotation: Math.PI / 2 },
          { x: bounds.max.x - 0.35, z: center.z, width: size.z, depth: 0.12, rotation: Math.PI / 2 }
        ];
        for (const [index, spec] of barriers.entries()) {
          const panel = new THREE.Mesh(new THREE.PlaneGeometry(spec.width, barrierHeight), barrierMaterial);
          panel.name = 'TransparentRedSafeZoneBarrier_' + index;
          panel.position.set(spec.x, barrierY, spec.z);
          panel.rotation.y = spec.rotation;
          panel.renderOrder = 5;
          // Keep the barrier inside the city hierarchy so the player's existing raycast collision detects it.
          city.add(panel);

          // Bright top and bottom rails make the boundary legible from a distance.
          for (const y of [bounds.min.y + 0.08, bounds.min.y + barrierHeight]) {
            const rail = new THREE.Mesh(
              new THREE.BoxGeometry(spec.width, y === bounds.min.y + 0.08 ? 0.12 : 0.075, 0.09),
              edgeMaterial
            );
            rail.name = 'RedSafeZoneBarrierEdge_' + index;
            rail.position.set(spec.x, y, spec.z);
            rail.rotation.y = spec.rotation;
            rail.renderOrder = 6;
            city.add(rail);
          }
        }
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
