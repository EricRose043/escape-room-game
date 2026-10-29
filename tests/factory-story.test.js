import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, WORLD, DOORS, isDoorOpen } from '../src/logic/world.js';
import { createPlayer } from '../src/logic/movement.js';
import { selectItem } from '../src/logic/interaction.js';

const item=id=>ITEMS.find(entry=>entry.id===id);

test('玩具工廠地圖放在辦公室前段且可從出生點取得',()=>{
  const map=item('lobby.factory-map');
  assert.ok(map,'地圖應作為可取得物品存在');
  assert.equal(WORLD.areas.find(area=>area.id==='lobby').name,'工廠辦公室');
  assert.ok(map.minZ>=0 && map.maxZ<=8,'地圖要留在第一區');
  const player={...createPlayer(WORLD.spawn),paused:false,pitch:-0.5};
  assert.equal(selectItem(player,{itemIds:[]},[map],[])?.id,map.id);
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
