import { buttonLabel } from '../logic/gamepad.js';

export function createStartMenuView(root,sendCommand) {
  const buttons=Object.fromEntries(['continue','new','confirm','cancel','return'].map(id=>[id,root.querySelector(`#start-${id}`)]));
  const message=root.querySelector('#start-message'),hint=root.querySelector('#start-hint');
  let mode='closed',selected=null;
  for(const [id,button] of Object.entries(buttons)) button.addEventListener('click',event=>{
    event.preventDefault();
    if(mode==='closed' || button.disabled || button.hidden) return;
    sendCommand({type:{confirm:'confirm-new',return:'resume'}[id]??id});
  });
  return {sync(state,device) {
    const show=state.mode!=='closed',confirm=state.mode==='confirm';root.hidden=!show;mode=state.mode;
    if(!show) {selected=null;return;}
    message.textContent=confirm?'確定重新開始？這會取代本章節存檔。':state.reason || '選擇繼續或重新開始。';
    hint.textContent=device==='keyboard'?'滑鼠點擊／方向鍵選擇 · Enter 確認 · Esc 取消。手把先按任一鍵喚醒。'
      :`${buttonLabel('menu',device)} 選擇 · ${buttonLabel('confirm',device)} 確認 · ${buttonLabel('cancel',device)} 取消`;
    for(const [id,button] of Object.entries(buttons)) {
      button.hidden=['confirm','cancel'].includes(id)?!confirm:confirm || (id==='return' && !state.hasCurrent);
      button.disabled=button.hidden || (id==='continue' && !state.canContinue);
      const active=(id==='return'?'resume':id)===state.selected;
      button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));
      if(active && selected!==state.selected) button.focus();
    }
    selected=state.selected;
  }};
}
