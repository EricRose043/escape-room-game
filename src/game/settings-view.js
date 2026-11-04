import {createSettingsMenu,updateSettingsMenu,settingsKeyboardCommand,settingsGamepadCommand,updateSetting} from '../logic/settings.js';

export function showSettings(root,settings,onChange,onClose) {
  const doc=root.ownerDocument;
  let menu=createSettingsMenu(settings);
  const make=(tag,text)=>{const el=doc.createElement(tag);if(text)el.textContent=text;return el;};
  const panel=make('section'),heading=make('h2','設定');heading.id='settings-title';
  const hint=make('p','方向鍵／十字鍵：上下選擇、左右調整；Enter／A／✕ 切換；Esc／B／○ 返回。');
  const status=make('p');status.setAttribute('role','status');
  const controls=[],values=[];
  for(const [index,key,label,min,max,step] of [[0,'volume','主音量',0,100,1],[1,'jumpScare','驚嚇近景'],[2,'mouseSensitivity','滑鼠靈敏度',.25,3,.25]]) {
    const row=make('div');row.className='settings-row';
    const text=make('label',label),value=make('output');text.htmlFor=`setting-${key}`;
    const control=make(key==='jumpScare'?'button':'input');control.id=`setting-${key}`;
    if(key==='jumpScare') {control.type='button';control.setAttribute('role','switch');control.setAttribute('aria-label',label);}
    // 儲存層接受範圍內的任何有限數值；原生 range 不應把合法舊設定量化。
    // 鍵盤／手把的增量仍由 updateSettingsMenu 控制。
    else {control.type='range';control.min=String(min);control.max=String(max);control.step=key==='volume'&&Number.isInteger(settings.volume)?'1':'any';}
    control.addEventListener('focus',()=>{menu={...menu,selected:index};});
    control.addEventListener(key==='jumpScare'?'click':'input',()=>{
      menu={...menu,selected:index};
      if(key==='jumpScare') command({type:'activate'});
      else setValue(key,Number(control.value));
    });
    row.append(text,control,value);panel.append(row);controls.push(control);values.push(value);
  }
  const closeButton=make('button','返回遊戲選單');closeButton.type='button';
  closeButton.addEventListener('click',close);closeButton.addEventListener('focus',()=>{menu={...menu,selected:3};});
  controls.push(closeButton);panel.append(closeButton,hint,status);
  // 標題先於控制項，保持視覺與閱讀順序一致。
  const content=make('div');content.append(heading,panel);root.replaceChildren(content);
  root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','settings-title');root.hidden=false;
  function render(focus=false) {
    controls[0].value=String(menu.settings.volume);values[0].textContent=`${menu.settings.volume}%`;
    controls[1].setAttribute('aria-checked',String(menu.settings.jumpScare));controls[1].textContent=menu.settings.jumpScare?'開啟':'關閉';
    values[1].textContent=menu.settings.jumpScare?'被抓時播放齜牙貼臉演出':'關閉貼臉演出，被抓時僅顯示黑畫面';
    controls[2].value=String(menu.settings.mouseSensitivity);values[2].textContent=`${menu.settings.mouseSensitivity} 倍`;
    controls.forEach((el,index)=>el.classList.toggle('selected',index===menu.selected));
    if(focus)controls[menu.selected].focus();
  }
  function changed(before) {if(Object.keys(before).some(k=>before[k]!==menu.settings[k]))onChange({...menu.settings});}
  function setValue(key,value) {
    const before=menu.settings;
    // range 的瀏覽器數值仍經純規則夾住，與鍵盤／手把共用界線。
    menu={...menu,settings:updateSetting(menu.settings,key,value)};
    render();changed(before);
  }
  function command(cmd) {if(menu.closed||!cmd)return;const before=menu.settings;menu=updateSettingsMenu(menu,cmd);if(menu.closed){finish();return;}render(true);changed(before);}
  function keydown(event) {
    if(event.code==='Tab') {
      event.preventDefault();event.stopPropagation();menu={...menu,selected:(menu.selected+(event.shiftKey?3:1))%4};render(true);return;
    }
    const cmd=settingsKeyboardCommand(event);if(cmd){event.preventDefault();event.stopPropagation();command(cmd);}
  }
  function finish(){root.hidden=true;root.removeEventListener('keydown',keydown);onClose();}
  function close(){if(menu.closed)return;menu={...menu,closed:true};finish();}
  root.addEventListener('keydown',keydown);render(true);
  return {command,close,handleGamepad:actions=>command(settingsGamepadCommand(actions)),setStatus:message=>{status.textContent=message;}};
}
