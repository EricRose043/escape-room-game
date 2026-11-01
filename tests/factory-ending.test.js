import test from 'node:test';
import assert from 'node:assert/strict';
import * as logic from '../src/logic/index.js';

test('裝配線密碼開啟玩具列車貨運區',()=>{
  const production=logic.WORLD.areas.find(area=>area.id==='production');
  const bay=logic.WORLD.areas.find(area=>area.id==='loading-bay');
  assert.ok(bay,'最後一區應是列車裝卸區');
  const door=production.doors.find(entry=>entry.id==='production.east-door');
  assert.deepEqual(door.destination,{type:'area',areaId:'chase-corridor'});
  const s=logic.createChapter();
  assert.equal(logic.isDoorOpen(door,s),false);
  const solved={...s,puzzles:{...s.puzzles,'production.sequence':{installedItemId:null,restored:true,restoreElapsed:1}}};
  assert.equal(logic.isDoorOpen(door,solved),true);
});

test('啟動列車後登車完成逃脫，沒啟動前不能通關',()=>{
  const bay=logic.WORLD.areas.find(area=>area.id==='loading-bay');
  assert.ok(bay);
  const console=bay.devices.find(device=>device.kind==='trainConsole');
  const boarding=bay.devices.find(device=>device.kind==='train');
  assert.ok(console);assert.ok(boarding);
  let s=logic.createChapter();
  s={...s,player:{...s.player,paused:false,x:console.bounds.minX-0.5,z:(console.bounds.minZ+console.bounds.maxZ)/2,yaw:-Math.PI/2,pitch:-0.55},
    inventory:{itemIds:['lobby.flashlight','lobby.employee-card']},
    puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:true,restoreElapsed:0.6},
      'production.sequence':{installedItemId:null,restored:true,restoreElapsed:0.6},'production.color-sequence':{installedItemId:null,restored:true},'exit.final':{installedItemId:null,restored:true}},
    foundClueIds:['production.color-clue','corridor.color-key','exit.reverse-clue'],corridor:{...s.corridor,complete:true}};
  s=logic.updateChapter(s,{interactPressed:true});
  assert.equal(s.trainStarted,true);
  s={...s,player:{...s.player,x:boarding.bounds.minX-0.5,z:(boarding.bounds.minZ+boarding.bounds.maxZ)/2,yaw:-Math.PI/2}};
  s=logic.updateChapter(s,{interactPressed:true});
  assert.equal(s.ui.mode,'ending');
  for(let i=0;i<logic.ENDING_SECONDS*10;i++) s=logic.updateChapter(s,{},0.1);
  assert.equal(s.ui.mode,'complete');
});

test('中段密碼鎖、列車控制台與列車提示各自顯示正確進度',()=>{
  const bay=logic.WORLD.areas.find(area=>area.id==='loading-bay');
  const console=bay.devices.find(device=>device.kind==='trainConsole');
  const train=bay.devices.find(device=>device.kind==='train');
  const keypad=logic.DEVICES.find(device=>device.id==='production.sequence-keypad');
  const state=logic.createChapter();
  const solved={...state,puzzles:{...state.puzzles,'production.sequence':{installedItemId:null,restored:true}}};
  assert.equal(logic.deviceMessage(solved,keypad),'貨運月台門已解鎖');
  assert.equal(logic.deviceMessage(solved,console),'月台檢修碼已確認，刷員工卡啟動列車');
  assert.equal(logic.deviceMessage({...solved,trainStarted:true},console),'列車已啟動，快登車');
  assert.equal(logic.deviceMessage(solved,train),'列車尚未啟動');
});
