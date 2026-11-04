import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const source=html.match(/<script id="game-startup">([\s\S]*?)<\/script>/)?.[1];
function runtime({protocol='http:',importmaps=true}={}){
 assert.ok(source,'opening controls must run independently before ES modules');
 const events=()=>({listeners:new Map(),addEventListener(type,fn){const list=this.listeners.get(type)??[];list.push(fn);this.listeners.set(type,list);},
  emit(type,values={}){const event={target:this,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...values};for(const fn of this.listeners.get(type)??[]){fn(event);if(event.stopped)break;}return event;}});
 const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{...events(),hidden:false,textContent:'',style:{},dataset:{},content:'test-build',focus(){this.focused=true;}});return nodes.get(id);};
 for(const id of ['startup-status','startup-details'])node(id).hidden=true;
 const document={...events(),hidden:false,getElementById:node,querySelector:()=>({content:'test-build'})};
 const window={...events(),location:{protocol,reload(){reloads++;}}};
 let now=0,reloads=0;const timers=new Map();let sequence=0;
 const context=vm.createContext({window,document,HTMLScriptElement:{supports:importmaps===null?undefined:()=>importmaps},performance:{now:()=>now},
  setInterval(fn){const id=++sequence;timers.set(id,fn);return id;},clearInterval:id=>timers.delete(id)});
 vm.runInContext(source,context);
 return {window,document,node,boot:window.factoryStartup,reloads:()=>reloads,
  tick(ms){now+=ms;for(const fn of [...timers.values()])fn();}};
}

test('開場略過不依賴任何ESM或Three.js，先顯示載入而非無反應',()=>{
 const r=runtime();assert.ok(html.indexOf('id="game-startup"')<html.indexOf('type="module"'));
 r.node('intro-skip').emit('click');assert.equal(r.node('story-intro').hidden,true);
 assert.equal(r.node('startup-status').hidden,false);assert.match(r.node('startup-title').textContent,/準備/);
 assert.equal(r.boot.status().ready,false);
});
test('開場文案自行換段，Enter略過會消耗按鍵而不穿透開始選單',()=>{
 const r=runtime();r.tick(12000);assert.match(r.node('intro-copy').textContent,/封廠/);
 let leaked=false;r.document.addEventListener('keydown',()=>{leaked=true;});
 const event=r.document.emit('keydown',{code:'Enter',repeat:false});
 assert.equal(event.prevented,true);assert.equal(event.stopped,true);assert.equal(leaked,false);assert.equal(r.node('story-intro').hidden,true);
});
test('直接雙擊HTML明示啟動器用法，略過不能把錯誤藏成空白頁',()=>{
 const r=runtime({protocol:'file:'});assert.equal(r.node('startup-status').hidden,false);
 assert.match(r.node('startup-message').textContent,/Play-EscapeRoom\.cmd/);
 assert.match(r.node('startup-message').textContent,/解壓/);
 assert.match(r.node('startup-diagnostic').textContent,/file:/);
 r.node('intro-skip').emit('click');assert.match(r.node('startup-message').textContent,/Play-EscapeRoom\.cmd/);
 r.node('startup-retry').emit('click');assert.equal(r.reloads(),1);
});
test('不支援importmap時顯示瀏覽器相容說明',()=>{
 for(const importmaps of [false,null]){const r=runtime({importmaps});assert.match(r.node('startup-title').textContent,/瀏覽器/);assert.match(r.node('startup-message').textContent,/更新/);}
});
test('主模組未載入與匯入例外會留下錯誤資訊和可用重試按鈕',()=>{
 const r=runtime();r.window.emit('error',{target:{tagName:'SCRIPT',src:'http://local/src/game/main.js?v=test'}});
 assert.match(r.node('startup-title').textContent,/載入失敗/);assert.match(r.node('startup-diagnostic').textContent,/main\.js/);
 assert.equal(r.node('startup-details').hidden,false);
 const rejection=runtime();rejection.window.emit('unhandledrejection',{reason:new Error('Failed to fetch dynamically imported module: chapter.js')});
 assert.match(rejection.node('startup-diagnostic').textContent,/chapter\.js/);
});
test('WebGL初始化失敗有明確3D圖形說明，後續錯誤不蓋掉第一個原因',()=>{
 const r=runtime();r.window.emit('error',{message:'Error creating WebGL context'});
 assert.match(r.node('startup-title').textContent,/3D/);assert.match(r.node('startup-message').textContent,/電腦|圖形/);
 const first=r.node('startup-diagnostic').textContent;r.window.emit('error',{message:'secondary error'});
 assert.equal(r.node('startup-diagnostic').textContent,first);
});
test('載入逾時可以繼續等待並在真正準備好後恢復，背景時間不誤判',()=>{
 const r=runtime();r.document.hidden=true;r.tick(60000);assert.equal(r.boot.status().phase,'loading');
 r.document.hidden=false;r.tick(1000);assert.equal(r.boot.status().phase,'loading');
 r.tick(30000);assert.equal(r.boot.status().phase,'slow');assert.match(r.node('startup-title').textContent,/較久/);
 r.node('startup-wait').emit('click');assert.equal(r.boot.status().phase,'loading');
 r.boot.markReady();assert.equal(r.node('startup-status').hidden,true);assert.equal(r.boot.status().ready,true);
});
test('準備好後正常略過不出現錯誤，非啟動期音效或圖片錯誤不攔住遊戲',()=>{
 const r=runtime();r.window.emit('error',{target:{tagName:'IMG',src:'optional.png'}});assert.equal(r.boot.status().phase,'loading');
 r.boot.markReady();r.node('intro-skip').emit('click');assert.equal(r.node('story-intro').hidden,true);assert.equal(r.node('startup-status').hidden,true);
 r.window.emit('unhandledrejection',{reason:new Error('optional audio unavailable')});assert.equal(r.node('startup-status').hidden,true);
});
