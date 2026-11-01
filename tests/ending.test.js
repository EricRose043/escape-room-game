import test from 'node:test';
import assert from 'node:assert/strict';
import {finishChapter} from '../src/logic/ending.js';

test('結局顯示經過時間並處理零秒、無效值及超過一小時',()=>{
  assert.deepEqual(finishChapter(4,4),{elapsedSeconds:0,formattedTime:'0 分 00 秒'});
  assert.deepEqual(finishChapter(0,754),{elapsedSeconds:754,formattedTime:'12 分 34 秒'});
  assert.deepEqual(finishChapter(0,3661),{elapsedSeconds:3661,formattedTime:'1 小時 01 分 01 秒'});
  assert.equal(finishChapter(12,2).elapsedSeconds,0);
  assert.equal(finishChapter(0,Infinity).elapsedSeconds,0);
});

test('結局畫面可用按鈕、Enter／手把確認及方向鍵操作重新開始',async()=>{
  const {showEnding}=await import('../src/game/ending-view.js');
  const listeners={};let restarted=0;
  const elements=[];
  let nextFrame;
  const doc={activeElement:null,defaultView:{navigator:{getGamepads:()=>[{connected:true,buttons:[{pressed:true}]}]},requestAnimationFrame(fn){nextFrame=fn;return 1;},cancelAnimationFrame(){}},createElement(){
    const attrs={};const element={dataset:{},children:[],textContent:'',addEventListener(type,fn){listeners[type]=fn;},setAttribute(k,v){attrs[k]=v;},append(...nodes){this.children.push(...nodes);},focus(){doc.activeElement=this;}};elements.push(element);return element;
  }};
  const container={ownerDocument:doc,hidden:true,addEventListener(type,fn){listeners[`container:${type}`]=fn;},removeEventListener(){},replaceChildren(){this.children=[];},append(node){this.children=[node];}};
  const dispose=showEnding(container,finishChapter(0,61),()=>restarted++);
  const [,title,time,button]=elements;
  assert.equal(title.textContent,'你逃出了玩具工廠');assert.equal(time.textContent,'1 分 01 秒');assert.equal(container.hidden,false);
  listeners.click();assert.equal(restarted,1);
  nextFrame();assert.equal(restarted,2);
  listeners['container:keydown']({code:'KeyA',preventDefault(){}});assert.equal(restarted,3);
  dispose();
});
