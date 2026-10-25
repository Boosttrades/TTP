import * as THREE from 'three';

/**
 * Invisible third-person movement controller for the dense-city prototype.
 * Attach to an existing Three.js scene and camera. The player collider is
 * deliberately invisible; camera follows its position from behind.
 */
export class InvisiblePlayerController {
  constructor({ scene, camera, renderer, city, start = new THREE.Vector3(0, 0, 0) }) {
    this.scene = scene; this.camera = camera; this.renderer = renderer; this.city = city;
    this.position = start.clone(); this.velocityY = 0; this.grounded = true;
    this.speed = 4.2; this.runMultiplier = 1.55; this.jumpSpeed = 5.3;
    this.radius = 0.32; this.height = 1.7;
    this.input = { x: 0, y: 0, run: false, jump: false };
    this.yaw = 0; this.pitch = -0.16; this.lookPointer = null; this.lastPointer = null;
    this.raycaster = new THREE.Raycaster(); this.raycaster.near = 0; this.raycaster.far = this.radius + 0.12;
    this._makeCollider(); this._makeJoystick(); this._bindLook(); this._bindKeys(); this._bindButtons();
    this._resize = () => this._positionJoystick(); window.addEventListener('resize', this._resize);
    this._positionJoystick(); this._updateCamera(0);
  }
  _makeCollider() {
    this.collider = new THREE.Mesh(new THREE.CylinderGeometry(this.radius, this.radius, this.height, 8), new THREE.MeshBasicMaterial({ visible: false }));
    this.collider.visible = false; this.collider.position.copy(this.position).add(new THREE.Vector3(0, this.height / 2, 0)); this.scene.add(this.collider);
  }
  _makeJoystick() {
    const style = document.createElement('style');
    style.textContent = `.tpp-stick-base{position:fixed;left:26px;bottom:30px;width:124px;height:124px;border-radius:50%;background:#ffffff20;border:2px solid #ffffff70;z-index:1000;touch-action:none;display:none}.tpp-stick-knob{position:absolute;width:54px;height:54px;left:33px;top:33px;border-radius:50%;background:#ffffff9c;border:2px solid #fff;box-sizing:border-box}.tpp-action{position:fixed;right:24px;bottom:36px;z-index:1001;padding:12px 16px;border-radius:24px;border:1px solid #ffffffa0;background:#18202ccc;color:white;font:600 14px system-ui;touch-action:manipulation}.tpp-run{right:26px;bottom:100px}.tpp-jump{right:26px;bottom:38px}@media (pointer:coarse){.tpp-stick-base{display:block}}`;
    document.head.appendChild(style); this.joystickStyle = style;
    this.stick = document.createElement('div'); this.stick.className = 'tpp-stick-base';
    this.knob = document.createElement('div'); this.knob.className = 'tpp-stick-knob'; this.stick.appendChild(this.knob); document.body.appendChild(this.stick);
    this.stick.addEventListener('pointerdown', e => { e.preventDefault(); this.stick.setPointerCapture(e.pointerId); this.stickPointer = e.pointerId; this._moveStick(e); });
    this.stick.addEventListener('pointermove', e => { if (e.pointerId === this.stickPointer) this._moveStick(e); });
    const end = e => { if (e.pointerId !== this.stickPointer) return; this.stickPointer = null; this.input.x = this.input.y = 0; this.knob.style.transform = 'translate(0px,0px)'; };
    this.stick.addEventListener('pointerup', end); this.stick.addEventListener('pointercancel', end);
  }
  _positionJoystick() {}
  _moveStick(e) {
    const rect = this.stick.getBoundingClientRect(), cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx, dy = e.clientY - cy; const max = 34, length = Math.hypot(dx, dy);
    if (length > max) { dx = dx / length * max; dy = dy / length * max; }
    this.knob.style.transform = `translate(${dx}px,${dy}px)`;
    this.input.x = THREE.MathUtils.clamp(dx / max, -1, 1); this.input.y = THREE.MathUtils.clamp(-dy / max, -1, 1);
  }
  _bindLook() {
    const canvas = this.renderer?.domElement || document;
    canvas.addEventListener('pointerdown', e => { if (e.target.closest?.('.tpp-stick-base,.tpp-action')) return; this.lookPointer = e.pointerId; this.lastPointer = { x: e.clientX, y: e.clientY }; });
    window.addEventListener('pointermove', e => {
      if (e.pointerId !== this.lookPointer || !this.lastPointer) return;
      const dx = e.clientX - this.lastPointer.x, dy = e.clientY - this.lastPointer.y; this.lastPointer = { x: e.clientX, y: e.clientY };
      this.yaw -= dx * 0.004; this.pitch = THREE.MathUtils.clamp(this.pitch - dy * 0.003, -0.8, 0.35);
    });
    const end = e => { if (e.pointerId === this.lookPointer) { this.lookPointer = null; this.lastPointer = null; } };
    window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
  }
  _bindKeys() {
    this.keys = new Set();
    window.addEventListener('keydown', e => { this.keys.add(e.code); if (e.code === 'Space') this.input.jump = true; if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.input.run = true; });
    window.addEventListener('keyup', e => { this.keys.delete(e.code); if (e.code === 'Space') this.input.jump = false; if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.input.run = false; });
  }
  _bindButtons() {
    this.runButton = document.createElement('button'); this.runButton.className = 'tpp-action tpp-run'; this.runButton.textContent = 'RUN';
    this.jumpButton = document.createElement('button'); this.jumpButton.className = 'tpp-action tpp-jump'; this.jumpButton.textContent = 'JUMP'; document.body.append(this.runButton, this.jumpButton);
    const runOn = e => { e.preventDefault(); this.input.run = true; }, runOff = () => { this.input.run = false; };
    this.runButton.addEventListener('pointerdown', runOn); this.runButton.addEventListener('pointerup', runOff); this.runButton.addEventListener('pointercancel', runOff); this.runButton.addEventListener('pointerleave', runOff);
    this.jumpButton.addEventListener('pointerdown', e => { e.preventDefault(); this.input.jump = true; });
    const jumpOff = () => { this.input.jump = false; }; this.jumpButton.addEventListener('pointerup', jumpOff); this.jumpButton.addEventListener('pointercancel', jumpOff);
  }
  _blockedAt(candidate, movement) {
    if (!this.city || movement.lengthSq() < 1e-10) return false;
    const direction = movement.clone().setY(0).normalize();
    // Raycast from the pre-move position so the clearance check is frame-rate independent.
    const origin = new THREE.Vector3(candidate.x - movement.x, candidate.y + 0.85, candidate.z - movement.z);
    this.raycaster.set(origin, direction); this.raycaster.far = this.radius + movement.length() + 0.08;
    const hits = this.raycaster.intersectObject(this.city, true);
    return Boolean(hits.find(h => h.object.isMesh && h.distance <= this.radius + movement.length()));
  }
  update(dt) {
    dt = Math.min(Math.max(dt, 0), 0.05);
    const forwardInput = this.input.y + (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) - (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0);
    const sideInput = this.input.x + (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);
    const inputLen = Math.hypot(sideInput, forwardInput), forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)), right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)), move = new THREE.Vector3();
    if (inputLen > 0.001) { move.addScaledVector(forward, forwardInput / Math.max(1, inputLen)); move.addScaledVector(right, sideInput / Math.max(1, inputLen)); move.normalize().multiplyScalar(this.speed * ((this.input.run || this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) ? this.runMultiplier : 1) * dt); }
    const nextX = this.position.clone(); nextX.x += move.x; if (!this._blockedAt(nextX, new THREE.Vector3(move.x, 0, 0))) this.position.x = nextX.x;
    const nextZ = this.position.clone(); nextZ.z += move.z; if (!this._blockedAt(nextZ, new THREE.Vector3(0, 0, move.z))) this.position.z = nextZ.z;
    if (this.input.jump && this.grounded) { this.velocityY = this.jumpSpeed; this.grounded = false; }
    this.velocityY -= 14 * dt; this.position.y += this.velocityY * dt;
    if (this.position.y <= 0) { this.position.y = 0; this.velocityY = 0; this.grounded = true; }
    this.collider.position.set(this.position.x, this.position.y + this.height / 2, this.position.z); this._updateCamera(dt);
  }
  _updateCamera() {
    const target = this.position.clone().add(new THREE.Vector3(0, 1.35, 0)), distance = 4.5, horizontal = Math.cos(this.pitch) * distance;
    const desired = target.clone().add(new THREE.Vector3(Math.sin(this.yaw) * horizontal, 1.1 - Math.sin(this.pitch) * distance, Math.cos(this.yaw) * horizontal));
    this.camera.position.lerp(desired, 0.18); this.camera.lookAt(target);
  }
  dispose() {
    window.removeEventListener('resize', this._resize); this.stick?.remove(); this.runButton?.remove(); this.jumpButton?.remove(); this.joystickStyle?.remove(); this.scene.remove(this.collider);
  }
}
