import test from 'node:test';
import assert from 'node:assert/strict';
import * as logic from '../src/logic/index.js';

test('數字最多四位，刪除與返回符合規則',()=>{
  let ui=logic.createKeypad('power.keypad');
  assert.deepEqual(ui,{mode:'keypad',deviceId:'power.keypad',buffer:'',selectedIndex:0,message:''});
  for(const value of '123456') ui=logic.updateKeypad(ui,{type:'digit',value});
  assert.equal(ui.buffer,'1234');
  assert.equal(logic.updateKeypad(ui,{type:'digit',value:'12'}).buffer,'1234');
  ui=logic.updateKeypad(ui,{type:'delete'}); assert.equal(ui.buffer,'123');
  for(let i=0;i<5;i++) ui=logic.updateKeypad(ui,{type:'delete'});
  assert.equal(ui.buffer,'');
  assert.deepEqual(logic.updateKeypad(ui,{type:'cancel'}),{mode:'explore'});
  assert.equal(logic.createKeypad('power.keypad').buffer,'');
});
test('十字鍵按指定方向移動選取且不越界',()=>{
  assert.deepEqual(logic.KEYPAD_KEYS,['1','2','3','4','5','6','7','8','9','delete','0','submit']);
  for(let index=0;index<12;index++) for(const direction of ['up','down','left','right']) {
    const ui={...logic.createKeypad('power.keypad'),selectedIndex:index};
    const row=Math.floor(index/3),col=index%3;
    const expected={up:row>0?index-3:index,down:row<3?index+3:index,left:col>0?index-1:index,right:col<2?index+1:index}[direction];
    const next=logic.updateKeypad(ui,{type:'move',direction});
    assert.equal(next.selectedIndex,expected,`${index} ${direction}`);
    assert.equal(ui.selectedIndex,index);
  }
  assert.equal(logic.updateKeypad({...logic.createKeypad('x'),selectedIndex:10},{type:'activate'}).buffer,'0');
});
