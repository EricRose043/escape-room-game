import { keypadButtonCommand } from '../logic/keypad.js';
import { buttonLabel } from '../logic/gamepad.js';

// 僅負責 DOM 與焦點；所有輸入、選取、錯誤及解鎖狀態由 logic 決定。
export function createKeypadView(root, sendCommand) {
  const buttons=Array.from(root.querySelectorAll('[data-key]'));
  const back=root.querySelector('#keypad-back');
  const buffer=root.querySelector('#keypad-buffer');
  const message=root.querySelector('#keypad-message');
  const hint=root.querySelector('#keypad-hint');
  let selectedIndex=-1;
  let visible=false;
  for (const button of [...buttons,back]) {
    button.addEventListener('click',event=>{
      event.preventDefault();
      if (!visible) return;
      const command=keypadButtonCommand(button===back?'cancel':button.dataset.key);
      if (command) sendCommand(command);
    });
  }
  return {
    sync(ui, paused, device) {
      const show=ui.mode==='keypad' && !paused;
      root.hidden=!show;
      for (const button of [...buttons,back]) button.disabled=!show;
      if (show) {
        buffer.textContent=ui.buffer.padEnd(4,'＿');
        message.textContent=ui.message;
        hint.textContent=device==='keyboard' ? '點按鍵或輸入數字 · Backspace 刪除 · Enter 確認 · Esc 返回'
          : `十字鍵選擇 · ${buttonLabel('confirm',device)} 按鍵 · ${buttonLabel('cancel',device)} 返回 · ${buttonLabel('pause',device)} 暫停`;
        for (const [index,button] of buttons.entries()) {
          const selected=index===ui.selectedIndex;
          button.classList.toggle('selected',selected);
          button.setAttribute('aria-pressed',String(selected));
        }
        if (!visible || selectedIndex!==ui.selectedIndex) buttons[ui.selectedIndex]?.focus();
        selectedIndex=ui.selectedIndex;
      }
      visible=show;
    },
  };
}
