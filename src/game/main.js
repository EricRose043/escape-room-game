import * as THREE from 'three';
import { createPlayer, updatePlayer, setPaused, EYE_HEIGHT, LEVEL_BOXES, ROOM_SURFACES } from '../logic/index.js';

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
}

const materials = { wall: wallMaterial, table: tableMaterial, floor: floorMaterial, ceiling: ceilingMaterial };
for (const box of [...LEVEL_BOXES, ...ROOM_SURFACES]) {
  addBox(box.maxX - box.minX, box.maxY - box.minY, box.maxZ - box.minZ,
    (box.minX + box.maxX) / 2, (box.minY + box.maxY) / 2, (box.minZ + box.maxZ) / 2,
    materials[box.kind]);
}

scene.add(new THREE.AmbientLight(0x8e9eae, 0.55));
const lamp = new THREE.PointLight(0xffd7a0, 45, 18, 2);
lamp.position.set(0, 3.1, -1);
scene.add(lamp);
addBox(0.7, 0.08, 0.4, 0, 3.4, -1,
  new THREE.MeshBasicMaterial({ color: 0xffd7a0 }));

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
let dYaw = 0;
let dPitch = 0;
let previousTime;
let hasStarted = false;
let requestingLock = false;

function clearInput() {
  keys.clear();
  dYaw = 0;
  dPitch = 0;
  previousTime = undefined;
}

function lockFailed() {
  lockMessage.textContent = '無法鎖定滑鼠，請再點一次「繼續」。';
}

async function requestLock() {
  if (requestingLock || document.pointerLockElement === renderer.domElement) return;
  requestingLock = true;
  try {
    // 相容回傳 Promise 或 undefined 的瀏覽器，包含 Esc 後短暫拒絕重新鎖定。
    await renderer.domElement.requestPointerLock();
  } catch {
    lockFailed();
  } finally {
    requestingLock = false;
  }
}

resumeButton.addEventListener('click', requestLock);
renderer.domElement.addEventListener('click', () => {
  if (!hasStarted) requestLock();
});
document.addEventListener('pointerlockerror', lockFailed);
document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === renderer.domElement;
  clearInput();
  if (locked) {
    hasStarted = true;
    player = setPaused(player, false);
    pauseScreen.hidden = true;
    lockMessage.textContent = '';
  } else {
    // Esc 可能不產生 keydown；以瀏覽器實際解鎖事件作為暫停依據。
    player = updatePlayer(player, { pausePressed: true }, 0);
    pauseTitle.textContent = '已暫停';
    resumeButton.textContent = '繼續';
    pauseScreen.hidden = false;
    lockMessage.textContent = '按「繼續」重新鎖定滑鼠。';
  }
});

document.addEventListener('keydown', (event) => {
  if (player.paused || !['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) return;
  event.preventDefault();
  keys.add(event.code);
});
document.addEventListener('keyup', (event) => keys.delete(event.code));
document.addEventListener('mousemove', (event) => {
  if (player.paused || document.pointerLockElement !== renderer.domElement) return;
  dYaw -= event.movementX * MOUSE_SENSITIVITY;
  dPitch -= event.movementY * MOUSE_SENSITIVITY;
});

function pauseForFocusLoss() {
  clearInput();
  player = updatePlayer(player, { pausePressed: true }, 0);
  pauseTitle.textContent = '已暫停';
  resumeButton.textContent = '繼續';
  pauseScreen.hidden = false;
  if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
}
window.addEventListener('blur', pauseForFocusLoss);

function readActions() {
  let x = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
  let y = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
  const length = Math.max(1, Math.hypot(x, y));
  x /= length;
  y /= length;
  const actions = { move: { x, y }, look: { dYaw, dPitch, yawRate: 0, pitchRate: 0 }, pausePressed: false };
  dYaw = 0;
  dPitch = 0;
  return actions;
}

const fpsDisplay = document.querySelector('#fps');
let frames = 0;
let sampleStart;

function animate(time) {
  if (sampleStart === undefined) sampleStart = time;
  const dt = previousTime === undefined ? 0 : (time - previousTime) / 1000;
  previousTime = time;
  player = updatePlayer(player, readActions(), dt);
  camera.position.set(player.x, EYE_HEIGHT, player.z);
  camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
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
