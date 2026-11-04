import test from 'node:test';
import assert from 'node:assert/strict';
import * as l from '../src/logic/index.js';

function ready(){const s=l.createChapter();return {...s,checkpointId:'exit.checkpoint',player:{...s.player,paused:false},inventory:{itemIds:['lobby.flashlight','lobby.employee-card','power.fuse']},puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:true},'production.sequence':{installedItemId:null,restored:true},'production.color-sequence':{installedItemId:null,restored:true},'exit.final':{installedItemId:null,restored:true}},foundClueIds:['production.color-clue','corridor.color-key','exit.reverse-clue'],corridor:{...s.corridor,complete:true}};}
function interact(s,id){const d=l.DEVICES.find(d=>d.id===id);assert.ok(d,`${id} exists`);const b=d.bounds,x=(b.minX+b.maxX)/2,z=(b.minZ+b.maxZ)/2,y=(b.minY+b.maxY)/2;const p=d.kind==='trainCard'?{...s.player,x,z:z+1,yaw:0,pitch:Math.atan2(y-1.6,1)}:{...s.player,x:b.minX-.5,z,yaw:-Math.PI/2,pitch:Math.atan2(y-1.6,.5)};assert.equal(l.selectChapterTarget({...s,player:p})?.id,id,`${id} reachable`);return l.updateChapter({...s,player:p},{interactPressed:true});}
const readAll=s=>l.TRAIN_CARD_IDS.reduce((next,id)=>interact(next,id),s);
function enter(s,code){return l.updateChapter(s,{keypadCommands:[...code].map(value=>({type:'digit',value})).concat({type:'submit'})});}

test('列車三張實體檢修卡記錄18、12、6，配方確實推導2123',()=>{
 assert.equal(l.TRAIN_CODE,'2123');assert.deepEqual(l.TRAIN_CARDS.map(c=>c.reading),[18,12,6]);
 const s=readAll(ready());assert.deepEqual(s.trainPuzzle.readCardIds,l.TRAIN_CARD_IDS);assert.equal(s.trainPuzzle.solved,false);
 assert.equal(interact(s,l.TRAIN_CARD_IDS[0]).trainPuzzle.readCardIds.length,3);
 const bay=l.WORLD.areas.find(a=>a.id==='loading-bay');assert.ok(bay.signs.some(s=>s.text.includes('÷ 6')&&s.text.includes('完整軌道組數')&&s.text.includes('兩根鋼軌')));
});
test('缺任一檢修卡或員工卡、電力、出口進度，不能偷猜2123發車',()=>{
 const base=readAll(ready());
 const cases=[...l.TRAIN_CARD_IDS.map(id=>({...base,trainPuzzle:{...base.trainPuzzle,readCardIds:l.TRAIN_CARD_IDS.filter(c=>c!==id)}})),{...base,inventory:{itemIds:['lobby.flashlight','power.fuse']}},{...base,puzzles:{...base.puzzles,'power.main':{restored:false}}},{...base,puzzles:{...base.puzzles,'exit.final':{restored:false}}},{...base,corridor:{...base.corridor,complete:false}}];
 for(const s of cases){const attempted=enter({...s,ui:l.createKeypad('bay.train-console')},'2123');assert.equal(attempted.trainStarted,false);assert.equal(attempted.trainPuzzle.solved,false);}
 const untouched=interact(ready(),'bay.train-console');assert.equal(untouched.trainStarted,false);assert.equal(untouched.ui.mode,'explore');
});
test('列車控制台重用鍵盤與手把命令，錯碼清空可重試，解碼才發車',()=>{
 let s=interact(readAll(ready()),'bay.train-console');assert.equal(s.ui.mode,'keypad');assert.equal(s.ui.buffer,'');
 s=enter(s,'1234');assert.equal(s.trainStarted,false);assert.equal(s.ui.buffer,'');assert.match(s.ui.message,/錯誤/);
 const keys=['2','1','2','3','submit'];
 for(const key of keys){const index=l.KEYPAD_KEYS.indexOf(key);s=l.updateChapter({...s,ui:{...s.ui,selectedIndex:index}},{keypadCommands:[l.gamepadKeypadCommand({confirmPressed:true})]});}
 assert.equal(s.trainStarted,true);assert.equal(s.trainPuzzle.solved,true);assert.equal(s.ui.mode,'explore');
 const unopened={...ready(),ui:{mode:'explore'}};assert.equal(l.submitPuzzleCode(unopened,'bay.train-console','2123'),unopened);
});
test('發車登車才開始24秒脫軌，暫停與移動不能跳過，失焦安全凍結',()=>{
 let s=enter(interact(readAll(ready()),'bay.train-console'),'2123');assert.equal(s.ui.mode,'explore');
 s=interact(s,'bay.train');assert.equal(s.ui.mode,'ending');assert.equal(s.ui.variant,'derailment');assert.equal(l.ENDING_SECONDS,24);
 const p={...s.player};s=l.updateChapter(s,{pausePressed:true,move:{x:1,y:1},interactPressed:true,keypadCommands:[{type:'submit'}]},1);
 assert.equal(s.player.paused,false);assert.deepEqual(s.player,p);assert.equal(s.ui.elapsed,1);
 s=l.updateChapter(s,{focusLost:true},1);assert.equal(s.player.paused,true);assert.equal(s.ui.elapsed,1);
 s=l.updateChapter(s,{},10);assert.equal(s.ui.elapsed,1);
 s={...s,player:{...s.player,paused:false}};s=l.updateChapter(s,{},22.9);assert.equal(s.ui.mode,'ending');
 s=l.updateChapter(s,{},.1);assert.equal(s.ui.mode,'complete');assert.equal(s.completed,true);
});
test('純過場時間軸依順序呈現突襲、對話、失控、脫軌和黑幕',()=>{
 const phases=[[0,'depart'],[3,'ambush'],[5,'impact'],[6,'tunnel'],[19,'failure'],[21,'derail'],[22,'blackout'],[24,'complete']];
 for(const [t,phase] of phases)assert.equal(l.trainCinematicFrame(t).phase,phase);
 assert.equal(l.trainCinematicFrame(NaN).elapsed,0);assert.equal(l.trainCinematicFrame(-1).elapsed,0);assert.equal(l.trainCinematicFrame(99).elapsed,24);
 assert.equal(l.trainCinematicFrame(10).dialogue,'這恐怖的工廠……終於要逃出去了嗎？');assert.equal(l.trainCinematicFrame(15).dialogue,'不對……我還不能放鬆。只要離開這裡……');assert.equal(l.trainCinematicFrame(23).blackout,1);assert.equal(l.trainCinematicFrame(23.99).complete,false);
});
test('新列車進度升級v4且立即保存，過場中讀檔續播，拒絕竄改',()=>{
 const initial=ready();assert.equal(l.createChapterSave(initial).version,3);
 let s=readAll(initial);const data=l.createChapterSave(s);assert.equal(data.version,4);assert.deepEqual(l.validateChapterSave(data),[]);
 const loaded=l.restoreChapterSave(data);assert.deepEqual(loaded.trainPuzzle,s.trainPuzzle);
 let raw=null,writes=0;const store=l.createSaveStorage({getItem:()=>raw,setItem(_k,v){raw=v;writes++;}});store.load();store.restart(initial);const before=writes;
 const one=interact(initial,l.TRAIN_CARD_IDS[0]);store.observe(initial,one,.01);assert.equal(writes,before+1);assert.deepEqual(JSON.parse(raw).trainPuzzle.readCardIds,[l.TRAIN_CARD_IDS[0]]);
 s=enter(interact(s,'bay.train-console'),'2123');s=interact(s,'bay.train');s=l.updateChapter(s,{},10);
 const progress=l.createChapterSave(s),restored=l.restoreChapterSave(progress);assert.equal(restored.ui.mode,'ending');assert.equal(restored.ui.elapsed,10);assert.equal(restored.trainPuzzle.solved,true);
 for(const mutate of [d=>d.trainPuzzle.readCardIds.push('bad'),d=>d.trainPuzzle.readCardIds.push(d.trainPuzzle.readCardIds[0]),d=>d.trainPuzzle.readCardIds.pop(),d=>d.trainStarted=false,d=>d.trainCinematic.elapsed=-1,d=>d.trainCinematic.elapsed=25,d=>d.trainCinematic.started=false]){const bad=structuredClone(progress);mutate(bad);assert.ok(l.validateChapterSave(bad).length);assert.equal(l.restoreChapterSave(bad),null);}
});
test('舊v2/v3合法發車存檔保留登車能力，不偽造新卡片或2123完成',()=>{
 for(const s of [(()=>{const s=l.createChapter();return {...s,checkpointId:'production.checkpoint',inventory:{itemIds:['lobby.flashlight','lobby.employee-card','power.fuse']},puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:true},'production.sequence':{installedItemId:null,restored:true}},trainStarted:true};})(),{...ready(),trainStarted:true}]){
 const old=l.createChapterSave(s);assert.ok([2,3].includes(old.version));const restored=l.restoreChapterSave(old);assert.equal(restored.trainStarted,true);assert.deepEqual(restored.trainPuzzle,{readCardIds:[],solved:false});assert.deepEqual(l.createChapterSave(restored),old);
 const boarded=interact({...restored,player:{...restored.player,paused:false}},'bay.train');assert.equal(boarded.ui.mode,'ending');
 }
});

