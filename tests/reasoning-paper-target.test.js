import test from 'node:test';
import assert from 'node:assert/strict';
import * as l from '../src/logic/index.js';

test('加長的跨區文件有足夠紙面，上下邊緣可按互動鍵記錄且仍限制距離與遮擋',()=>{
 const clues=l.reasoningClues(l.CLUES);
 for(const [deviceId,clueId] of [['corridor.clue-note','corridor.color-key'],['exit.clue-note','exit.reverse-clue']]){
  const clue=clues.find(c=>c.id===clueId);assert.ok(clue.height>=.75,'不能把整段文字塞進舊窄條');
  const s=l.createChapter();s.player.paused=false;s.inventory.itemIds=['lobby.flashlight','lobby.employee-card','power.fuse'];
  for(const id of ['power.main','production.sequence','production.color-sequence'])s.puzzles[id].restored=true;
  s.foundClueIds=deviceId.startsWith('exit')?['production.color-clue','corridor.color-key']:['production.color-clue'];s.corridor.complete=deviceId.startsWith('exit');
  for(const vertical of [-clue.height/2+.03,clue.height/2-.03]){
   const n=clue.normal,p=clue.position,x=p.x+n.x*1.2,z=p.z+n.z*1.2;
   const state={...s,player:{...s.player,x,z,yaw:Math.atan2(x-p.x,z-p.z),pitch:Math.atan2(p.y+vertical-l.EYE_HEIGHT,1.2)}};
   assert.equal(l.selectChapterTarget(state,{reasoning:true})?.id,deviceId);
   assert.ok(l.updateChapter(state,{interactPressed:true},0,{reasoning:true}).foundClueIds.includes(clueId));
   const far={...state,player:{...state.player,x:p.x+n.x*2.4,z:p.z+n.z*2.4,pitch:Math.atan2(p.y+vertical-l.EYE_HEIGHT,2.4)}};
   assert.notEqual(l.selectChapterTarget(far,{reasoning:true})?.id,deviceId);
  }
 }
});
