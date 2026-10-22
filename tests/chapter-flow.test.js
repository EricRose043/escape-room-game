import test from 'node:test';
import assert from 'node:assert/strict';
import * as logic from '../src/logic/index.js';
const puzzleId='power.main',keypadId='power.keypad';
const puzzle=()=>logic.getPuzzle(puzzleId);
function aim(s,x,y,z) {
  const dx=x-s.player.x,dz=z-s.player.z;
  const yaw=Math.atan2(-dx,-dz),pitch=Math.atan2(y-logic.EYE_HEIGHT,Math.hypot(dx,dz));
  return logic.updateChapter(s,{look:{dYaw:yaw-s.player.yaw,dPitch:pitch-s.player.pitch}});
}
function walk(s,x,z) {
  s=aim(s,x,logic.EYE_HEIGHT,z);
  for(let i=0;i<500;i++) {
    const distance=Math.hypot(x-s.player.x,z-s.player.z);
    if(distance<1e-7) return s;
    const next=logic.updateChapter(s,{move:{y:1}},Math.min(0.1,distance/logic.WALK_SPEED));
    assert.ok(Math.hypot(next.player.x-s.player.x,next.player.z-s.player.z)>1e-9,`路線卡住：${s.player.x},${s.player.z} → ${x},${z}`);
    s=next;
  }
  assert.fail('路線超時');
}
function take(s,id) {
  const item=logic.ITEMS.find(i=>i.id===id);
  s=aim(s,(item.minX+item.maxX)/2,(item.minY+item.maxY)/2,(item.minZ+item.maxZ)/2);
  s=logic.updateChapter(s,{interactPressed:true});
  assert.ok(s.inventory.itemIds.includes(id)); return s;
}
function journey() {
  let s=logic.createChapter();
  s={...s,player:logic.setPaused(s.player,false)};
  assert.equal(s.player.x,logic.WORLD.spawn.x); assert.equal(s.player.z,logic.WORLD.spawn.z);
  assert.equal(logic.hasFlashlight(s),false);
  s=take(walk(s,-1.5,5.5),'lobby.flashlight');
  s=logic.updateChapter(s,{flashlightPressed:true});
  s=walk(walk(walk(s,0,5.5),0,-4.6),-3,-4.6);
  s=take(s,'power.fuse');
  s=walk(walk(s,0,-4.6),3,-3);
  const box=logic.DEVICES.find(d=>d.kind==='fuseBox');
  s=aim(s,box.bounds.minX,1.4,-3);
  s=logic.updateChapter(s,{interactPressed:true});
  assert.equal(s.puzzles[puzzleId].installedItemId,box.acceptsItemId);
  return s;
}
function opened() {
  let s=walk(journey(),3,-5.2);
  s=aim(s,4.5,1.4,-5.2);
  return logic.updateChapter(s,{interactPressed:true});
}
function enter(s,code) {
  for(const value of code) s=logic.updateChapter(s,{keypadCommands:[{type:'digit',value}]});
  return logic.updateChapter(s,{keypadCommands:[{type:'submit'}]});
}

test('缺保險絲時即使提交正確碼仍不能供電',()=>{
  let s=logic.createChapter();
  s={...s,player:{...s.player,paused:false,x:3,z:-5.2,yaw:-Math.PI/2,pitch:0}};
  const blocked=logic.updateChapter(s,{interactPressed:true,keypadCommands:[{type:'submit'}]});
  assert.equal(blocked.ui.mode,'explore');
  assert.equal(blocked.puzzles[puzzleId].restored,false);
  const submitted=logic.submitPuzzleCode({...s,ui:{mode:'keypad',deviceId:keypadId,buffer:puzzle().code,selectedIndex:0,message:''}},keypadId,puzzle().code);
  assert.equal(submitted.puzzles[puzzleId].restored,false);
  assert.equal(logic.isDoorOpen(logic.DOORS.find(d=>d.id==='power.production-door'),submitted),false);
});
test('錯碼不供電不開門，之後仍可重試',()=>{
  const s=opened(); assert.equal(s.ui.mode,'keypad');
  const next=enter(s,'0000');
  assert.equal(next.puzzles[puzzleId].restored,false);
  assert.equal(next.ui.mode,'keypad'); assert.equal(next.ui.buffer,'');
  assert.match(next.ui.message,/錯誤/);
  assert.deepEqual(next.inventory,s.inventory);
  assert.equal(logic.isDoorOpen(logic.DOORS.find(d=>d.id==='power.production-door'),next),false);
  assert.equal(enter(next,puzzle().code).puzzles[puzzleId].restored,true);
});
test('正確碼恢復電力並只開啟對應生產線門',()=>{
  const s=opened(),next=enter(s,puzzle().code);
  assert.equal(next.puzzles[puzzleId].restored,true); assert.equal(next.ui.mode,'explore');
  const changed=logic.DOORS.filter(d=>logic.isDoorOpen(d,s)!==logic.isDoorOpen(d,next)).map(d=>d.id);
  assert.deepEqual(changed,['power.production-door']);
  assert.equal(logic.getGeometry(next).collisionBoxes.some(b=>b.id==='power.production-door'),false);
  assert.equal(logic.getGeometry(next).occluderBoxes.some(b=>b.id==='power.production-door'),false);
  assert.equal(logic.POWER_TRANSITION_SECONDS,0.6);
  assert.equal(logic.powerProgress(next,puzzleId),0);
  const half=logic.updateChapter(next,{},0.3);
  assert.equal(logic.powerProgress(half,puzzleId),0.5);
  assert.equal(logic.powerProgress(logic.updateChapter(half,{},0.3),puzzleId),1);
  assert.equal(logic.powerProgress(logic.updateChapter(half,{forcePause:true},10),puzzleId),0.5);
});
test('恢復供電後重複互動不重播供電轉換',()=>{
  let s=logic.updateChapter(enter(opened(),puzzle().code),{},1);
  assert.equal(logic.powerProgress(s,puzzleId),1);
  const original=s.puzzles[puzzleId];
  for(let i=0;i<3;i++) {
    s=logic.updateChapter(s,{interactPressed:true});
    assert.equal(s.ui.mode,'explore'); assert.deepEqual(s.puzzles[puzzleId],original);
  }
  const direct=logic.submitPuzzleCode(s,keypadId,puzzle().code);
  assert.deepEqual(direct.puzzles,s.puzzles);
});
test('使用正式資料從出生點完成取得安裝輸入與通過出口',()=>{
  let s=journey();
  s=walk(s,3,-4.5);
  const clue=logic.CLUES.find(c=>c.id===puzzle().clueId);
  s=aim(s,clue.position.x,clue.position.y,clue.position.z);
  s=logic.updateChapter(s,{uvPressed:true});
  assert.equal(logic.isClueVisible(s.player,s.flashlight,clue,logic.getGeometry(s).occluderBoxes),true);
  s=walk(s,3,-5.2); s=aim(s,4.5,1.4,-5.2);
  s=logic.updateChapter(s,{interactPressed:true}); assert.equal(s.ui.mode,'keypad');
  // 依正式線索的同一份資料輸入；沒有直接改供電或門旗標。
  s=enter(s,puzzle().code);
  s=walk(walk(s,3,-6.5),6.5,-6.5);
  assert.ok(s.player.x>5.5); assert.equal(s.puzzles[puzzleId].restored,true);
  assert.equal(logic.powerProgress(s,puzzleId),1);
  assert.deepEqual(s.inventory.itemIds,['lobby.flashlight','power.fuse']);
  assert.ok(s.flashlight.charge>80);
});
