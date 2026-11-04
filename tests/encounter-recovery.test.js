import test from 'node:test';
import assert from 'node:assert/strict';
import * as l from '../src/logic/index.js';

const def=l.MONSTERS[0],id=def.id,options={captureRecovery:'stay',progressive:true,reasoning:true,jumpScare:true};
function ready(){const s=l.createChapter({jumpScare:true});return {...s,checkpointId:'production.checkpoint',player:{...s.player,x:18.5,z:-5.5,yaw:.42,pitch:-.17,paused:false},
 inventory:{itemIds:['lobby.flashlight','lobby.employee-card','power.fuse']},flashlight:{charge:73,enabled:true,mode:'uv'},
 puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:true}},monsters:{[id]:{...l.createMonster(def),mode:'patrol'}}};}
function finish(s,opts=options){for(let i=0;i<21;i++)s=l.updateChapter(s,{move:{x:1},look:{dYaw:1},interactPressed:true},.1,opts);return s;}

test('原位驚嚇兩種開關都保留位置視角與進度，玩偶至少消失五秒且不重新捕捉',()=>{
 for(const jumpScare of [true,false]){
  const opts={...options,jumpScare},start=ready(),before=structuredClone(start);
  let s=l.updateChapter(start,{},.1,opts);assert.equal(s.ui.mode,'caught');assert.deepEqual(s.player,start.player);
  s=finish(s,opts);assert.equal(s.ui.mode,'explore');assert.deepEqual(s.player,start.player);
  assert.deepEqual(s.inventory,start.inventory);assert.deepEqual(s.puzzles,start.puzzles);assert.equal(s.checkpointId,start.checkpointId);assert.equal(s.flashlight.charge,73);
  assert.equal(s.monsters[id].mode,'inactive');assert.ok(s.encounterRecovery.remaining>=5-1e-9);
  for(let i=0;i<49;i++){s=l.updateChapter(s,{},.1,opts);assert.equal(s.ui.mode,'explore');assert.equal(s.monsters[id].mode,'inactive');}
  assert.deepEqual(start,before,'不修改原始狀態');
 }
});

test('消失期間能走動、沒有透明碰撞，暫停失焦及面板都不偷跑倒數',()=>{
 let s=finish(l.updateChapter(ready(),{},.1,options));const remaining=s.encounterRecovery.remaining;
 for(const action of [{forcePause:true},{focusLost:true},{gameplayActive:false},{pausePressed:true}]){
  const next=l.updateChapter(s,action,10,options);assert.equal(next.encounterRecovery.remaining,remaining);
 }
 const panel=l.updateChapter({...s,ui:l.createKeypad('production.sequence-keypad')},{},.1,options);assert.equal(panel.encounterRecovery.remaining,remaining);
 const moved=l.updateChapter(s,{move:{x:1}},.1,options);assert.ok(Math.hypot(moved.player.x-s.player.x,moved.player.z-s.player.z)>.1);
 const clamped=l.updateChapter(s,{},1000,options);assert.ok(clamped.encounterRecovery.remaining>=4.9-1e-9);
});

test('消失後在安全巡邏點恢復，不在玩家面前或貼身瞬間出現抓人',()=>{
 let s=finish(l.updateChapter(ready(),{},.1,options));
 for(let i=0;i<60&&s.encounterRecovery;i++)s=l.updateChapter(s,{},.1,options);
 assert.equal(s.encounterRecovery,null);assert.equal(s.monsters[id].mode,'patrol');assert.equal(s.ui.mode,'explore');
 assert.ok(Math.hypot(s.player.x-s.monsters[id].x,s.player.z-s.monsters[id].z)>=4);
 assert.equal(s.monsters[id].lastSeen,null);assert.equal(s.monsters[id].contactLatched,false);
 assert.equal(l.updateChapter(s,{},.1,options).ui.mode,'explore');
});

test('走廊被抓也留原位並保留關門紀錄，隱身期間可到出口且不再觸發caught',()=>{
 const s=ready();for(const pid of ['production.sequence','production.color-sequence'])s.puzzles[pid].restored=true;
 s.foundClueIds=['production.color-clue','corridor.color-key'];s.player={...s.player,x:27,z:-13,yaw:0,pitch:0};
 s.corridor={...l.createCorridor(),active:true,caught:true,distance:11.5,chaser:l.corridorPoint(11.5),gates:{previous:{x:27,z:-13},closedIds:['corridor.door-1','corridor.door-2']}};s.ui=l.createCapture({jumpScare:true});
 let recovered=finish(s);assert.deepEqual(recovered.player,s.player);assert.deepEqual(recovered.corridor.gates,s.corridor.gates);assert.equal(recovered.corridor.caught,false);
 const held=l.updateChapter(recovered,{},.1,options);assert.equal(held.ui.mode,'explore');assert.equal(held.corridor.distance,recovered.corridor.distance);
 recovered={...recovered,player:{...recovered.player,x:41.2,z:-17.5}};
 const exited=l.updateChapter(recovered,{},.1,options);assert.equal(exited.corridor.complete,true);assert.equal(exited.checkpointId,'exit.checkpoint');assert.equal(exited.ui.mode,'explore');
 assert.deepEqual(l.validateChapterSave(l.createChapterSave(exited)),[]);
});

test('走廊追兵回來時在玩家後方留距離，既有關門與追逐仍能繼續',()=>{
 let s=ready();for(const pid of ['production.sequence','production.color-sequence'])s.puzzles[pid].restored=true;
 s.foundClueIds=['production.color-clue','corridor.color-key'];s.player={...s.player,x:27,z:-13,yaw:0,pitch:0};
 s.corridor={...l.createCorridor(),active:true,caught:true,distance:11.5,chaser:l.corridorPoint(11.5),gates:{previous:{x:27,z:-13},closedIds:['corridor.door-1','corridor.door-2']}};s.ui=l.createCapture({jumpScare:true});
 s=finish(s);for(let i=0;i<60&&s.encounterRecovery;i++)s=l.updateChapter(s,{},.1,options);
 assert.equal(s.encounterRecovery,null);assert.equal(s.corridor.active,true);assert.equal(s.corridor.caught,false);assert.equal(s.ui.mode,'explore');
 assert.ok(Math.hypot(s.player.x-s.corridor.chaser.x,s.player.z-s.corridor.chaser.z)>3);
 assert.ok(s.corridor.gates.closedIds.includes('corridor.door-2'));
});
