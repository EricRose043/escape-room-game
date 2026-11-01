export function showEnding(container,result,onRestart,options={}) {
  if(!container?.ownerDocument) throw new TypeError('結局容器必須是 DOM 元素');
  const doc=container.ownerDocument;
  container.replaceChildren();container.hidden=false;
  const section=doc.createElement('section'),title=doc.createElement('h1'),time=doc.createElement('p'),restart=doc.createElement('button');
  section.setAttribute('role','dialog');section.setAttribute('aria-modal','true');
  title.dataset.endingTitle='';title.textContent=options.title??'你逃出了玩具工廠';
  time.dataset.endingTime='';time.textContent=result?.formattedTime??'0 分 00 秒';
  restart.type='button';restart.textContent='重新開始';restart.dataset.endingAction='restart';
  section.append(title,time,restart);container.append(section);restart.focus();restart.addEventListener('click',()=>onRestart?.());
  const actions=[()=>onRestart?.()],buttons=[restart];let selected=0;
  restart.addEventListener('focus',()=>{selected=0;});
  if(options.storyText){const story=doc.createElement('p');story.textContent=options.storyText;section.append(story);}
  if(options.onMap){const map=doc.createElement('button');map.type='button';map.dataset.endingAction='map';map.addEventListener('focus',()=>{selected=1;});map.textContent='查看完整收藏地圖';map.addEventListener('click',options.onMap);section.append(map);actions.push(options.onMap);buttons.push(map);}
  let disposed=false,frame=0,previousButtons=[],awaitRelease=options.ignoreHeld===true;
  if(options.ignoreHeld)try{previousButtons=Array.from(doc.defaultView.navigator.getGamepads()).find(p=>p?.connected)?.buttons.map(b=>Boolean(b?.pressed))??[];}catch{}
  const select=direction=>{selected=(selected+direction+buttons.length)%buttons.length;buttons[selected].focus();};
  const activate=()=>{if(!disposed)actions[selected]();};
  const onKeyDown=event=>{
    if(event.repeat)return;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code)){event.preventDefault();select(['ArrowUp','ArrowLeft'].includes(event.code)?-1:1);return;}
    if(['KeyA'].includes(event.code)||(['Enter','Space'].includes(event.code)&&doc.activeElement!==restart)){event.preventDefault();activate();}
    if(event.code==='Escape'||event.code==='KeyB') event.preventDefault();
  };
  container.addEventListener('keydown',onKeyDown);
  function pollGamepad(){
    if(disposed)return;
    try {
      const pads=doc.defaultView?.navigator?.getGamepads?.()??[];
      const pad=Array.from(pads).find(candidate=>candidate?.connected);
      const padButtons=pad?.buttons??[];
      const confirm=Boolean(padButtons[0]?.pressed),dpad=Boolean(padButtons[12]?.pressed||padButtons[13]?.pressed||padButtons[14]?.pressed||padButtons[15]?.pressed);
      if(container.hidden)awaitRelease=true;else if(!padButtons.some(b=>b?.pressed))awaitRelease=false;
      if(!awaitRelease&&!container.hidden&&confirm&&!previousButtons[0]) activate();
      if(!awaitRelease&&!container.hidden&&dpad&&!previousButtons[12]&&!previousButtons[13]&&!previousButtons[14]&&!previousButtons[15])select(padButtons[12]?.pressed||padButtons[14]?.pressed?-1:1);
      previousButtons=padButtons.map(button=>Boolean(button?.pressed));
    } catch {previousButtons=[];}
    if(doc.defaultView?.requestAnimationFrame) frame=doc.defaultView.requestAnimationFrame(pollGamepad);
  }
  if(doc.defaultView?.requestAnimationFrame) frame=doc.defaultView.requestAnimationFrame(pollGamepad);
  return ()=>{disposed=true;container.removeEventListener('keydown',onKeyDown);if(frame)doc.defaultView?.cancelAnimationFrame?.(frame);container.hidden=true;};
}
