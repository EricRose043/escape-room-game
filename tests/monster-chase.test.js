import test from 'node:test';
import assert from 'node:assert/strict';
import * as logic from '../src/logic/index.js';
const area=logic.WORLD.areas.find(a=>a.id==='production'),d=area.monsters[0],id=d.id;
const geometry=()=>logic.getGeometry(logic.createChapter());
const player=(x=18.5,z=-5.5)=>({x,z,yaw:0,pitch:0,paused:false});
const active=(overrides={})=>({...logic.createMonster(d),mode:'patrol',waitRemaining:0,...overrides});
const step=(m,p=player(),dt=0.1,g=geometry(),options={})=>logic.updateMonster(m,d,area,p,dt,g.collisionBoxes,{occluderBoxes:g.occluderBoxes,...options});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function chapter(m=active(),p=player()) {
  const s=logic.createChapter();
  return {...s,player:p,monsters:{[id]:m},inventory:{itemIds:['lobby.employee-card','lobby.flashlight','power.fuse']},
    puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:true}}};
}

test('有效視線立即追逐，追逐會繞過機台', () => {
  const original=active(),snapshot=structuredClone(original),p=player();
  const m=step(original,p);
  assert.equal(m.mode,'chase');assert.deepEqual(m.lastSeen,{x:p.x,z:p.z});
  assert.ok(Math.abs(distance(m,original)-0.23)<1e-8);assert.deepEqual(original,snapshot);
  assert.equal(d.chaseSpeed,2.3);assert.equal(d.searchSpeed,1);assert.equal(d.returnSpeed,1.2);
  let routed=step(active({x:10,z:-6.5,yaw:-Math.PI/2,mode:'chase',lastSeen:{x:18.5,z:-6.5}}),player(18.5,-6.5));
  assert.ok(routed.path.length>2,'不能直接穿機台');
  const boxes=geometry().collisionBoxes;
  for(let i=1;i<routed.path.length;i++) assert.ok(logic.segmentClear(routed.path[i-1],routed.path[i],boxes,0.4,area.bounds));
  for(let i=0;i<70;i++) {
    const before=routed;routed=step(routed,player(18.5,-6.5));
    assert.ok(distance(before,routed)<=0.23+1e-8);
    assert.ok(!boxes.some(b=>logic.circleOverlapsBox(routed.x,routed.z,b,0.4)));
  }
});
test('失去視線後不更新目標，逾時搜尋再返回巡邏', () => {
  let m=step(active()),seen=structuredClone(m.lastSeen);
  // 背後的新位置即使沒有遮擋，也不能更新記憶。
  for(let i=0;i<7;i++) {
    m=step(m,player(18.5,-11.2));
    assert.deepEqual(m.lastSeen,seen);assert.equal(m.mode,'chase');
  }
  m=step(m,player(18.5,-11.2));assert.equal(m.mode,'search');
  assert.equal(d.lostSightSeconds,0.75);assert.equal(d.searchSeconds,4);
  const outside=player(0,-4);let searchTime=0;
  while(m.mode==='search' && searchTime<4.1) {m=step(m,outside);searchTime+=0.1;}
  assert.equal(m.mode,'return');assert.ok(searchTime<=4+1e-8);
  assert.ok(m.searchElapsed<=4);
  for(let i=0;i<200 && m.mode!=='patrol';i++) m=step(m,outside);
  assert.equal(m.mode,'patrol');
  const node=area.navigation.nodes.find(n=>n.id===d.patrol[m.patrolIndex]);
  assert.ok(distance(m,node)<1e-8);
});
test('搜尋與返回途中重新看見玩家會再次追逐', () => {
  for(const mode of ['search','return']) {
    const m=step(active({mode,lastSeen:{x:10,z:-6.5},searchElapsed:1}));
    assert.equal(m.mode,'chase');assert.deepEqual(m.lastSeen,{x:18.5,z:-5.5});
  }
});
test('追逐最多每 0.25 秒重算路徑，仍逐幀更新可見位置', () => {
  let m=active(),lastPlan=-Infinity,time=0,plans=0;
  for(let i=0;i<30;i++) {
    const p=player(18.5+i*0.015,-5.5),before=m;
    m=step(m,p,0.05);time+=0.05;
    assert.equal(m.mode,'chase');assert.deepEqual(m.lastSeen,{x:p.x,z:p.z});
    assert.ok(m.visionRaycasts<=1);
    if(m.pathPlanCount!==before.pathPlanCount) {
      assert.ok(time-lastPlan>=0.25-1e-8);lastPlan=time;plans++;
    }
  }
  assert.ok(plans>=3 && plans<=6);
});
test('接觸只發一次事件且不重疊，離開後可再次接觸', () => {
  let m=active(),events=[];const p=player(18.5,-8);
  for(let i=0;i<80;i++) {m=step(m,p);events.push(...m.events);assert.ok(distance(m,p)>=0.8-1e-8);}
  assert.equal(events.length,1);assert.deepEqual(events[0],{type:'contact',monsterId:id});
  assert.equal(m.contactLatched,true);assert.equal(m.contactCount,1);
  const still=step(m,p);assert.equal(still.events.length,0);assert.equal(distance(still,m),0);
  const away=player(18.5,-6);
  m=step(m,away);assert.equal(m.contactLatched,false);
  for(let i=0;i<80;i++) {m=step(m,away);events.push(...m.events);}
  assert.equal(events.length,2);assert.equal(m.contactCount,2);
  assert.equal(d.contactDistance,0.8);assert.equal(d.contactResetDistance,1);
});
test('玩家不能穿過怪物身體，接觸觸發被抓並保留進度', () => {
  let s=chapter(active(),player(18.5,-9)),events=[];
  const inventory=structuredClone(s.inventory),puzzles=structuredClone(s.puzzles);
  for(let i=0;i<25;i++) {
    s=logic.updateChapter(s,{move:{y:1}},0.1);events.push(...s.events);
    assert.ok(distance(s.player,s.monsters[id])>=logic.PLAYER_RADIUS+d.radius-1e-8);
    assert.equal(s.player.paused,false);
    if(s.events.some(event=>event.type==='contact'||event.type==='detected')) {assert.equal(s.ui.mode,'caught');break;}
    assert.equal(s.ui.mode,'explore');
  }
  assert.equal(events.length,1);assert.deepEqual(s.inventory,inventory);
  assert.equal(s.puzzles['power.main'].restored,puzzles['power.main'].restored);
  for(let i=0;i<Math.ceil(logic.CAPTURE_SECONDS*10);i++) s=logic.updateChapter(s,{},0.1);
  assert.equal(s.ui.mode,'explore');
  assert.equal(s.player.x,6.5);assert.equal(s.player.z,-6.5);assert.equal(s.player.yaw,-Math.PI/2);
  const before=structuredClone(s.player);
  s=logic.updateChapter(s,{},0.1);assert.deepEqual(s.player,before,'怪物不能推動玩家');
  s=logic.updateChapter(s,{move:{y:-1}},0.1);assert.ok(s.player.x<before.x,'仍能自行離開');
});
test('接觸 0.8 m 含邊界，未到 1.0 m 不重置', () => {
  let m=step(active(),player(18.5,-9.5));assert.equal(m.events.length,1);
  m=step(m,player(m.x,m.z+0.99),0.01);assert.equal(m.contactLatched,true);
  m=step(m,player(m.x,m.z+1),0.01);assert.equal(m.contactLatched,false);
});
test('離開活動區及暫停介面不造成透視追逐或計時跳進', () => {
  let m=step(active()),s=chapter(m),snapshot=structuredClone(m);
  for(const actions of [{pausePressed:true},{focusLost:true},{forcePause:true},{gameplayActive:false}]) {
    assert.deepEqual(logic.updateChapter(s,actions,10).monsters[id],snapshot);
  }
  for(const dt of [0,-1,NaN,Infinity]) assert.deepEqual(logic.updateChapter(s,{},dt).monsters[id],snapshot);
  assert.deepEqual(logic.updateChapter(s,{},100).monsters[id],logic.updateChapter(s,{},0.1).monsters[id]);
  const panel={...s,ui:{mode:'keypad',deviceId:'power.keypad',buffer:'',selectedIndex:0,message:''}};
  for(const actions of [{},{keypadCommands:[{type:'cancel'}]}]) assert.deepEqual(logic.updateChapter(panel,actions,10).monsters[id],snapshot);
  m=step(m,player(6.5,-6.5));assert.equal(m.mode,'search');assert.deepEqual(m.lastSeen,snapshot.lastSeen);
  for(let i=0;i<160;i++) {m=step(m,player(6.5,-6.5));assert.ok(m.x>=7.6-1e-8);}
});
test('無路徑先搜尋再返回，全程不穿牆不瞬移', () => {
  const wall={minX:7.2,maxX:21.2,minY:0,maxY:3.5,minZ:-7,maxZ:-6.8};
  const g=geometry();g.collisionBoxes=[...g.collisionBoxes,wall];g.occluderBoxes=[...g.occluderBoxes,wall];
  const origin=active({mode:'chase',lastSeen:{x:18.5,z:-5.5}});
  let m=step(origin,player(0,-4),0.1,g);
  assert.equal(m.mode,'search');assert.equal(distance(m,origin),0);
  for(let i=0;i<41;i++) m=step(m,player(0,-4),0.1,g);
  assert.ok(['return','patrol'].includes(m.mode));assert.ok(!g.collisionBoxes.some(b=>logic.circleOverlapsBox(m.x,m.z,b,0.4)));
});
test('靠牆可見目標仍走向區內安全位置，不越過邊界', () => {
  let m=active({x:20,z:-5.5,yaw:-Math.PI/2}),p=player(20.89,-5.5);
  for(let i=0;i<20;i++) {m=step(m,p);assert.ok(m.x<=area.bounds.maxX-0.4+1e-8);}
  assert.ok(distance(m,p)<=0.8+1e-8);assert.equal(m.contactCount,1);
});
test('搜尋轉向有上限，返回使用 1.2 m/s 且結果可重播', () => {
  let a=active({mode:'search',lastSeen:{x:18.5,z:-10.3},searchElapsed:1}),b=structuredClone(a);
  for(let i=0;i<80;i++) {
    const previous=a;a=step(a,player(0,-4));b=step(b,player(0,-4));assert.deepEqual(a,b);
    assert.ok(Math.abs(logic.angleDelta(a.yaw,previous.yaw))<=Math.PI*0.1+1e-8);
    assert.ok(distance(a,previous)<=0.12+1e-8);
  }
  assert.equal(a.mode,'patrol');assert.ok(a.searchElapsed<=4);
});

