import { collectItem } from './interaction.js';
import { ITEMS } from './items.js';
import { LEVEL_BOXES, ROOM_SURFACES } from './level.js';

export const DRAIN_PER_SECOND = 0.2;
export const BATTERY_CHARGE = 25;

export function createFlashlight() {
  return { charge: 100, enabled: false, mode: 'normal' };
}

function blocked(actions, paused) {
  return paused || actions.gameplayActive === false || actions.focusLost || actions.forcePause || actions.pausePressed;
}

export function updateFlashlight(state, actions = {}, dt = 0, paused = false) {
  if (blocked(actions, paused)) return state;
  const seconds = Number.isFinite(dt) && dt > 0 ? dt : 0;
  // dt 是這次按下前經過的遊戲時間，先依原本開關狀態耗電。
  const charge = Math.max(0, state.charge - (state.enabled ? DRAIN_PER_SECOND * seconds : 0));
  let enabled = state.enabled && charge > 0;
  if (actions.flashlightPressed) enabled = charge > 0 && !enabled;
  const mode = actions.uvPressed ? (state.mode === 'normal' ? 'uv' : 'normal') : state.mode;
  return { ...state, charge, enabled, mode };
}

export function rechargeFlashlight(state, amount) {
  const gain = Number.isFinite(amount) && amount > 0 ? amount : 0;
  return { ...state, charge: Math.min(100, state.charge + gain) };
}

// 只從既有撿取結果取得本幀新增 ID，不另寫距離或遮擋判定。
export function updateEquipment(state, player, actions = {}, dt = 0, items = ITEMS, blockers = [...LEVEL_BOXES, ...ROOM_SURFACES]) {
  if (blocked(actions, player.paused)) return state;
  let flashlight = updateFlashlight(state.flashlight, actions, dt);
  const inventory = collectItem(state.inventory, player, actions, items, blockers);
  for (const id of inventory.itemIds) {
    if (state.inventory.itemIds.includes(id)) continue;
    const item = items.find(candidate => candidate.id === id);
    if (item?.kind === 'battery') flashlight = rechargeFlashlight(flashlight, item.chargeAmount);
  }
  return { ...state, inventory, flashlight };
}
