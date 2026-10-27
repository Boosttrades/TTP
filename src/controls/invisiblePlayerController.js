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
    this.speed = 0.56; this.runMultiplier = 2.5; this.jumpSpeed = 5.3 / 3;
    this.radius = 0.32; this.height = 1.7;
    this.input = { x: 0, y: 0, run: false, jump: false, slide: false };
    this.yaw = 0; this.pitch = -0.04; this.lookPointer = null; this.lastPointer = null;
    this.lookSensitivity = 1; this.layoutMode = false; this.controlScale = { stick: 1, run: 1, jump: 1, slide: 1, settings: 1 }; this.controlPositions = {};
    this._loadControlSettings();
    this.raycaster = new THREE.Raycaster(); this.raycaster.near = 0; this.raycaster.far = this.radius + 0.12;
    this._makeCollider(); this._makeJoystick(); this._bindLook(); this._bindKeys(); this._bindButtons(); this._makeSettings();
    this._resize = () => this._positionJoystick(); window.addEventListener('resize', this._resize);
    this._positionJoystick(); this._updateCamera(0);
  }
  _makeCollider() {
    this.collider = new THREE.Mesh(new THREE.CylinderGeometry(this.radius, this.radius, this.height, 8), new THREE.MeshBasicMaterial({ visible: false }));
    this.collider.visible = false; this.collider.position.copy(this.position).add(new THREE.Vector3(0, this.height / 2, 0)); this.scene.add(this.collider);
  }
  _makeJoystick() {
    const style = document.createElement('style');
    style.textContent = `.tpp-stick-base{position:fixed;left:26px;bottom:30px;width:124px;height:124px;border-radius:50%;background:#ffffff20;border:2px solid #ffffff70;z-index:1000;touch-action:none;display:none}.tpp-stick-knob{position:absolute;width:54px;height:54px;left:33px;top:33px;border-radius:50%;background:#ffffff9c;border:2px solid #fff;box-sizing:border-box}.tpp-action{position:fixed;right:24px;bottom:36px;z-index:1001;width:58px;height:58px;padding:0;display:flex;align-items:center;justify-content:center;border-radius:50%;border:1px solid #ffffff55;background:#ffffff12;color:#ffffffd9;touch-action:manipulation;backdrop-filter:blur(2px);filter:grayscale(1);opacity:.72}.tpp-action svg,.city-settings-button svg{width:31px;height:31px;display:block;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}.city-settings-button{width:48px;height:48px;padding:0;display:flex;align-items:center;justify-content:center;border-radius:50%;border:1px solid #ffffff55;background:#ffffff12;color:#ffffffd9;backdrop-filter:blur(2px)}.tpp-run{right:26px;bottom:100px}.tpp-jump{right:26px;bottom:38px}.tpp-slide{right:104px;bottom:38px}@media (pointer:coarse){.tpp-stick-base{display:block}}`;
    document.head.appendChild(style); this.joystickStyle = style;
    this.stick = document.createElement('div'); this.stick.className = 'tpp-stick-base';
    this.knob = document.createElement('div'); this.knob.className = 'tpp-stick-knob'; this.stick.appendChild(this.knob); document.body.appendChild(this.stick);
    this.stick.addEventListener('pointerdown', e => { e.preventDefault(); this.stick.setPointerCapture(e.pointerId); this.stickPointer = e.pointerId; this._moveStick(e); });
    this.stick.addEventListener('pointermove', e => { if (e.pointerId === this.stickPointer) this._moveStick(e); });
    const end = e => { if (e.pointerId !== this.stickPointer) return; this.stickPointer = null; this.input.x = this.input.y = 0; this.knob.style.transform = 'translate(0px,0px)'; };
    this.stick.addEventListener('pointerup', end); this.stick.addEventListener('pointercancel', end);
  }
  _loadControlSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem('cityGameControlsV1') || '{}');
      if (Number.isFinite(saved.sensitivity)) this.lookSensitivity = THREE.MathUtils.clamp(saved.sensitivity, 0.4, 2.5);
      if (saved.scale && typeof saved.scale === 'object') {
        for (const key of Object.keys(this.controlScale)) if (Number.isFinite(saved.scale[key])) this.controlScale[key] = THREE.MathUtils.clamp(saved.scale[key], 0.55, 6.0);
      }
      if (saved.positions && typeof saved.positions === 'object') this.controlPositions = saved.positions;
    } catch {}
  }
  _saveControlSettings() {
    try { localStorage.setItem('cityGameControlsV1', JSON.stringify({ sensitivity: this.lookSensitivity, scale: this.controlScale, positions: this.controlPositions })); } catch {}
  }
  _makeSettings() {
    const style = document.createElement('style');
    style.textContent = `
      .city-settings-button{position:fixed;top:14px;left:14px;z-index:1200;border:1px solid #ffffff80;border-radius:12px;background:#122333dc;color:#fff;padding:10px 14px;font:700 14px system-ui;box-shadow:0 5px 18px #0003;touch-action:manipulation}
      .city-settings-backdrop{position:fixed;inset:0;z-index:2200;background:#07131dcc;display:flex;align-items:center;justify-content:center;padding:16px;font:14px system-ui;color:#f4f8fb}
      .city-settings-panel{width:min(430px,100%);max-height:90dvh;overflow:auto;background:#142635;border:1px solid #527082;border-radius:18px;padding:18px;box-shadow:0 20px 60px #0008}
      .city-settings-panel h2{margin:0 0 14px;font-size:21px}.city-settings-panel h3{font-size:15px;margin:18px 0 8px}
      .city-settings-panel label{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:10px 0}
      .city-settings-panel input[type=range]{width:100%;accent-color:#8ce5c0}
      .city-settings-panel select,.city-settings-panel button{border:1px solid #718999;border-radius:9px;padding:9px 11px;background:#203a4a;color:white;font:600 13px system-ui}
      .city-settings-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.city-settings-row button.primary{background:#8ce5c0;color:#10332b;border-color:#8ce5c0}
      .city-settings-note{font-size:12px;line-height:1.45;color:#bed0d9;margin:8px 0}
      .city-layout-active{outline:2px dashed #8ce5c0!important;outline-offset:3px;touch-action:none!important;cursor:move!important;z-index:2401!important}
      .city-layout-editor{position:fixed;inset:0;z-index:2300;pointer-events:none;background:#07131d28;font:13px system-ui;color:#fff}
      .city-layout-toolbar{position:absolute;left:50%;top:12px;transform:translateX(-50%);display:flex;align-items:center;gap:9px;flex-wrap:wrap;justify-content:center;width:max-content;max-width:94vw;padding:10px 12px;background:#142635f2;border:1px solid #6b8799;border-radius:14px;box-shadow:0 8px 30px #0005;pointer-events:auto}
      .city-layout-toolbar strong{font-size:14px}.city-layout-toolbar span{font-size:11px;color:#c6d8e2}
      .city-layout-toolbar button{border:1px solid #718999;border-radius:8px;padding:8px 10px;background:#203a4a;color:white;font:700 12px system-ui}
      .city-layout-toolbar .city-layout-done{background:#8ce5c0;color:#10332b;border-color:#8ce5c0}
      .city-layout-resize-handle{position:absolute!important;right:-8px!important;bottom:-8px!important;width:26px!important;height:26px!important;border-radius:50%!important;background:#8ce5c0!important;border:2px solid #10332b!important;box-sizing:border-box!important;z-index:5!important;display:flex!important;align-items:center!important;justify-content:center!important;touch-action:none!important}
      .city-layout-resize-handle i{display:block;width:9px;height:9px;border-right:2px solid #10332b;border-bottom:2px solid #10332b}
    `;
    document.head.appendChild(style); this.settingsStyle = style;
    this.settingsButton = document.createElement('button');
    this.settingsButton.className = 'city-settings-button'; this.settingsButton.setAttribute('aria-label','Settings'); this.settingsButton.title='Settings'; this.settingsButton.textContent='⚙';
    this.settingsButton.addEventListener('click', () => this._openSettings());
    document.body.appendChild(this.settingsButton);
    this._applyControlLayout();
  }
  _controlElements() {
    return { stick: this.stick, run: this.runButton, jump: this.jumpButton, slide: this.slideButton, settings: this.settingsButton };
  }
  _applyControlLayout() {
    const elements = this._controlElements();
    for (const [key, el] of Object.entries(elements)) {
      if (!el) continue;
      el.style.transformOrigin = 'center center';
      el.style.scale = String(this.controlScale[key] || 1);
      const pos = this.controlPositions[key];
      if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
        el.style.left = (pos.x * 100) + 'vw'; el.style.top = (pos.y * 100) + 'vh';
        el.style.right = 'auto'; el.style.bottom = 'auto';
      } else {
        el.style.left = ''; el.style.top = ''; el.style.right = ''; el.style.bottom = '';
      }
    }
    this._positionJoystick();
  }
  _openSettings() {
    if (this.settingsBackdrop) return;
    const backdrop = document.createElement('div'); backdrop.className = 'city-settings-backdrop';
    backdrop.innerHTML = `<section class="city-settings-panel" role="dialog" aria-modal="true" aria-label="Game settings">
      <h2>Game Settings</h2>
      <h3>Screen sensitivity</h3>
      <label for="city-sensitivity"><span>Look sensitivity</span><strong id="city-sensitivity-value"></strong></label>
      <input id="city-sensitivity" type="range" min="0.4" max="2.5" step="0.1">
      <p class="city-settings-note">Adjust how quickly the camera turns when you drag the screen. Changes apply immediately and are saved on this device.</p>
      <h3>Layout settings</h3>
      <p class="city-settings-note">Choose a control, adjust its size, then enter layout mode and drag controls to where you want them.</p>
      <label for="city-layout-control"><span>Control</span><select id="city-layout-control"><option value="stick">Movement joystick</option><option value="run">Run button</option><option value="jump">Jump button</option><option value="slide">Slide button</option></select></label>
      <label for="city-control-size"><span>Control size</span><strong id="city-control-size-value"></strong></label>
      <input id="city-control-size" type="range" min="0.55" max="6" step="0.05">
      <div class="city-settings-row"><button id="city-layout-toggle" class="primary">Arrange controls</button><button id="city-layout-reset">Reset layout</button></div>
      <p class="city-settings-note" id="city-layout-status">Layout mode is off.</p>
      <div class="city-settings-row"><button id="city-settings-close" class="primary">Done</button></div>
    </section>`;
    document.body.appendChild(backdrop); this.settingsBackdrop = backdrop;
    const q = id => backdrop.querySelector('#' + id);
    const sens = q('city-sensitivity'), size = q('city-control-size'), select = q('city-layout-control');
    sens.value = String(this.lookSensitivity); size.value = String(this.controlScale[select.value]);
    const updateSensitivity = () => { this.lookSensitivity = Number(sens.value); q('city-sensitivity-value').textContent = this.lookSensitivity.toFixed(1) + '×'; this._saveControlSettings(); };
    const updateSize = () => { const key = select.value; this.controlScale[key] = Number(size.value); q('city-control-size-value').textContent = Math.round(this.controlScale[key] * 100) + '%'; this._applyControlLayout(); this._saveControlSettings(); };
    const updateSelectedSize = () => { size.value = String(this.controlScale[select.value]); updateSize(); };
    sens.addEventListener('input', updateSensitivity); size.addEventListener('input', updateSize); select.addEventListener('change', updateSelectedSize);
    q('city-layout-toggle').addEventListener('click', () => {
      this._closeSettings();
      this.layoutMode = true;
      this._setLayoutMode();
    });
    q('city-layout-reset').addEventListener('click', () => {
      this.controlPositions = {}; this.controlScale = { stick: 1, run: 1, jump: 1, slide: 1 };
      this._applyControlLayout(); updateSelectedSize(); this._saveControlSettings();
    });
    q('city-settings-close').addEventListener('click', () => this._closeSettings());
    backdrop.addEventListener('click', e => { if (e.target === backdrop) this._closeSettings(); });
    updateSensitivity(); updateSelectedSize();
  }
  _setLayoutMode() {
    const elements = this._controlElements();
    if (this.layoutMode) {
      if (!this.layoutEditor) {
        const editor = document.createElement('div');
        editor.className = 'city-layout-editor';
        editor.innerHTML = '<div class="city-layout-toolbar"><strong>Custom controls</strong><span>Drag buttons to move · drag corner to resize</span><button type="button" class="city-layout-reset-editor">Reset</button><button type="button" class="city-layout-done">Done</button></div>';
        document.body.appendChild(editor);
        this.layoutEditor = editor;
        editor.querySelector('.city-layout-done').addEventListener('click', () => { this.layoutMode = false; this._setLayoutMode(); this._saveControlSettings(); });
        editor.querySelector('.city-layout-reset-editor').addEventListener('click', () => {
          this.controlPositions = {};
          this.controlScale = { stick: 1, run: 1, jump: 1, slide: 1 };
          this._applyControlLayout(); this._saveControlSettings();
        });
      }
    } else {
      this.layoutEditor?.remove(); this.layoutEditor = null;
    }
    for (const [key, el] of Object.entries(elements)) {
      if (!el) continue;
      el.classList.toggle('city-layout-active', this.layoutMode);
      let handle = el.querySelector?.('.city-layout-resize-handle');
      if (this.layoutMode && !handle) {
        handle = document.createElement('span');
        handle.className = 'city-layout-resize-handle';
        handle.setAttribute('aria-label', 'Drag to resize control');
        handle.innerHTML = '<i></i>';
        el.appendChild(handle);
        handle.addEventListener('pointerdown', e => {
          if (!this.layoutMode) return;
          e.preventDefault(); e.stopPropagation();
          const startX = e.clientX, startY = e.clientY, startScale = this.controlScale[key] || 1;
          const move = ev => {
            if (ev.pointerId !== e.pointerId) return;
            const delta = Math.max(ev.clientX - startX, ev.clientY - startY);
            this.controlScale[key] = THREE.MathUtils.clamp(startScale + delta / 180, 0.55, 6.0);
            el.style.scale = String(this.controlScale[key]);
          };
          const finish = ev => {
            if (ev.pointerId !== e.pointerId) return;
            window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', finish);
            this._saveControlSettings();
          };
          window.addEventListener('pointermove', move); window.addEventListener('pointerup', finish);
        });
      }
      if (!this.layoutMode) handle?.remove();
      if (el.dataset.layoutBound) continue;
      el.dataset.layoutBound = '1';
      el.addEventListener('pointerdown', e => {
        if (!this.layoutMode || e.target.closest?.('.city-layout-resize-handle')) return;
        e.preventDefault(); e.stopPropagation();
        const rect = el.getBoundingClientRect(); const startX = e.clientX, startY = e.clientY, left = rect.left, top = rect.top;
        const move = ev => {
          if (ev.pointerId !== e.pointerId) return;
          const current = el.getBoundingClientRect();
          const x = THREE.MathUtils.clamp(left + ev.clientX - startX, 0, Math.max(0, innerWidth - current.width));
          const y = THREE.MathUtils.clamp(top + ev.clientY - startY, 0, Math.max(0, innerHeight - current.height));
          el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.right = 'auto'; el.style.bottom = 'auto';
          this.controlPositions[key] = { x: x / innerWidth, y: y / innerHeight };
        };
        const finish = ev => {
          if (ev.pointerId !== e.pointerId) return;
          window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', finish);
          this._saveControlSettings();
        };
        window.addEventListener('pointermove', move); window.addEventListener('pointerup', finish);
      });
    }
  }
  _closeSettings() {
    this.layoutMode = false; this._setLayoutMode();
    this.settingsBackdrop?.remove(); this.settingsBackdrop = null;
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
      this.yaw -= dx * 0.004 * this.lookSensitivity; this.pitch = THREE.MathUtils.clamp(this.pitch - dy * 0.003 * this.lookSensitivity, -Math.PI / 2, Math.PI / 2);
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
    this.runButton = document.createElement('button'); this.runButton.className = 'tpp-action tpp-run'; this.runButton.setAttribute('aria-label','Run'); this.runButton.title='Run'; this.runButton.textContent='🏃';
    this.jumpButton = document.createElement('button'); this.jumpButton.className = 'tpp-action tpp-jump'; this.jumpButton.setAttribute('aria-label','Jump'); this.jumpButton.title='Jump'; this.jumpButton.textContent='🦘';
    this.slideButton = document.createElement('button'); this.slideButton.className = 'tpp-action tpp-slide'; this.slideButton.setAttribute('aria-label','Slide'); this.slideButton.title='Slide'; this.slideButton.textContent='⇘';
    document.body.append(this.runButton, this.jumpButton, this.slideButton);
    const runOn = e => { e.preventDefault(); this.input.run = true; }, runOff = () => { this.input.run = false; };
    this.runButton.addEventListener('pointerdown', runOn); this.runButton.addEventListener('pointerup', runOff); this.runButton.addEventListener('pointercancel', runOff); this.runButton.addEventListener('pointerleave', runOff);
    this.jumpButton.addEventListener('pointerdown', e => { e.preventDefault(); this.input.jump = true; });
    const jumpOff = () => { this.input.jump = false; }; this.jumpButton.addEventListener('pointerup', jumpOff); this.jumpButton.addEventListener('pointercancel', jumpOff);
    this.slideButton.addEventListener('pointerdown', e => { e.preventDefault(); this.input.slide = true; });
    const slideOff = () => { this.input.slide = false; }; this.slideButton.addEventListener('pointerup', slideOff); this.slideButton.addEventListener('pointercancel', slideOff); this.slideButton.addEventListener('pointerleave', slideOff);
  }
  _blockedAt(candidate, movement) {
    if (!this.city || movement.lengthSq() < 1e-10) return false;
    const direction = movement.clone().setY(0).normalize();
    const start = new THREE.Vector3(candidate.x - movement.x, candidate.y, candidate.z - movement.z);
    const reach = this.radius + movement.length() + 0.1;
    const heights = [0.35, 0.9, 1.45];
    // Three centerline rays cover low obstacles, torso-height walls, and upper walls.
    // Keeping this to three recursive raycasts per axis avoids a heavy per-frame collision cost.
    for (const height of heights) {
      const origin = start.clone().add(new THREE.Vector3(0, height, 0));
      this.raycaster.set(origin, direction);
      this.raycaster.far = reach;
      const hit = this.raycaster.intersectObject(this.city, true).find(h => h.object.isMesh && h.distance <= reach && h.face);
      if (hit) return true;
    }
    return false;
  }
  update(dt) {
    dt = Math.min(Math.max(dt, 0), 0.05);
    const forwardInput = this.input.y + (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) - (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0);
    const sideInput = this.input.x + (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);
    const inputLen = Math.hypot(sideInput, forwardInput), forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)), right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)), move = new THREE.Vector3();
    if (inputLen > 0.001) { move.addScaledVector(forward, forwardInput / Math.max(1, inputLen)); move.addScaledVector(right, sideInput / Math.max(1, inputLen)); move.normalize().multiplyScalar(this.speed * (this.input.slide ? 0.45 : ((this.input.run || this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) ? this.runMultiplier : 1)) * dt); }
    const nextX = this.position.clone(); nextX.x += move.x; if (!this._blockedAt(nextX, new THREE.Vector3(move.x, 0, 0))) this.position.x = nextX.x;
    const nextZ = this.position.clone(); nextZ.z += move.z; if (!this._blockedAt(nextZ, new THREE.Vector3(0, 0, move.z))) this.position.z = nextZ.z;
    if (this.input.jump && this.grounded) { this.velocityY = this.jumpSpeed; this.grounded = false; }
    this.velocityY -= 14 * dt; this.position.y += this.velocityY * dt;
    if (this.position.y <= 0) { this.position.y = 0; this.velocityY = 0; this.grounded = true; }
    this.collider.position.set(this.position.x, this.position.y + this.height / 2, this.position.z); this._updateCamera(dt);
  }
  _updateCamera() {
    // First-person, street-level view: place the camera at eye height above the player's feet.
    const eye = this.position.clone().add(new THREE.Vector3(0, 0.2, 0));
    const direction = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    );
    this.camera.position.copy(eye);
    this.camera.lookAt(eye.clone().add(direction));
  }
  dispose() {
    window.removeEventListener('resize', this._resize); this.stick?.remove(); this.runButton?.remove(); this.jumpButton?.remove(); this.slideButton?.remove(); this.joystickStyle?.remove(); this.settingsButton?.remove(); this.settingsStyle?.remove(); this.settingsBackdrop?.remove(); document.querySelector('.city-layout-hint')?.remove(); this.layoutEditor?.remove(); this.layoutEditor = null; this.scene.remove(this.collider);
  }
}
