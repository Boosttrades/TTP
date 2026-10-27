import * as THREE from 'three';
import { loadDenseCity } from './world/loadDenseCity.js';
import { InvisiblePlayerController } from './controls/invisiblePlayerController.js';

const style = document.createElement('style');
style.textContent = `*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#9db4c2;font-family:system-ui,sans-serif;touch-action:none}canvas{display:block}#loading,#error{position:fixed;z-index:2000;left:50%;top:16px;transform:translateX(-50%);max-width:calc(100vw - 28px);padding:10px 14px;border-radius:10px;background:#101820df;color:white;font-size:14px}#error{top:64px;background:#632d2d}#error[hidden]{display:none}#help{position:fixed;top:14px;right:14px;color:white;background:#101820aa;padding:8px 10px;border-radius:8px;font-size:12px;z-index:900;pointer-events:none}@media(orientation:landscape){#landscape-gate{display:none!important}}#landscape-gate{position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center;padding:24px;background:linear-gradient(145deg,#0d2635,#173f4b);color:white;text-align:center}#landscape-gate .panel{max-width:360px}#landscape-gate h1{font-size:26px;margin:0 0 12px}#landscape-gate p{line-height:1.5;color:#d8e8ed}#landscape-gate button{border:0;border-radius:12px;background:#8ce5c0;color:#10332b;font-size:16px;font-weight:800;padding:14px 20px;min-height:48px}`;
document.head.appendChild(style);

const gate = document.createElement('div');
gate.id = 'landscape-gate';
gate.innerHTML = '<div class="panel"><h1>Play in Landscape</h1><p>Turn your phone sideways for the full-screen 3D city and easier movement controls.</p><button type="button">Enter Game</button></div>';
document.body.appendChild(gate);
gate.querySelector('button').addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
  } catch {}
  try {
    if (screen.orientation?.lock) await screen.orientation.lock('landscape');
  } catch {}
  if (matchMedia('(orientation: landscape)').matches) gate.remove();
});
const updateGate = () => {
  if (matchMedia('(orientation: landscape)').matches) gate.remove();
  else if (!document.getElementById('landscape-gate')) document.body.appendChild(gate);
};
addEventListener('orientationchange', updateGate);
addEventListener('resize', updateGate);

const loading = document.querySelector('#loading');
const errorBox = document.querySelector('#error');
const help = document.createElement('div'); help.id = 'help'; help.textContent = 'Drag to look Â· joystick to move Â· RUN / JUMP'; document.body.appendChild(help);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb8c6cc);
scene.fog = new THREE.Fog(0xb8c6cc, 28, 205);
const camera = new THREE.PerspectiveCamera(95, innerWidth / innerHeight, 0.1, 420);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xe8f2ff, 0x62584d, 1.65));
const sun = new THREE.DirectionalLight(0xfff1d8, 2.6);
sun.position.set(15, 28, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
sun.shadow.camera.left = -45;
sun.shadow.camera.right = 45;
sun.shadow.camera.top = 45;
sun.shadow.camera.bottom = -45;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 100;
sun.shadow.bias = -0.00025;
sun.shadow.normalBias = 0.025;
sun.shadow.radius = 4;
scene.add(sun);
// Soft fill keeps pale walls readable while the directional sun creates clear street shadows.
const fill = new THREE.DirectionalLight(0xdceaff, 0.45);
fill.position.set(-18, 10, -14);
scene.add(fill);

let controller = null;
const clock = new THREE.Clock();
try {
  let city;
  try {
    city = await loadDenseCity(scene);
  } catch (err) {
    throw new Error(`Could not load the city model at public/assets/dense_tightly_packed_city.glb: ${err?.message || err}`);
  }
  controller = new InvisiblePlayerController({ scene, camera, renderer, city, start: new THREE.Vector3(0, 0, 0) });
  loading.remove();
} catch (err) {
  loading.remove();
  errorBox.hidden = false;
  errorBox.textContent = err?.message || 'Unable to start the city environment.';
  console.error(err);
}
function animate() { requestAnimationFrame(animate); controller?.update(clock.getDelta()); renderer.render(scene, camera); }
animate();
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); });
