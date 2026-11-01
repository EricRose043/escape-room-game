import test from 'node:test';
import assert from 'node:assert/strict';
import * as logic from '../src/logic/index.js';

const lobbyId='lobby.checkpoint',powerId='power.checkpoint',productionId='production.checkpoint';
const area=logic.WORLD.areas.find(a=>a.id==='production'),definition=area.monsters[0],monsterId=definition.id;
const at=(s,x,z)=>({...s,player:{...s.player,x,z,paused:false}});
function powered() {
  const s=logic.createChapter();
  return {...s,player:{...s.player,paused:false},inventory:{itemIds:['lobby.employee-card','lobby.flashlight','power.fuse']},
    puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:true,restoreElapsed:0.2}}};
}
function production() {
  let s=logic.updateChapter(at(powered(),0,-1.2));
  return logic.updateChapter(at(s,8.2,-6.5));
}
function assertPose(s,id) {
  const spawn=logic.CHECKPOINTS.find(c=>c.id===id).spawn;
  for(const key of ['x','z','yaw','pitch']) assert.equal(s.player[key],spawn[key],key);
  assert.equal(logic.EYE_HEIGHT,1.6);
}

test('四個存檔點 ID 前置條件與玩家半徑位置有效',()=>{
  assert.deepEqual(logic.CHECKPOINTS.map(c=>c.id),[lobbyId,powerId,productionId,'exit.checkpoint']);
  assert.deepEqual(logic.CHECKPOINTS.map(c=>c.order),[0,1,2,3]);
  assert.deepEqual(logic.CHECKPOINTS.map(c=>c.spawn),[
    {x:0,z:6,yaw:0,pitch:0},{x:0,z:-1.2,yaw:0,pitch:0},{x:6.5,z:-6.5,yaw:-Math.PI/2,pitch:0},{x:41.2,z:-17.5,yaw:-Math.PI/2,pitch:0},
  ]);
  for(const checkpoint of logic.CHECKPOINTS) {
    const s=checkpoint.id===lobbyId?logic.createChapter():powered();
    const floor=logic.SURFACES.find(f=>f.id===checkpoint.floorId);
    assert.ok(floor && floor.kind==='floor');
    const {x,z}=checkpoint.spawn,r=logic.PLAYER_RADIUS;
    assert.ok(x>=floor.minX+r && x<=floor.maxX-r && z>=floor.minZ+r && z<=floor.maxZ-r);
    assert.ok(!logic.getGeometry(s).collisionBoxes.some(b=>logic.circleOverlapsBox(x,z,b)));
  }
  assert.equal(logic.CHECKPOINTS[2].floorId,'power.landing-floor');
  assert.deepEqual(logic.validateWorld(),[]);
  for(const corrupt of [
    w=>w.areas[1].checkpoint.id=lobbyId,
    w=>w.areas[1].checkpoint.order=0,
    w=>w.areas[1].checkpoint.order=-1,
    w=>w.areas[1].checkpoint.requires.itemIds=['missing'],
    w=>w.areas[2].checkpoint.requires.puzzleIds=['missing'],
    w=>w.areas[2].checkpoint.floorId='missing',
    w=>w.areas[2].checkpoint.floorId='production.floor',
    w=>w.areas[2].checkpoint.floorId='power.landing-ceiling',
    w=>w.areas[1].checkpoint.spawn.x=NaN,
    w=>w.areas[1].checkpoint.spawn.yaw=Infinity,
    w=>w.areas[1].checkpoint.spawn.pitch=NaN,
    w=>w.areas[1].checkpoint.spawn.x=-3,
    w=>w.areas[1].checkpoint.spawn.z=100,
    w=>w.areas[0].checkpoint.spawn.z=0,
  ]) {
    const bad=structuredClone(logic.WORLD);corrupt(bad);
    assert.ok(logic.validateWorld(bad).length>0,'無效存檔點資料必須被攔截');
  }
  const initial=logic.createChapter();
  assert.equal(logic.updateChapter(at(initial,0,-1.2)).checkpointId,lobbyId,'缺手電筒不能啟用電力室');
  const unsolved={...powered(),puzzles:initial.puzzles};
  assert.equal(logic.updateChapter(at(unsolved,8.2,-6.5)).checkpointId,lobbyId,'未供電不能啟用生產線');
});

