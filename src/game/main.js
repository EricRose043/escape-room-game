import * as THREE from 'three';
import {
  createPlayer, updatePlayer, setPaused, EYE_HEIGHT, LEVEL_BOXES, ROOM_SURFACES,
  readGamepad, mergeActions, buttonLabel, createPrompt, updatePrompt, pauseOnDisconnect,
  createSession, updateSession, keyboardInteractPressed, gameplayActions,
  ITEMS, selectItem, createFlashlight, updateEquipment, keyboardEquipmentActions,
  BEAM, CLUES, isClueVisible, viewRay,
} from '../logic/index.js';

const MOUSE_SENSITIVITY = 0.002; // 弧度／像素；滑鼠只送角度位移，不換算成速度。
let player = createPlayer();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c1015);

const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 50);
camera.rotation.order = 'YXZ';

// 簡單幾何、無即時陰影或後製；像素比上限 1，降低內顯負擔。
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1));
document.body.appendChild(renderer.domElement);

const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x42434a });
const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x586367 });
const ceilingMaterial = new THREE.MeshLambertMaterial({ color: 0x343941 });
const tableMaterial = new THREE.MeshLambertMaterial({ color: 0x66504c });

function addBox(width, height, depth, x, y, z, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return mesh;
}

const materials = { partition: wallMaterial, wall: wallMaterial, table: tableMaterial, floor: floorMaterial, ceiling: ceilingMaterial };
for (const box of [...LEVEL_BOXES, ...ROOM_SURFACES]) {
  addBox(box.maxX - box.minX, box.maxY - box.minY, box.maxZ - box.minZ,
    (box.minX + box.maxX) / 2, (box.minY + box.maxY) / 2, (box.minZ + box.maxZ) / 2,
    materials[box.kind]);
}

// 每個模型直接從唯一物品 AABB 建立，不另存座標或尺寸。
let inventory = { itemIds: [] };
let flashlight = createFlashlight();
const itemMeshes = new Map(ITEMS.map(item => [item.id,
  addBox(item.maxX - item.minX, item.maxY - item.minY, item.maxZ - item.minZ,
    (item.minX + item.maxX) / 2, (item.minY + item.maxY) / 2, (item.minZ + item.maxZ) / 2,
    new THREE.MeshLambertMaterial({ color: item.color }))]));

scene.add(new THREE.AmbientLight(0x8e9eae, 0.45));
const lamp = new THREE.PointLight(0xffd7a0, 26, 18, 2);
lamp.position.set(0, 3.1, -1);
scene.add(lamp);
addBox(0.7, 0.08, 0.4, 0, 3.4, -1,
  new THREE.MeshBasicMaterial({ color: 0xffd7a0 }));

// 單盞手電筒，不開陰影或後製；照射範圍與 logic 共用設定。
const torch = new THREE.SpotLight(0xffeed0, 35, BEAM.distance, BEAM.halfAngle, 0, 2);
torch.castShadow = false;
torch.visible = false;
scene.add(torch);
scene.add(torch.target);

const clueMeshes = new Map(CLUES.map(clue => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 360;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#caff9e';
  context.font = 'bold 180px system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(clue.text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(clue.width, clue.height),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
  const p = clue.position;
  mesh.position.set(p.x, p.y, p.z);
  mesh.lookAt(p.x + clue.normal.x, p.y + clue.normal.y, p.z + clue.normal.z);
  mesh.visible = false;
  scene.add(mesh);
  return [clue.id, mesh];
}));

function syncLighting() {
  const { origin, direction } = viewRay(player);
  torch.position.set(origin.x, origin.y, origin.z);
  torch.target.position.set(origin.x + direction.x, origin.y + direction.y, origin.z + direction.z);
  torch.visible = flashlight.enabled && flashlight.charge > 0;
  torch.color.setHex(flashlight.mode === 'uv' ? 0x9977ff : 0xffeed0);
  for (const clue of CLUES) {
    clueMeshes.get(clue.id).visible = isClueVisible(player, flashlight, clue);
  }
}

