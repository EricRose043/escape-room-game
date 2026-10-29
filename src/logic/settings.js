// 驚嚇預設由呼叫端明確決定；不在儲存層暗中改變使用者選擇。
export const SETTINGS_KEY = 'escape-room.settings.v1';
export const SETTINGS_LIMITS = Object.freeze({volume:Object.freeze([0,100]),mouseSensitivity:Object.freeze([.25,3])});
export function createSettings(jumpScare) {
  if(typeof jumpScare!=='boolean') throw new TypeError('jumpScare default must be boolean');
  return {volume:32,jumpScare,mouseSensitivity:1};
}
export function updateSetting(settings,key,value) {
  if(key==='jumpScare') return typeof value==='boolean'?{...settings,jumpScare:value}:{...settings};
  const range=Object.hasOwn(SETTINGS_LIMITS,key)?SETTINGS_LIMITS[key]:null;
  return range && Number.isFinite(value)?{...settings,[key]:Math.max(range[0],Math.min(range[1],value))}:{...settings};
}
function valid(settings) {
  return settings && typeof settings==='object' && !Array.isArray(settings)
    && Object.keys(settings).length===3 && typeof settings.jumpScare==='boolean'
    && Object.entries(SETTINGS_LIMITS).every(([key,[min,max]])=>Number.isFinite(settings[key]) && settings[key]>=min && settings[key]<=max);
}
export function serialize(settings) {
  if(!valid(settings)) throw new TypeError('Invalid settings');
  return JSON.stringify({version:1,settings:{...settings}});
}
export function deserialize(raw,defaults) {
  if(!valid(defaults)) throw new TypeError('Invalid defaults');
  try {
    const data=JSON.parse(raw);
    if(data && Object.keys(data).length===2 && data.version===1 && valid(data.settings)) return {...data.settings};
  } catch {}
  return {...defaults};
}
export function createSettingsStorage(storage,defaults) {
  if(!valid(defaults)) throw new TypeError('Invalid defaults');
  let current={...defaults},state='ready',message='';
  const get=()=>({...current});
  function load() {
    try {current=deserialize(storage.getItem(SETTINGS_KEY),defaults);state='ready';message='';}
    catch {current={...defaults};state='error';message='無法讀取設定，暫用預設值；仍可遊玩。';}
    return get();
  }
  function save() {
    try {storage.setItem(SETTINGS_KEY,serialize(current));state='saved';message='設定已儲存。';return true;}
    catch {state='error';message='設定暫時無法儲存，本次仍會套用；請稍後重試。';return false;}
  }
  return {get,load,save,update(key,value){current=updateSetting(current,key,value);save();return get();},status:()=>({state,message})};
}
export function createSettingsMenu(settings) {return {selected:0,settings:{...settings},closed:false};}
export function updateSettingsMenu(menu,command) {
  if(!command || menu.closed) return menu;
  if(command.type==='close' || (command.type==='activate' && menu.selected===3)) return {...menu,closed:true};
  if(command.type==='move') return {...menu,selected:Math.max(0,Math.min(3,menu.selected+Math.sign(command.delta)))};
  const key=['volume','jumpScare','mouseSensitivity'][menu.selected];
  if(command.type==='activate' && key==='jumpScare') return {...menu,settings:updateSetting(menu.settings,key,!menu.settings[key])};
  if(command.type!=='adjust' || !key) return menu;
  const value=key==='jumpScare'?command.delta>0:menu.settings[key]+Math.sign(command.delta)*(key==='volume'?5:.25);
  return {...menu,settings:updateSetting(menu.settings,key,value)};
}
export function settingsKeyboardCommand(event) {
  if(event.repeat) return null;
  return {ArrowUp:{type:'move',delta:-1},ArrowDown:{type:'move',delta:1},ArrowLeft:{type:'adjust',delta:-1},
    ArrowRight:{type:'adjust',delta:1},Enter:{type:'activate'},Space:{type:'activate'},Escape:{type:'close'}}[event.code]??null;
}
export function settingsGamepadCommand(actions={}) {
  if(actions.cancelPressed || actions.pausePressed) return {type:'close'};
  return {up:{type:'move',delta:-1},down:{type:'move',delta:1},left:{type:'adjust',delta:-1},right:{type:'adjust',delta:1}}[actions.menuDirection]
    ??(actions.confirmPressed?{type:'activate'}:null);
}
