import test from 'node:test';
import assert from 'node:assert/strict';
const load = () => import('../src/logic/flashlight.js');
const player = (overrides = {}) => ({ x: 0, z: 0, yaw: 0, pitch: 0, paused: false, ...overrides });
const item = (overrides = {}) => ({ id: 'battery', kind: 'battery', chargeAmount: 25, minX: -0.25, maxX: 0.25, minY: 1.35, maxY: 1.85, minZ: -1.5, maxZ: -1, ...overrides });
const equipment = (charge = 50) => ({ inventory: { itemIds: [] }, flashlight: { charge, enabled: false, mode: 'normal' } });
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test('手電筒初始滿電、關閉且為一般光', async () => {
  const { createFlashlight } = await load();
  assert.deepEqual(createFlashlight(), { charge: 100, enabled: false, mode: 'normal' });
});
test('有電時開關可切換，關閉時不耗電', async () => {
  const { createFlashlight, updateFlashlight } = await load();
  const initial = createFlashlight();
  assert.deepEqual(updateFlashlight(initial, {}, 50), initial);
  const on = updateFlashlight(initial, { flashlightPressed: true }, 0);
  assert.equal(on.enabled, true);
  assert.equal(updateFlashlight(on, { flashlightPressed: true }, 0).enabled, false);
  assert.equal(initial.enabled, false);
});
test('兩種模式依經過秒數等速耗電，分幀結果一致', async () => {
  const { updateFlashlight } = await load();
  for (const mode of ['normal', 'uv']) {
    const initial = { charge: 100, enabled: true, mode };
    close(updateFlashlight(initial, {}, 10).charge, 98);
    let split = initial;
    for (let i = 0; i < 100; i++) split = updateFlashlight(split, {}, 0.1);
    close(split.charge, 98);
  }
});
test('耗盡時電量不小於零並自動關閉，零電量不能開啟', async () => {
  const { updateFlashlight } = await load();
  for (const seconds of [500, 501, 10000]) {
    const empty = updateFlashlight({ charge: 100, enabled: true, mode: 'uv' }, {}, seconds);
    assert.equal(empty.charge, 0); assert.equal(empty.enabled, false);
    assert.equal(updateFlashlight(empty, { flashlightPressed: true }, 0).enabled, false);
  }
});
test('模式可往返切換，關閉時切換不會開燈', async () => {
  const { createFlashlight, updateFlashlight } = await load();
  const uv = updateFlashlight(createFlashlight(), { uvPressed: true }, 0);
  assert.equal(uv.mode, 'uv'); assert.equal(uv.enabled, false);
  assert.equal(updateFlashlight(uv, { uvPressed: true }, 0).mode, 'normal');
});
test('暫停失焦時狀態不變，開始繼續當幀不耗電', async () => {
  const { updateFlashlight, updateEquipment } = await load();
  const initial = { charge: 70, enabled: true, mode: 'uv' };
  const input = { flashlightPressed: true, uvPressed: true, interactPressed: true };
  for (const blocked of [{ focusLost: true }, { forcePause: true }, { pausePressed: true }, { gameplayActive: false }]) {
    assert.deepEqual(updateFlashlight(initial, { ...input, ...blocked }, 100), initial);
  }
  assert.deepEqual(updateFlashlight(initial, input, 100, true), initial);
  const state = { inventory: { itemIds: [] }, flashlight: initial };
  assert.deepEqual(updateEquipment(state, player({ paused: true }), input, 100, [item()], []), state);
  assert.deepEqual(updateEquipment(state, player(), { ...input, gameplayActive: false }, 100, [item()], []), state);
});
test('無效時間不耗電或增加電量', async () => {
  const { updateFlashlight } = await load();
  const initial = { charge: 50, enabled: true, mode: 'normal' };
  for (const dt of [-1, NaN, Infinity, -Infinity]) assert.deepEqual(updateFlashlight(initial, {}, dt), initial);
});
test('電池補充 25 且不超過 100，補電不自動開燈', async () => {
  const { rechargeFlashlight } = await load();
  for (const [charge, expected] of [[0, 25], [50, 75], [90, 100], [100, 100]]) {
    const initial = { charge, enabled: false, mode: 'uv' };
    const next = rechargeFlashlight(initial, 25);
    assert.equal(next.charge, expected); assert.equal(next.enabled, false); assert.equal(next.mode, 'uv');
    assert.equal(initial.charge, charge);
  }
});
test('沿用 collectItem 撿到電池才補電，同一電池只生效一次', async () => {
  const { updateEquipment } = await load();
  const { collectItem } = await import('../src/logic/interaction.js');
  const initial = equipment(); const input = { interactPressed: true }; const items = [item()];
  const picked = updateEquipment(initial, player(), input, 0, items, []);
  assert.deepEqual(picked.inventory, collectItem(initial.inventory, player(), input, items, []));
  assert.equal(picked.flashlight.charge, 75);
  assert.deepEqual(updateEquipment(picked, player(), input, 0, items, []), picked);
  assert.deepEqual(initial, equipment());
});
test('普通物品不補電，超距或隔牆撿取不補電', async () => {
  const { updateEquipment } = await load();
  const input = { interactPressed: true };
  const ordinary = updateEquipment(equipment(), player(), input, 0, [item({ kind: 'token' })], []);
  assert.deepEqual(ordinary.inventory.itemIds, ['battery']); assert.equal(ordinary.flashlight.charge, 50);
  for (const [p, blockers, actions] of [[player({ z: 5 }), [], input], [player(), [item()], input], [player(), [], {}]]) {
    assert.deepEqual(updateEquipment(equipment(), p, actions, 0, [item()], blockers), equipment());
  }
});
test('兩顆示範電池保留唯一 ID，所有物品三邊至少 0.25 公尺', async () => {
  const { ITEMS } = await import('../src/logic/items.js');
  assert.equal(ITEMS.length, 3);
  assert.equal(new Set(ITEMS.map(i => i.id)).size, 3);
  assert.deepEqual(ITEMS.filter(i => i.kind === 'battery').map(i => i.id).sort(), ['demo-open-token', 'demo-table-token']);
  for (const i of ITEMS) {
    for (const axis of ['X', 'Y', 'Z']) assert.ok(i[`max${axis}`] - i[`min${axis}`] >= 0.25);
    if (i.kind === 'battery') assert.equal(i.chargeAmount, 25);
  }
});
