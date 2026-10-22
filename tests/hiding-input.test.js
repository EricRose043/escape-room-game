import test from 'node:test';
import assert from 'node:assert/strict';
import * as logic from '../src/logic/index.js';
const pad=(indices=[],id='Xbox')=>({id,mapping:'standard',index:0,axes:[0,0,0,0],buttons:Array.from({length:17},(_,i)=>({pressed:indices.includes(i)}))});
function front() {
  const s=logic.createChapter();
  return {...s,player:{...s.player,x:8.5,z:-1.2,yaw:0,pitch:0,paused:false},
    inventory:{itemIds:['lobby.flashlight']},flashlight:{charge:80,enabled:true,mode:'normal'}};
}

test('鍵鼠Xbox與PS進出等效，長按及切換當幀不洩漏操作',()=>{
  const s=front();
  const key=()=>logic.mergeActions({interactPressed:logic.keyboardInteractPressed({code:'KeyE'})});
  const entered=logic.updateChapter(s,key(),0.1);assert.equal(entered.ui.mode,'hiding');
  const repeat=logic.mergeActions({interactPressed:logic.keyboardInteractPressed({code:'KeyE',repeat:true})});
  assert.equal(logic.updateChapter(entered,repeat,0.1).ui.mode,'hiding');
  assert.equal(logic.updateChapter(entered,key(),0.1).ui.mode,'explore');
  for(const id of ['Xbox','DualSense']) {
    const first=logic.readGamepad(pad([0,4,5],id));
    const input=logic.mergeActions({move:{y:1},look:{dYaw:1,dPitch:1}},first.actions);
    input.keypadCommands.push({type:'digit',value:'9'});
    const inside=logic.updateChapter(s,input,10);
    assert.equal(inside.ui.mode,'hiding');assert.equal(inside.player.x,8.5);assert.equal(inside.player.z,-2.6);
    assert.equal(inside.player.yaw,Math.PI);assert.equal(inside.player.pitch,0);
    assert.equal(inside.flashlight.charge,80);assert.equal(inside.flashlight.mode,'normal');assert.equal(inside.flashlight.enabled,false);
    let held=inside;
    for(let i=0;i<10;i++) held=logic.updateChapter(held,logic.mergeActions({},logic.readGamepad(pad([0,4,5],id),first.buttons).actions),0.1);
    assert.equal(held.ui.mode,'hiding');
    const release=logic.readGamepad(pad([],id),first.buttons);
    const pressed=logic.readGamepad(pad([0,4,5],id),release.buttons);
    const out=logic.updateChapter(held,logic.mergeActions({move:{y:1},look:{dYaw:2}},pressed.actions),10);
    assert.equal(out.ui.mode,'explore');assert.equal(out.player.x,8.5);assert.equal(out.player.z,-1.2);
    assert.equal(out.player.yaw,held.player.yaw);assert.deepEqual(out.flashlight,held.flashlight);
    assert.equal(logic.updateChapter(out,logic.mergeActions({},logic.readGamepad(pad([0],id),pressed.buttons).actions),0.1).ui.mode,'explore');
  }
});

test('躲藏暫停失焦拔除及密碼鎖流程互不干擾',()=>{
  const s=logic.updateChapter(front(),{interactPressed:true},0.1);assert.equal(s.ui.mode,'hiding');
  for(const interruption of [{pausePressed:true},{focusLost:true},{forcePause:true}]) {
    const paused=logic.updateChapter(s,{...interruption,interactPressed:true,flashlightPressed:true,look:{dYaw:2}},10);
    assert.equal(paused.player.paused,true);assert.deepEqual(paused.ui,s.ui);assert.deepEqual(paused.monsters,s.monsters);
    assert.deepEqual(logic.updateChapter(paused,{interactPressed:true},10),paused);
    const resumed={...paused,player:logic.setPaused(paused.player,false)};
    const before={hasStarted:true,paused:true},after={hasStarted:true,paused:false};
    const filtered=logic.gameplayActions({interactPressed:true,flashlightPressed:true},before,after);
    assert.deepEqual(logic.updateChapter(resumed,filtered,10),resumed);
    assert.equal(logic.updateChapter(resumed,{interactPressed:true},0.1).ui.mode,'explore');
  }
  for(const id of ['Xbox','DualSense']) {
    const device=logic.classifyGamepad(id),prompt=logic.updatePrompt(logic.createPrompt(),{device,gamepadIndex:0},1000);
    assert.equal(logic.pauseOnDisconnect(prompt,0),true);
    const paused=logic.updateChapter(s,{forcePause:logic.pauseOnDisconnect(prompt,0),interactPressed:true},1);
    assert.equal(paused.ui.mode,'hiding');assert.equal(paused.player.paused,true);
    const actions=logic.mergeActions({},logic.readGamepad(pad([0,9],id)).actions);
    const before={hasStarted:true,paused:false},after=logic.updateSession(before,actions);
    assert.equal(logic.updateChapter(s,logic.gameplayActions(actions,before,after),1).ui.mode,'hiding');
  }
  const panel={...front(),ui:logic.createKeypad('power.keypad')};
  const frozen=logic.updateChapter(panel,{interactPressed:true,flashlightPressed:true,move:{y:1}},1);
  assert.deepEqual(frozen,panel);
  const cancelled=logic.updateChapter(panel,{interactPressed:true,keypadCommands:[{type:'cancel'}]},1);
  assert.equal(cancelled.ui.mode,'explore');assert.deepEqual(cancelled.player,panel.player);
  assert.equal(logic.updateChapter(cancelled,{interactPressed:true},0.1).ui.mode,'hiding');
  const hidden=logic.updateChapter(s,{keypadCommands:[{type:'cancel'},{type:'submit'}]},0.1);
  assert.equal(hidden.ui.mode,'hiding');
});
