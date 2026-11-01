import test from 'node:test';
import assert from 'node:assert/strict';
const load=()=>import('../src/logic/chapter.js');
const playing=(s)=>({...s,player:{...s.player,paused:false}});

test('開場未持有手電筒，開關及模式輸入不生效',async()=>{
  const {createChapter,updateChapter,hasFlashlight}=await load();
  const initial=playing(createChapter());
  assert.equal(hasFlashlight(initial),false);
  assert.deepEqual(initial.inventory.itemIds,[]);
  assert.equal(initial.player.z,6);
  const next=updateChapter(initial,{flashlightPressed:true,uvPressed:true},1);
  assert.deepEqual(next.flashlight,{charge:100,enabled:false,mode:'normal'});
  assert.deepEqual(initial.inventory.itemIds,[]);
});
test('未取得員工卡時辦公室門阻擋玩家',async()=>{
  const {createChapter,updateChapter}=await load();
  let s=playing(createChapter());
  for(let i=0;i<50;i++) s=updateChapter(s,{move:{y:1}},0.1);
  assert.ok(s.player.z>=0.3-1e-9);
  assert.ok(s.player.z<1);
});
test('員工卡解鎖控制室；手電筒仍可正常取得與使用',async()=>{
  const {createChapter,updateChapter,hasFlashlight}=await load();
  let s=playing(createChapter());
  s={...s,player:{...s.player,x:0.5,z:4.95,pitch:-1.3}};
  s=updateChapter(s,{interactPressed:true},0);
  assert.deepEqual(s.inventory.itemIds,['lobby.employee-card']);
  assert.equal((await import('../src/logic/world.js')).isDoorOpen((await import('../src/logic/world.js')).DOORS[0],s),true);
  s=playing(s);
  s={...s,player:{...s.player,x:-1.5,z:5.5,pitch:Math.atan2(-0.5,1.3)}};
  s=updateChapter(s,{interactPressed:true},0);
  assert.equal(hasFlashlight(s),true);
  assert.deepEqual(s.inventory.itemIds,['lobby.employee-card','lobby.flashlight']);
  s=updateChapter(s,{interactPressed:true},0);
  assert.deepEqual(s.inventory.itemIds,['lobby.employee-card','lobby.flashlight']);
  s=updateChapter(s,{flashlightPressed:true},0); assert.equal(s.flashlight.enabled,true);
  s={...s,player:{...s.player,x:0,z:1,pitch:0}};
  for(let i=0;i<10;i++)s=updateChapter(s,{move:{y:1}},0.1);
  assert.ok(s.player.z < -1);
});

