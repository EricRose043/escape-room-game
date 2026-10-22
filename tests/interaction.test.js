import test from 'node:test';
import assert from 'node:assert/strict';
const load = () => import('../src/logic/interaction.js');
const player = (overrides = {}) => ({ x: 0, z: 0, yaw: 0, pitch: 0, paused: false, ...overrides });
const box = (id = 'a', overrides = {}) => ({ id, minX: -0.25, maxX: 0.25, minY: 1.35, maxY: 1.85, minZ: -1.5, maxZ: -1, ...overrides });
const inventory = { itemIds: [] };

test('中央射線命中 2 公尺內物品時可選取', async () => {
  const { selectItem } = await load();
  assert.equal(selectItem(player(), inventory, [box()], [])?.id, 'a');
});
test('恰好 2 公尺可選取，超過 2 公尺不可選取', async () => {
  const { selectItem } = await load();
  for (const [distance, expected] of [[2, 'a'], [2.000001, undefined]]) {
    assert.equal(selectItem(player(), inventory, [box('a', { minZ: -distance - 0.5, maxZ: -distance })], [])?.id, expected);
  }
});
test('背後或未被中央射線命中的物品不可選取', async () => {
  const { selectItem } = await load();
  for (const item of [box('a', { minZ: 1, maxZ: 1.5 }), box('a', { minX: 1, maxX: 1.5 })]) {
    assert.equal(selectItem(player(), inventory, [item], []), null);
  }
});
test('水平轉向與抬頭低頭的視線方向符合相機', async () => {
  const { viewRay } = await load();
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-10);
  const left = viewRay(player({ yaw: Math.PI / 2 }));
  close(left.direction.x, -1); close(left.direction.z, 0);
  for (const pitch of [-0.5, 0.5]) {
    const { origin, direction } = viewRay(player({ pitch }));
    close(origin.y, 1.6); close(direction.y, Math.sin(pitch));
    close(direction.z, -Math.cos(pitch));
    close(Math.hypot(direction.x, direction.y, direction.z), 1);
  }
});
test('多個物品重疊時只選最近的未撿物品', async () => {
  const { selectItem } = await load();
  const items = [box('far', { minZ: -2, maxZ: -1.5 }), box('near')];
  assert.equal(selectItem(player(), inventory, items, []).id, 'near');
  assert.equal(selectItem(player(), { itemIds: ['near'] }, items, []).id, 'far');
});
test('牆壁或隔板位於物品前方時不可選取', async () => {
  const { selectItem } = await load();
  for (const kind of ['wall', 'partition']) assert.equal(selectItem(player(), inventory, [box()], [box('block', { kind, minZ: -0.8, maxZ: -0.7 })]), null);
});
test('障礙物在物品後方不阻擋，與物品同距離時阻擋', async () => {
  const { selectItem } = await load();
  assert.equal(selectItem(player(), inventory, [box()], [box('back', { minZ: -3, maxZ: -2.5 })]).id, 'a');
  assert.equal(selectItem(player(), inventory, [box()], [box('same')]), null);
});
test('平行射線、擦邊與薄牆的遮擋判斷正確', async () => {
  const { rayBoxDistance, viewRay } = await load();
  const ray = viewRay(player());
  assert.equal(rayBoxDistance(ray, box()), 1);
  assert.equal(rayBoxDistance(ray, box('edge', { minX: 0 })), 1);
  assert.equal(rayBoxDistance(ray, box('miss', { minX: 0.00001 })), null);
  assert.equal(rayBoxDistance(ray, box('thin', { minZ: -0.500001, maxZ: -0.5 })), 0.5);
});
test('桌子遮擋生效，但視線高於桌面可選取桌上物品', async () => {
  const { selectItem } = await load();
  const table = box('table', { minY: 0, maxY: 0.9, minZ: -1, maxZ: -0.5 });
  assert.equal(selectItem(player(), inventory, [box()], [table]).id, 'a');
  assert.equal(selectItem(player({ pitch: -Math.PI / 4 }), inventory, [box('low', { minY: 0, maxY: 0.5 })], [table]), null);
});
test('互動成功加入背包，重複互動不重複加入且不改寫原狀態', async () => {
  const { collectItem } = await load();
  const initial = { itemIds: [] }; const item = box(); const snapshot = JSON.stringify(item);
  const next = collectItem(initial, player(), { interactPressed: true }, [item], []);
  assert.deepEqual(next, { itemIds: ['a'] }); assert.deepEqual(initial, { itemIds: [] });
  assert.deepEqual(collectItem(next, player(), { interactPressed: true }, [item], []), next);
  assert.equal(JSON.stringify(item), snapshot);
});
test('超距、遮擋、無目標或暫停時互動不改變背包', async () => {
  const { collectItem } = await load();
  for (const [p, items, blockers, actions] of [
    [player(), [box('far', { minZ: -4, maxZ: -3 })], [], { interactPressed: true }],
    [player(), [box()], [box('block')], { interactPressed: true }],
    [player(), [], [], { interactPressed: true }],
    [player({ paused: true }), [box()], [], { interactPressed: true }],
    [player(), [box()], [], {}],
  ]) assert.deepEqual(collectItem(inventory, p, actions, items, blockers), inventory);
});
test('示範資料具唯一 ID，隔板後物品可被擋住且繞行後可取得', async () => {
  const { ITEMS } = await import('./fixtures/demo-room.js');
  const { LEVEL_BOXES } = await import('./fixtures/demo-room.js');
  const { selectItem: select } = await load();
  const selectItem = (p, inv) => select(p, inv, ITEMS, LEVEL_BOXES);
  assert.equal(ITEMS.length, 3); assert.equal(new Set(ITEMS.map(i => i.id)).size, 3);
  assert.ok(LEVEL_BOXES.some(b => b.kind === 'partition'));
  const item = ITEMS.find(i => i.id === 'demo-hidden-token');
  const x = (item.minX + item.maxX) / 2;
  const y = (item.minY + item.maxY) / 2;
  const z = (item.minZ + item.maxZ) / 2;
  const aim = (fromZ) => player({ x, z: fromZ, pitch: Math.atan2(y - 1.6, fromZ - z) });
  assert.equal(selectItem(aim(z + 1.8), inventory), null);
  assert.equal(selectItem(aim(z + 0.7), inventory)?.id, item.id);
});
test('每個物品的判定方塊三邊都至少 0.25 公尺', async () => {
  const { ITEMS } = await import('../src/logic/items.js');
  assert.ok(ITEMS.length > 0);
  for (const item of ITEMS) for (const axis of ['X', 'Y', 'Z']) assert.ok(item[`max${axis}`] - item[`min${axis}`] >= 0.25, `${item.id} ${axis}`);
});
