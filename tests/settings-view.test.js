import test from 'node:test';
import assert from 'node:assert/strict';
import {showSettings} from '../src/game/settings-view.js';
function dom() {
  const document={activeElement:null,createElement(tag){return new Element(tag);}};
  class Element {
    constructor(tag){this.tagName=tag;this.ownerDocument=document;this.children=[];this.events=new Map();this.attrs={};this.classList={toggle(){}};}
    append(...nodes){this.children.push(...nodes);}
    replaceChildren(...nodes){this.children=nodes;}
    setAttribute(k,v){this.attrs[k]=v;}
    addEventListener(k,fn){this.events.set(k,[...(this.events.get(k)??[]),fn]);}
    removeEventListener(k,fn){this.events.set(k,(this.events.get(k)??[]).filter(x=>x!==fn));}
    emit(k,event={}){for(const fn of this.events.get(k)??[])fn({preventDefault(){},stopPropagation(){},...event});}
    focus(){document.activeElement=this;}
  }
  return {root:new Element('section'),document};
}
test('設定面板透過手把與鍵盤調整實際控制項、顯示焦點並在關閉後解除事件',()=>{
  const {root,document}=dom();let changes=[],closed=0;
  const view=showSettings(root,{volume:32,jumpScare:false,mouseSensitivity:1},s=>changes.push(s),()=>closed++);
  assert.equal(root.hidden,false);assert.equal(root.attrs.role,'dialog');
  const first=document.activeElement;assert.equal(first.type,'range');assert.equal(Number(first.value),32);
  view.handleGamepad({menuDirection:'right'});assert.equal(changes.at(-1).volume,37);
  view.handleGamepad({menuDirection:'down'});view.handleGamepad({confirmPressed:true});
  assert.equal(changes.at(-1).jumpScare,true);assert.equal(document.activeElement.attrs['aria-checked'],'true');
  root.emit('keydown',{code:'ArrowDown'});root.emit('keydown',{code:'ArrowLeft'});assert.equal(changes.at(-1).mouseSensitivity,.75);
  root.emit('keydown',{code:'Escape'});assert.equal(root.hidden,true);assert.equal(closed,1);
  root.emit('keydown',{code:'ArrowRight'});assert.equal(changes.length,3);view.close();assert.equal(closed,1);
});
test('音量滑桿能精確表示非五的倍數，避免32%被瀏覽器自動量化成30%',()=>{
  const {root,document}=dom();const settings={volume:32,jumpScare:false,mouseSensitivity:1};
  showSettings(root,settings,()=>{},()=>{});
  const range=document.activeElement;
  assert.equal((settings.volume-Number(range.min))/Number(range.step)%1,0);
});
test('設定對話框的Tab與Shift+Tab循環留在四個控制項內',()=>{
  const {root,document}=dom();showSettings(root,{volume:32,jumpScare:false,mouseSensitivity:1},()=>{},()=>{});
  const first=document.activeElement;
  root.emit('keydown',{code:'Tab',shiftKey:true});assert.equal(document.activeElement.textContent,'返回遊戲選單');
  root.emit('keydown',{code:'Tab'});assert.equal(document.activeElement,first);
});
