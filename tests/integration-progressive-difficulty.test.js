import test from 'node:test';
import assert from 'node:assert/strict';
import * as l from '../src/logic/index.js';
import {pressureSpeed,progressiveObjective} from '../src/logic/progression.js';
function ready(){const s=l.createChapter();return {...s,player:{...s.player,paused:false},inventory:{itemIds:['lobby.flashlight','lobby.employee-card','power.fuse']},puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:true},'production.sequence':{installedItemId:null,restored:true},'production.color-sequence':{restored:true}},foundClueIds:['production.color-clue','corridor.color-key','exit.reverse-clue'],corridor:{...s.corridor,complete:true},ui:l.createKeypad('exit.final-keypad')};}
test('後段錯碼有警報與短復位，暫停不倒數、取消重開也不能繞過',()=>{
 let s=ready();s.ui.buffer='0000';const before=structuredClone(s);
 s=l.updateChapter(s,{keypadCommands:[{type:'submit'}]},.1,{progressive:true});
 assert.ok(s.pressure.remaining>=2);assert.ok(s.events.some(e=>e.type==='alarm'));assert.deepEqual(before.foundClueIds,s.foundClueIds);
 const frozen=l.updateChapter({...s,player:{...s.player,paused:true}},{},.1,{progressive:true});assert.equal(frozen.pressure.remaining,s.pressure.remaining);
 const cancel=l.updateChapter(s,{keypadCommands:[{type:'cancel'}]},.1,{progressive:true});assert.equal(cancel.ui.mode,'explore');
 s={...cancel,ui:{...l.createKeypad('exit.final-keypad'),buffer:'2413'}};
 s=l.updateChapter(s,{keypadCommands:[{type:'submit'}]},.1,{progressive:true});assert.equal(s.puzzles['exit.final'].restored,false);
 for(let i=0;i<80;i++)s=l.updateChapter(s,{},.1,{progressive:true});
 s={...s,ui:{...s.ui,buffer:'2413'}};s=l.updateChapter(s,{keypadCommands:[{type:'submit'}]},.1,{progressive:true});assert.equal(s.puzzles['exit.final'].restored,true);
});
test('前段保留教學、後段不直接交公式；追逐壓力有上限且仍慢於玩家',()=>{
 assert.match(progressiveObjective(l.createChapter(),'找保險絲'),'找保險絲');
 const s=ready();s.puzzles['exit.final']={restored:true};s.trainPuzzle={readCardIds:[...l.TRAIN_CARD_IDS],solved:false};
 assert.doesNotMatch(progressiveObjective(s,'讀數除以 6、由小到大排列'),/除以 6|由小到大/);
 assert.equal(pressureSpeed(0),2.1);assert.ok(pressureSpeed(99)<l.WALK_SPEED);assert.ok(pressureSpeed(2)>pressureSpeed(0));
});
