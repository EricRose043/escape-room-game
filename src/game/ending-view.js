export function showEnding(container,result,onRestart) {
  if(!container?.ownerDocument) throw new TypeError('結局容器必須是 DOM 元素');
  const doc=container.ownerDocument;
  container.replaceChildren();container.hidden=false;
  const section=doc.createElement('section'),title=doc.createElement('h1'),time=doc.createElement('p'),restart=doc.createElement('button');
  section.setAttribute('role','dialog');section.setAttribute('aria-modal','true');
  title.dataset.endingTitle='';title.textContent='你逃出了玩具工廠';
  time.dataset.endingTime='';time.textContent=result?.formattedTime??'0 分 00 秒';
  restart.type='button';restart.textContent='重新開始';restart.dataset.endingAction='restart';
  section.append(title,time,restart);container.append(section);restart.focus();restart.addEventListener('click',()=>onRestart?.());
  let disposed=false,frame=0,previousButtons=[];
  const activate=()=>{if(!disposed)onRestart?.();};
  const onKeyDown=event=>{
    if(['KeyA'].includes(event.code)||(['Enter','Space'].includes(event.code)&&doc.activeElement!==restart)){event.preventDefault();activate();}
    if(event.code==='Escape'||event.code==='KeyB') event.preventDefault();
  };
  container.addEventListener('keydown',onKeyDown);
  function pollGamepad(){
    if(disposed)return;
    try {
      const pads=doc.defaultView?.navigator?.getGamepads?.()??[];
      const pad=Array.from(pads).find(candidate=>candidate?.connected);
      const buttons=pad?.buttons??[];
      const confirm=Boolean(buttons[0]?.pressed),dpad=Boolean(buttons[12]?.pressed||buttons[13]?.pressed||buttons[14]?.pressed||buttons[15]?.pressed);
      if(confirm&&!previousButtons[0]) activate();
      if(dpad&&!previousButtons[12]&&!previousButtons[13]&&!previousButtons[14]&&!previousButtons[15]) restart.focus();
      previousButtons=buttons.map(button=>Boolean(button?.pressed));
    } catch {previousButtons=[];}
    if(doc.defaultView?.requestAnimationFrame) frame=doc.defaultView.requestAnimationFrame(pollGamepad);
  }
  if(doc.defaultView?.requestAnimationFrame) frame=doc.defaultView.requestAnimationFrame(pollGamepad);
  return ()=>{disposed=true;container.removeEventListener('keydown',onKeyDown);if(frame)doc.defaultView?.cancelAnimationFrame?.(frame);container.hidden=true;};
}
