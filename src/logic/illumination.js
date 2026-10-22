import { viewRay, rayBoxDistance } from './interaction.js';
import { LEVEL_BOXES, ROOM_SURFACES } from './level.js';

// 同時供 SpotLight 與 logic 使用。halfAngle 是半角，distance 單位為公尺。
export const BEAM = Object.freeze({ halfAngle: 25 * Math.PI / 180, distance: 8 });
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

export function isClueVisible(player, flashlight, clue, blockers = [...LEVEL_BOXES, ...ROOM_SURFACES]) {
  if (!flashlight.enabled || flashlight.charge <= 0 || flashlight.mode !== 'uv') return false;
  const { origin, direction: forward } = viewRay(player);
  const offset = { x: clue.position.x - origin.x, y: clue.position.y - origin.y, z: clue.position.z - origin.z };
  const distance = Math.hypot(offset.x, offset.y, offset.z);
  if (distance === 0 || distance > BEAM.distance || dot(clue.normal, offset) >= 0) return false;
  const direction = { x: offset.x / distance, y: offset.y / distance, z: offset.z / distance };
  // 僅補償三角函數的浮點誤差，讓恰好半角邊界包含在內。
  if (dot(forward, direction) < Math.cos(BEAM.halfAngle) - 1e-12) return false;
  return !blockers.some(box => {
    const hit = rayBoxDistance({ origin, direction }, box);
    return hit !== null && hit <= distance;
  });
}
