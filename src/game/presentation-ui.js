import { WORLD } from '../logic/world.js';
import { operationGuide,controlLegend } from './operation-guide.js';
import { createControlGlyph } from './control-glyph.js';
import { createControllerDiagram } from './controller-diagram.js';

export function createPresentationUI(doc=document,{reasoning=false}={}){
  const body=doc.body,map=doc.querySelector?.('#factory-map'),content=doc.querySelector?.('#map-content');
  if(!body||!map||!content||!doc.createElementNS)return {sync(){}};
  const namespace='http://www.w3.org/2000/svg';
  const svg=(tag,attrs={},text)=>{const n=doc.createElementNS(namespace,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(text)n.textContent=text;return n;};
  const diagram=svg('svg',{viewBox:'-6 -25 74 35',class:'factory-diagram',role:'img','aria-label':'工廠六區配置與目前位置'});
  const rooms=svg('g');diagram.append(rooms);
  for(const [i,area] of WORLD.areas.entries()){
    const b=area.bounds;
    if(area.id==='chase-corridor'){
      rooms.append(svg('path',{d:'M 21.2 -6.5 H 27 V -17.5 H 40',fill:'none',stroke:'#607d65','stroke-width':2.6}));
      rooms.append(svg('path',{d:'M 21.2 -6.5 H 27 V -17.5 H 40',fill:'none',stroke:'#cbbd8b','stroke-width':.06,'stroke-dasharray':'.35 .25'}));
      rooms.append(svg('text',{x:31,y:-19.7,'font-size':.95,fill:'#344e43'},'04 追逐走廊'));
      continue;
    }
    rooms.append(svg('rect',{x:b.minX,y:b.minZ,width:b.maxX-b.minX,height:b.maxZ-b.minZ,rx:.2,fill:'#6e886955',stroke:'#45604c','stroke-width':.12}));
    const cx=(b.minX+b.maxX)/2,cy=(b.minZ+b.maxZ)/2;
    rooms.append(svg('text',{x:cx,y:cy-.2,'text-anchor':'middle','font-size':1,fill:'#294538'},`0${i+1}`));
    rooms.append(svg('text',{x:cx,y:cy+1.2,'text-anchor':'middle','font-size':.85,fill:'#294538'},area.name));
  }
  for(const d of WORLD.areas.flatMap(a=>a.doors)){
    const b=d.bounds;rooms.append(svg('rect',{x:b.minX-.08,y:b.minZ-.08,width:b.maxX-b.minX+.16,height:b.maxZ-b.minZ+.16,fill:'#c5ae78'}));
  }
  const marker=svg('g'),ring=svg('circle',{r:.5,fill:'#b36345',stroke:'#efdfaf','stroke-width':.17});marker.append(ring,svg('circle',{r:.14,fill:'#f2e0b5'}));diagram.append(marker);
  content.before(diagram);
  const hud=doc.createElement('div');hud.id='location-hud';hud.setAttribute('aria-hidden','true');body.append(hud);
  const danger=doc.createElement('div');danger.id='danger-indicator';danger.textContent='保持移動 · 小心身後';danger.hidden=true;body.append(danger);
  const make=(tag,id,text)=>{const e=doc.createElement(tag);if(id)e.id=id;if(text)e.textContent=text;return e;};
  const tutorial=make('aside','context-guide');tutorial.setAttribute('aria-label','操作指引');
  const eyebrow=make('p',null,'操作指引'),title=make('h2'),copy=make('p'),actions=make('div');actions.className='guide-actions';tutorial.append(eyebrow,title,copy,actions);body.append(tutorial);
  const ribbon=make('div','control-ribbon');body.append(ribbon);
  const pauseLegend=make('div','pause-controls');pauseLegend.append(make('h2',null,'操作指南'));
  const pauseRows=make('div');pauseRows.className='control-grid';pauseLegend.append(pauseRows,make('p',null,'物品要靠近兩公尺內，並用中央準星對準。躲櫃也使用互動鍵。'));
  const pauseController=make('div','pause-controller');pauseController.hidden=true;pauseRows.before(pauseController);
  doc.querySelector('#pause-screen section')?.append(pauseLegend);
  const startLegend=make('div','start-controls');doc.querySelector('#start-message')?.before(startLegend);
  const startController=make('aside','start-controller'),startControllerTitle=make('h2'),startControllerMap=make('div');
  startController.hidden=true;startController.append(make('p',null,'CONTROLLER / 操作配置'),startControllerTitle,startControllerMap,make('p',null,'先按任一鍵喚醒手把並放開，再按下方確認鍵。地圖須先取得；肩鍵須先拿到手電筒。'));
  doc.querySelector('#start-menu')?.append(startController);
  const help=make('button','help-shortcut','操作指南 · H');help.type='button';help.addEventListener('click',()=>doc.defaultView?.dispatchEvent(new CustomEvent('factory-help-open')));body.append(help);
  const reader=make('aside','document-caption');reader.hidden=true;reader.append(make('p',null,'文件內容'),make('p','document-copy'));reader.setAttribute('role','status');body.append(reader);
  const renderControls=(container,entries,device)=>{container.replaceChildren();for(const entry of entries){const row=make('span'),key=createControlGlyph(doc,entry.control,device,entry.key),text=make('span',null,entry.action);row.className='control-binding';row.append(key,text);container.append(row);}};
  let controlDevice='',previousGuide='',previousReading='';
  let previousArea='',previousPosition='',previousMode='',previousThreat=false;
  return {sync(state,session,prompt,target,reading){
    const device=prompt?.device??'keyboard';
    if(device!==controlDevice){
      controlDevice=device;const legend=controlLegend(device);
      renderControls(pauseRows,legend,device);renderControls(startLegend,legend.slice(0,3),device);
      renderControls(ribbon,legend.slice(0,3).concat(legend[5]),device);
      const pad=device!=='keyboard';
      body.dataset.controlDevice=device;pauseLegend.dataset.device=device;
      doc.querySelector('#start-menu section')?.setAttribute('aria-describedby',pad?'start-message start-hint start-controller':'start-message start-hint');
      pauseRows.hidden=pad;pauseController.hidden=!pad;startController.hidden=!pad;
      if(pad){
        pauseController.replaceChildren(createControllerDiagram(doc,device));
        startControllerMap.replaceChildren(createControllerDiagram(doc,device));
        startControllerTitle.textContent=device==='ps'?'PlayStation 手把':device==='unknown'?'標準手把':'Xbox 手把';
      }else {pauseController.replaceChildren();startControllerMap.replaceChildren();}
      help.textContent=`操作指南 · ${device==='keyboard'?'H':device==='ps'?'Options':'Start'}`;
    }
    const guide=operationGuide(state,device,target,{reasoning}),guideKey=device+JSON.stringify(guide);
    if(guideKey!==previousGuide){previousGuide=guideKey;title.textContent=guide.title;copy.textContent=guide.body;renderControls(actions,guide.actions,device);}
    tutorial.hidden=session.paused||!['explore','hiding'].includes(state.ui.mode)||state.puzzles['power.main']?.restored;
    ribbon.hidden=session.paused||!['explore','hiding'].includes(state.ui.mode)||state.puzzles['power.main']?.restored;
    help.hidden=!session.hasStarted||!['explore','hiding'].includes(state.ui.mode);
    reader.hidden=!reading;body.dataset.reading=reading?'true':'false';
    if(reading&&reading.text!==previousReading){previousReading=reading.text;reader.querySelector('#document-copy').textContent=reading.text;}
    const area=WORLD.areas.find(a=>state.player.x>=a.bounds.minX&&state.player.x<=a.bounds.maxX&&state.player.z>=a.bounds.minZ&&state.player.z<=a.bounds.maxZ);
    if(area&&area.id!==previousArea){previousArea=area.id;hud.textContent=`0${WORLD.areas.indexOf(area)+1}  /  ${area.name}`;}
    const mode=session?.paused?'paused':state.ui.mode;
    if(mode!==previousMode){previousMode=mode;body.dataset.gameMode=mode;}
    const threat=!session?.paused&&state.ui.mode==='explore'&&(state.corridor?.active||Object.values(state.monsters).some(m=>m.mode==='chase'));
    if(threat!==previousThreat){previousThreat=threat;body.dataset.threat=threat?'true':'false';danger.hidden=!threat;}
    if(!map.hidden){const pos=`${state.player.x.toFixed(2)},${state.player.z.toFixed(2)}`;if(pos!==previousPosition){previousPosition=pos;marker.setAttribute('transform',`translate(${state.player.x} ${state.player.z})`);}}
  }};
}
