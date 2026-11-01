import test from 'node:test';
import assert from 'node:assert/strict';
import { heartbeatIntensity, footstepInterval, AUDIO_MIX } from '../src/logic/audio-mix.js';

test('心跳在近距為一、遠距為零，範圍內隨距離增加而下降', () => {
  assert.equal(heartbeatIntensity(0), 1);
  assert.equal(heartbeatIntensity(AUDIO_MIX.heartbeatNear), 1);
  assert.equal(heartbeatIntensity(AUDIO_MIX.heartbeatFar), 0);
  assert.equal(heartbeatIntensity(100), 0);
  const values = [0, 1, 2, 3, 5, 8, 11, 14, 30].map(d => heartbeatIntensity(d));
  assert.ok(values.every(v => v >= 0 && v <= 1));
  assert.ok(values.every((v, i) => i === 0 || v <= values[i - 1]));
  assert.ok(heartbeatIntensity(5) > heartbeatIntensity(10));
});
test('心跳無效或負距離不產生突然滿強度', () => {
  for (const value of [NaN, Infinity, -Infinity, -1, undefined, null, '3']) assert.equal(heartbeatIntensity(value), 0);
});
test('走路越快腳步間隔越短，但不超過安全節奏上下限', () => {
  assert.ok(footstepInterval(1) > footstepInterval(2.5));
  assert.ok(footstepInterval(2.5) > footstepInterval(5));
  assert.equal(footstepInterval(1000), AUDIO_MIX.minFootstepInterval);
  assert.equal(footstepInterval(0.001), AUDIO_MIX.maxFootstepInterval);
});
test('停下及無效速度以 Infinity 表示不安排腳步', () => {
  for (const value of [0, -1, NaN, Infinity, undefined, null, '2']) assert.equal(footstepInterval(value), Infinity);
});
test('相同輸入可重播，混音常數不會被呼叫改寫', () => {
  const before = { ...AUDIO_MIX };
  for (let i = 0; i < 10; i++) { assert.equal(heartbeatIntensity(5), heartbeatIntensity(5)); footstepInterval(2.5); }
  assert.deepEqual(AUDIO_MIX, before);
  assert.equal(Object.isFrozen(AUDIO_MIX), true);
});
