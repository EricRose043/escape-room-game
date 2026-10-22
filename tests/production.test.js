import test from 'node:test';
import assert from 'node:assert/strict';
import * as logic from '../src/logic/index.js';

const area = () => logic.WORLD.areas.find(a => a.id === 'production');
function state(power = true) {
  const s = logic.createChapter();
  return {...s, player:{...s.player,paused:false}, inventory:{itemIds:['lobby.flashlight']},
    puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:power}}};
}
function walk(s, x, z, update = logic.updateChapter) {
  for (let i=0;i<500;i++) {
    const dx=x-s.player.x,dz=z-s.player.z,distance=Math.hypot(dx,dz);
    if (distance<1e-7) return s;
    const yaw=Math.atan2(-dx,-dz);
    const next=update(s,{look:{dYaw:yaw-s.player.yaw},move:{y:1}},Math.min(0.1,distance/logic.WALK_SPEED));
    if (Math.hypot(next.player.x-s.player.x,next.player.z-s.player.z)<1e-9) return next;
    s=next;
  }
  assert.fail('路線超時');
}

test('第三區 ID 與導航引用唯一且有效', () => {
  const p=area(); assert.ok(p);
  assert.deepEqual(p.bounds,{minX:7.2,maxX:21.2,minZ:-12.5,maxZ:-0.5});
  assert.equal(p.height,3.5);
  assert.deepEqual(logic.validateWorld(),[]);
  assert.ok(p.navigation.nodes.length<=16 && p.navigation.edges.length<=24);
  assert.equal(p.monsters.length,1);
  for (const corrupt of [
    p=>p.navigation.nodes[1].id=p.navigation.nodes[0].id,
    p=>p.navigation.edges[0].to='missing',
    p=>p.navigation.edges.push({...p.navigation.edges[0]}),
    p=>p.navigation.nodes[0].x=NaN,
    p=>p.monsters[0].patrol[0]='missing',
    p=>p.monsters[0].areaId='missing',
    p=>p.monsters[0].spawn.x=100,
    p=>p.monsters[0].radius=-1,
    p=>p.devices[0].exitCandidates[0].x=100,
  ]) {
    const bad=structuredClone(logic.WORLD); corrupt(bad.areas[2]);
    assert.ok(logic.validateWorld(bad).length>0,'損壞的導航／怪物／櫃子資料必須被攔截');
  }
});
test('未恢復供電不能進生產線，恢復後可經平台進入', () => {
  assert.ok(area());
  for (const power of [false,true]) {
    let s=state(power); s.player={...s.player,x:3,z:-5.2};
    s=walk(walk(s,3,-6.5),8.2,-6.5);
    assert.ok(power ? Math.abs(s.player.x-8.2)<1e-7 : s.player.x<5);
  }
  const door=logic.DOORS.find(d=>d.id==='power.production-door');
  assert.deepEqual(door.destination,{type:'area',areaId:'production'});
  const power=logic.WORLD.areas.find(a=>a.id==='power-room');
  assert.ok(!power.boxes.some(b=>b.id==='power.landing-end'));
  assert.ok(!power.signs.some(s=>s.id==='power.landing-sign'));
  assert.equal(power.signs.find(s=>s.id==='power.exit-sign').text,'糖果生產線');
  const landing=logic.SURFACES.find(b=>b.id==='power.landing-floor');
  const floor=logic.SURFACES.find(b=>b.id==='production.floor');
  assert.equal(landing.maxX,floor.minX,'平台與新區地板無縫相接');
});
test('新區牆機台與櫃體阻擋移動，必要通道可通行', () => {
  const p=area(); assert.ok(p);
  const boxes=logic.getGeometry(state()).collisionBoxes;
  const obstacles=[...p.boxes.filter(b=>b.blocksMovement!==false),...p.devices.map(d=>({...d.bounds,id:d.id}))];
  assert.equal(p.boxes.filter(b=>b.kind==='machine').length,2);
  assert.equal(p.devices.filter(d=>d.kind==='locker').length,2);
  for (const b of obstacles) {
    let player=logic.createPlayer({x:b.minX-0.5,z:(b.minZ+b.maxZ)/2,paused:false});
    for(let i=0;i<20;i++) player=logic.updatePlayer(player,{move:{x:1}},0.1,[b]);
    assert.ok(player.x<=b.minX-logic.PLAYER_RADIUS+1e-8,b.id);
  }
  let s=state(); s.player={...s.player,x:8.2,z:-6.5};
  for (const [x,z] of [[10,-6.5],[10,-10.3],[18.5,-10.3],[18.5,-2],[14.2,-2],[14.2,-10.3],[10,-10.3],[10,-1.2],[8.5,-1.2]]) {
    s=walk(s,x,z,(state,actions,dt)=>({...state,player:logic.updatePlayer(state.player,actions,dt,logic.getGeometry(state).collisionBoxes)})); assert.ok(Math.hypot(s.player.x-x,s.player.z-z)<1e-7,`${x},${z}`);
    assert.ok(!boxes.some(b=>logic.circleOverlapsBox(s.player.x,s.player.z,b,logic.PLAYER_RADIUS)));
  }
});
test('下一區門保持關閉且同時阻擋移動與視線', () => {
  const p=area(); assert.ok(p);
  const s=state(),door=p.doors[0],g=logic.getGeometry(s);
  assert.equal(door.openWhen.puzzleId,'production.sequence');
  assert.equal(door.destination.type,'reserved');
  assert.equal(s.puzzles['production.sequence'].restored,false);
  assert.equal(logic.isDoorOpen(door,s),false);
  for(const list of [g.collisionBoxes,g.occluderBoxes]) assert.ok(list.some(b=>b.id===door.id));
  let player={...s.player,x:20,z:-6.5};
  for(let i=0;i<20;i++) player=logic.updatePlayer(player,{move:{x:1}},0.1,g.collisionBoxes);
  assert.ok(player.x<=21.2-logic.PLAYER_RADIUS+1e-8);
  const ray={origin:{x:20,y:1.6,z:-6.5},direction:{x:1,y:0,z:0}};
  assert.ok(logic.rayBoxDistance(ray,door.bounds)<1.3);
});
test('5a 不新增物品密碼或櫃子互動，照明沿用兩盞固定池', () => {
  const p=area(); assert.ok(p);
  assert.equal(logic.ITEMS.length,4);
  assert.equal(logic.WORLD.areas.flatMap(a=>a.puzzles).filter(p=>p.code).length,1);
  let s=state(); s.player={...s.player,x:8.5,z:-1.2,yaw:0,pitch:0};
  assert.equal(logic.selectChapterTarget(s),null);
  const next=logic.updateChapter(s,{interactPressed:true},0.1);
  assert.equal(next.ui.mode,'explore'); assert.deepEqual(next.inventory,s.inventory);
  const lights=logic.getActiveLights(s.player);
  assert.ok(lights.length<=2); assert.equal(lights[0].id,p.lights[0].id);
});
