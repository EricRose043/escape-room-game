import { LEVEL_BOXES } from './level.js';

export const WALK_SPEED = 2.5;
export const PLAYER_RADIUS = 0.3;
export const EYE_HEIGHT = 1.6;
export const MAX_PITCH = 85 * Math.PI / 180;
export const TURN_SPEED = 2.5;
export const MAX_DT = 0.1;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = (value) => Number.isFinite(value) ? value : 0;

export function createPlayer(overrides = {}) {
  return { x: 0, z: 3.8, yaw: 0, pitch: 0, paused: true, ...overrides };
}

export function setPaused(state, paused) {
  return { ...state, paused };
}

function overlaps(x, z, box) {
  const dx = x - clamp(x, box.minX, box.maxX);
  const dz = z - clamp(z, box.minZ, box.maxZ);
  return dx * dx + dz * dz < PLAYER_RADIUS ** 2 - 1e-12;
}

export function updatePlayer(state, actions = {}, dt = 0, boxes = LEVEL_BOXES) {
  if (actions.pausePressed) return setPaused(state, true);
  if (state.paused) return { ...state };

  const seconds = clamp(finite(dt), 0, MAX_DT);
  const look = actions.look ?? {};
  const next = {
    ...state,
    yaw: state.yaw + finite(look.dYaw) + clamp(finite(look.yawRate), -1, 1) * TURN_SPEED * seconds,
    pitch: clamp(state.pitch + finite(look.dPitch)
      + clamp(finite(look.pitchRate), -1, 1) * TURN_SPEED * seconds, -MAX_PITCH, MAX_PITCH),
  };

  const x = clamp(finite(actions.move?.x), -1, 1);
  const y = clamp(finite(actions.move?.y), -1, 1);
  const scale = WALK_SPEED * seconds / Math.max(1, Math.hypot(x, y));
  // yaw=0 面向 -Z；three.js 的 YXZ 旋轉也採相同方向。
  const dx = (x * Math.cos(next.yaw) - y * Math.sin(next.yaw)) * scale;
  const dz = (-x * Math.sin(next.yaw) - y * Math.cos(next.yaw)) * scale;

  // 每小步不超過半徑的 1/4，避免一步跨過薄牆；分軸讓玩家能沿牆滑動。
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (PLAYER_RADIUS / 4)));
  for (let step = 0; step < steps; step++) {
    const candidateX = next.x + dx / steps;
    if (!boxes.some((box) => overlaps(candidateX, next.z, box))) next.x = candidateX;
    const candidateZ = next.z + dz / steps;
    if (!boxes.some((box) => overlaps(next.x, candidateZ, box))) next.z = candidateZ;
  }
  return next;
}
