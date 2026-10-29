import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer, updatePlayer, PLAYER_RADIUS } from '../src/logic/movement.js';
import { selectItem } from '../src/logic/interaction.js';
import { isClueVisible } from '../src/logic/illumination.js';
const load = () => import('../src/logic/world.js');
const state = (access = false, power = false) => ({ inventory: { itemIds: access ? ['lobby.flashlight','lobby.employee-card'] : [] }, puzzles: { 'power.main': { restored: power } } });
const rect = (x, y, z, sx = 0.5, sy = 0.5, sz = 0.5) => ({ minX: x-sx/2, maxX: x+sx/2, minY: y-sy/2, maxY: y+sy/2, minZ: z-sz/2, maxZ: z+sz/2 });

function reachable(boxes, spawn) {
  const queue = [{ x: spawn.x, z: spawn.z }]; const seen = new Set([`${spawn.x},${spawn.z}`]);
  const free = (x,z) => !boxes.some(b => {
    const dx = x - Math.max(b.minX, Math.min(b.maxX,x)); const dz = z - Math.max(b.minZ, Math.min(b.maxZ,z));
    return dx*dx+dz*dz < PLAYER_RADIUS**2-1e-12;
  });
  assert.ok(free(spawn.x,spawn.z), '出生點不可卡在障礙物');
  for (let n=0;n<queue.length;n++) {
    const p=queue[n];
    for (const [dx,dz] of [[0.5,0],[-0.5,0],[0,0.5],[0,-0.5]]) {
      const x=p.x+dx,z=p.z+dz,key=`${x},${z}`;
      if(x < -5 || x > 7.5 || z < -8.5 || z > 8 || seen.has(key) || !free(x,z)) continue;
      seen.add(key); queue.push({x,z});
    }
  }
  return queue;
}

test('正式關卡所有 ID 唯一且引用有效', async () => {
  const { WORLD, validateWorld } = await load();
  assert.deepEqual(validateWorld(WORLD), []);
  assert.deepEqual(WORLD.areas.map(a=>a.id), ['lobby','power-room','production','loading-bay']);
  const duplicate = structuredClone(WORLD); duplicate.areas[1].items[0].id=duplicate.areas[0].items[0].id;
  assert.ok(validateWorld(duplicate).length > 0, '重複 ID 必須報錯');
  const invalid = structuredClone(WORLD); invalid.areas[0].doors[0].openWhen.itemId='missing';
  assert.ok(validateWorld(invalid).length > 0, '無效引用必須報錯');
  const broken = structuredClone(WORLD); broken.areas[0].items[0].minX=100;
  assert.ok(validateWorld(broken).length > 0, '無效 AABB 必須報錯');
  const json=JSON.stringify(WORLD); assert.ok(!json.includes('demo-')); assert.ok(!json.includes('星光在此'));
});
test('出生點與必要通道可通行，物品可從走道接近', async () => {
  const { WORLD, getGeometry, ITEMS } = await load();
  assert.deepEqual(WORLD.spawn, {x:0,z:6,yaw:0,pitch:0});
  const closed=reachable(getGeometry(state()).collisionBoxes,WORLD.spawn);
  assert.ok(closed.every(p=>p.z >= 0.3), '未取得員工卡不可繞過辦公室門');
  const open=reachable(getGeometry(state(true)).collisionBoxes,WORLD.spawn);
  assert.ok(open.some(p=>p.z < -7), '大廳門開後必須能探索電力室');
  assert.ok(open.every(p=>p.x < 5), '生產線門仍關閉');
  assert.ok(reachable(getGeometry(state(true,true)).collisionBoxes,WORLD.spawn).some(p=>p.x > 6), '預留平台有可通行門洞');
  for(const item of ITEMS) {
    const x=(item.minX+item.maxX)/2, y=(item.minY+item.maxY)/2,z=(item.minZ+item.maxZ)/2;
    const candidates=item.id==='lobby.flashlight'?closed:open;
    assert.ok(candidates.some(p=> {
      const yaw=Math.atan2(-(x-p.x),-(z-p.z)); const pitch=Math.atan2(y-1.6, Math.hypot(x-p.x,z-p.z));
      return selectItem({...p,yaw,pitch,paused:false}, {itemIds:[]}, [item], getGeometry(state(item.id!=='lobby.flashlight')).occluderBoxes)?.id===item.id;
    }), `${item.id} 必須可合法瞄準取得`);
  }
});
test('所有正式物品三邊至少 0.25 公尺', async () => {
  const { ITEMS }=await load();
  assert.deepEqual(ITEMS.map(i=>i.kind).sort(),['battery','battery','flashlight','fuse','keycard','map']);
  for(const item of ITEMS) for(const axis of ['X','Y','Z']) assert.ok(item[`max${axis}`]-item[`min${axis}`]>=0.25,item.id);
});
test('關門同時遮擋撿取與紫外光，開門後三者同步解除', async () => {
  const { WORLD, getGeometry, isDoorOpen }=await load();
  const door=WORLD.areas[0].doors[0];
  const p=createPlayer({x:0,z:1.2,yaw:0,pitch:0,paused:false});
  const item={id:'probe',...rect(0,1.6,-0.7)};
  const clue={position:{x:0,y:1.6,z:-1},normal:{x:0,y:0,z:1}};
  for(const open of [false,true]) {
    const s=state(open); const g=getGeometry(s);
    assert.equal(isDoorOpen(door,s),open);
    assert.equal(g.collisionBoxes.some(b=>b.id===door.id),!open);
    assert.equal(g.occluderBoxes.some(b=>b.id===door.id),!open);
    assert.equal(selectItem(p,{itemIds:[]},[item],g.occluderBoxes)?.id,open?'probe':undefined);
    assert.equal(isClueVisible(p,{enabled:true,charge:100,mode:'uv'},clue,g.occluderBoxes),open);
    let moved=p; for(let i=0;i<10;i++) moved=updatePlayer(moved,{move:{y:1}},0.1,g.collisionBoxes);
    assert.ok(open?moved.z < -0.5:moved.z >= PLAYER_RADIUS-1e-9);
  }
});
test('正式靜態牆及家具仍會擋住玩家', async () => {
  const { STATIC_BOXES }=await load();
  assert.ok(STATIC_BOXES.some(b=>b.kind==='table')); assert.ok(STATIC_BOXES.filter(b=>b.kind==='wall').length>4);
  for(const box of STATIC_BOXES) for(const side of [-1,1]) {
    const limit=side<0?box.minX-PLAYER_RADIUS:box.maxX+PLAYER_RADIUS;
    let p=createPlayer({x:limit+side*0.05,z:(box.minZ+box.maxZ)/2,paused:false});
    for(let i=0;i<10;i++) p=updatePlayer(p,{move:{x:-side}},0.1,[box]);
    assert.ok(side*(p.x-limit)>=-1e-9,box.id);
  }
});
