import test from 'node:test';
import assert from 'node:assert/strict';
import * as l from '../src/logic/index.js';

const def=l.MONSTERS[0],id=def.id,area=l.WORLD.areas.find(a=>a.id===def.areaId);
function seen(){const s=l.createChapter({jumpScare:true});return {...s,checkpointId:'production.checkpoint',player:{...s.player,x:18.5,z:-5.5,paused:false},inventory:{itemIds:['lobby.flashlight','lobby.employee-card','power.fuse']},flashlight:{charge:73,mode:'normal',enabled:true},puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:true}},monsters:{[id]:{...l.createMonster(def),mode:'patrol'}}};}

test('裝配線被真正看見即鎖定抓捕，跑離或同幀躲櫃都不能取消',()=>{
 const start=seen();assert.ok(Math.hypot(start.player.x-start.monsters[id].x,start.player.z-start.monsters[id].z)>def.contactDistance);
 assert.equal(l.monsterVision(start.monsters[id],def,area,start.player,l.getGeometry(start).occluderBoxes).visible,true);
 const caught=l.updateChapter(start,{move:{y:1},interactPressed:true,flashlightPressed:true,keypadCommands:[{type:'cancel'}]},.1);
 assert.equal(caught.ui.mode,'caught');assert.equal(caught.ui.cause,'detected');assert.deepEqual(caught.player,start.player);assert.equal(caught.flashlight.enabled,false);assert.equal(caught.ui.elapsed,0);
 const corner={...start,player:{...start.player,x:8.5,z:-1.2,yaw:0},monsters:{[id]:{...start.monsters[id],x:10,z:-1.2,yaw:Math.PI/2}}};
 const attempt=l.updateChapter(corner,{interactPressed:true},0);assert.equal(attempt.ui.mode,'caught');assert.equal(attempt.ui.cause,'detected');
 const noisy={move:{x:1,y:1},look:{dYaw:3},interactPressed:true,flashlightPressed:true,uvPressed:true,keypadCommands:[{type:'cancel'},{type:'submit'}]};
 let s=caught;for(let i=0;i<20;i++)s=l.updateChapter(s,noisy,.1);
 assert.equal(s.ui.mode,'caught');assert.deepEqual(s.player,caught.player);assert.deepEqual(s.inventory,caught.inventory);assert.deepEqual(s.puzzles,caught.puzzles);
 const paused=l.updateChapter(s,{focusLost:true},100);assert.equal(paused.ui.elapsed,s.ui.elapsed);assert.equal(paused.player.paused,true);
 s=l.updateChapter(s,noisy,.1);assert.equal(s.ui.mode,'explore');assert.equal(s.player.x,6.5);assert.equal(s.player.z,-6.5);assert.equal(s.flashlight.enabled,false);
});

test('沒看見時能預先入櫃；必經走廊的腳本追兵不會觸發視線即死',()=>{
 const start=seen(),unseen={...start,player:{...start.player,x:8.5,z:-1.2,yaw:0}};
 assert.equal(l.monsterVision(unseen.monsters[id],def,area,unseen.player,l.getGeometry(unseen).occluderBoxes).visible,false);
 assert.equal(l.updateChapter(unseen,{interactPressed:true},.1).ui.mode,'hiding');
 let s={...start,player:{...start.player,x:25,z:-6.5},puzzles:{...start.puzzles,'production.sequence':{restored:true},'production.color-sequence':{restored:true}},foundClueIds:['production.color-clue','corridor.color-key']};
 s=l.updateChapter(s,{},.1);assert.equal(s.corridor.active,true);assert.equal(s.ui.mode,'explore');
 const raw=l.serializeChapterSave(l.updateChapter(start,{},.1));const restored=l.restoreChapterSave(l.parseChapterSave(raw).data);assert.equal(restored.ui.mode,'explore');assert.equal(restored.player.x,6.5);
});
