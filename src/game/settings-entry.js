import {createGameSettingsStorage,SETTINGS_KEY} from '../logic/settings.js';
import {showSettings} from './settings-view.js';

const storage=createGameSettingsStorage({
  getItem:key=>window.localStorage.getItem(key),
  setItem:(key,value)=>window.localStorage.setItem(key,value),
},{search:window.location.search});
let settings=storage.load(),view=null;
const root=document.createElement('div');root.id='settings-panel';root.hidden=true;
const button=document.createElement('button');button.id='settings-button';button.type='button';button.textContent='設定（O／Y／△）';
document.body.append(button,root);
const emit=(name,detail)=>window.dispatchEvent(new CustomEvent(name,{detail}));
function close(){view=null;emit('factory-settings-close');button.focus();}
function open(){
  if(view||document.body.dataset.cinematic==='true')return;
  emit('factory-settings-open');
  view=showSettings(root,settings,next=>{
    for(const key of ['volume','jumpScare','mouseSensitivity']) if(next[key]!==settings[key])settings=storage.update(key,next[key]);
    view.setStatus(storage.status().message);emit('factory-settings-change',settings);
  },close);
  view.setStatus(storage.status().message);
}
button.addEventListener('click',open);
window.addEventListener('factory-settings-toggle',()=>view?view.close():open());
window.addEventListener('factory-settings-gamepad',event=>view?.handleGamepad(event.detail));
document.addEventListener('keydown',event=>{
  if(event.code==='KeyO'&&!event.repeat&&!view){event.preventDefault();open();}
});
window.addEventListener('storage',event=>{
  if(event.key!==SETTINGS_KEY)return;
  settings=storage.load();emit('factory-settings-change',settings);
  // 外部分頁更新時重建面板，避免下一次操作寫回舊值。
  if(view){view.close();open();}
});
