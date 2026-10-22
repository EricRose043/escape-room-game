import test from 'node:test';
import assert from 'node:assert/strict';
const load = () => import('../src/logic/gamepad.js');
const pad = (index, id = 'Xbox') => ({ id, mapping: 'standard', axes: [], buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: i === index })) });

test('F 與 RB／R1 產生相同開關動作', async () => {
  const { keyboardEquipmentActions, readGamepad } = await load();
  assert.equal(keyboardEquipmentActions({ code: 'KeyF', repeat: false }).flashlightPressed, true);
  for (const id of ['Xbox', 'DualSense']) assert.equal(readGamepad(pad(5, id)).actions.flashlightPressed, true);
});
test('R 與 LB／L1 產生相同模式動作', async () => {
  const { keyboardEquipmentActions, readGamepad } = await load();
  assert.equal(keyboardEquipmentActions({ code: 'KeyR', repeat: false }).uvPressed, true);
  for (const id of ['Xbox', 'DualSense']) assert.equal(readGamepad(pad(4, id)).actions.uvPressed, true);
});
test('長按不重複，放開再按才再次觸發', async () => {
  const { keyboardEquipmentActions, readGamepad } = await load();
  for (const [code, index, field] of [['KeyF', 5, 'flashlightPressed'], ['KeyR', 4, 'uvPressed']]) {
    assert.equal(keyboardEquipmentActions({ code, repeat: true })[field], false);
    const first = readGamepad(pad(index)); assert.equal(first.actions[field], true);
    assert.equal(readGamepad(pad(index), first.buttons).actions[field], false);
    const released = readGamepad(pad(-1), first.buttons);
    assert.equal(readGamepad(pad(index), released.buttons).actions[field], true);
  }
});
test('鍵鼠與手把同時按同一動作只切換一次', async () => {
  const { mergeActions } = await load();
  const { updateFlashlight } = await import('../src/logic/flashlight.js');
  const actions = mergeActions({ flashlightPressed: true, uvPressed: true }, { flashlightPressed: true, uvPressed: true });
  assert.equal(actions.flashlightPressed, true); assert.equal(actions.uvPressed, true);
  assert.deepEqual(updateFlashlight({ charge: 100, enabled: false, mode: 'normal' }, actions, 0), { charge: 100, enabled: true, mode: 'uv' });
});
test('開始繼續暫停失焦時忽略裝備動作且不延後執行', async () => {
  const { gameplayActions, updateSession, mergeActions } = await load();
  const { updateFlashlight } = await import('../src/logic/flashlight.js');
  const state = { charge: 50, enabled: true, mode: 'normal' };
  const playing = { hasStarted: true, paused: false };
  const paused = { hasStarted: true, paused: true };
  for (const [before, extra] of [[{ hasStarted: false, paused: true }, { confirmPressed: true }], [paused, { pausePressed: true }], [playing, { pausePressed: true }], [playing, { focusLost: true }], [playing, { forcePause: true }]]) {
    const input = { flashlightPressed: true, uvPressed: true, ...extra };
    const after = updateSession(before, input);
    const filtered = gameplayActions(input, before, after);
    assert.equal(filtered.flashlightPressed, false); assert.equal(filtered.uvPressed, false);
    assert.deepEqual(updateFlashlight(state, filtered, 100), state);
    const following = gameplayActions(mergeActions(), after, after);
    assert.equal(following.flashlightPressed, false); assert.equal(following.uvPressed, false);
  }
  assert.equal(gameplayActions({ flashlightPressed: true }, playing, playing).flashlightPressed, true);
});
test('裝備提示沿用按鍵名稱表與既有裝置切換規則', async () => {
  const { buttonLabel, updatePrompt, createPrompt, readGamepad } = await load();
  for (const [device, expected] of [['keyboard', ['F', 'R']], ['xbox', ['RB', 'LB']], ['ps', ['R1', 'L1']], ['unknown', ['RB', 'LB']]]) {
    assert.deepEqual(['flashlight', 'uv'].map(a => buttonLabel(a, device)), expected);
  }
  const ps = readGamepad(pad(5, 'DualSense')); assert.equal(ps.actions.flashlightPressed, true);
  const prompt = updatePrompt(createPrompt(), { device: ps.device, gamepadIndex: 0 }, 1000);
  assert.equal(prompt.device, 'ps');
  assert.equal(updatePrompt(prompt, { device: 'keyboard' }, 1499).device, 'ps');
  assert.equal(updatePrompt(prompt, { device: 'keyboard' }, 1500).device, 'keyboard');
});
