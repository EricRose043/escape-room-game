import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudio } from '../src/game/audio.js';

function setup({ failResume = false } = {}) {
  const nodes = [], timers = new Map(); let contexts = 0, timerId = 0;
  const parameter = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} });
  class Node {
    constructor() { this.gain = parameter(); this.frequency = parameter(); this.Q = parameter(); this.started = 0; this.stopped = 0; nodes.push(this); }
    connect() { return this; } disconnect() { this.disconnected = true; }
    start() { this.started++; } stop() { this.stopped++; }
  }
  class Context {
    constructor() { contexts++; this.currentTime = 1; this.sampleRate = 8000; this.state = 'suspended'; this.destination = new Node(); }
    createGain() { return new Node(); } createOscillator() { return new Node(); }
    createBufferSource() { return new Node(); } createBiquadFilter() { return new Node(); }
    createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length) }; }
    async resume() { if (failResume) throw new Error('blocked'); this.state = 'running'; }
    async close() { this.state = 'closed'; }
  }
  const audio = createAudio({ AudioContext: Context, setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id) });
  return { audio, nodes, timers, contexts: () => contexts };
}
test('解鎖前不建立 AudioContext，不播放或啟動背景計時', async () => {
  const { audio, contexts, timers } = setup();
  audio.setAmbience('production'); audio.setHeartbeat(0.5); audio.setMasterVolume(0.3);
  assert.equal(audio.playFootstep(), false); assert.equal(audio.playAlarm(), false); assert.equal(audio.playDoor(), false);
  assert.equal(contexts(), 0); assert.equal(timers.size, 0);
  await audio.dispose();
});
test('解鎖後可播放三種效果，重複解鎖不建立第二個 context', async () => {
  const { audio, contexts } = setup();
  assert.equal(await audio.unlock(), true); assert.equal(await audio.unlock(), true);
  assert.equal(contexts(), 1);
  assert.equal(audio.playFootstep(), true); assert.equal(audio.playAlarm(), true); assert.equal(audio.playDoor(), true);
  assert.equal(audio.getStatus().contextState, 'running');
  await audio.dispose();
});
test('每幀重送環境及心跳不疊加節點或計時器，零強度停止心跳', async () => {
  const { audio, nodes, timers } = setup(); await audio.unlock();
  audio.setAmbience('production'); audio.setHeartbeat(0.6);
  const count = nodes.length;
  for (let i = 0; i < 100; i++) { audio.setAmbience('production'); audio.setHeartbeat(0.6); }
  assert.equal(nodes.length, count); assert.equal(timers.size, 1);
  audio.setHeartbeat(0); assert.equal(timers.size, 0);
  assert.equal(audio.getStatus().voices, 0, '零強度立即停止已排程的心跳雙拍');
  audio.setAmbience(null); assert.equal(audio.getStatus().ambience, null);
  await audio.dispose();
});
test('主音量夾在零到一，無效輸入靜音', async () => {
  const { audio } = setup();
  assert.equal(audio.setMasterVolume(-1), 0); assert.equal(audio.setMasterVolume(2), 1);
  assert.equal(audio.setMasterVolume(NaN), 0);
  await audio.dispose();
});
test('停止與銷毀會清理循環，銷毀後不能再啟動', async () => {
  const { audio, timers } = setup(); await audio.unlock(); audio.setAmbience('lobby'); audio.setHeartbeat(1);
  audio.stop(); assert.equal(timers.size, 0); assert.equal(audio.getStatus().voices, 0);
  await audio.dispose(); assert.equal(await audio.unlock(), false); assert.equal(audio.playFootstep(), false);
});
test('不支援或 resume 失敗時回傳 false，不拋未處理錯誤', async () => {
  const unsupported = createAudio({ AudioContext: null }); assert.equal(await unsupported.unlock(), false); await unsupported.dispose();
  const { audio } = setup({ failResume: true }); assert.equal(await audio.unlock(), false); assert.equal(audio.playDoor(), false); await audio.dispose();
});
