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
  if (player.paused) return null;
  const ray = viewRay(player);
  let selected = null;
  let distance = Infinity;
  for (const item of items) {
    if (inventory.itemIds.includes(item.id)) continue;
    const hit = rayBoxDistance(ray, item);
    if (hit !== null && hit <= INTERACT_DISTANCE && hit < distance) {
      selected = item;
      distance = hit;
    }
  }
  if (!selected) return null;
  if (blockers.some(box => {
    const hit = rayBoxDistance(ray, box);
    return hit !== null && hit <= distance;
  })) return null;
  return selected;
}

export function collectItem(inventory, player, actions, items = ITEMS, blockers = [...LEVEL_BOXES, ...ROOM_SURFACES]) {
  if (!actions.interactPressed) return inventory;
  const item = selectItem(player, inventory, items, blockers);
  return item ? { ...inventory, itemIds: [...inventory.itemIds, item.id] } : inventory;
}
