import test from 'node:test';
import assert from 'node:assert/strict';
const load = () => import('../src/logic/illumination.js');
const player = (overrides = {}) => ({ x: 0, z: 0, yaw: 0, pitch: 0, ...overrides });
const light = { charge: 50, enabled: true, mode: 'uv' };
const clue = (position = { x: 0, y: 1.6, z: -2 }, normal = { x: 0, y: 0, z: 1 }) => ({ position, normal });
const blocker = (kind, overrides = {}) => ({ kind, minX: -1, maxX: 1, minY: 0, maxY: 3, minZ: -1.1, maxZ: -1, ...overrides });

test('有電且開啟紫外光時，光錐內的正面文字可見', async () => {
  const { isClueVisible, BEAM } = await load();
  assert.equal(BEAM.distance, 8); assert.equal(BEAM.halfAngle, 25 * Math.PI / 180);
  assert.equal(isClueVisible(player(), light, clue(), []), true);
});
test('一般光、關閉或零電量時隱藏字不可見', async () => {
  const { isClueVisible } = await load();
  for (const changes of [{ mode: 'normal' }, { enabled: false }, { charge: 0 }]) assert.equal(isClueVisible(player(), { ...light, ...changes }, clue(), []), false);
});
test('距離與角度邊界可見，超出邊界或位於背後不可見', async () => {
  const { isClueVisible, BEAM } = await load();
  for (const [distance, angle, expected] of [[8, 0, true], [8.000001, 0, false], [4, BEAM.halfAngle, true], [4, BEAM.halfAngle + 0.000001, false], [4, Math.PI, false]]) {
    assert.equal(isClueVisible(player(), light, clue({ x: Math.sin(angle) * distance, y: 1.6, z: -Math.cos(angle) * distance }), []), expected);
  }
});
test('文字背面不可見，轉頭與抬低頭會改變照射結果', async () => {
  const { isClueVisible } = await load();
  assert.equal(isClueVisible(player(), light, clue(undefined, { x: 0, y: 0, z: -1 }), []), false);
  assert.equal(isClueVisible(player({ yaw: Math.PI / 2 }), light, clue(), []), false);
  for (const pitch of [-0.6, 0.6]) {
    const elevated = clue({ x: 0, y: 1.6 + Math.sin(pitch) * 2, z: -Math.cos(pitch) * 2 });
    assert.equal(isClueVisible(player(), light, elevated, []), false);
    assert.equal(isClueVisible(player({ pitch }), light, elevated, []), true);
  }
});
test('牆壁隔板桌子地板天花板均可遮擋文字', async () => {
  const { isClueVisible } = await load();
  for (const kind of ['wall', 'partition', 'table', 'floor', 'ceiling']) assert.equal(isClueVisible(player(), light, clue(), [blocker(kind)]), false);
  const { ROOM_SURFACES } = await import('../src/logic/level.js');
  for (const [y, pitch, normal] of [[-1, -Math.PI / 2, { x: 0, y: 1, z: 0 }], [4, Math.PI / 2, { x: 0, y: -1, z: 0 }]]) {
    assert.equal(isClueVisible(player({ pitch }), light, clue({ x: 0, y, z: 0 }, normal), ROOM_SURFACES), false);
  }
});
test('同距離障礙物阻擋，文字後方障礙物不阻擋', async () => {
  const { isClueVisible } = await load();
  assert.equal(isClueVisible(player(), light, clue(), [blocker('wall', { minZ: -2.2, maxZ: -2 })]), false);
  assert.equal(isClueVisible(player(), light, clue(), [blocker('wall', { minZ: -3.2, maxZ: -3 })]), true);
});
test('附著牆不誤擋外移文字，從牆另一側仍不可見', async () => {
  const { CLUES } = await import('./fixtures/demo-room.js');
  const { isClueVisible: visible } = await load();
  const isClueVisible = (p, f, c) => visible(p, f, c, LEVEL_BOXES);
  const { LEVEL_BOXES } = await import('./fixtures/demo-room.js');
  assert.equal(CLUES.length, 1);
  const c = CLUES[0]; const wall = LEVEL_BOXES.find(b => b.kind === 'partition');
  assert.equal(c.position.z, wall.minZ - 0.02);
  assert.equal(isClueVisible(player({ x: c.position.x, z: -2, yaw: Math.PI }), light, c), true);
  assert.equal(isClueVisible(player({ x: c.position.x, z: 2 }), light, c), false);
  // 單獨驗證遮擋，避免僅因背面條件而通過。
  assert.equal(isClueVisible(player({ x: c.position.x, z: 2 }), light, { ...c, normal: { x: 0, y: 0, z: 1 } }), false);
});
