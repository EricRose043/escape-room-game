import test from 'node:test';
import assert from 'node:assert/strict';
import * as logic from '../src/logic/index.js';
const area=()=>logic.WORLD.areas.find(a=>a.id==='production');
const def=()=>area().monsters[0];
const monster=s=>s.monsters[def().id];
function inside() {
  let s=logic.createChapter();
  s={...s,player:{...s.player,x:8.2,z:-6.5,paused:false}};
  return logic.updateChapter(s,{},0.1);
}
const deltaYaw=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));

test('首次進入生產線才啟動怪物，離區不重置且活動限區內', () => {
  assert.ok(area());
  let s=logic.createChapter(); assert.equal(monster(s).mode,'inactive');
  const original=structuredClone(s);
  s={...s,player:{...s.player,paused:false,x:6.5,z:-6.5}};
  s=logic.updateChapter(s,{},0.1); assert.equal(monster(s).mode,'inactive');
  assert.equal(monster(original).mode,'inactive','更新不可污染舊狀態');
  s={...s,player:{...s.player,x:8.2}};
  s=logic.updateChapter(s,{},0.1); assert.equal(monster(s).mode,'patrol');
  const initial=monster(s);
  s={...s,player:{...s.player,x:6.5}};
  for(let i=0;i<80;i++) s=logic.updateChapter(s,{},0.1);
  assert.equal(monster(s).mode,'patrol'); assert.notEqual(monster(s).z,initial.z);
  assert.ok(monster(s).x>=area().bounds.minX+0.4);
});
test('巡邏按 B C D A B 固定順序完成兩圈並每點停一秒', () => {
  assert.ok(area());
  let s=inside(),visited=[],lastWait=monster(s).waitRemaining;
  assert.deepEqual(def().patrol,['production.nav.B','production.nav.C','production.nav.D','production.nav.A']);
  assert.equal(def().patrolSpeed,1); assert.equal(def().dwellSeconds,1); assert.equal(def().turnSpeed,Math.PI);
  let elapsed=0,arrivals=[];
  for(let i=0;i<850;i++) {
    const previous=monster(s); s=logic.updateChapter(s,{},0.1); elapsed+=0.1;
    const m=monster(s);
    assert.ok(Math.hypot(m.x-previous.x,m.z-previous.z)<=0.1+1e-8);
    assert.ok(Math.abs(deltaYaw(m.yaw,previous.yaw))<=Math.PI*0.1+1e-8);
    assert.ok(m.x>=7.6 && m.x<=20.8 && m.z>=-12.1 && m.z<=-0.9);
    assert.ok(!logic.getGeometry(s).collisionBoxes.some(b=>logic.circleOverlapsBox(m.x,m.z,b,0.4)));
    if(previous.waitRemaining>0) {
      // 停留尚未用完的幀，位置與朝向均保持。
      if(previous.waitRemaining>=0.1-1e-8) {
        assert.ok(Math.hypot(m.x-previous.x,m.z-previous.z)<1e-8);
        assert.ok(Math.abs(deltaYaw(m.yaw,previous.yaw))<1e-8);
      }
    }
    if(m.waitRemaining>lastWait+0.5) {
      const node=area().navigation.nodes.find(n=>Math.hypot(n.x-m.x,n.z-m.z)<1e-8);
      assert.ok(node); visited.push(node.id); arrivals.push(elapsed);
      assert.ok(m.waitRemaining<=1 && m.waitRemaining>=0.9-1e-8);
    }
    lastWait=m.waitRemaining;
  }
  assert.deepEqual(visited.slice(0,8),[...def().patrol.slice(1),def().patrol[0],...def().patrol.slice(1),def().patrol[0]]);
  assert.ok(Math.abs(arrivals[7]-arrivals[3]-39.6)<0.5,'完整一圈約 40 秒');
});
test('暫停失焦開始繼續及密碼鎖開關提交當幀，怪物與計時全停', () => {
  assert.ok(area());
  let s=inside(); for(let i=0;i<30;i++) s=logic.updateChapter(s,{},0.1);
  const before=structuredClone(monster(s));
  for(const actions of [{pausePressed:true},{focusLost:true},{forcePause:true},{gameplayActive:false}]) {
    assert.deepEqual(monster(logic.updateChapter(s,actions,10)),before);
  }
  const paused={...s,player:{...s.player,paused:true}};
  assert.deepEqual(monster(logic.updateChapter(paused,{},10)),before);
  const panel={...s,player:{...s.player,x:3,z:-5.2,yaw:-Math.PI/2,pitch:-0.133},
    puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:false}}};
  const opened=logic.updateChapter(panel,{interactPressed:true},0.1);
  assert.equal(opened.ui.mode,'keypad'); assert.deepEqual(monster(opened),before);
  for(const actions of [{},{keypadCommands:[{type:'cancel'}]},
    {keypadCommands:[...['4','7','2','6'].map(value=>({type:'digit',value})),{type:'submit'}]}]) {
    assert.deepEqual(monster(logic.updateChapter(opened,actions,10)),before);
  }
});
test('巡邏不讀真實時間或亂數，無效 dt 不推進且長幀上限 0.1 秒', () => {
  assert.ok(area());
  const s=inside(),snapshot=structuredClone(s);
  for(const dt of [0,-1,Infinity,NaN]) assert.deepEqual(monster(logic.updateChapter(s,{},dt)),monster(s));
  assert.deepEqual(monster(logic.updateChapter(s,{},100)),monster(logic.updateChapter(s,{},0.1)));
  let a=s,b=structuredClone(s);
  for(let i=0;i<150;i++) { a=logic.updateChapter(a,{},0.1); b=logic.updateChapter(b,{},0.1); }
  assert.deepEqual(a,b); assert.deepEqual(s,snapshot);
});
test('巡邏必要路徑受阻時停止，不穿牆或瞬移', async () => {
  const {createMonster,updateMonster}=await import('../src/logic/monster.js');
  const p=area(),d=def(),player={x:8.2,z:-6.5};
  let m=createMonster(d);
  const wall={minX:7.2,maxX:21.2,minY:0,maxY:3.5,minZ:-7,maxZ:-6.8};
  const boxes=[...logic.getGeometry(logic.createChapter()).collisionBoxes,wall];
  const origin=structuredClone(m);
  for(let i=0;i<200;i++) m=updateMonster(m,d,p,player,0.1,boxes);
  assert.equal(m.x,origin.x); assert.equal(m.z,origin.z); assert.equal(m.navigationBlocked,true);
});
