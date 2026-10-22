// Standard Gamepad 軸與按鈕索引：https://www.w3.org/TR/gamepad/#remapping
// id 常見格式：https://developer.mozilla.org/en-US/docs/Web/API/Gamepad/id
// 廠商碼資料：https://usb-ids.gowdy.us/（045e Microsoft、054c Sony）
export const DEAD_ZONE = 0.18;
export const PROMPT_HOLD_MS = 500;

export function classifyGamepad(id = '') {
  const vendor = id.match(/\bVendor:\s*([\da-f]{4})\b/i)?.[1]
    ?? id.match(/^([\da-f]{4})-[\da-f]{4}-/i)?.[1];
  if (vendor) {
    if (vendor.toLowerCase() === '054c') return 'ps';
    if (vendor.toLowerCase() === '045e') return 'xbox';
    return 'unknown';
  }
  if (/dualshock|dualsense|playstation|sony/i.test(id)) return 'ps';
  if (/xbox|xinput|microsoft/i.test(id)) return 'xbox';
  return 'unknown';
}

const LABELS = {
  keyboard: { move: 'WASD', look: '滑鼠', interact: 'E', cancel: 'Esc', flashlight: 'F', uv: 'R', pause: 'Esc', confirm: '滑鼠點擊', menu: '滑鼠' },
  xbox: { move: '左搖桿', look: '右搖桿', interact: 'A', cancel: 'B', flashlight: 'RB', uv: 'LB', pause: 'Start', confirm: 'A', menu: '十字鍵' },
  ps: { move: '左搖桿', look: '右搖桿', interact: '✕', cancel: '○', flashlight: 'R1', uv: 'L1', pause: 'Options', confirm: '✕', menu: '十字鍵' },
};

export function buttonLabel(action, device) {
  return (LABELS[device] ?? LABELS.xbox)[action];
}

const finite = (value) => Number.isFinite(value) ? value : 0;
export function filterStick(rawX, rawY) {
  const x = Math.max(-1, Math.min(1, finite(rawX)));
  const y = Math.max(-1, Math.min(1, finite(rawY)));
  const length = Math.hypot(x, y);
  if (length <= DEAD_ZONE) return { x: 0, y: 0 };
  const strength = ((Math.min(length, 1) - DEAD_ZONE) / (1 - DEAD_ZONE)) ** 1.5;
  return { x: x / length * strength, y: y / length * strength };
}

function emptyActions() {
  return { move: { x: 0, y: 0 }, look: { dYaw: 0, dPitch: 0, yawRate: 0, pitchRate: 0 }, pausePressed: false, confirmPressed: false };
}

export function readGamepad(pad, previousButtons = []) {
  const result = { supported: false, active: false, device: 'unknown', index: pad?.index, buttons: [], actions: emptyActions() };
  if (!pad || pad.connected === false || pad.mapping !== 'standard') return result;
  result.supported = true;
  result.device = classifyGamepad(pad.id);
  result.buttons = Array.from(pad.buttons ?? [], (button) => Boolean(button?.pressed));
  const left = filterStick(pad.axes?.[0], pad.axes?.[1]);
  const right = filterStick(pad.axes?.[2], pad.axes?.[3]);
  result.actions.move = { x: left.x, y: -left.y };
  result.actions.look.yawRate = -right.x;
  result.actions.look.pitchRate = -right.y;
  result.actions.pausePressed = Boolean(result.buttons[9] && !previousButtons[9]);
  result.actions.confirmPressed = Boolean(result.buttons[0] && !previousButtons[0]);
  result.active = Math.hypot(left.x, left.y, right.x, right.y) > 0 || result.buttons.some(Boolean);
  return result;
}

export function mergeActions(keyboard = {}, gamepad = {}) {
  const x = finite(keyboard.move?.x) + finite(gamepad.move?.x);
  const y = finite(keyboard.move?.y) + finite(gamepad.move?.y);
  const length = Math.max(1, Math.hypot(x, y));
  return {
    move: { x: x / length, y: y / length },
    look: { dYaw: finite(keyboard.look?.dYaw), dPitch: finite(keyboard.look?.dPitch),
      yawRate: finite(gamepad.look?.yawRate), pitchRate: finite(gamepad.look?.pitchRate) },
    pausePressed: Boolean(keyboard.pausePressed || gamepad.pausePressed),
    confirmPressed: Boolean(keyboard.confirmPressed || gamepad.confirmPressed),
  };
}

export function createPrompt() {
  return { device: 'keyboard', gamepadIndex: null, changedAt: -Infinity };
}

export function updatePrompt(state, candidate, now) {
  if (!candidate || (state.device === candidate.device && state.gamepadIndex === (candidate.gamepadIndex ?? null))
    || now - state.changedAt < PROMPT_HOLD_MS) return state;
  return { device: candidate.device, gamepadIndex: candidate.gamepadIndex ?? null, changedAt: now };
}

export function pauseOnDisconnect(prompt, index) {
  return prompt.device !== 'keyboard' && prompt.gamepadIndex === index;
}

export function createSession() {
  return { hasStarted: false, paused: true };
}

export function updateSession(state, actions = {}) {
  if (actions.focusLost) return state.hasStarted ? { ...state, paused: true } : state;
  if (actions.forcePause) return { ...state, paused: true };
  if (!state.hasStarted) return actions.confirmPressed ? { hasStarted: true, paused: false } : state;
  if (actions.pausePressed) return { ...state, paused: !state.paused };
  return state;
}
