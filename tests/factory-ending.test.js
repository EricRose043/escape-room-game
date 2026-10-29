import test from 'node:test';
import assert from 'node:assert/strict';
import * as logic from '../src/logic/index.js';

test('裝配線密碼開啟玩具列車貨運區',()=>{
  const production=logic.WORLD.areas.find(area=>area.id==='production');
  const bay=logic.WORLD.areas.find(area=>area.id==='loading-bay');
  assert.ok(bay,'最後一區應是列車裝卸區');
  const door=production.doors.find(entry=>entry.id==='production.east-door');
  assert.deepEqual(door.destination,{type:'area',areaId:'loading-bay'});
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
      'production.sequence':{installedItemId:null,restored:true,restoreElapsed:0.6}}};
  s=logic.updateChapter(s,{interactPressed:true});
  assert.equal(s.trainStarted,true);
  s={...s,player:{...s.player,x:boarding.bounds.minX-0.5,z:(boarding.bounds.minZ+boarding.bounds.maxZ)/2,yaw:-Math.PI/2}};
  s=logic.updateChapter(s,{interactPressed:true});
  assert.equal(s.ui.mode,'ending');
  for(let i=0;i<logic.ENDING_SECONDS*10;i++) s=logic.updateChapter(s,{},0.1);
  assert.equal(s.ui.mode,'complete');
});
