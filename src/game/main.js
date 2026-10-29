import * as THREE from 'three';
import {
  setPaused, EYE_HEIGHT,
  readGamepad, mergeActions, buttonLabel, createPrompt, updatePrompt, pauseOnDisconnect,
  createSession, updateSession, keyboardInteractPressed, gameplayActions,
  ITEMS, selectChapterTarget, deviceMessage, keyboardEquipmentActions,
  BEAM, CLUES, isClueVisible, viewRay, rayBoxDistance,
  createChapter, updateChapter, hasFlashlight, getGeometry, keyboardKeypadCommand,
  createSaveStorage, restoreChapterSave, createStartMenu, updateStartMenu,
  keyboardStartMenuCommand, startMenuGamepadCommand,
} from '../logic/index.js';
import { createWorldView } from './world-view.js';
import { createMonsterView } from './monster-view.js';
import { createKeypadView } from './keypad-view.js';
import { createCaptureView } from './capture-view.js';
import { createStartMenuView } from './start-menu-view.js';
import { compensatedIntensity } from './lighting.js';
import { createFactoryAudio } from './audio.js';

const MOUSE_SENSITIVITY = 0.002; // 弧度／像素；滑鼠只送角度位移，不換算成速度。
// 僅供監督者驗收開啟分支；待 S2 設定接上後移除。
const chapterOptions={jumpScare:new URLSearchParams(window.location.search).get('jumpscare')==='1'};
let chapter = createChapter(chapterOptions);
const intro=document.querySelector('#story-intro');
const introSlides=['曾經，這裡製作的玩具風靡全城。每個孩子都想帶一個回家。','一夜之間，公司突然關閉。沒有公告，也沒有人知道原因。','封存的監視畫面裡，藍色展示玩偶在斷電後自行移動。','最後一張維修單只留下警告：不要替展示玩偶接上電源。','多年後，你走進工廠。身後的門鎖上了。'];
let introStarted=performance.now(),introStage=-1;
let introTimer;
function finishIntro(){intro.hidden=true;clearInterval(introTimer);try{audio.start();}catch{}}
document.querySelector('#intro-skip').addEventListener('click',finishIntro);
introTimer=setInterval(()=>{const elapsed=performance.now()-introStarted;if(elapsed>=60000){finishIntro();return;}const stage=Math.min(4,Math.floor(elapsed/12000));if(stage!==introStage){introStage=stage;intro.dataset.scene=String(stage);document.querySelector('#intro-copy').textContent=introSlides[stage];}},250);
introTimer?.unref?.();
// 將存取包在函式內，連 localStorage getter 拋錯也交由儲存層處理。
const saveStorage=createSaveStorage({
  getItem:key=>window.localStorage.getItem(key),
  setItem:(key,value)=>window.localStorage.setItem(key,value),
  removeItem:key=>window.localStorage.removeItem(key),
});
let startMenu=createStartMenu(saveStorage.load());

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c1015);

const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 50);
camera.rotation.order = 'YXZ';

// 簡單幾何、無即時陰影或後製；像素比上限 1，降低內顯負擔。
const renderer = new THREE.WebGLRenderer({ antialias: true });
let renderPixelRatio=Math.min(window.devicePixelRatio||1,1.25);
renderer.setPixelRatio(renderPixelRatio);
document.body.appendChild(renderer.domElement);

const worldView = createWorldView(scene);
const monsterView = createMonsterView(scene);
const audio=createFactoryAudio();
const audioToggle=document.querySelector('#audio-toggle');
audioToggle.hidden=!audio.supported();
audioToggle.addEventListener('click',()=>{const muted=audio.toggle();audioToggle.textContent=muted?'音效：靜音':'音效：開啟';});
function addBox(width, height, depth, x, y, z, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return mesh;
}

// 每個模型直接從唯一物品 AABB 建立，不另存座標或尺寸。
const itemMeshes = new Map(ITEMS.map(item => [item.id,
  addBox(item.maxX - item.minX, item.maxY - item.minY, item.maxZ - item.minZ,
    (item.minX + item.maxX) / 2, (item.minY + item.maxY) / 2, (item.minZ + item.maxZ) / 2,
    new THREE.MeshLambertMaterial({ color: item.color }))]));

