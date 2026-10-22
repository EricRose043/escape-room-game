import assert from 'node:assert/strict';
import test from 'node:test';

const load = () => import('../src/logic/movement.js');
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
const action = (move = {}, look = {}) => ({ move, look });
const wall = { minX: 1, maxX: 1.1, minZ: -10, maxZ: 10 };

test('使用移動動作時會依 dt 與速度更新位置', async () => {
  const { createPlayer, updatePlayer } = await load();
  const start = createPlayer({ x: 0, z: 0, paused: false });
  for (const [x, y, dx, dz] of [[1, 0, 0.25, 0], [-1, 0, -0.25, 0], [0, 1, 0, -0.25], [0, -1, 0, 0.25]]) {
    const next = updatePlayer(start, action({ x, y }), 0.1, []);
    close(next.x, dx);
    close(next.z, dz);
  }
  close(updatePlayer(start, action({ x: 1 }), 0.05, []).x, 0.125);
  assert.equal(start.x, 0, '不得改寫輸入狀態');
});

test('斜向移動不會比單方向移動更快，類比半推仍保留半速', async () => {
  const { createPlayer, updatePlayer } = await load();
  const start = createPlayer({ x: 0, z: 0, paused: false });
  const next = updatePlayer(start, action({ x: 1, y: 1 }), 0.1, []);
  close(Math.hypot(next.x, next.z), 0.25);
  close(updatePlayer(start, action({ x: 0.5 }), 0.1, []).x, 0.125);
});

test('移動方向跟隨水平視角，抬頭不影響走路速度', async () => {
  const { createPlayer, updatePlayer } = await load();
  const next = updatePlayer(createPlayer({ x: 0, z: 0, yaw: Math.PI / 2, pitch: 1, paused: false }), action({ y: 1 }), 0.1, []);
  close(next.x, -0.25);
  close(next.z, 0);
});

test('look 角速度會依 dt 更新視角', async () => {
  const { createPlayer, updatePlayer } = await load();
  const start = createPlayer({ paused: false });
  const next = updatePlayer(start, action({}, { yawRate: 0.5, pitchRate: -0.5 }), 0.1, []);
  close(next.yaw, 0.125);
  close(next.pitch, -0.125);
});

test('視角仰俯限制在正負 85 度，不會翻轉', async () => {
  const { createPlayer, updatePlayer, MAX_PITCH } = await load();
  close(MAX_PITCH, 85 * Math.PI / 180);
  for (const sign of [-1, 1]) {
    const next = updatePlayer(createPlayer({ paused: false }), action({}, { dPitch: sign * 10 }), 0.1, []);
    close(next.pitch, sign * MAX_PITCH);
  }
});

test('玩家不會穿過房間牆壁，包含長時間持續前進', async () => {
  const { createPlayer, updatePlayer, PLAYER_RADIUS } = await load();
  const { LEVEL_BOXES } = await import('./fixtures/demo-room.js');
  let state = createPlayer({ x: 0, z: 0, paused: false });
  for (let i = 0; i < 100; i++) state = updatePlayer(state, action({ y: 1 }), 0.1, LEVEL_BOXES);
  assert.ok(state.z >= -6 + PLAYER_RADIUS - 1e-9);
  assert.ok(state.z < -5);
});

test('玩家不會穿過桌子或薄方塊', async () => {
  const { createPlayer, updatePlayer, PLAYER_RADIUS } = await load();
  let state = createPlayer({ x: 0.65, z: 0, paused: false });
  for (let i = 0; i < 10; i++) state = updatePlayer(state, action({ x: 1 }), 0.1, [wall]);
  assert.ok(state.x <= wall.minX - PLAYER_RADIUS + 1e-9);
});

test('碰撞後玩家仍可沿障礙物邊緣移動', async () => {
  const { createPlayer, updatePlayer } = await load();
  const next = updatePlayer(createPlayer({ x: 0.7, z: 0, paused: false }), action({ x: 1, y: 1 }), 0.1, [wall]);
  close(next.x, 0.7);
  assert.ok(next.z < -0.1);
});

