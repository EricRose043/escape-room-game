import { EYE_HEIGHT } from './movement.js';
import { LEVEL_BOXES, ROOM_SURFACES } from './level.js';
import { ITEMS } from './items.js';

export const INTERACT_DISTANCE = 2;

export function viewRay(player) {
  const cosPitch = Math.cos(player.pitch);
  return {
    origin: { x: player.x, y: EYE_HEIGHT, z: player.z },
    direction: { x: -Math.sin(player.yaw) * cosPitch, y: Math.sin(player.pitch), z: -Math.cos(player.yaw) * cosPitch },
  };
}

// direction 為單位向量。包含擦邊；起點在方塊內時距離為 0。
export function rayBoxDistance({ origin, direction }, box) {
  let near = 0;
  let far = Infinity;
  for (const axis of ['X', 'Y', 'Z']) {
    const key = axis.toLowerCase();
    const start = origin[key];
    const delta = direction[key];
    const min = box[`min${axis}`];
    const max = box[`max${axis}`];
    if (Math.abs(delta) < 1e-12) {
      if (start < min || start > max) return null;
      continue;
    }
    const a = (min - start) / delta;
    const b = (max - start) / delta;
    near = Math.max(near, Math.min(a, b));
    far = Math.min(far, Math.max(a, b));
    if (near > far) return null;
  }
  return near;
}

export function selectItem(player, inventory, items = ITEMS, blockers = [...LEVEL_BOXES, ...ROOM_SURFACES]) {
  return selectInteractionTarget(player, inventory, items, [], blockers);
}

export function collectItem(inventory, player, actions, items = ITEMS, blockers = [...LEVEL_BOXES, ...ROOM_SURFACES]) {
  if (!actions.interactPressed) return inventory;
  const item = selectItem(player, inventory, items, blockers);
  return item ? { ...inventory, itemIds: [...inventory.itemIds, item.id] } : inventory;
}

// 設備模型本身是遮擋方塊；只略過當前設備自己的方塊，其他表面仍擋住互動。
export function selectInteractionTarget(player, inventory, items, devices, blockers) {
  if (player.paused) return null;
  const ray = viewRay(player);
  const candidates = [
    ...items.filter(item => !inventory.itemIds.includes(item.id)),
    ...devices,
  ].map(target => ({target, distance:rayBoxDistance(ray, target.bounds ?? target)}))
    .filter(hit => hit.distance !== null && hit.distance <= INTERACT_DISTANCE)
    .sort((a,b) => a.distance - b.distance);
  const hit = candidates[0];
  if (!hit) return null;
  if (blockers.some(box => {
    if (hit.target.bounds && (box.id === hit.target.id || (hit.target.interactionOccluderId && box.id === hit.target.interactionOccluderId))) return false;
    const distance = rayBoxDistance(ray, box);
    return distance !== null && distance <= hit.distance;
  })) return null;
  return hit.target;
}
