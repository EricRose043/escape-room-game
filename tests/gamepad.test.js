import assert from 'node:assert/strict';
import test from 'node:test';
import { createPlayer, updatePlayer } from '../src/logic/movement.js';

const load = () => import('../src/logic/gamepad.js');
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
const pad = (options = {}) => ({
  id: 'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)',
  mapping: 'standard', index: 0, connected: true, axes: [0, 0, 0, 0],
  buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), ...options,
});
const pressedPad = (index, options = {}) => {
  const result = pad(options);
  result.buttons[index] = { pressed: true, value: 1 };
  return result;
};

test('真實 Chrome PS4 廠商欄位與 Firefox PS 格式可辨識', async () => {
  const { classifyGamepad } = await load();
  assert.equal(classifyGamepad(pad().id), 'ps');
  assert.equal(classifyGamepad('054c-09cc-Wireless Controller'), 'ps');
});

test('Chrome 與 Firefox Xbox 廠商格式可辨識', async () => {
  const { classifyGamepad } = await load();
  assert.equal(classifyGamepad('Xbox 360 Controller (STANDARD GAMEPAD Vendor: 045e Product: 028e)'), 'xbox');
  assert.equal(classifyGamepad('045e-028e-Microsoft X-Box 360 pad'), 'xbox');
});

test('產品編號或名稱裡的廠商碼片段不會誤判', async () => {
  const { classifyGamepad } = await load();
  assert.equal(classifyGamepad('Generic Controller (STANDARD GAMEPAD Vendor: 1234 Product: 045e)'), 'unknown');
  assert.equal(classifyGamepad('1234-054c-Generic Controller'), 'unknown');
  assert.equal(classifyGamepad('Generic 054c 045e Controller'), 'unknown');
  assert.equal(classifyGamepad('Xbox name (Vendor: 1234 Product: 045e)'), 'unknown', '有廠商欄位時不以名稱蓋過');
});

test('無廠商欄位時用名稱辨識，大小寫不影響', async () => {
  const { classifyGamepad } = await load();
  for (const id of ['DualShock 4', 'dualsense', 'PlayStation Controller', 'Sony Wireless Controller']) assert.equal(classifyGamepad(id), 'ps');
  for (const id of ['Xbox Wireless Controller', 'XInput STANDARD GAMEPAD', 'Microsoft Controller']) assert.equal(classifyGamepad(id), 'xbox');
  assert.equal(classifyGamepad('Wireless Controller'), 'unknown');
});

test('按鍵名稱表完整覆蓋 BRIEF 操作，unknown 使用 Xbox 名稱', async () => {
  const { buttonLabel } = await load();
  const expected = {
    move: ['WASD', '左搖桿', '左搖桿'], look: ['滑鼠', '右搖桿', '右搖桿'],
    interact: ['E', 'A', '✕'], cancel: ['Esc', 'B', '○'], flashlight: ['F', 'RB', 'R1'],
    uv: ['R', 'LB', 'L1'], pause: ['Esc', 'Start', 'Options'],
    confirm: ['滑鼠點擊', 'A', '✕'], menu: ['滑鼠', '十字鍵', '十字鍵'],
  };
  for (const [action, labels] of Object.entries(expected)) {
    for (const [i, device] of ['keyboard', 'xbox', 'ps'].entries()) assert.equal(buttonLabel(action, device), labels[i]);
    assert.equal(buttonLabel(action, 'unknown'), labels[1]);
  }
});

test('徑向死區內與邊界的雜訊都歸零', async () => {
  const { filterStick, DEAD_ZONE } = await load();
  close(DEAD_ZONE, 0.18);
  for (const [x, y] of [[0, 0], [0.1, 0.1], [0.18, 0]]) assert.deepEqual(filterStick(x, y), { x: 0, y: 0 });
});

test('搖桿重新映射與 1.5 次方曲線保留方向、類比與最大值', async () => {
  const { filterStick } = await load();
  close(filterStick(0.59, 0).x, 0.5 ** 1.5);
  close(filterStick(1, 0).x, 1);
  const diagonal = filterStick(-1, 1);
  close(Math.hypot(diagonal.x, diagonal.y), 1);
  close(diagonal.x, -Math.SQRT1_2);
});

test('standard 軸轉為 move 與 look，右搖桿和滑鼠方向一致', async () => {
  const { readGamepad } = await load();
  const result = readGamepad(pad({ axes: [1, -1, 1, -1] }));
  close(result.actions.move.x, Math.SQRT1_2);
  close(result.actions.move.y, Math.SQRT1_2);
  close(result.actions.look.yawRate, -Math.SQRT1_2);
  close(result.actions.look.pitchRate, Math.SQRT1_2);
  assert.equal(result.active, true);
});