test('圓形碰撞不會把家具角落當成方形玩家', async () => {
  const { createPlayer, updatePlayer } = await load();
  const box = { minX: 1, maxX: 2, minZ: 1, maxZ: 2 };
  const next = updatePlayer(createPlayer({ x: 0.75, z: 0.75, paused: false }), action({ x: 0.1 }), 0.01, [box]);
  assert.ok(next.x > 0.75);
});

test('暫停時移動與轉頭都不生效，pausePressed 當幀即停止', async () => {
  const { createPlayer, updatePlayer, setPaused } = await load();
  const paused = createPlayer();
  const input = { ...action({ x: 1, y: 1 }, { dYaw: 2, dPitch: 1, yawRate: 1, pitchRate: 1 }), pausePressed: false };
  assert.deepEqual(updatePlayer(paused, input, 0.1, []), paused);
  const playing = setPaused(paused, false);
  const next = updatePlayer(playing, { ...input, pausePressed: true }, 0.1, []);
  assert.deepEqual(next, { ...playing, paused: true });
  assert.equal(setPaused(next, false).paused, false);
});

test('dt 超過上限時只照上限移動，負 dt 不倒退', async () => {
  const { createPlayer, updatePlayer, MAX_DT } = await load();
  close(MAX_DT, 0.1);
  const start = createPlayer({ x: 0, z: 0, paused: false });
  close(updatePlayer(start, action({ x: 1 }), 10, []).x, 0.25);
  close(updatePlayer(start, action({ x: 1 }), -1, []).x, 0);
});

test('滑鼠角度位移不受 dt 影響且不截斷快速甩動', async () => {
  const { createPlayer, updatePlayer } = await load();
  const start = createPlayer({ paused: false });
  for (const dt of [0, 0.01, 0.1]) {
    const next = updatePlayer(start, action({}, { dYaw: 2, dPitch: 0.2 }), dt, []);
    close(next.yaw, 2);
    close(next.pitch, 0.2);
  }
});

test('搖桿轉頭量照 dt 與轉頭速度換算，並與滑鼠位移相加', async () => {
  const { createPlayer, updatePlayer, TURN_SPEED } = await load();
  close(TURN_SPEED, 2.5);
  const start = createPlayer({ paused: false });
  for (const dt of [0.02, 0.08]) {
    const next = updatePlayer(start, action({}, { dYaw: 0.3, dPitch: -0.1, yawRate: 1, pitchRate: 0.5 }), dt, []);
    close(next.yaw, 0.3 + 2.5 * dt);
    close(next.pitch, -0.1 + 1.25 * dt);
  }
});

test('level 清單裡的每個牆壁與家具方塊都能擋住玩家', async () => {
  const { createPlayer, updatePlayer, PLAYER_RADIUS } = await load();
  const { LEVEL_BOXES } = await import('./fixtures/demo-room.js');
  assert.ok(LEVEL_BOXES.filter((box) => box.kind === 'table').length >= 1);
  assert.equal(LEVEL_BOXES.filter((box) => box.kind === 'wall').length, 4);
  for (const box of LEVEL_BOXES) {
    for (const side of [-1, 1]) {
      const limit = side < 0 ? box.minX - PLAYER_RADIUS : box.maxX + PLAYER_RADIUS;
      let state = createPlayer({ x: limit + side * 0.05, z: (box.minZ + box.maxZ) / 2, paused: false });
      for (let i = 0; i < 10; i++) state = updatePlayer(state, action({ x: -side }), 0.1, [box]);
      assert.ok(side * (state.x - limit) >= -1e-9, box.id);
    }
  }
});

test('移動模組與關卡可在沒有瀏覽器的 Node 單獨載入，常數符合規格', async () => {
  const movement = await load();
  await import('../src/logic/level.js');
  assert.equal(typeof globalThis.window, 'undefined');
  close(movement.WALK_SPEED, 2.5);
  close(movement.PLAYER_RADIUS, 0.3);
  close(movement.EYE_HEIGHT, 1.6);
});
