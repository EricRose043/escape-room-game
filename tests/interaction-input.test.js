import test from 'node:test';
import assert from 'node:assert/strict';
const load = () => import('../src/logic/gamepad.js');
const pad = (pressed) => ({ id: 'Xbox', mapping: 'standard', buttons: [{ pressed }], axes: [] });

test('E 與手把按鈕 0 產生相同 interactPressed', async () => {
  const { keyboardInteractPressed, readGamepad, mergeActions } = await load();
  assert.equal(keyboardInteractPressed({ code: 'KeyE', repeat: false }), true);
  assert.equal(keyboardInteractPressed({ code: 'KeyF', repeat: false }), false);
  assert.equal(mergeActions({ interactPressed: true }).interactPressed, true);
  assert.equal(mergeActions({}, readGamepad(pad(true)).actions).interactPressed, true);
});
test('長按不重複互動，放開再按才再次觸發', async () => {
  const { keyboardInteractPressed, readGamepad } = await load();
  assert.equal(keyboardInteractPressed({ code: 'KeyE', repeat: true }), false);
  const first = readGamepad(pad(true));
  assert.equal(first.actions.interactPressed, true);
  assert.equal(readGamepad(pad(true), first.buttons).actions.interactPressed, false);
  const release = readGamepad(pad(false), first.buttons);
  assert.equal(readGamepad(pad(true), release.buttons).actions.interactPressed, true);
});
test('兩種來源同時互動只執行一次', async () => {
  const { mergeActions } = await load();
  const { collectItem } = await import('../src/logic/interaction.js');
  const actions = mergeActions({ interactPressed: true }, { interactPressed: true });
  const items = ['a', 'b'].map(id => ({ id, minX: -0.2, maxX: 0.2, minY: 1.4, maxY: 1.8, minZ: -1.5, maxZ: -1 }));
  assert.deepEqual(collectItem({ itemIds: [] }, { x: 0, z: 0, yaw: 0, pitch: 0, paused: false }, actions, items, []).itemIds, ['a']);
});
test('開始或繼續當幀不觸發撿取，暫停輸入不延後執行', async () => {
  const { gameplayActions, updateSession } = await load();
  for (const before of [{ hasStarted: false, paused: true }, { hasStarted: true, paused: true }, { hasStarted: true, paused: false }]) {
    const input = { interactPressed: true, confirmPressed: true, pausePressed: true };
    const after = updateSession(before, input);
    assert.equal(gameplayActions(input, before, after).interactPressed, false);
    assert.equal(gameplayActions({}, after, after).interactPressed, false);
  }
  const playing = { hasStarted: true, paused: false };
  assert.equal(gameplayActions({ interactPressed: true }, playing, playing).interactPressed, true);
});
