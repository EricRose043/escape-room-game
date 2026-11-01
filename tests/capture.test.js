import test from 'node:test';
import assert from 'node:assert/strict';
import * as logic from '../src/logic/index.js';

const definition=logic.MONSTERS[0],id=definition.id;
function ready(options) {
  const s=logic.createChapter(options);
  return {...s,player:{...s.player,x:18.5,z:-9.5,paused:false},
    inventory:{itemIds:['lobby.employee-card','lobby.flashlight','power.fuse']},
    puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:true,restoreElapsed:0.2}},
    monsters:{[id]:{...logic.createMonster(definition),mode:'patrol'}}};
}

test('本幀接觸只啟動一次被抓流程，舊事件不重播',()=>{
  const s=ready(),snapshot=structuredClone(s);
  let caught=logic.updateChapter(s,{},0.1);
  assert.equal(caught.ui.mode,'caught');assert.equal(caught.ui.elapsed,0);
  assert.deepEqual(caught.events,[{type:'contact',monsterId:id}]);
  assert.equal(caught.player.paused,false);assert.deepEqual(s,snapshot);
  const firstMonster=structuredClone(caught.monsters);
  caught=logic.updateChapter(caught,{},0.1);
  assert.equal(caught.ui.elapsed,0.1);assert.deepEqual(caught.monsters,firstMonster);
  assert.deepEqual(caught.events,[]);
  const stale={...ready(),events:[{type:'contact',monsterId:id}]};
  stale.monsters[id].events=[{type:'contact',monsterId:id}];
  assert.equal(logic.updateChapter(stale,{},0).ui.mode,'explore','dt=0 的舊事件不能觸發');
  const paused={...stale,player:{...stale.player,paused:true}};
  assert.equal(logic.updateChapter(paused,{},1).ui.mode,'explore');
});

test('開關兩種流程均先黑畫面，只有開啟分支顯示近景',()=>{
  assert.equal(logic.CAPTURE_SECONDS,1.2);
  for(const jumpScare of [false,true,undefined,1,'true']) {
    let ui=logic.createCapture({jumpScare});
    const show=()=>logic.capturePresentation(ui,{jumpScare});
    assert.equal(show().blackout,true);assert.equal(show().closeup,false);
    ui=logic.updateCapture(ui,0.1,{jumpScare});
    assert.equal(show().closeup,false);
    ui=logic.updateCapture(ui,0.05,{jumpScare});
    assert.equal(show().closeup,jumpScare===true);
    const firstScale=show().scale;
    ui=logic.updateCapture(ui,0.1,{jumpScare});
    if(jumpScare===true) assert.ok(show().scale>firstScale,'只放大，不閃爍');
    for(let i=0;i<3;i++) ui=logic.updateCapture(ui,0.1,{jumpScare});
    assert.equal(show().closeup,false);assert.equal(show().blackout,true);
  }
  const defaultCaught=logic.updateChapter(ready(),{},0.1);
  assert.equal(defaultCaught.ui.jumpScareAllowed,false);
  assert.equal(logic.updateChapter(ready({jumpScare:true}),{},0.1).ui.jumpScareAllowed,true);
  assert.equal(logic.updateChapter(ready({jumpScare:true}),{},0.1,{jumpScare:false}).ui.jumpScareAllowed,false);
});

test('被抓滿指定模擬時間回復最近存檔點',()=>{
  for(const jumpScare of [false,true]) {
    const options={jumpScare};let s=logic.updateChapter(ready(options),{},0.1,options);
    assert.equal(s.ui.mode,'caught');
    for(const dt of [0,-1,NaN,Infinity]) assert.deepEqual(logic.updateChapter(s,{},dt,options),s);
    assert.equal(logic.updateChapter(s,{},100,options).ui.elapsed,0.1,'單幀最多 0.1 秒');
    for(let i=0;i<11;i++) s=logic.updateChapter(s,{},0.1,options);
    assert.equal(s.ui.mode,'caught');
    const progress=structuredClone(s);
    s=logic.updateChapter(s,{move:{y:1},look:{dYaw:2},interactPressed:true,flashlightPressed:true,
      uvPressed:true,keypadCommands:[{type:'submit'}]},0.1,options);
    assert.equal(s.ui.mode,'explore');assert.equal(s.player.x,6.5);assert.equal(s.player.z,-6.5);
    assert.equal(s.player.yaw,-Math.PI/2);assert.equal(s.player.pitch,0);assert.equal(s.player.paused,false);
    assert.deepEqual(s.events,[]);assert.deepEqual(s.inventory,progress.inventory);
    assert.equal(s.flashlight.charge,progress.flashlight.charge);assert.equal(s.flashlight.enabled,false);
    assert.equal(logic.powerProgress(s,'power.main'),1);
    assert.deepEqual(s.monsters[id],{...logic.createMonster(definition),mode:'patrol'},'回復當幀不再跑 AI');
  }
});

test('回復清除接觸遲滯，重新進區可再次被抓',()=>{
  let s=logic.updateChapter(ready(),{},0.1);assert.equal(s.ui.mode,'caught');
  for(let i=0;i<12;i++) s=logic.updateChapter(s,{},0.1);
  assert.equal(s.ui.mode,'explore');assert.equal(s.monsters[id].contactLatched,false);
  s={...s,player:{...s.player,x:8.2,z:-6.5}};
  let chased=false;
  for(let i=0;i<600 && s.ui.mode!=='caught';i++) {
    s=logic.updateChapter(s,{},0.1);chased ||= s.monsters[id].mode==='chase';
  }
  assert.ok(chased);assert.equal(s.ui.mode,'caught');assert.equal(s.ui.elapsed,0);
  assert.equal(s.monsters[id].contactCount,1);
});

