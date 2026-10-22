import test from 'node:test';
import assert from 'node:assert/strict';
import * as logic from '../src/logic/index.js';

const lockers=logic.DEVICES.filter(d=>d.kind==='locker');
function front(locker=lockers[0]) {
  const s=logic.createChapter(),p=locker.exitCandidates[0];
  return {...s,player:{...s.player,...p,yaw:0,pitch:0,paused:false},
    inventory:{itemIds:['lobby.flashlight']},flashlight:{charge:73,enabled:true,mode:'uv'}};
}
const enter=s=>logic.updateChapter(s,{interactPressed:true},0.1);
const barrier=(id,minX,maxX,minZ,maxZ)=>({id,minX,maxX,minZ,maxZ,minY:0,maxY:3});

test('置物櫃沿用中央射線兩公尺遮擋與最近目標',()=>{
  const locker=lockers[1],s=front(locker);
  s.player.z=locker.bounds.maxZ+2;
  assert.equal(logic.selectChapterTarget(s)?.id,locker.id,'包含兩公尺邊界');
  s.player.z+=0.001;assert.equal(logic.selectChapterTarget(s),null);
  s.player.z=locker.exitCandidates[0].z;s.player.yaw=Math.PI/2;
  assert.equal(logic.selectChapterTarget(s),null,'中央射線未瞄到櫃子');
  s.player.yaw=0;
  const boxes=logic.getGeometry(s).occluderBoxes;
  const wall=barrier('test.wall',19,20,-10.95,-10.9);
  assert.equal(logic.selectInteractionTarget(s.player,s.inventory,[],[locker],[...boxes,wall]),null);
  const item={...barrier('test.item',19.3,19.7,-10.8,-10.5),minY:1.4,maxY:1.8};
  assert.equal(logic.selectInteractionTarget(s.player,s.inventory,[item],[locker],boxes)?.id,item.id);
  const farther={...item,id:'test.farther',minZ:-12.8,maxZ:-12.5};
  assert.equal(logic.selectInteractionTarget(s.player,s.inventory,[farther],[locker],boxes)?.id,locker.id);
});

test('只有櫃門正面可以進入，進出不穿牆或重複觸發',()=>{
  for(const locker of lockers) {
    const s=front(locker),snapshot=structuredClone(s),inside=enter(s);
    assert.equal(inside.ui.mode,'hiding');assert.equal(inside.ui.lockerId,locker.id);
    assert.equal(inside.player.x,locker.inside.x);assert.equal(inside.player.z,locker.inside.z);
    assert.equal(inside.player.yaw,locker.doorYaw);assert.equal(inside.player.pitch,0);
    assert.deepEqual(s,snapshot,'進櫃不修改舊狀態');
    assert.equal(logic.updateChapter(inside,{},0.1).ui.mode,'hiding');
    const outside=enter(inside);
    assert.equal(outside.ui.mode,'explore');assert.equal(outside.player.x,locker.exitCandidates[0].x);
    assert.equal(outside.player.z,locker.exitCandidates[0].z);
    assert.ok(!logic.getGeometry(outside).collisionBoxes.some(b=>logic.circleOverlapsBox(outside.player.x,outside.player.z,b)));
    assert.equal(logic.updateChapter(outside,{},0.1).ui.mode,'explore');
  }
  const locker=lockers[0],s=front();
  for(const p of [{x:7.5,z:-2.6,yaw:-Math.PI/2},{x:9.5,z:-2.6,yaw:Math.PI/2},{x:8.5,z:-3.5,yaw:Math.PI}]) {
    const side={...s,player:{...s.player,...p}};
    assert.equal(logic.selectChapterTarget(side),null);
    assert.equal(enter(side).ui.mode,'explore');
  }
  // 即使中央射線瞄中正面，身體移入的整段也不能跨過旁邊薄牆或怪物。
  const boxes=logic.getGeometry(s).collisionBoxes;
  const wall=barrier('test.thin',8,9,-2.05,-2.04);
  assert.equal(logic.tryEnterHiding(s,locker,[...boxes,wall],[]).ui.mode,'explore');
  assert.equal(logic.tryEnterHiding(s,locker,boxes,[{x:8.5,z:-1.95,radius:0.35}]).ui.mode,'explore');
  const oblique={...s,player:{...s.player,x:9.4,yaw:Math.atan2(0.9,1.4)}};
  assert.equal(logic.tryEnterHiding(oblique,locker,boxes,[]).ui.mode,'explore','不能斜穿櫃體側板');
});

