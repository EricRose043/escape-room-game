export const KEYPAD_KEYS = Object.freeze(['1','2','3','4','5','6','7','8','9','delete','0','submit']);

export function createKeypad(deviceId) {
  return {mode:'keypad',deviceId,buffer:'',selectedIndex:0,message:''};
}
export function keypadButtonCommand(key) {
  if (/^\d$/.test(key)) return {type:'digit',value:key};
  return ['delete','submit','cancel'].includes(key) ? {type:key} : null;
}
export function resolveKeypadCommand(ui, command) {
  return command?.type === 'activate' ? keypadButtonCommand(KEYPAD_KEYS[ui.selectedIndex]) : command;
}
export function updateKeypad(ui, command) {
  if (ui.mode !== 'keypad') return ui;
  const action=resolveKeypadCommand(ui,command);
  if (!action) return ui;
  if (action.type === 'cancel') return {mode:'explore'};
  if (action.type === 'digit' && typeof action.value === 'string' && /^\d$/.test(action.value)) {
    return {...ui,buffer:(ui.buffer+action.value).slice(0,4),message:''};
  }
  if (action.type === 'delete') return {...ui,buffer:ui.buffer.slice(0,-1),message:''};
  if (action.type === 'move') {
    const i=ui.selectedIndex,row=Math.floor(i/3),col=i%3;
    const next={up:row>0?i-3:i,down:row<3?i+3:i,left:col>0?i-1:i,right:col<2?i+1:i}[action.direction];
    return next === undefined ? ui : {...ui,selectedIndex:next};
  }
  return ui;
}
