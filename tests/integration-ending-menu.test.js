import test from 'node:test';
import assert from 'node:assert/strict';
import {showEnding} from '../src/game/ending-view.js';
test('結局在鍵盤焦點或手把選取收藏地圖時確認不會重新開始，長按不穿透',()=>{
 const nodes=[];let callback,raw=[],restarts=0,maps=0;
 const doc={activeElement:null,defaultView:{navigator:{getGamepads:()=>[{connected:true,buttons:Array.from({length:17},(_,i)=>({pressed:raw.includes(i)}))}]},requestAnimationFrame:fn=>{callback=fn;return 1;},cancelAnimationFrame(){}},createElement(){const n={dataset:{},events:{},setAttribute(){},append(){},addEventListener(t,fn){this.events[t]=fn;},focus(){doc.activeElement=this;this.events.focus?.();}};nodes.push(n);return n;}};
 const root={ownerDocument:doc,hidden:true,events:{},replaceChildren(){},append(){},addEventListener(t,fn){this.events[t]=fn;},removeEventListener(){}};
 const dispose=showEnding(root,{formattedTime:'1 分 00 秒'},()=>restarts++,{ignoreHeld:true,onMap:()=>{maps++;root.hidden=true;}});
 const frame=buttons=>{raw=buttons;callback();};frame([]);frame([13]);frame([]);frame([0]);assert.equal(maps,1);assert.equal(restarts,0);
 frame([0]);root.hidden=false;frame([0]);assert.equal(maps,1,'重新顯示時長按不能再觸發');frame([]);
 root.events.keydown({code:'ArrowUp',preventDefault(){}});nodes.at(-1).focus();root.events.keydown({code:'Enter',preventDefault(){}});
 assert.equal(maps,2,'Tab／原生焦點應決定確認動作');assert.equal(restarts,0);dispose();
});
