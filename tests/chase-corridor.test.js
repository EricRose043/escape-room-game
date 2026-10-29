import test from 'node:test';
import assert from 'node:assert/strict';
import {CHASE_CORRIDOR,getCorridorGeometry} from '../src/logic/areas/chase-corridor.js';
import {createCorridorDoors,updateCorridorDoors} from '../src/logic/corridor-doors.js';
import {WORLD,validateWorld} from '../src/logic/world.js';
import {createPlayer,updatePlayer,circleOverlapsBox,PLAYER_RADIUS} from '../src/logic/movement.js';
test('S3 獨立區域符合 D010 與全域 ID／引用，尚未加入正式地圖',()=>{
  assert.deepEqual(validateWorld({...WORLD,areas:[...WORLD.areas,CHASE_CORRIDOR]}),[]);
  assert.equal(WORLD.areas.some(a=>a.id===CHASE_CORRIDOR.id),false);
  assert.ok(CHASE_CORRIDOR.doors.length>=3);assert.ok(CHASE_CORRIDOR.route.length>=4);
  for(const d of CHASE_CORRIDOR.doors) {
    const t=d.trigger,b=d.bounds;
    const edge=t.direction===1?b[`max${t.axis.toUpperCase()}`]:b[`min${t.axis.toUpperCase()}`];
    assert.ok((t.value-edge)*t.direction>PLAYER_RADIUS,'門在整個身體通過後才關');
  }
});
test('能走過轉彎與三道門，門只在身後關上且不夾住玩家',()=>{
  let p=createPlayer({...CHASE_CORRIDOR.entry,paused:false}),doors=createCorridorDoors();
  doors=updateCorridorDoors(doors,p.x,p.z,CHASE_CORRIDOR);
  for(const point of CHASE_CORRIDOR.route.slice(1)) {
    for(let step=0;step<200&&Math.hypot(point.x-p.x,point.z-p.z)>.26;step++) {
      const yaw=Math.atan2(-(point.x-p.x),-(point.z-p.z));
      p=updatePlayer({...p,yaw},{move:{y:1}},.1,getCorridorGeometry(doors).collisionBoxes);
      doors=updateCorridorDoors(doors,p.x,p.z,CHASE_CORRIDOR);
      assert.ok(!getCorridorGeometry(doors).collisionBoxes.some(b=>circleOverlapsBox(p.x,p.z,b)),'關門不得夾身');
    }
    assert.ok(Math.hypot(point.x-p.x,point.z-p.z)<=.26,'每個轉彎均可達');
  }
  assert.deepEqual(doors.closedIds,[...CHASE_CORRIDOR.doors.map(d=>d.id)]);
});
test('同一份門狀態控制碰撞與遮擋，關門後無法走回',()=>{
  const d=CHASE_CORRIDOR.doors[0],open=getCorridorGeometry(createCorridorDoors());
  assert.equal(open.collisionBoxes.some(b=>b.id===d.id),false);
  const closed=getCorridorGeometry({closedIds:[d.id]});
  assert.ok(closed.collisionBoxes.some(b=>b.id===d.id));assert.ok(closed.occluderBoxes.some(b=>b.id===d.id));
  let p=createPlayer({x:d.bounds.maxX+.6,z:-6.5,paused:false,yaw:Math.PI/2});
  for(let i=0;i<20;i++)p=updatePlayer(p,{move:{y:1}},.1,closed.collisionBoxes);
  assert.ok(p.x>=d.bounds.maxX+PLAYER_RADIUS-1e-8);
});