function resize() {
  const width = window.innerWidth;
  const height = Math.max(window.innerHeight, 1);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
window.addEventListener('resize', resize);
resize();

const keys = new Set();
const pauseScreen = document.querySelector('#pause-screen');
const pauseTitle = document.querySelector('#pause-title');
const lockMessage = document.querySelector('#lock-message');
const resumeButton = document.querySelector('#resume');
const controlsHint = document.querySelector('#controls-hint');
const inputHint = document.querySelector('#input-hint');
const pauseInstructions = document.querySelector('#pause-instructions');
const gamepadStatus = document.querySelector('#gamepad-status');
const chargeMeter = document.querySelector('#charge-meter');
const chargeText = document.querySelector('#charge-text');
const flashlightMode = document.querySelector('#flashlight-mode');
const crosshair = document.querySelector('#crosshair');
const interactionHint = document.querySelector('#interaction-hint');
const previousPads = new Map();
let prompt = createPrompt();
let session = createSession();
let selectedPadIndex = null;
let keyboardActivity = false;
let interactPending = false;
let equipmentPending = { flashlightPressed: false, uvPressed: false };
let disconnectedMessage = false;
let dYaw = 0;
let dPitch = 0;
let previousTime;
let requestingLock = false;
let unlockForGamepad = false;

function setText(element, text) {
  if (element.textContent !== text) element.textContent = text;
}

function syncUI() {
  pauseScreen.hidden = !session.paused;
  crosshair.hidden = session.paused;
  const target = selectItem(player, inventory);
  interactionHint.hidden = !target;
  setText(interactionHint, target ? `${buttonLabel('interact', prompt.device)} 撿起 ${target.name}` : '');
  setText(pauseTitle, session.hasStarted ? '已暫停' : '星星糖果樂園');
  setText(resumeButton, session.hasStarted ? '繼續（鍵盤滑鼠）' : '開始（鍵盤滑鼠）');
  chargeMeter.value = flashlight.charge;
  setText(chargeText, `${Math.ceil(flashlight.charge)}%`);
  setText(flashlightMode, `${flashlight.mode === 'uv' ? '紫外光' : '一般光'} · ${flashlight.enabled ? '開啟' : '關閉'}`);
  const device = prompt.device;
  setText(controlsHint, `${buttonLabel('move', device)} 走路 · ${buttonLabel('look', device)} 轉頭 · ${buttonLabel('pause', device)} 暫停 · ${buttonLabel('flashlight', device)} 手電筒 · ${buttonLabel('uv', device)} 切換光線`);
  setText(pauseInstructions, device === 'keyboard'
    ? '鍵盤滑鼠：按下方按鈕。手把：按任一鍵喚醒，A／✕ 開始，Start／Options 暫停與繼續。'
    : session.hasStarted ? `按 ${buttonLabel('pause', device)} 繼續，或使用下方按鈕切換鍵盤滑鼠。`
      : `按 ${buttonLabel('confirm', device)} 開始（不需要鎖定滑鼠）。`);
  setText(inputHint, !session.paused && device === 'keyboard' && document.pointerLockElement !== renderer.domElement
    ? '點一下畫面以啟用滑鼠轉頭' : '');
}

function clearInput() {
  keys.clear();
  interactPending = false;
  equipmentPending = { flashlightPressed: false, uvPressed: false };
  dYaw = 0;
  dPitch = 0;
  keyboardActivity = false;
  previousTime = undefined;
}

function applySession(actions) {
  const next = updateSession(session, actions);
  if (next.paused !== session.paused || next.hasStarted !== session.hasStarted) clearInput();
  if (!next.paused && disconnectedMessage) clearDisconnectMessage();
  session = next;
  player = setPaused(player, session.paused);
  syncUI();
}

function releasePointerForGamepad() {
  if (document.pointerLockElement === renderer.domElement) {
    // 這次解鎖是切換操作方式，不是玩家按 Esc；不可再把遊戲暫停。
    unlockForGamepad = true;
    document.exitPointerLock();
  }
}

function lockFailed() {
  lockMessage.textContent = '無法鎖定滑鼠，請再點一次鍵盤滑鼠的開始／繼續按鈕。';
}

async function requestLock() {
  if (requestingLock || document.pointerLockElement === renderer.domElement) return;
  requestingLock = true;
  try {
    await renderer.domElement.requestPointerLock();
  } catch {
    lockFailed();
  } finally {
    requestingLock = false;
  }
}

resumeButton.addEventListener('click', requestLock);
renderer.domElement.addEventListener('click', () => {
  keyboardActivity = true;
  if (!session.hasStarted || !session.paused) requestLock();
});
document.addEventListener('pointerlockerror', lockFailed);
document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === renderer.domElement;
  if (locked) {
    unlockForGamepad = false;
    clearInput();
    keyboardActivity = true;
    applySession(session.hasStarted ? { pausePressed: session.paused } : { confirmPressed: true });
    lockMessage.textContent = '';
  } else if (unlockForGamepad) {
    unlockForGamepad = false;
    dYaw = 0;
    dPitch = 0;
    syncUI();
  } else {
    // Esc 解鎖以 pointerlockchange 為準，不依賴 keydown。
    clearInput();
    applySession({ forcePause: true });
    lockMessage.textContent = '可用 Start／Options 繼續，或按鍵盤滑鼠的繼續按鈕。';
  }
});

