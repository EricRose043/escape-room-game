import test from 'node:test';
import assert from 'node:assert/strict';
import * as logic from '../src/logic/index.js';
const area=logic.WORLD.areas.find(a=>a.id==='production'),def=area.monsters[0],id=def.id;
function aim(s,x,y,z) {
  return logic.updateChapter(s,{look:{dYaw:Math.atan2(s.player.x-x,s.player.z-z)-s.player.yaw,
    dPitch:Math.atan2(y-logic.EYE_HEIGHT,Math.hypot(x-s.player.x,z-s.player.z))-s.player.pitch}});
}
function walk(s,x,z) {
  s=aim(s,x,logic.EYE_HEIGHT,z);
  for(let i=0;i<600;i++) {
    const distance=Math.hypot(x-s.player.x,z-s.player.z);
    if(distance<1e-7) return s;
    const next=logic.updateChapter(s,{move:{y:1}},Math.min(0.1,distance/logic.WALK_SPEED));
    assert.ok(Math.hypot(next.player.x-s.player.x,next.player.z-s.player.z)>1e-9,`路線卡住 ${s.player.x},${s.player.z} → ${x},${z}`);
    s=next;
  }
  assert.fail('路線超時');
}
function take(s,id) {
  const i=logic.ITEMS.find(i=>i.id===id);
  s=aim(s,(i.minX+i.maxX)/2,(i.minY+i.maxY)/2,(i.minZ+i.maxZ)/2);
  s=logic.updateChapter(s,{interactPressed:true});assert.ok(s.inventory.itemIds.includes(id));return s;
}

test('被目擊進櫃仍立即失去目標，搜尋後回到巡邏',()=>{
  let s=logic.createChapter();
  s={...s,player:{...s.player,x:8.5,z:-1.2,yaw:0,pitch:0,paused:false},
    monsters:{[id]:{...s.monsters[id],mode:'chase',x:10,z:-1.2,yaw:Math.PI/2,lastSeen:{x:8.5,z:-1.2},contactLatched:true,contactFeedbackRemaining:0.8}}};
  assert.equal(logic.monsterVision(s.monsters[id],def,area,s.player,logic.getGeometry(s).occluderBoxes).visible,true);
  const memory=structuredClone(s.monsters[id].lastSeen),snapshot=structuredClone(s);
  s=logic.updateChapter(s,{interactPressed:true},0);
  assert.equal(s.ui.mode,'hiding');assert.equal(s.monsters[id].mode,'search','進櫃當幀立即失去目標，不等待 dt');
  assert.deepEqual(s.monsters[id].lastSeen,memory);assert.equal(s.monsters[id].contactLatched,false);
  assert.equal(s.monsters[id].contactFeedbackRemaining,0);assert.deepEqual(s.events,[]);
  assert.equal(snapshot.ui.mode,'explore');
  let elapsed=0,seenReturn=false;
  for(;elapsed<20;elapsed+=0.1) {
    s=logic.updateChapter(s,{},0.1);
    const m=s.monsters[id];assert.notEqual(m.mode,'chase');assert.equal(m.visionRaycasts,0);assert.deepEqual(s.events,[]);
    assert.equal(m.contactLatched,false);assert.equal(m.contactCount,0);
    assert.ok(!logic.getGeometry(s).collisionBoxes.some(b=>logic.circleOverlapsBox(m.x,m.z,b,def.radius+def.clearance)));
    if(m.mode==='search') assert.deepEqual(m.lastSeen,memory);
    if(m.mode==='return' && !seenReturn) {seenReturn=true;assert.ok(elapsed<=4.1);}
    if(m.mode==='patrol') break;
  }
  assert.ok(seenReturn);assert.equal(s.monsters[id].mode,'patrol');assert.ok(elapsed<20);
  assert.equal(logic.updateChapter(s,{interactPressed:true},0.1).ui.mode,'explore');
});

test('正式資料從出生點完成供電進區發現躲藏等待與出櫃',()=>{
  let s=logic.createChapter();s={...s,player:logic.setPaused(s.player,false)};
  s=take(walk(s,-1.5,5.5),'lobby.flashlight');s=logic.updateChapter(s,{flashlightPressed:true});
  s=take(walk(walk(walk(s,0,5.5),0,-4.6),-3,-4.6),'power.fuse');
  s=walk(walk(s,0,-4.6),3,-3);s=aim(s,4.5,1.4,-3);s=logic.updateChapter(s,{interactPressed:true});
  s=walk(s,3,-4.5);
  const puzzle=logic.getPuzzle('power.main'),clue=logic.CLUES.find(c=>c.id===puzzle.clueId);
  s=aim(s,clue.position.x,clue.position.y,clue.position.z);s=logic.updateChapter(s,{uvPressed:true});
  assert.equal(logic.isClueVisible(s.player,s.flashlight,clue,logic.getGeometry(s).occluderBoxes),true);
  s=aim(walk(s,3,-5.2),4.5,1.4,-5.2);s=logic.updateChapter(s,{interactPressed:true});
  assert.equal(s.ui.mode,'keypad');
  for(const value of puzzle.code) s=logic.updateChapter(s,{keypadCommands:[{type:'digit',value}]});
  s=logic.updateChapter(s,{keypadCommands:[{type:'submit'}]});assert.equal(s.puzzles['power.main'].restored,true);
  s=walk(walk(s,3,-6.5),8.2,-6.5);
  s=walk(walk(walk(s,10,-6.5),10,-1.2),8.5,-1.2);
  s=aim(s,8.5,logic.EYE_HEIGHT,-2.2);
  let discovered=false;
  for(let i=0;i<450;i++) {s=logic.updateChapter(s,{},0.1);if(s.monsters[id].mode==='chase') {discovered=true;break;}}
  assert.ok(discovered,'正式巡邏能發現櫃前玩家');
  assert.equal(s.monsters[id].mode,'chase','到櫃前仍被追逐');
  const lastSeen=structuredClone(s.monsters[id].lastSeen),inventory=structuredClone(s.inventory),charge=s.flashlight.charge;
  s=logic.updateChapter(s,{interactPressed:true},0.1);assert.equal(s.ui.mode,'hiding');assert.equal(s.monsters[id].mode,'search');
  assert.deepEqual(s.monsters[id].lastSeen,lastSeen);assert.equal(s.flashlight.enabled,false);
  let returned=false;
  for(let i=0;i<200;i++) {s=logic.updateChapter(s,{},0.1);assert.notEqual(s.monsters[id].mode,'chase');if(s.monsters[id].mode==='patrol') {returned=true;break;}}
  assert.ok(returned);assert.equal(s.flashlight.charge,charge);assert.deepEqual(s.inventory,inventory);
  s=logic.updateChapter(s,{interactPressed:true},0.1);assert.equal(s.ui.mode,'explore');assert.equal(s.flashlight.enabled,false);
  assert.equal(s.player.x,8.5);assert.equal(s.player.z,-1.2);assert.equal(s.puzzles['power.main'].restored,true);
});
