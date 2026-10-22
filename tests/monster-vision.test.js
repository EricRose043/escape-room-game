import test from 'node:test';
import assert from 'node:assert/strict';
import * as logic from '../src/logic/index.js';
const load=()=>import('../src/logic/monster-vision.js');
const area=logic.WORLD.areas.find(a=>a.id==='production'),definition=area.monsters[0];
const player=(x,z)=>({x,z,paused:false});
const monster=(x=14.2,z=-10.3,yaw=Math.PI)=>({...logic.createMonster(definition),x,z,yaw,mode:'patrol'});
const block=(minX,maxX,minZ,maxZ,minY=0,maxY=2.2)=>({minX,maxX,minY,maxY,minZ,maxZ});

test('距離與視角邊界可發現，超界及背後不能新發現', async () => {
  const {monsterVision}=await load();
  assert.deepEqual(definition.vision,{distance:8,halfAngle:Math.PI/3,eyeHeight:1.5});
  const m=monster(),horizontal=Math.sqrt(8**2-0.1**2);
  for(const angle of [0,Math.PI/3,-Math.PI/3]) {
    const p=player(m.x+Math.sin(angle)*horizontal,m.z+Math.cos(angle)*horizontal);
    assert.equal(monsterVision(m,definition,area,p,[]).visible,true,`角度 ${angle}`);
  }
  for(const p of [player(m.x,m.z+8.001),player(m.x+Math.sin(Math.PI/3+0.001)*4,m.z+Math.cos(Math.PI/3+0.001)*4),player(m.x,m.z-1)]) {
    const result=monsterVision(m,definition,area,p,[]);
    assert.equal(result.visible,false);assert.equal(result.raycasts,0);
  }
});
test('牆機台櫃體與關門遮擋視線，後方障礙物不誤擋', async () => {
  const {monsterVision}=await load();
  const m=monster(10,-10.3,-Math.PI/2),p=player(14.2,-10.3);
  for(const kind of ['wall','machine','locker','door']) {
    assert.equal(monsterVision(m,definition,area,p,[{...block(12,12.2,-11,-9),kind}]).visible,false,kind);
  }
  assert.equal(monsterVision(m,definition,area,p,[block(15,15.2,-11,-9)]).visible,true);
  assert.equal(monsterVision(m,definition,area,p,[block(14.2,14.3,-11,-9)]).visible,false,'同距離也遮擋');
  assert.equal(monsterVision(m,definition,area,p,[block(12,12.2,-11,-9,0,1.4)]).visible,true,'低於眼睛的設備不誤擋');
  const geometry=logic.getGeometry(logic.createChapter());
  assert.equal(monsterVision(monster(10,-5.5,-Math.PI/2),definition,area,player(14.2,-8.5),geometry.occluderBoxes).visible,false,'正式機台 A');
  assert.equal(monsterVision(monster(18.5,-10.3,0),definition,area,player(19.5,-12.3),geometry.occluderBoxes).visible,false,'正式櫃體 L2');
});
test('手電筒開關與模式不改變怪物發現規則', async () => {
  const {monsterVision}=await load();
  const m=monster(18.5,-10.3),p=player(18.5,-5.5);
  for(const enabled of [false,true]) for(const mode of ['normal','uv']) for(const charge of [0,100]) {
    assert.equal(monsterVision(m,definition,area,{...p,flashlight:{enabled,mode,charge}},[]).visible,true);
  }
});
test('每次有效視覺判斷最多一條射線，未啟動躲藏或離區時不射線', async () => {
  const {monsterVision}=await load();
  const m=monster(18.5,-10.3),p=player(18.5,-5.5);
  assert.equal(monsterVision(m,definition,area,p,[]).raycasts,1);
  assert.equal(monsterVision({...m,mode:'inactive'},definition,area,p,[]).raycasts,0);
  assert.equal(monsterVision(m,definition,area,p,[],{hidden:true}).raycasts,0);
  assert.equal(monsterVision(m,definition,area,player(6.5,-6.5),[]).raycasts,0);
  assert.equal(monsterVision(m,definition,area,{...p,paused:true},[]).raycasts,0);
});
test('怪物在生產線內看不到電力室內的玩家', async () => {
  const {monsterVision}=await load();
  const s=logic.createChapter(),p=player(0,-4),boxes=logic.getGeometry(s).occluderBoxes;
  for(const [x,z] of [[7.6,-4],[8.2,-6.5],[10,-10.3],[18.5,-10.3],[18.5,-2],[10,-2]]) {
    for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]) assert.equal(monsterVision(monster(x,z,yaw),definition,area,p,boxes).visible,false);
  }
  // 最靠近且朝西時，距離本來在 8 m 內，仍隔著正式西牆。
  const dx=-7.6,dy=0.1,length=Math.hypot(dx,dy);
  const ray={origin:{x:7.6,y:1.5,z:-4},direction:{x:dx/length,y:dy/length,z:0}};
  assert.ok(length<8);
  assert.ok(boxes.some(b=>b.id==='production.west-south' && logic.rayBoxDistance(ray,b)<length));
});
