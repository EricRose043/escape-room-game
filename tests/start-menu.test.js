import test from 'node:test';
import assert from 'node:assert/strict';
import * as logic from '../src/logic/index.js';

test('鍵鼠Xbox與PS可繼續重新開始及取消，長按不重複確認',async()=>{
  const valid={status:'valid',data:logic.createChapterSave(logic.createChapter())};
  let menu=logic.createStartMenu(valid);assert.equal(menu.selected,'continue');
  assert.equal(logic.updateStartMenu(menu,{type:'activate'}).effect,'continue');
  for(const name of ['Xbox','DualSense']) {
    const pad=indices=>({id:name,index:0,mapping:'standard',axes:[0,0,0,0],
      buttons:Array.from({length:17},(_,i)=>({pressed:indices.includes(i)}))});
    const first=logic.readGamepad(pad([0]));
    assert.deepEqual(logic.startMenuGamepadCommand(first.actions),{type:'activate'});
    assert.equal(logic.startMenuGamepadCommand(logic.readGamepad(pad([0]),first.buttons).actions),null);
    menu=logic.createStartMenu(valid);
    menu=logic.updateStartMenu(menu,logic.startMenuGamepadCommand(logic.readGamepad(pad([13])).actions));
    assert.equal(menu.selected,'new');menu=logic.updateStartMenu(menu,{type:'activate'});
    assert.equal(menu.mode,'confirm');assert.equal(menu.selected,'cancel');assert.equal(menu.effect,null);
    assert.equal(logic.updateStartMenu(menu,{type:'cancel'}).mode,'menu');
    menu=logic.updateStartMenu(menu,{type:'move',direction:'right'});
    assert.equal(logic.updateStartMenu(menu,{type:'activate'}).effect,'new');
  }
  assert.equal(logic.keyboardStartMenuCommand({code:'Enter',repeat:true}),null);
  assert.deepEqual(logic.keyboardStartMenuCommand({code:'ArrowDown'}),{type:'move',direction:'down'});
  assert.deepEqual(logic.keyboardStartMenuCommand({code:'Escape'}),{type:'cancel'});
  for(const status of ['invalid','unavailable','empty']) {
    const bad=logic.createStartMenu({status,reason:'無法載入'});
    assert.equal(bad.selected,'new');assert.equal(bad.canContinue,false);
    assert.equal(logic.updateStartMenu(bad,{type:'continue'}).effect,null);
  }
  const {createStartMenuView}=await import('../src/game/start-menu-view.js');
  const elements=new Map();
  const get=key=>{if(!elements.has(key)) elements.set(key,{hidden:true,disabled:false,textContent:'',
    classList:{toggle(){}},setAttribute(){},focus(){},addEventListener(type,fn){this[type]=fn;}});return elements.get(key);};
  const root={hidden:true,querySelector:get},commands=[];const view=createStartMenuView(root,c=>commands.push(c));
  view.sync(logic.createStartMenu(valid),'ps');assert.equal(root.hidden,false);
  get('#start-new').click({preventDefault(){}});assert.deepEqual(commands.pop(),{type:'new'});
  view.sync(logic.updateStartMenu(logic.createStartMenu(valid),{type:'new'}),'ps');
  get('#start-cancel').click({preventDefault(){}});assert.deepEqual(commands.pop(),{type:'cancel'});
  get('#start-confirm').click({preventDefault(){}});assert.deepEqual(commands.pop(),{type:'confirm-new'});
  view.sync({mode:'closed'},'ps');get('#start-confirm').click({preventDefault(){}});assert.equal(commands.length,0);
});
