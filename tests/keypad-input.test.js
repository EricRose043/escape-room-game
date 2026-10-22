import test from 'node:test';
import assert from 'node:assert/strict';
import * as logic from '../src/logic/index.js';
const pad=(indices=[],id='Xbox')=>({id,mapping:'standard',index:0,axes:[0,0,0,0],buttons:Array.from({length:17},(_,i)=>({pressed:indices.includes(i)}))});
const atKeypad=s=>({...s,player:{...s.player,x:3,z:-5.2,yaw:-Math.PI/2,pitch:0}});
function ready() {
  let s=logic.createChapter();
  s={...s,player:{...s.player,paused:false,x:3,z:-3,yaw:-Math.PI/2},inventory:{itemIds:['lobby.flashlight','power.fuse']}};
  s=logic.updateChapter(s,{interactPressed:true});
  s=logic.updateChapter(s,{flashlightPressed:true});
  return atKeypad(s);
}
const open=()=>logic.updateChapter(ready(),{interactPressed:true});
const command=(s,c)=>logic.updateChapter(s,{keypadCommands:[c]});

test('鍵鼠與 Xbox／PS 產生相同密碼鎖命令',async()=>{
  for(const value of '0123456789') {
    const expected={type:'digit',value};
    assert.deepEqual(logic.keyboardKeypadCommand({code:`Digit${value}`}),expected);
    assert.deepEqual(logic.keyboardKeypadCommand({code:`Numpad${value}`}),expected);
    assert.deepEqual(logic.keypadButtonCommand(value),expected);
    const index=logic.KEYPAD_KEYS.indexOf(value);
    for(const id of ['Xbox','DualSense']) {
      const raw=logic.gamepadKeypadCommand(logic.readGamepad(pad([0],id)).actions);
      assert.deepEqual(logic.resolveKeypadCommand({...logic.createKeypad('x'),selectedIndex:index},raw),expected);
    }
  }
  for(const [code,key] of [['Backspace','delete'],['Enter','submit'],['Escape','cancel']]) {
    assert.deepEqual(logic.keyboardKeypadCommand({code}),logic.keypadButtonCommand(key));
  }
  const {createKeypadView}=await import('../src/game/keypad-view.js');
  const emitted=[];
  const element=(key)=>({dataset:{key},hidden:true,textContent:'',disabled:false,
    classList:{toggle(){}},setAttribute(){},addEventListener(type,fn){this[type]=fn;},focus(){this.focused=true;}});
  const buttons=logic.KEYPAD_KEYS.map(element),back=element('cancel'),buffer=element(),message=element(),hint=element();
  const root={hidden:true,querySelectorAll:()=>buttons,querySelector:selector=>({'#keypad-back':back,'#keypad-buffer':buffer,'#keypad-message':message,'#keypad-hint':hint}[selector])};
  const view=createKeypadView(root,c=>emitted.push(c));
  view.sync(logic.createKeypad('power.keypad'),false,'ps');
  for(const button of buttons) button.click({preventDefault(){}});
  back.click({preventDefault(){}});
  assert.deepEqual(emitted,[...logic.KEYPAD_KEYS.map(logic.keypadButtonCommand),{type:'cancel'}]);
  assert.equal(root.hidden,false); assert.equal(buttons[0].focused,true);
  assert.match(hint.textContent,/✕/);
  view.sync(logic.createKeypad('power.keypad'),true,'ps'); assert.equal(root.hidden,true);
  buttons[0].click({preventDefault(){}}); assert.equal(emitted.length,13);
});
test('長按不重複，開關介面當幀不洩漏操作',()=>{
  for(const code of ['Digit1','Numpad0','Enter','Backspace','Escape']) assert.equal(logic.keyboardKeypadCommand({code,repeat:true}),null);
  for(const index of [0,1,12,13,14,15]) {
    const first=logic.readGamepad(pad([index]));
    assert.ok(logic.gamepadKeypadCommand(first.actions));
    assert.equal(logic.gamepadKeypadCommand(logic.readGamepad(pad([index]),first.buttons).actions),null);
    const release=logic.readGamepad(pad(),first.buttons);
    assert.ok(logic.gamepadKeypadCommand(logic.readGamepad(pad([index]),release.buttons).actions));
  }
  const s=ready();
  const opened=logic.updateChapter(s,{interactPressed:true,confirmPressed:true,keypadCommands:[{type:'digit',value:'9'}],move:{y:1},look:{dYaw:0.1},flashlightPressed:true},10);
  assert.equal(opened.ui.mode,'keypad'); assert.equal(opened.ui.buffer,'');
  assert.deepEqual(opened.player,s.player); assert.deepEqual(opened.flashlight,s.flashlight);
  const closed=logic.updateChapter(opened,{interactPressed:true,keypadCommands:[{type:'cancel'},{type:'digit',value:'1'}],move:{y:1}},10);
  assert.equal(closed.ui.mode,'explore'); assert.deepEqual(closed.player,s.player);
  assert.equal(logic.updateChapter(closed,{}).ui.mode,'explore');
});
test('密碼鎖開啟時移動轉頭互動及耗電停止',()=>{
  const s=open();
  assert.equal(s.ui.mode,'keypad');
  const next=logic.updateChapter(s,{move:{x:1,y:1},look:{dYaw:1,dPitch:1,yawRate:1},interactPressed:true,flashlightPressed:true,uvPressed:true},100);
  assert.deepEqual(next,s);
});
test('返回後正常探索，取消不誤觸暫停或場景互動',()=>{
  const s=open();
  const cancel=logic.keyboardKeypadCommand({code:'Escape'});
  const closed=logic.updateChapter(s,{keypadCommands:[cancel],interactPressed:true},1);
  assert.equal(closed.ui.mode,'explore'); assert.equal(closed.player.paused,false);
  const moved=logic.updateChapter(closed,{move:{y:1}},0.1);
  assert.ok(moved.player.x>closed.player.x);
  assert.ok(moved.flashlight.charge<closed.flashlight.charge);
  const reopened=logic.updateChapter(closed,{interactPressed:true});
  assert.equal(reopened.ui.buffer,'');
  for(const id of ['Xbox','DualSense']) {
    const input=logic.mergeActions({},logic.readGamepad(pad([1],id)).actions);
    assert.equal(logic.updateChapter(s,input).ui.mode,'explore');
  }
});
test('失焦拔除與 Start／Options 暫停不提交密碼',()=>{
  let s=open();
  s=command(s,{type:'digit',value:'1'});
  for(const extra of [{focusLost:true},{forcePause:true},{pausePressed:true}]) {
    const paused=logic.updateChapter(s,{...extra,keypadCommands:[{type:'submit'}]},10);
    assert.equal(paused.ui.buffer,'1'); assert.equal(paused.ui.mode,'keypad');
    assert.equal(paused.puzzles['power.main'].restored,false);
    assert.deepEqual(paused.flashlight,s.flashlight);
  }
  for(const id of ['Xbox','DualSense']) {
    const before={hasStarted:true,paused:false};
    const raw=logic.mergeActions({},logic.readGamepad(pad([9,0],id)).actions);
    const after=logic.updateSession(before,raw);
    const filtered=logic.gameplayActions(raw,before,after);
    assert.equal(after.paused,true); assert.deepEqual(filtered.keypadCommands,[]);
    const resumed=logic.gameplayActions(raw,after,logic.updateSession(after,raw));
    assert.deepEqual(resumed.keypadCommands,[]);
    assert.equal(logic.updateChapter(s,filtered).ui.buffer,'1');
  }
});