document.addEventListener('keydown', (event) => {
  if (!['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Escape', 'KeyE', 'KeyF', 'KeyR'].includes(event.code)) return;
  keyboardActivity = true;
  if (event.code === 'Escape') {
    if (!event.repeat && document.pointerLockElement !== renderer.domElement) applySession({ forcePause: true });
    return;
  }
  if (keyboardInteractPressed(event) && !session.paused && !document.hidden && document.hasFocus()) {
    event.preventDefault();
    interactPending = true;
  }
  if (!session.paused && !document.hidden && document.hasFocus()) {
    const equipment = keyboardEquipmentActions(event);
    if (equipment.flashlightPressed || equipment.uvPressed) event.preventDefault();
    equipmentPending.flashlightPressed ||= equipment.flashlightPressed;
    equipmentPending.uvPressed ||= equipment.uvPressed;
  }
  if (session.paused || !['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) return;
  event.preventDefault();
  keys.add(event.code);
});
document.addEventListener('keyup', (event) => keys.delete(event.code));
document.addEventListener('mousemove', (event) => {
  if (!event.movementX && !event.movementY) return;
  keyboardActivity = true;
  if (session.paused || document.pointerLockElement !== renderer.domElement) return;
  dYaw -= event.movementX * MOUSE_SENSITIVITY;
  dPitch -= event.movementY * MOUSE_SENSITIVITY;
});

function pauseForFocusLoss() {
  clearInput();
  applySession({ focusLost: true });
  if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
}
window.addEventListener('blur', pauseForFocusLoss);

function clearDisconnectMessage() {
  if (!disconnectedMessage) return;
  disconnectedMessage = false;
  lockMessage.textContent = '';
}

function disconnectPad(index) {
  previousPads.delete(index);
  if (selectedPadIndex === index) selectedPadIndex = null;
  if (pauseOnDisconnect(prompt, index)) {
    clearInput();
    applySession({ forcePause: true });
    if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
    prompt = createPrompt();
    disconnectedMessage = true;
    lockMessage.textContent = '使用中的手把已拔除；重新連接後按 Start／Options 繼續，或改用鍵盤滑鼠。';
  }
}
window.addEventListener('gamepaddisconnected', (event) => disconnectPad(event.gamepad.index));
window.addEventListener('gamepadconnected', () => {
  // 實際數值仍在下一幀輪詢，再交給 logic 判斷。
  gamepadStatus.textContent = '已偵測到手把，請按 A／✕ 開始。';
});

function pollGamepads() {
  let pads;
  try {
    if (!navigator.getGamepads) {
      setText(gamepadStatus, '此瀏覽器無法讀取手把，請使用鍵盤滑鼠。');
      return null;
    }
    pads = Array.from(navigator.getGamepads());
  } catch {
    setText(gamepadStatus, '瀏覽器未開放手把存取，請使用鍵盤滑鼠。');
    return null;
  }
  const seen = new Set();
  const supported = [];
  let unsupported = false;
  for (const raw of pads) {
    if (!raw || raw.connected === false) continue;
    seen.add(raw.index);
    const previous = previousPads.get(raw.index);
    const result = readGamepad(raw, previous?.id === raw.id ? previous.buttons : []);
    previousPads.set(raw.index, { id: raw.id, buttons: result.buttons });
    if (result.supported) supported.push(result);
    else unsupported = true;
  }
  for (const index of previousPads.keys()) {
    if (!seen.has(index)) disconnectPad(index);
  }
  const active = supported.filter((result) => result.active);
  const selected = active.find((result) => result.index === selectedPadIndex) ?? active[0]
    ?? supported.find((result) => result.index === selectedPadIndex) ?? supported[0];
  selectedPadIndex = selected?.index ?? null;
  if (selected) clearDisconnectMessage();
  const name = selected?.device === 'ps' ? 'PS' : selected?.device === 'xbox' ? 'Xbox' : '未知種類（使用 Xbox 按鍵名稱）';
  setText(gamepadStatus, [selected ? `${name} 手把已連線。` : '按手把任一鍵喚醒。',
    unsupported ? '有手把不是 standard 映射：目前不支援，請改用標準模式或鍵盤滑鼠。' : ''].filter(Boolean).join(' '));
  return selected;
}

function readActions(time) {
  const pad = pollGamepads();
  // 背景時仍更新前幀按鈕狀態，避免回到前景時把長按當成新按下。
  if (document.hidden || !document.hasFocus()) {
    clearInput();
    applySession({ focusLost: true });
    return mergeActions();
  }
  const candidate = keyboardActivity ? { device: 'keyboard' }
    : pad?.active ? { device: pad.device, gamepadIndex: pad.index } : null;
  prompt = updatePrompt(prompt, candidate, time);
  keyboardActivity = false;

  const before = session;
  if (pad?.actions.pausePressed || (!session.hasStarted && pad?.actions.confirmPressed)) {
    applySession(pad.actions);
    releasePointerForGamepad();
    lockMessage.textContent = '';
  }
  let x = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
  let y = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
  const length = Math.max(1, Math.hypot(x, y));
  x /= length;
  y /= length;
  // 暫停已在 session 處理；交給 movement 的動作不可再次觸發暫停。
  const merged = mergeActions({ move: { x, y }, look: { dYaw, dPitch }, interactPressed: interactPending, ...equipmentPending }, pad?.actions);
  const actions = gameplayActions(merged, before, session);
  interactPending = false;
  equipmentPending = { flashlightPressed: false, uvPressed: false };
  actions.pausePressed = false;
  dYaw = 0;
  dPitch = 0;
  syncUI();
  return actions;
}
syncUI();

const fpsDisplay = document.querySelector('#fps');
let frames = 0;
let sampleStart;

function animate(time) {
  if (sampleStart === undefined) sampleStart = time;
  const dt = previousTime === undefined ? 0 : (time - previousTime) / 1000;
  previousTime = time;
  const actions = readActions(time);
  player = updatePlayer(player, actions, dt);
  const equipment = updateEquipment({ inventory, flashlight }, player, actions, dt);
  inventory = equipment.inventory;
  flashlight = equipment.flashlight;
  for (const id of inventory.itemIds) {
    const mesh = itemMeshes.get(id);
    if (!mesh) continue;
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
    itemMeshes.delete(id);
  }
  syncUI();
  camera.position.set(player.x, EYE_HEIGHT, player.z);
  camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
  syncLighting();
  renderer.render(scene, camera);
  frames += 1;
  const elapsed = time - sampleStart;
  if (elapsed >= 1000) {
    fpsDisplay.textContent = `FPS: ${Math.round(frames * 1000 / elapsed)}`;
    frames = 0;
    sampleStart = time;
  }
  requestAnimationFrame(animate);
}

// 背景分頁停止繪圖時，不把閒置時間混入下一次 FPS 取樣。
document.addEventListener('visibilitychange', () => {
  frames = 0;
  sampleStart = undefined;
  if (document.hidden) pauseForFocusLoss();
});
requestAnimationFrame(animate);