scene.add(new THREE.AmbientLight(0x8e9eae, 0.45));

// 單盞手電筒，不開陰影或後製；照射範圍與 logic 共用設定。
const torch = new THREE.SpotLight(0xffeed0, 18, BEAM.distance, BEAM.halfAngle, 0, 2);
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
  context.fillText(clue.text, canvas.width / 2, canvas.height / 2, canvas.width - 32);
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
  const ray = viewRay(chapter.player);
  const { origin, direction } = ray;
  const geometry = getGeometry(chapter);
  let nearest = Infinity;
  for (const box of [...geometry.occluderBoxes, ...ITEMS.filter(item => !chapter.inventory.itemIds.includes(item.id))]) {
    const hit = rayBoxDistance(ray, box);
    if (hit !== null) nearest = Math.min(nearest, hit);
  }
  torch.intensity = compensatedIntensity(nearest,18);
  torch.position.set(origin.x, origin.y, origin.z);
  torch.target.position.set(origin.x + direction.x, origin.y + direction.y, origin.z + direction.z);
  torch.visible = hasFlashlight(chapter) && chapter.flashlight.enabled && chapter.flashlight.charge > 0;
  torch.color.setHex(chapter.flashlight.mode === 'uv' ? 0x9977ff : 0xffeed0);
  for (const clue of CLUES) {
    clueMeshes.get(clue.id).visible = isClueVisible(chapter.player, chapter.flashlight, clue, geometry.occluderBoxes);
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
const chargeRow = document.querySelector('#charge-row');
const chargeMeter = document.querySelector('#charge-meter');
const chargeText = document.querySelector('#charge-text');
const flashlightMode = document.querySelector('#flashlight-mode');
const crosshair = document.querySelector('#crosshair');
const interactionHint = document.querySelector('#interaction-hint');
const contactHint = document.querySelector('#contact-hint');
const hidingHint = document.querySelector('#hiding-hint');
const saveStatus = document.querySelector('#save-status');
const startOpen = document.querySelector('#start-open');
const captureView = createCaptureView(document.querySelector('#capture-screen'));
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
let pointerLockFailed = false;
let dragLooking=false;
let unlockReason = null;
let keypadPending = [];
const keypadView = createKeypadView(document.querySelector('#keypad-screen'),command=>{
  if (chapter.ui.mode !== 'keypad' || session.paused || document.hidden || !document.hasFocus()) return;
  keyboardActivity = true;
  keypadPending.push(command);
});
const startMenuView=createStartMenuView(document.querySelector('#start-menu'),command=>{
  keyboardActivity=true;handleStartCommand(command,'keyboard');
});

function setText(element, text) {
  if (element.textContent !== text) element.textContent = text;
}

function syncUI() {
  pauseScreen.hidden = !session.paused || startMenu.mode!=='closed';
  startMenuView.sync(startMenu,prompt.device);
  startOpen.hidden=!session.hasStarted;
  setText(saveStatus,saveStorage.status().message);
  setText(document.querySelector('#start-save-status'),saveStorage.status().message);
  keypadView.sync(chapter.ui,session.paused,prompt.device);
  captureView.sync(chapter.ui,{...chapterOptions,paused:session.paused});
  let completed=false;try {completed=window.localStorage.getItem('toy-factory-complete')==='true';} catch {}
  const hasMap=chapter.inventory.itemIds.includes('lobby.factory-map') || completed;
  document.querySelector('#factory-map-button').hidden=!hasMap || chapter.ui.mode==='complete';
  document.querySelector('#ending-screen').hidden=chapter.ui.mode!=='complete';
  crosshair.hidden = session.paused || chapter.ui.mode!=='explore';
  const target = selectChapterTarget(chapter);
  interactionHint.hidden = !target;
  const message=target && chapter.ui.messageTargetId===target.id?chapter.ui.message:null;
  setText(interactionHint, target ? `${buttonLabel('interact', prompt.device)} ${target.bounds ? `${target.name}｜${message ?? deviceMessage(chapter,target)}` : `撿起 ${target.name}`}` : '');
  const contact=Object.values(chapter.monsters).some(m=>m.contactFeedbackRemaining>0);
  contactHint.hidden=session.paused || chapter.ui.mode!=='explore' || !contact;
  setText(contactHint,contact?'衣角被扯住了。':'');
  const hiding=chapter.ui.mode==='hiding';
  hidingHint.hidden=session.paused || !hiding;
  setText(hidingHint,hiding?`${chapter.ui.message || '躲藏中'} · ${buttonLabel('interact',prompt.device)} 出櫃`:'');
  setText(pauseTitle, session.hasStarted ? '已暫停' : '失落玩具工廠');
  setText(resumeButton, session.hasStarted ? '繼續（鍵盤滑鼠）' : '開始（鍵盤滑鼠）');
  chargeRow.hidden = !hasFlashlight(chapter);
  chargeMeter.value = chapter.flashlight.charge;
  setText(chargeText, `${Math.ceil(chapter.flashlight.charge)}%`);
  setText(flashlightMode, `${chapter.flashlight.mode === 'uv' ? '紫外光' : '一般光'} · ${chapter.flashlight.enabled ? '開啟' : '關閉'}`);
  const device = prompt.device;
  setText(controlsHint, chapter.ui.mode==='caught' ? `回復中 · ${buttonLabel('pause',device)} 暫停` : hiding
    ? `${buttonLabel('look', device)} 窺視（左右 45°／上下 25°） · ${buttonLabel('pause',device)} 暫停`
    : `${buttonLabel('move', device)} 走路 · 滑鼠／方向鍵轉頭 · ${buttonLabel('pause', device)} 暫停${hasFlashlight(chapter) ? ` · ${buttonLabel('flashlight', device)} 手電筒 · ${buttonLabel('uv', device)} 切換光線` : ' · 請領取巡檢燈'}`);
  setText(pauseInstructions, device === 'keyboard'
    ? '鍵盤滑鼠：按下方按鈕。手把：按任一鍵喚醒，A／✕ 開始，Start／Options 暫停與繼續。'
    : session.hasStarted ? `按 ${buttonLabel('pause', device)} 繼續，${buttonLabel('cancel',device)} 返回開始選單，或使用下方按鈕切換鍵盤滑鼠。`
      : `按 ${buttonLabel('confirm', device)} 開始（不需要鎖定滑鼠）。`);
  setText(inputHint, !session.paused && !['keypad','caught'].includes(chapter.ui.mode) && device === 'keyboard' && document.pointerLockElement !== renderer.domElement
    ? (pointerLockFailed ? lockMessage.textContent : '點一下畫面以啟用滑鼠轉頭') : '');
}

const mapPanel=document.querySelector('#factory-map');
let mapReturnToGame=false;
function openMap(){mapPanel.hidden=false;mapReturnToGame=!session.paused;if(mapReturnToGame)applySession({forcePause:true});}
function closeMap(){mapPanel.hidden=true;if(mapReturnToGame){mapReturnToGame=false;applySession({pausePressed:true});}}
document.querySelector('#factory-map-button').addEventListener('click',openMap);
document.querySelector('#map-close').addEventListener('click',closeMap);
document.querySelector('#ending-close').addEventListener('click',()=>{document.querySelector('#ending-screen').hidden=true;mapPanel.hidden=false;});
function clearInput() {
  keys.clear();
  interactPending = false;
  keypadPending = [];
  equipmentPending = { flashlightPressed: false, uvPressed: false };
  dYaw = 0;
  dPitch = 0;
  keyboardActivity = false;
  previousTime = undefined;
}

function applySession(actions) {
  const next = updateSession(session, actions);
  if(next.paused && !session.paused) saveStorage.flush('pause');
  if (next.paused !== session.paused || next.hasStarted !== session.hasStarted) clearInput();
  if (!next.paused && disconnectedMessage) clearDisconnectMessage();
  session = next;
  chapter = { ...chapter, player: setPaused(chapter.player, session.paused) };
  syncUI();
}

function handleStartCommand(command,source='keyboard') {
  if(document.hidden || !document.hasFocus() || startMenu.mode==='closed') return;
  startMenu=updateStartMenu(startMenu,command);
  if(startMenu.effect==='new' || startMenu.effect==='continue') {
    audio.start();
    let next;
    if(startMenu.effect==='continue') {
      const result=saveStorage.load();next=result.status==='valid'?restoreChapterSave(result.data,chapterOptions):null;
      if(!next) {startMenu=createStartMenu(result,{hasCurrent:session.hasStarted});syncUI();return;}
    } else {next=createChapter(chapterOptions);saveStorage.restart(next);}
    chapter=next;session=createSession();clearInput();
    if(source==='keyboard') requestLock();
    else {applySession({confirmPressed:true});releasePointer('gamepad');}
  }
  syncUI();
}

function openStartMenu() {
  if(!session.hasStarted || !session.paused) return;
  saveStorage.flush('pause');
  startMenu=createStartMenu(saveStorage.load(),{hasCurrent:true});
  clearInput();releasePointer('menu');syncUI();
}
startOpen.addEventListener('click',openStartMenu);

function releasePointer(reason) {
  if (document.pointerLockElement === renderer.domElement) {
    // 明確區分開啟密碼鎖／切換手把與 Esc 解鎖，避免誤觸暫停。
    unlockReason = reason;
    document.exitPointerLock();
  }
}

function lockFailed() {
  pointerLockFailed = true;
  lockMessage.textContent = '滑鼠鎖定不可用時，開始後可用方向鍵轉頭，或按住滑鼠拖曳。';
  syncUI();
}

async function requestLock() {
  if (startMenu.mode!=='closed' || ['keypad','caught'].includes(chapter.ui.mode) || requestingLock || document.pointerLockElement === renderer.domElement) return;
  requestingLock = true;
  try {
    await renderer.domElement.requestPointerLock();
  } catch {
    lockFailed();
  } finally {
    requestingLock = false;
  }
}

resumeButton.addEventListener('click', () => {
  audio.start();
  if(startMenu.mode!=='closed') handleStartCommand({type:'activate'},'keyboard');
  else if(session.paused) applySession(session.hasStarted?{pausePressed:true}:{confirmPressed:true});
  else requestLock();
});
renderer.domElement.addEventListener('click', () => {
  keyboardActivity = true;
  if (!session.hasStarted || !session.paused) requestLock();
});
renderer.domElement.addEventListener('mousedown',()=>{if(!session.paused && document.pointerLockElement!==renderer.domElement) dragLooking=true;});
window.addEventListener('mouseup',()=>{dragLooking=false;});
document.addEventListener('pointerlockerror', lockFailed);
document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === renderer.domElement;
  if (locked) {
    if(startMenu.mode!=='closed') {releasePointer('menu');return;}
    if (['keypad','caught'].includes(chapter.ui.mode)) { releasePointer(chapter.ui.mode); return; }
    unlockReason = null;
    pointerLockFailed = false;
    clearInput();
    keyboardActivity = true;
    applySession(session.hasStarted ? { pausePressed: session.paused } : { confirmPressed: true });
    lockMessage.textContent = '';
  } else if (unlockReason) {
    unlockReason = null;
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
  if(!intro.hidden) { if(event.code==='Escape'||event.code==='Enter'||event.code==='Space'){event.preventDefault();finishIntro();} return; }
  if(!mapPanel.hidden) { if(event.code==='Escape'||event.code==='KeyM'){event.preventDefault();closeMap();} return; }
  if(startMenu.mode!=='closed') {
    const command=keyboardStartMenuCommand(event);
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter','Space','Escape'].includes(event.code)) event.preventDefault();
    if(command) {keyboardActivity=true;handleStartCommand(command,'keyboard');}
    return;
  }
  if(chapter.ui.mode==='caught') {
    if(event.code==='Escape' && !event.repeat) applySession({forcePause:true});
    if(['KeyW','KeyA','KeyS','KeyD','KeyE','KeyF','KeyR','Escape','Enter','Space'].includes(event.code)) event.preventDefault();
    return;
  }
  if (chapter.ui.mode==='keypad') {
    keyboardActivity = true;
    // repeat 也要攔截預設行為，避免 Enter／Space 原生 click 再輸入一次。
    if (/^(Digit[0-9]|Numpad[0-9]|NumpadEnter|Enter|Backspace|Escape|Space)$/.test(event.code)) event.preventDefault();
    const command=keyboardKeypadCommand(event);
    if (command && !session.paused && !document.hidden && document.hasFocus()) keypadPending.push(command);
    return;
  }
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.code)) {
    event.preventDefault();
    if(session.paused || document.hidden || !document.hasFocus()) return;
    dYaw+=event.code==='ArrowLeft'?0.22:event.code==='ArrowRight'?-0.22:0;
    dPitch+=event.code==='ArrowUp'?0.16:event.code==='ArrowDown'?-0.16:0;
    keyboardActivity=true;return;
  }
  if(event.code==='KeyM' && !event.repeat && chapter.inventory.itemIds.includes('lobby.factory-map')) { openMap();return; }
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
  if (session.paused || ['keypad','caught'].includes(chapter.ui.mode) || (document.pointerLockElement !== renderer.domElement && !dragLooking)) return;
  dYaw -= event.movementX * MOUSE_SENSITIVITY;
  dPitch -= event.movementY * MOUSE_SENSITIVITY;
});