test('v4拒絕卡片型別與過場矛盾，單獨竄改舊版資格不能跳過2123',()=>{
 const cards=l.createChapterSave(readAll(ready()));
 for(const mutate of [d=>d.trainPuzzle.readCardIds=null,d=>d.trainPuzzle.readCardIds='bay.traction-card',d=>d.trainPuzzle.readCardIds=[1],d=>d.trainPuzzle.solved='yes',d=>d.trainCinematic={started:false,elapsed:1},d=>d.trainCinematic.started='yes',d=>d.completed=true,
   d=>{d.trainStarted=true;d.trainLegacyAuthorized=true;},
   d=>{d.trainStarted=true;d.trainLegacyAuthorized=true;d.trainLegacySave={version:2,trainStarted:true};},
   d=>{d.trainStarted=true;d.trainLegacyAuthorized=true;d.trainLegacySave={...l.createChapterSave(ready()),trainStarted:false};}
 ]){const bad=structuredClone(cards);mutate(bad);assert.ok(l.validateChapterSave(bad).length,'malformed v4 must be rejected');assert.equal(l.restoreChapterSave(bad),null);assert.equal(l.parseChapterSave(JSON.stringify(bad)).status,'invalid');}
 const old=l.createChapterSave({...ready(),trainStarted:true});
 let migrated=l.restoreChapterSave(old);migrated=interact({...migrated,player:{...migrated.player,paused:false}},'bay.train');
 const data=l.createChapterSave(migrated);assert.equal(data.version,4);assert.deepEqual(data.trainLegacySave,old);assert.deepEqual(l.validateChapterSave(data),[]);
 const restored=l.restoreChapterSave(data);assert.equal(restored.ui.mode,'ending');assert.equal(restored.trainPuzzle.solved,false);assert.deepEqual(restored.trainPuzzle.readCardIds,[]);
 const corrupted=structuredClone(data);corrupted.trainLegacySave.itemIds=corrupted.trainLegacySave.itemIds.filter(id=>id!=='lobby.employee-card');assert.ok(l.validateChapterSave(corrupted).length);
});