test('躲藏時禁止移動互動及裝備動作，視角限於窺視範圍',()=>{
  let s=enter(front());assert.equal(s.ui.mode,'hiding');
  assert.equal(s.flashlight.enabled,false);assert.equal(s.flashlight.charge,73);assert.equal(s.flashlight.mode,'uv');
  const original=structuredClone(s),locker=lockers[0];
  for(const sign of [1,-1]) {
    for(let i=0;i<20;i++) s=logic.updateChapter(s,{move:{x:1,y:1},look:{dYaw:sign*5,dPitch:sign*5,yawRate:sign,pitchRate:sign},
      flashlightPressed:true,uvPressed:true,keypadCommands:[{type:'submit'}]},0.1);
    assert.equal(s.player.x,locker.inside.x);assert.equal(s.player.z,locker.inside.z);
    assert.ok(Math.abs(logic.angleDelta(s.player.yaw,locker.doorYaw)-sign*Math.PI/4)<1e-9);
    assert.ok(Math.abs(s.player.pitch-sign*25*Math.PI/180)<1e-9);
    assert.deepEqual(s.inventory,original.inventory);assert.deepEqual(s.flashlight,original.flashlight);
    assert.equal(logic.selectChapterTarget(s),null);
    assert.equal(logic.submitPuzzleCode(s,'power.keypad','4726'),s);
  }
  const before=s.player;
  for(const dt of [0,-1,NaN,Infinity]) {
    const next=logic.updateChapter(s,{look:{yawRate:1,pitchRate:1}},dt);
    assert.deepEqual(next.player,before);
  }
  const out=enter(s);assert.equal(out.ui.mode,'explore');assert.equal(out.flashlight.enabled,false);
});

test('出口被占用時留在櫃內，安全後可以離開',()=>{
  const locker=lockers[0],s=enter(front());assert.equal(s.ui.mode,'hiding');
  const boxes=logic.getGeometry(s).collisionBoxes;
  const blocked=barrier('test.exit',8,9,-1.85,-0.8);
  const next=logic.tryLeaveHiding(s,locker,[...boxes,blocked],[]);
  assert.equal(next.ui.mode,'hiding');assert.deepEqual(next.player,s.player);assert.match(next.ui.message,/出口|稍候/);
  const thin=barrier('test.between',8,9,-2.05,-2.04);
  assert.equal(logic.tryLeaveHiding(s,locker,[...boxes,thin],[]).ui.mode,'hiding','出口點安全但路上有牆仍不能出櫃');
  const body={x:8.5,z:-1.2,radius:0.35},snapshot=structuredClone(body);
  const occupied=logic.tryLeaveHiding(s,locker,boxes,[body]);
  assert.equal(occupied.ui.mode,'hiding');assert.deepEqual(body,snapshot,'不強推怪物');
  const id=Object.keys(s.monsters)[0];
  const integrated={...s,monsters:{...s.monsters,[id]:{...s.monsters[id],mode:'patrol',x:8.5,z:-1.2}}};
  assert.equal(enter(integrated).ui.mode,'hiding','正式互動也檢查怪物占用');
  const firstOnly=barrier('test.first-only',8.4,8.6,-0.91,-0.89);
  const fallback=logic.tryLeaveHiding(s,locker,[...boxes,firstOnly],[]);
  assert.equal(fallback.ui.mode,'explore');assert.equal(fallback.player.z,locker.exitCandidates[1].z);
  const safe=logic.tryLeaveHiding(next,locker,boxes,[]);
  assert.equal(safe.ui.mode,'explore');assert.equal(safe.flashlight.enabled,false);
});
