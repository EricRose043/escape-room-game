import test from 'node:test';
import assert from 'node:assert/strict';
import {createPresentationUI} from '../src/game/presentation-ui.js';
import {createChapter} from '../src/logic/chapter.js';
import {runtime} from './fixtures/settings-runtime.js';

class Element{
  constructor(){this.children=[];this.hidden=false;this.dataset={};this.events={};this.textContent='';}
  append(...items){this.children.push(...items);}
  before(){}
  replaceChildren(...items){this.children=items;}
  setAttribute(k,v){this[k]=v;}
  addEventListener(k,v){this.events[k]=v;}
  querySelector(selector){return this.children.flatMap(c=>[c,c.querySelector?.(selector)]).find(c=>c?.id===selector.slice(1))??null;}
  text(){return this.textContent+this.children.map(c=>c.text()).join(' ');}
}
function documentFixture(){
  const nodes=new Map(['#factory-map','#map-content','#pause-screen section','#start-message'].map(k=>[k,new Element()]));
  const body=new Element();nodes.get('#factory-map').hidden=true;
  return {body,nodes,createElement:()=>new Element(),createElementNS:()=>new Element(),querySelector:k=>nodes.get(k),defaultView:{dispatchEvent(){}}};
}
test('真正的教學視圖會渲染PS/Xbox按鍵，暫停時仍可查看完整操作',()=>{
  const doc=documentFixture(),view=createPresentationUI(doc),state=createChapter();
  view.sync(state,{paused:false,hasStarted:true},{device:'ps'},null,null);
  assert.match(doc.body.text(),/✕/);assert.match(doc.body.text(),/Options/);
  const help=doc.nodes.get('#pause-screen section').text();
  assert.match(help,/R1/);assert.match(help,/L1/);assert.match(help,/Share/);
  view.sync(state,{paused:true,hasStarted:true},{device:'xbox'},null,null);
  assert.match(doc.nodes.get('#pause-screen section').text(),/RB/);
  assert.equal(doc.body.children.find(e=>e.id==='context-guide').hidden,true);
  view.sync(state,{paused:false,hasStarted:true},{device:'keyboard'},null,{text:'原始文件文字'});
  assert.equal(doc.body.dataset.reading,'true');assert.match(doc.body.text(),/原始文件文字/);
});
test('H從實際遊戲開啟暫停指引並清除待執行移動，存檔進度不變',async()=>{
  const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
  const app=await runtime(storage);
  app.get('#start-new').emit('click');app.document.emit('keydown',{code:'ArrowRight'});app.document.emit('keydown',{code:'Enter'});
  await Promise.resolve();assert.equal(app.session().paused,false);
  const before=structuredClone(app.state());
  app.document.emit('keydown',{code:'KeyW'});app.document.emit('keydown',{code:'KeyH'});
  assert.equal(app.session().paused,true);assert.deepEqual(app.state().inventory,before.inventory);assert.deepEqual(app.look(),{dYaw:0,dPitch:0});
});
