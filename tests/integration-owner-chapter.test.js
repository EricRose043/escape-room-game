import test from 'node:test';
import assert from 'node:assert/strict';
import * as l from '../src/logic/index.js';
import {COLOR_SEQUENCE} from '../src/logic/puzzles/color-sequence.js';
import {EXIT_CLUE_IDS,EXIT_CODE} from '../src/logic/puzzles/exit-code.js';
function ready(){const s=l.createChapter();return {...s,checkpointId:'production.checkpoint',player:{...s.player,paused:false},inventory:{itemIds:['lobby.flashlight','lobby.employee-card','power.fuse']},puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:true},'production.sequence':{installedItemId:null,restored:true}}};}
function interact(s,id){const d=l.DEVICES.find(d=>d.id===id),b=d.bounds,x=(b.minX+b.maxX)/2,z=(b.minZ+b.maxZ)/2,y=(b.minY+b.maxY)/2;const p={...s.player,x:x-1,z,yaw:-Math.PI/2,pitch:Math.atan2(y-1.6,1)};assert.equal(l.selectChapterTarget({...s,player:p})?.id,id);return l.updateChapter({...s,player:p},{interactPressed:true},0);}
test('Eric 整合 R1：實際四色按鈕、錯序警報引怪、解開後登錄首線索',()=>{
 let s=ready();s=interact(s,'production.button-blue');assert.ok(s.events.some(e=>e.type==='alarm'));assert.equal(s.puzzles[COLOR_SEQUENCE.id].restored,false);
 for(const color of COLOR_SEQUENCE.sequence)s=interact(s,`production.button-${color}`);
 assert.equal(s.puzzles[COLOR_SEQUENCE.id].restored,true);assert.ok(s.foundClueIds.includes(EXIT_CLUE_IDS[0]));
});
test('Eric 整合 S3：正式區域不重疊，門受狀態控制，停下會被抓且保留謎題',()=>{
 assert.deepEqual(l.WORLD.areas.map(a=>a.id),['lobby','power-room','production','chase-corridor','exit','loading-bay']);assert.deepEqual(l.validateWorld(),[]);
 for(const [i,a] of l.WORLD.areas.entries())for(const b of l.WORLD.areas.slice(i+1)){assert.ok(Math.min(a.bounds.maxX,b.bounds.maxX)-Math.max(a.bounds.minX,b.bounds.minX)<=0 || Math.min(a.bounds.maxZ,b.bounds.maxZ)-Math.max(a.bounds.minZ,b.bounds.minZ)<=0,`${a.id}/${b.id}`);}
 let s=ready();s={...s,puzzles:{...s.puzzles,[COLOR_SEQUENCE.id]:{restored:true}},foundClueIds:EXIT_CLUE_IDS.slice(0,2),player:{...s.player,x:25,z:-6.5}};
 s=l.updateChapter(s,{},.1);assert.equal(s.corridor.active,true);
 for(let i=0;i<100&&s.ui.mode!=='caught';i++)s=l.updateChapter(s,{},.1);assert.equal(s.ui.mode,'caught');
 for(let i=0;i<12;i++)s=l.updateChapter(s,{},.1);assert.equal(s.player.x,6.5);assert.equal(s.puzzles[COLOR_SEQUENCE.id].restored,true);assert.deepEqual(s.foundClueIds,EXIT_CLUE_IDS.slice(0,2));
});
test('Eric 整合 R2：三線索鎖接入月台之前，沒收齊不能猜碼或啟動列車',()=>{
 let s=ready();s={...s,corridor:{...s.corridor,complete:true},puzzles:{...s.puzzles,[COLOR_SEQUENCE.id]:{restored:true}},ui:l.createKeypad('exit.final-keypad')};
 for(const missing of EXIT_CLUE_IDS){const incomplete={...s,foundClueIds:EXIT_CLUE_IDS.filter(id=>id!==missing)};assert.equal(l.validatePuzzleCode(incomplete,'exit.final',EXIT_CODE),false);}
 s=l.submitPuzzleCode({...s,foundClueIds:[...EXIT_CLUE_IDS]},'exit.final-keypad',EXIT_CODE);assert.equal(s.puzzles['exit.final'].restored,true);assert.notEqual(s.ui.mode,'complete');
 const blocked=interact({...s,puzzles:{...s.puzzles,'exit.final':{restored:false}}},'bay.train-console');assert.equal(blocked.trainStarted,false);
 s=interact(s,'bay.train-console');assert.equal(s.trainStarted,true);s=interact(s,'bay.train');assert.equal(s.ui.mode,'ending');
 for(let i=0;i<l.ENDING_SECONDS*10;i++)s=l.updateChapter(s,{},.1);assert.equal(s.ui.mode,'complete');assert.ok(s.endingResult.formattedTime);
});
test('版本三保存色序、線索、走廊、出口、時間與列車，舊一二版仍可讀',()=>{
 let s=ready();s={...s,elapsedSeconds:123.4,foundClueIds:[...EXIT_CLUE_IDS],corridor:{...s.corridor,complete:true},puzzles:{...s.puzzles,[COLOR_SEQUENCE.id]:{restored:true},'exit.final':{restored:true}},trainStarted:true};
 const data=l.createChapterSave(s);assert.equal(data.version,3);assert.deepEqual(l.validateChapterSave(data),[]);const restored=l.restoreChapterSave(data);assert.equal(restored.elapsedSeconds,123.4);assert.equal(restored.puzzles['exit.final'].restored,true);assert.deepEqual(restored.foundClueIds,s.foundClueIds);assert.equal(restored.trainStarted,true);
 for(const version of [1,2]){const old={version,chapterId:'chapter-1',checkpointId:'production.checkpoint',itemIds:s.inventory.itemIds,puzzles:{'power.main':{installedItemId:'power.fuse',restored:true}},flashlight:{charge:83,mode:'uv'}};if(version===2){old.puzzles['production.sequence']={installedItemId:null,restored:true};old.trainStarted=true;}assert.equal(l.parseChapterSave(JSON.stringify(old)).status,'valid');}
 for(const change of [d=>d.elapsedSeconds=-1,d=>d.foundClueIds.push('missing'),d=>d.puzzles['production.color-sequence'].restored=false]){const bad=structuredClone(data);change(bad);assert.ok(l.validateChapterSave(bad).length);}
});
