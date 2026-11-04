const bounded=level=>Math.max(0,Math.min(3,Number.isFinite(level)?level:0));
export const pressureSpeed=level=>2.1+bounded(level)*.06;
export function progressionBefore(state,actions,dt){
 const old=state.pressure??{level:0,remaining:0,deviceId:null};
 const paused=state.player.paused||actions.gameplayActive===false||actions.pausePressed||actions.forcePause||actions.focusLost;
 const remaining=Math.max(0,old.remaining-(paused?0:Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0))));
 let ui=state.ui;
 if(old.remaining>0&&ui.mode==='keypad')ui={...ui,message:remaining>0?`安全鎖復位中（${Math.ceil(remaining)} 秒），警報尚未解除。`:''};
 return {...state,pressure:{...old,remaining},ui};
}
export function progressionAfter(before,next,commands=[]){
 const submitted=commands.some(c=>c.type==='submit'||c.type==='activate'&&before.ui.selectedIndex===11);
 const wrongCode=before.ui.mode==='keypad'&&next.ui.mode==='keypad'&&submitted&&/錯誤/.test(next.ui.message??'');
 const wrongSequence=next.events!==before.events&&next.events?.some(e=>e.type==='alarm');
 if(!wrongCode&&!wrongSequence)return next;
 const id=before.ui.deviceId;
 if(wrongCode&&id==='power.keypad')return next;
 const level=bounded((before.pressure?.level??0)+1);
 const duration=wrongCode?(id==='bay.train-console'?4: id==='exit.final-keypad'?2+level*.5:0):0;
 return {...next,pressure:{level,remaining:duration,deviceId:id??null},events:[...(next.events??[]).filter(e=>e.type!=='alarm'),{type:'alarm'}],
   ui:duration>0?{...next.ui,message:`檢修錯誤！警報響起，安全鎖復位 ${Math.ceil(duration)} 秒。`}:next.ui};
}
export function progressiveObjective(s,fallback){
 if(!s.puzzles['power.main']?.restored||!['explore','keypad'].includes(s.ui.mode))return fallback;
 if(s.pressure?.remaining>0)return '警報響起。等待控制器復位，重新核對你收集的線索。';
 if(!s.puzzles['production.sequence']?.restored)return '裝配線封鎖中。留意機台與牆上的檢修紀錄，避開玩偶視線。';
 if(!s.puzzles['production.color-sequence']?.restored)return '觀察牆上三個排序條件，推導四色復位順序。';
 if(s.corridor?.active)return fallback;
 if(!s.puzzles['exit.final']?.restored)return '把沿路線索放在一起推理；注意方向與代碼的關係，地圖保留已讀紀錄。';
 if(!s.trainStarted)return '完成月台檢修：找到設備讀數、現場規則與軌道資訊，再決定發車碼。';
 return fallback;
}
