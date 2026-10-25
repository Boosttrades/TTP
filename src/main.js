import * as THREE from 'three';
import { loadDenseCity } from './world/loadDenseCity.js';
import { InvisiblePlayerController } from './controls/invisiblePlayerController.js';

const style = document.createElement('style');
style.textContent = `*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#9db4c2;font-family:system-ui,sans-serif;touch-action:none}canvas{display:block}#loading,#error{position:fixed;z-index:2000;left:50%;top:16px;transform:translateX(-50%);max-width:calc(100vw - 28px);padding:10px 14px;border-radius:10px;background:#101820df;color:white;font-size:14px}#error{top:64px;background:#632d2d}#error[hidden]{display:none}#help{position:fixed;top:14px;right:14px;color:white;background:#101820aa;padding:8px 10px;border-radius:8px;font-size:12px;z-index:900;pointer-events:none}`;
document.head.appendChild(style);
const loading = document.querySelector('#loading');
const errorBox = document.querySelector('#error');
const help = document.createElement('div'); help.id = 'help'; help.textContent = 'Drag to look · joystick to move · RUN / JUMP'; document.body.appendChild(help);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9db4c2);
scene.fog = new THREE.Fog(0x9db4c2, 35, 125);
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 300);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = false;
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xe5f2ff, 0x49505a, 2));
const sun = new THREE.DirectionalLight(0xfff0d4, 2.2);
sun.position.set(15, 28, 10);
scene.add(sun);

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
