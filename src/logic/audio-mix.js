// 距離以公尺、速度以公尺／秒、間隔以秒。這些是可調音效參數，不改遊戲規則。
export const AUDIO_MIX = Object.freeze({
  heartbeatNear: 2, heartbeatFar: 14,
  stepDistance: 1.3, minFootstepInterval: 0.18, maxFootstepInterval: 1.2,
});
export function heartbeatIntensity(distance) {
  if (typeof distance !== 'number' || !Number.isFinite(distance) || distance < 0) return 0;
  return Math.max(0, Math.min(1, (AUDIO_MIX.heartbeatFar - distance) / (AUDIO_MIX.heartbeatFar - AUDIO_MIX.heartbeatNear)));
}
export function footstepInterval(speed) {
  if (typeof speed !== 'number' || !Number.isFinite(speed) || speed <= 0) return Infinity;
  return Math.max(AUDIO_MIX.minFootstepInterval, Math.min(AUDIO_MIX.maxFootstepInterval, AUDIO_MIX.stepDistance / speed));
}