test('死區雜訊不算使用手把，按鍵或有效搖桿才算', async () => {
  const { readGamepad } = await load();
  assert.equal(readGamepad(pad({ axes: [0.1, -0.1, 0.05, 0.02] })).active, false);
  assert.equal(readGamepad(pressedPad(5)).active, true);
});

test('暫停與確認鍵只在按下邊緣觸發，長按不重複切換', async () => {
  const { readGamepad } = await load();
  for (const [index, field] of [[9, 'pausePressed'], [0, 'confirmPressed']]) {
    const first = readGamepad(pressedPad(index));
    assert.equal(first.actions[field], true);
    assert.equal(readGamepad(pressedPad(index), first.buttons).actions[field], false);
    const released = readGamepad(pad(), first.buttons);
    assert.equal(readGamepad(pressedPad(index), released.buttons).actions[field], true);
  }
});

test('非 standard、斷線、缺值的手把不產生動作', async () => {
  const { readGamepad } = await load();
  for (const raw of [pad({ mapping: '' }), pad({ connected: false }), null]) {
    const result = readGamepad(raw);
    assert.equal(result.supported, false);
    assert.equal(result.active, false);
    assert.equal(result.actions.pausePressed, false);
    assert.deepEqual(result.actions.move, { x: 0, y: 0 });
  }
  assert.equal(readGamepad(pad({ axes: [], buttons: [] })).active, false);
});

test('鍵盤與左搖桿同時推時移動速度不超過單一來源', async () => {
  const { mergeActions, readGamepad } = await load();
  const combined = mergeActions({ move: { x: 1, y: 1 } }, readGamepad(pad({ axes: [1, -1, 0, 0] })).actions);
  close(Math.hypot(combined.move.x, combined.move.y), 1);
  const next = updatePlayer(createPlayer({ x: 0, z: 0, paused: false }), combined, 0.1, []);
  close(Math.hypot(next.x, next.z), 0.25);
});

test('滑鼠位移與搖桿角速度分開保留並交給既有移動 logic', async () => {
  const { mergeActions } = await load();
  const combined = mergeActions({ look: { dYaw: 0.4, dPitch: -0.2 } }, { look: { yawRate: 0.5, pitchRate: 1 } });
  const next = updatePlayer(createPlayer({ paused: false }), combined, 0.1, []);
  close(next.yaw, 0.525);
  close(next.pitch, 0.05);
});

test('提示裝置切換後 0.5 秒內不會再切回', async () => {
  const { createPrompt, updatePrompt } = await load();
  const initial = createPrompt();
  const ps = updatePrompt(initial, { device: 'ps', gamepadIndex: 0 }, 1000);
  assert.equal(ps.device, 'ps');
  assert.deepEqual(updatePrompt(ps, { device: 'keyboard' }, 1499), ps);
  const keyboard = updatePrompt(ps, { device: 'keyboard' }, 1500);
  assert.equal(keyboard.device, 'keyboard');
  assert.equal(updatePrompt(keyboard, { device: 'ps', gamepadIndex: 0 }, 1600).device, 'keyboard');
});

test('沒有有意義輸入時不切換提示，持續同一裝置不重設停留時間', async () => {
  const { createPrompt, updatePrompt } = await load();
  const ps = updatePrompt(createPrompt(), { device: 'ps', gamepadIndex: 0 }, 1000);
  assert.deepEqual(updatePrompt(ps, null, 2000), ps);
  assert.equal(updatePrompt(ps, { device: 'ps', gamepadIndex: 0 }, 1300).changedAt, 1000);
});

test('只在拔除最後使用的手把時要求暫停', async () => {
  const { pauseOnDisconnect, createPrompt, updatePrompt } = await load();
  const ps = updatePrompt(createPrompt(), { device: 'ps', gamepadIndex: 2 }, 1000);
  assert.equal(pauseOnDisconnect(ps, 2), true);
  assert.equal(pauseOnDisconnect(ps, 0), false);
  assert.equal(pauseOnDisconnect(createPrompt(), 2), false);
});

test('手把確認開始、Start 暫停與繼續，不需要 Pointer Lock 資料', async () => {
  const { createSession, updateSession, readGamepad } = await load();
  let session = createSession();
  session = updateSession(session, readGamepad(pressedPad(0)).actions);
  assert.deepEqual(session, { hasStarted: true, paused: false });
  session = updateSession(session, readGamepad(pressedPad(9)).actions);
  assert.equal(session.paused, true);
  session = updateSession(session, readGamepad(pressedPad(9)).actions);
  assert.equal(session.paused, false);
});

test('開始前失焦保留開始狀態，遊戲中失焦才暫停，失焦不能由手把開始', async () => {
  const { createSession, updateSession } = await load();
  const initial = createSession();
  assert.deepEqual(updateSession(initial, { focusLost: true }), initial);
  assert.deepEqual(updateSession(initial, { confirmPressed: true, focusLost: true }), initial);
  assert.equal(updateSession({ hasStarted: true, paused: false }, { focusLost: true }).paused, true);
});