function pauseForFocusLoss() {
  saveStorage.flush('visibilitychange');
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
  if(startMenu.mode!=='closed') {
    const command=startMenuGamepadCommand(pad?.actions);
    if(command) handleStartCommand(command,'gamepad');
    syncUI();return {...mergeActions(),gameplayActive:false};
  }
  if(session.paused && pad?.actions.cancelPressed) {
    openStartMenu();return {...mergeActions(),gameplayActive:false};
  }
  if (pad?.actions.pausePressed || (!session.hasStarted && pad?.actions.confirmPressed)) {
    applySession(pad.actions);
    releasePointer('gamepad');
    lockMessage.textContent = '';
  }
  let x = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
  let y = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
  const length = Math.max(1, Math.hypot(x, y));
  x /= length;
  y /= length;
  // 暫停已在 session 處理；交給 movement 的動作不可再次觸發暫停。
  const merged = mergeActions({ move: { x, y }, look: { dYaw, dPitch }, interactPressed: interactPending, ...equipmentPending, keypadCommands:keypadPending }, pad?.actions);
  const actions = gameplayActions(merged, before, session);
  interactPending = false;
  keypadPending = [];
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
  const beforeChapter=chapter;
  const beforeMode=chapter.ui.mode;
  chapter = updateChapter(chapter, actions, dt, chapterOptions);
  audio.sync(beforeChapter,chapter,session.hasStarted&&!session.paused,dt);
  if(beforeMode!=='complete' && chapter.ui.mode==='complete') {
    try { localStorage.setItem('toy-factory-complete','true'); } catch {}
    document.querySelector('#map-title').textContent='完整工廠地圖｜通關解鎖';
    document.querySelector('#map-content').textContent='辦公室 ─ 控制室 ─ 裝配線 ─ 貨運月台\n入口      電力紀錄   置物櫃     玩具列車\n\n完整巡檢路線與月台出口已標記。';
  }
  if(session.hasStarted && startMenu.mode==='closed') saveStorage.observe(beforeChapter,chapter,actions.gameplayActive?dt:0);
  if (beforeMode!==chapter.ui.mode) {
    clearInput();
    if (['keypad','caught'].includes(chapter.ui.mode)) releasePointer(chapter.ui.mode);
  }
  worldView.sync(chapter);
  monsterView.sync(chapter);
  for (const [id,mesh] of itemMeshes) mesh.visible=!chapter.inventory.itemIds.includes(id);
  syncUI();
  camera.position.set(chapter.player.x, EYE_HEIGHT, chapter.player.z);
  camera.rotation.set(chapter.player.pitch, chapter.player.yaw, 0, 'YXZ');
  syncLighting();
  renderer.render(scene, camera);
  frames += 1;
  const elapsed = time - sampleStart;
  if (elapsed >= 1000) {
    const fps=Math.round(frames*1000/elapsed);
    fpsDisplay.textContent = `FPS: ${fps}`;
    if(fps<42 && renderPixelRatio>1) {renderPixelRatio=1;renderer.setPixelRatio(renderPixelRatio);resize();}
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
window.addEventListener('pagehide',()=>{saveStorage.flush('pagehide');syncUI();});