test('首次完整進區啟用存檔點，回頭不降級或重複啟用',()=>{
  let s=logic.createChapter();assert.equal(s.checkpointId,lobbyId);
  s={...s,inventory:{itemIds:['lobby.employee-card','lobby.flashlight']}};
  const b=logic.WORLD.areas.find(a=>a.id==='power-room').bounds,r=logic.PLAYER_RADIUS;
  const edge=at(s,0,b.maxZ-r+0.001);
  assert.equal(logic.updateChapter(edge).checkpointId,lobbyId);
  assert.equal(logic.updateChapter(at(s,b.minX+r-0.001,-4)).checkpointId,lobbyId);
  assert.equal(logic.updateChapter(at(s,b.maxX-r+0.001,-4)).checkpointId,lobbyId);
  assert.equal(logic.updateChapter(at(s,0,b.minZ+r-0.001)).checkpointId,lobbyId);
  for(const actions of [{pausePressed:true},{focusLost:true},{forcePause:true},{gameplayActive:false}]) {
    assert.equal(logic.updateChapter(at(s,0,-1.2),actions).checkpointId,lobbyId);
  }
  const paused={...s,player:{...s.player,x:0,z:-1.2,paused:true}};
  assert.equal(logic.updateChapter(paused).checkpointId,lobbyId);
  s=logic.updateChapter(at(s,0,b.maxZ-r));assert.equal(s.checkpointId,powerId);
  assert.equal(logic.advanceCheckpoint(s),s,'同一存檔點不重複啟用');
  s=logic.updateChapter(at(s,0,6));assert.equal(s.checkpointId,powerId);
  s={...s,puzzles:powered().puzzles};
  s=logic.updateChapter(at(s,area.bounds.minX+r-0.001,-6.5));assert.equal(s.checkpointId,powerId);
  s=logic.updateChapter(at(s,area.bounds.minX+r,-6.5));assert.equal(s.checkpointId,productionId);
  assert.equal(logic.advanceCheckpoint(s),s);
  s=logic.updateChapter(at(s,0,-1.2));assert.equal(s.checkpointId,productionId);
  assert.equal(logic.updateChapter(at(s,0,6)).checkpointId,productionId);
});

test('恢復供電不提前取得尚未到達的生產線存檔點',()=>{
  let s=logic.updateChapter(at(powered(),0,-1.2));
  s={...s,puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:false}},
    ui:logic.createKeypad('power.keypad')};
  s=logic.submitPuzzleCode(s,'power.keypad',logic.getPuzzle('power.main').code);
  assert.equal(s.puzzles['power.main'].restored,true);assert.equal(s.checkpointId,powerId);
  s=logic.updateChapter(at(s,6.5,-6.5),{},0.1);assert.equal(s.checkpointId,powerId);
  const restored=logic.restoreCheckpoint(s);assertPose(restored,powerId);
  assert.equal(restored.monsters[monsterId].mode,'inactive');
  assert.equal(logic.updateChapter(at(s,8.2,-6.5),{},0.1).checkpointId,productionId);
});

test('回復保留最新物品安裝與已解謎題，電池不重新出現',()=>{
  let s=production();
  s={...s,inventory:{itemIds:[...s.inventory.itemIds,'lobby.battery','power.battery']},
    puzzles:{...s.puzzles,'production.sequence':{installedItemId:null,restored:true}},
    flashlight:{charge:17.25,mode:'uv',enabled:true}};
  const before=structuredClone(s),next=logic.restoreCheckpoint(s);
  assert.deepEqual(s,before,'不修改傳入狀態');
  assert.deepEqual(next.inventory,s.inventory);
  for(const [id,p] of Object.entries(s.puzzles)) {
    assert.equal(next.puzzles[id].installedItemId,p.installedItemId);assert.equal(next.puzzles[id].restored,p.restored);
  }
  for(const item of logic.ITEMS.filter(i=>i.kind==='battery')) {
    const player={...next.player,x:(item.minX+item.maxX)/2,z:item.maxZ+0.8,yaw:0,
      pitch:Math.atan2((item.minY+item.maxY)/2-logic.EYE_HEIGHT,0.8+(item.maxZ-item.minZ)/2)};
    assert.equal(logic.selectItem(player,next.inventory,[item],[]),null);
    const retried=logic.updateEquipment(next,player,{interactPressed:true},0,[item],[]);
    assert.deepEqual(retried.inventory,next.inventory);assert.equal(retried.flashlight.charge,17.25);
  }
  const twice=logic.restoreCheckpoint(next);assert.deepEqual(twice,next,'重複回復不重複補電或丟失進度');
});

test('回復保留電量模式並關燈，門與供電狀態一致',()=>{
  assert.equal(typeof logic.restoreCheckpoint,'function');
  for(const charge of [0,17.25,100]) for(const mode of ['normal','uv']) {
    const s={...production(),flashlight:{charge,mode,enabled:true}};
    const next=logic.restoreCheckpoint(s);assertPose(next,productionId);
    assert.deepEqual(next.flashlight,{charge,mode,enabled:false});
    assert.equal(logic.powerProgress(next,'power.main'),1,'不重播供電轉換');
    const open=logic.DOORS.filter(d=>logic.isDoorOpen(d,next)).map(d=>d.id);
    assert.deepEqual(open,['lobby.power-door','power.production-door']);
    const geometry=logic.getGeometry(next);
    for(const boxes of [geometry.collisionBoxes,geometry.occluderBoxes]) {
      assert.ok(open.every(id=>!boxes.some(b=>b.id===id)));
      assert.ok(boxes.some(b=>b.id==='production.east-door'));
    }
  }
  const initial=logic.restoreCheckpoint(logic.createChapter());assertPose(initial,lobbyId);
  assert.ok(logic.DOORS.every(d=>!logic.isDoorOpen(d,initial)));assert.equal(logic.powerProgress(initial,'power.main'),0);
  assert.equal(initial.player.paused,true,'回復不代替開始／繼續操作');
});

