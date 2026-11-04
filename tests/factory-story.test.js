import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, WORLD, DOORS, isDoorOpen, getGeometry } from '../src/logic/world.js';
import { createPlayer } from '../src/logic/movement.js';
import { selectItem } from '../src/logic/interaction.js';

const item=id=>ITEMS.find(entry=>entry.id===id);

test('玩具工廠地圖放在辦公室前段且可從出生點取得',()=>{
  const map=item('lobby.factory-map');
  assert.ok(map,'地圖應作為可取得物品存在');
  assert.equal(WORLD.areas.find(area=>area.id==='lobby').name,'工廠辦公室');
  assert.ok(map.minZ>=0 && map.maxZ<=8,'地圖要留在第一區');
  const x=(map.minX+map.maxX)/2,y=(map.minY+map.maxY)/2,z=(map.minZ+map.maxZ)/2;
  const player={...createPlayer(WORLD.spawn),paused:false,yaw:Math.atan2(WORLD.spawn.x-x,WORLD.spawn.z-z),pitch:Math.atan2(y-1.6,Math.hypot(x-WORLD.spawn.x,z-WORLD.spawn.z))};
  assert.equal(selectItem(player,{itemIds:[]},[map],getGeometry({inventory:{itemIds:[]},puzzles:{}}).occluderBoxes)?.id,map.id);
});

test('員工卡在早期可取得，且單靠手電筒不能打開控制室',()=>{
  const card=item('lobby.employee-card');
  assert.ok(card,'員工卡應在辦公室中');
  const door=DOORS.find(entry=>entry.id==='lobby.power-door');
  assert.equal(door.openWhen.itemId,card.id);
  assert.equal(isDoorOpen(door,{inventory:{itemIds:['lobby.flashlight']}}),false);
  assert.equal(isDoorOpen(door,{inventory:{itemIds:[card.id]}}),true);
});

test('第一章區域名稱已採玩具工廠設定',()=>{
  assert.ok(WORLD.areas.every(area=>!area.name.includes('糖果') && !area.name.includes('樂園')));
  assert.ok(WORLD.areas.some(area=>area.name.includes('控制室')));
  assert.ok(WORLD.areas.some(area=>area.name.includes('裝配')));
});
