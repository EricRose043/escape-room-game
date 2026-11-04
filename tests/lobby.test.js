import test from 'node:test';
import assert from 'node:assert/strict';
const load=()=>import('../src/logic/chapter.js');
const playing=(s)=>({...s,player:{...s.player,paused:false}});
function aim(s,x,y,z,updateChapter){return updateChapter(s,{look:{dYaw:Math.atan2(s.player.x-x,s.player.z-z)-s.player.yaw,dPitch:Math.atan2(y-1.6,Math.hypot(x-s.player.x,z-s.player.z))-s.player.pitch}});}
function walk(s,x,z,updateChapter){
  s=aim(s,x,1.6,z,updateChapter);
  for(let i=0;i<200;i++){
    const distance=Math.hypot(x-s.player.x,z-s.player.z);if(distance<1e-7)return s;
    const next=updateChapter(s,{move:{y:1}},Math.min(.1,distance/2.5));
    assert.ok(Math.hypot(next.player.x-s.player.x,next.player.z-s.player.z)>1e-9,`繞桌路線受阻 ${s.player.x},${s.player.z} → ${x},${z}`);s=next;
  }
  assert.fail('辦公室繞桌路線超時');
}

test('開場未持有手電筒，開關及模式輸入不生效',async()=>{
  const {createChapter,updateChapter,hasFlashlight}=await load();
  const initial=playing(createChapter());
  assert.equal(hasFlashlight(initial),false);
  assert.deepEqual(initial.inventory.itemIds,[]);
  assert.equal(initial.player.z,6.6);
  const next=updateChapter(initial,{flashlightPressed:true,uvPressed:true},1);
  assert.deepEqual(next.flashlight,{charge:100,enabled:false,mode:'normal'});
  assert.deepEqual(initial.inventory.itemIds,[]);
});
test('未取得員工卡時辦公室門阻擋玩家',async()=>{
  const {createChapter,updateChapter}=await load();
  let s=playing(createChapter());
  for(const [x,z] of [[1.5,6.6],[1.5,1],[0,1]])s=walk(s,x,z,updateChapter);
  s=aim(s,0,1.6,-1,updateChapter);
  for(let i=0;i<50;i++) s=updateChapter(s,{move:{y:1}},0.1);
  assert.ok(s.player.z>=0.3-1e-9);
  assert.ok(s.player.z<1);
});
test('員工卡解鎖控制室；手電筒仍可正常取得與使用',async()=>{
  const {createChapter,updateChapter,hasFlashlight}=await load();
  let s=playing(createChapter());
  for(const [x,z] of [[1.5,6.6],[1.5,4.95]])s=walk(s,x,z,updateChapter);
  s=aim(s,.5,1.05,4.95,updateChapter);
  s=updateChapter(s,{interactPressed:true},0);
  assert.deepEqual(s.inventory.itemIds,['lobby.employee-card']);
  assert.equal((await import('../src/logic/world.js')).isDoorOpen((await import('../src/logic/world.js')).DOORS[0],s),true);
  for(const [x,z] of [[1.5,6.6],[-1.5,6.6],[-1.5,5.5]])s=walk(s,x,z,updateChapter);
  s=aim(s,-1.5,1.1,4.2,updateChapter);
  s=updateChapter(s,{interactPressed:true},0);
  assert.equal(hasFlashlight(s),true);
  assert.deepEqual(s.inventory.itemIds,['lobby.employee-card','lobby.flashlight']);
  s=updateChapter(s,{interactPressed:true},0);
  assert.deepEqual(s.inventory.itemIds,['lobby.employee-card','lobby.flashlight']);
  s=updateChapter(s,{flashlightPressed:true},0); assert.equal(s.flashlight.enabled,true);
  for(const [x,z] of [[-1.5,6.6],[1.5,6.6],[1.5,1],[0,1]])s=walk(s,x,z,updateChapter);
  s=aim(s,0,1.6,-1,updateChapter);
  for(let i=0;i<10;i++)s=updateChapter(s,{move:{y:1}},0.1);
  assert.ok(s.player.z < -1);
});

