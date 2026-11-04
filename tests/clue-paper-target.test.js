import test from 'node:test';
import assert from 'node:assert/strict';
import * as l from '../src/logic/index.js';
import {EXIT_CLUE_IDS,EXIT_CODE} from '../src/logic/puzzles/exit-code.js';

const documents=[['corridor.clue-note','corridor.color-key'],['exit.clue-note','exit.reverse-clue']];
function ready(deviceId){const s=l.createChapter();return {...s,checkpointId:'production.checkpoint',player:{...s.player,paused:false},inventory:{itemIds:['lobby.flashlight','lobby.employee-card','power.fuse']},puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:true},'production.sequence':{installedItemId:null,restored:true},'production.color-sequence':{installedItemId:null,restored:true}},foundClueIds:deviceId.startsWith('exit')?EXIT_CLUE_IDS.slice(0,2):EXIT_CLUE_IDS.slice(0,1),corridor:{...s.corridor,complete:deviceId.startsWith('exit')}};}
function aimPaper(s,clue,{horizontal=0,vertical=0,standingHorizontal=horizontal,distance=1.2,back=false}={}){
 const n=clue.normal,p=clue.position;
 const target={x:p.x+n.z*horizontal,y:p.y+vertical,z:p.z-n.x*horizontal};
 const side=back?-1:1,player={...s.player,x:p.x+n.z*standingHorizontal+n.x*distance*side,z:p.z-n.x*standingHorizontal+n.z*distance*side};
 player.yaw=Math.atan2(player.x-target.x,player.z-target.z);player.pitch=Math.atan2(target.y-l.EYE_HEIGHT,Math.hypot(player.x-target.x,player.z-target.z));
 return {...s,player};
}

test('瞄準兩張2413文件的實際紙面中心即可讀取，無需瞄下方牆壁',()=>{
 for(const [deviceId,clueId] of documents){
  const clue=l.CLUES.find(c=>c.id===clueId);
  for(const standingHorizontal of deviceId.startsWith('corridor')?[-1.35,-.85,-.35,0,.3]:[-1.1,0,1.1]){
  let s=aimPaper(ready(deviceId),clue,{standingHorizontal,distance:1.18});
  assert.ok(!l.getGeometry(s).collisionBoxes.some(b=>l.circleOverlapsBox(s.player.x,s.player.z,b)),`${deviceId}有正常站位`);
  assert.equal(l.selectChapterTarget(s)?.id,deviceId,'visible document center is the interaction target');
  assert.equal(s.foundClueIds.includes(clueId),false);assert.equal(l.validatePuzzleCode(s,'exit.final',EXIT_CODE),false,'瞄準不等於已記錄');
  s=l.updateChapter(s,{interactPressed:true},0);assert.ok(s.foundClueIds.includes(clueId));
  const again=l.updateChapter(s,{interactPressed:true},0);assert.equal(again.foundClueIds.length,s.foundClueIds.length,'重讀不重複收集');
  if(deviceId.startsWith('corridor'))assert.equal(l.isDoorOpen(l.DOORS.find(d=>d.id==='corridor.door-1'),s),true);
  }
 }
});

test('紙面左右及上下邊緣仍可選取，使用完整WORLD遮擋與玩家正常站位',()=>{
 for(const [deviceId,clueId] of documents){
  const clue=l.CLUES.find(c=>c.id===clueId),base=ready(deviceId);
  // 走廊紙本右緣在第一道門另一側，必須先讀中心開門再走過去觀看。
  base.foundClueIds=[...new Set([...base.foundClueIds,clueId])];
  for(const [horizontal,vertical] of [[-clue.width/2+.02,0],[clue.width/2-.02,0],[0,-clue.height/2+.01],[0,clue.height/2-.01]]){
   const s=aimPaper(base,clue,{horizontal,vertical});
   assert.ok(!l.getGeometry(s).collisionBoxes.some(b=>l.circleOverlapsBox(s.player.x,s.player.z,b)),`${deviceId} edge has legal standing room`);
   assert.equal(l.selectChapterTarget(s)?.id,deviceId,`${deviceId} paper edge ${horizontal},${vertical}`);
  }
 }
});

test('修正紙面選取不允許穿牆或超距閱讀，也不繞過線索門檻',()=>{
 for(const [deviceId,clueId] of documents){
  const clue=l.CLUES.find(c=>c.id===clueId),base=ready(deviceId);
  for(const options of [{back:true,distance:1},{distance:2.2}]){
   const blocked=aimPaper(base,clue,options);assert.notEqual(l.selectChapterTarget(blocked)?.id,deviceId);
   const attempted=l.updateChapter(blocked,{interactPressed:true},0);assert.equal(attempted.foundClueIds.includes(clueId),false);
  }
 }
 const s=ready('corridor.clue-note');assert.equal(l.isDoorOpen(l.DOORS.find(d=>d.id==='corridor.door-1'),s),false);
});