test('回復清除櫃子密碼鎖事件與怪物追逐記憶',()=>{
  assert.equal(typeof logic.restoreCheckpoint,'function');
  for(const ui of [
    {mode:'hiding',lockerId:'production.locker-l1',message:'出口被占用，請稍候再試'},
    {...logic.createKeypad('power.keypad'),buffer:'47',message:'密碼錯誤，請重試'},
  ]) {
    const s=production();
    const dirty={...s,player:{...s.player,x:8.5,z:-2.6,yaw:2,pitch:0.4},ui,
      events:[{type:'contact',monsterId}],monsters:{...s.monsters,[monsterId]:{
        ...s.monsters[monsterId],x:10,z:-2,mode:'chase',patrolIndex:2,waitRemaining:0.2,
        path:[{x:8.5,z:-1.2}],pathIndex:0,lastSeen:{x:8.5,z:-1.2},lostSightSeconds:0.4,
        searchElapsed:2,returnNodeId:'production.nav.D',repathRemaining:0.2,pathGoal:{x:8.5,z:-1.2},
        plannedMode:'chase',contactLatched:true,contactCount:4,contactFeedbackRemaining:0.8,
        events:[{type:'contact',monsterId}],
      }}};
    const before=structuredClone(dirty),next=logic.restoreCheckpoint(dirty);
    assert.deepEqual(dirty,before);assert.deepEqual(next.ui,{mode:'explore'});assert.deepEqual(next.events,[]);
    assert.deepEqual(next.monsters[monsterId],{...logic.createMonster(definition),mode:'patrol'});
    assertPose(next,productionId);assert.equal(next.player.paused,false);
  }
});

test('普通離區不重置怪物，回復時按進度重建啟動狀態',()=>{
  let s=logic.updateChapter(production(),{},0.1);
  s=logic.updateChapter(s,{},0.1);
  const previous=s.monsters[monsterId];
  const outside=logic.updateChapter(at(s,0,-1.2),{},0.1);
  assert.equal(outside.monsters[monsterId].mode,'patrol');
  assert.ok(outside.monsters[monsterId].waitRemaining<previous.waitRemaining,'普通離區仍推進巡邏');
  const reentered=logic.updateChapter(at(outside,8.2,-6.5),{},0.1);
  assert.ok(reentered.monsters[monsterId].waitRemaining<outside.monsters[monsterId].waitRemaining);
  assert.deepEqual(logic.restoreCheckpoint(outside).monsters[monsterId],{...logic.createMonster(definition),mode:'patrol'});
  const earlier=logic.updateChapter(at(powered(),0,-1.2));
  const dirty={...earlier,monsters:s.monsters};
  assert.deepEqual(logic.restoreCheckpoint(dirty).monsters[monsterId],logic.createMonster(definition));
});

test('平台回復位置安全，重新進區仍可被發現與接觸',()=>{
  let s=logic.restoreCheckpoint(production());assertPose(s,productionId);
  assert.ok(!logic.inMonsterArea(s.player,area));
  assert.ok(!logic.getGeometry(s).collisionBoxes.some(b=>logic.circleOverlapsBox(s.player.x,s.player.z,b)));
  for(let i=0;i<400;i++) s=logic.updateChapter(s,{},0.1);
  assert.equal(s.monsters[monsterId].contactCount,0);assert.equal(s.monsters[monsterId].mode,'patrol');
  s=logic.restoreCheckpoint(s);s=at(s,8.2,-6.5);
  let chased=false,contact=false;
  for(let i=0;i<600;i++) {
    s=logic.updateChapter(s,{},0.1);chased ||= s.monsters[monsterId].mode==='chase';
    if(s.events.some(e=>e.type==='contact')) {contact=true;break;}
  }
  assert.ok(chased);assert.ok(contact,'沒有永久或計時無敵');
  s=logic.restoreCheckpoint(s);assertPose(s,productionId);assert.equal(s.monsters[monsterId].contactLatched,false);
  s=at(s,8.2,-6.5);contact=false;
  for(let i=0;i<600;i++) {s=logic.updateChapter(s,{},0.1);if(s.events.some(e=>e.type==='contact')) {contact=true;break;}}
  assert.ok(contact,'第二次回復後仍能再次接觸');
});

