import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as logic from '../src/logic/index.js';
import {createFactoryAudio} from '../src/game/audio.js';

const id=logic.MONSTERS[0].id;
const pad=(buttons=[],name='Xbox')=>({id:name,index:0,mapping:'standard',connected:true,axes:[0,0,0,0],
  buttons:Array.from({length:17},(_,i)=>({pressed:buttons.includes(i)}))});
function ready(options) {
  const s=logic.createChapter(options);
  return {...s,player:{...s.player,x:18.5,z:-9.5,paused:false},
    inventory:{itemIds:['lobby.employee-card','lobby.flashlight','power.fuse']},flashlight:{charge:52,enabled:true,mode:'uv'},
    puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:true,restoreElapsed:0.2}},
    monsters:{[id]:{...s.monsters[id],mode:'patrol'}}};
}

// 以 Node DOM／three.js 替身執行實際 main.js，驗證輸入生命週期；不使用瀏覽器。
async function runtime(jumpScare=false) {
  const listeners=()=>({listeners:new Map(),addEventListener(type,fn){
    this.listeners.set(type,[...(this.listeners.get(type)??[]),fn]);
  },emit(type,event={}){for(const fn of this.listeners.get(type)??[]) fn({preventDefault(){},...event});}});
  const context=new Proxy({}, {get:(target,key)=>target[key]??(()=>{})});
  const element=()=>({...listeners(),hidden:true,textContent:'',style:{},dataset:{},
    appendChild(){},getContext:()=>context,focus(){},classList:{toggle(){}},setAttribute(){}});
  const elements=new Map();
  const get=selector=>{if(!elements.has(selector)) elements.set(selector,element());return elements.get(selector);};
  const screen=get('#capture-screen');screen.querySelector=()=>get('#capture-canvas');
  get('#start-menu').querySelector=get;
  const saved=new Map();
  const storage={getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value),removeItem:key=>saved.delete(key)};
  const document={...listeners(),hidden:false,pointerLockElement:null,hasFocus:()=>true,
    querySelector:get,createElement:element,body:element(),exitPointerLock(){this.pointerLockElement=null;this.emit('pointerlockchange');}};
  const window={...listeners(),innerWidth:1000,innerHeight:700,devicePixelRatio:1,
    location:{search:jumpScare?'?jumpscare=1':'?jumpscare=0'},localStorage:storage};
  const vector=()=>({set(){},setScalar(){}});
  class Object3D {constructor(){this.position=vector();this.rotation=vector();}add(){}remove(){}lookAt(){}}
  class Renderer {constructor(){this.domElement=element();this.domElement.requestPointerLock=async()=>{
    document.pointerLockElement=this.domElement;document.emit('pointerlockchange');
  };}setPixelRatio(){}setSize(){}render(){}}
  class Material {dispose(){}}
  class Light extends Object3D {constructor(){super();this.target=new Object3D();this.color={setHex(){}};}}
  class Camera extends Object3D {updateProjectionMatrix(){}}
  class Mesh extends Object3D {constructor(geometry,material){super();this.geometry=geometry;this.material=material;}}
  const THREE={Scene:Object3D,Color:Material,PerspectiveCamera:Camera,WebGLRenderer:Renderer,Mesh,
    BoxGeometry:Material,PlaneGeometry:Material,MeshLambertMaterial:Material,MeshBasicMaterial:Material,
    AmbientLight:Light,SpotLight:Light,CanvasTexture:Material};
  let pads=[],frame,lastChapter;
  const source=(await readFile(new URL('../src/game/main.js',import.meta.url),'utf8'))
    .replace(/^import[\s\S]*?from '[^']+';\n/gm,'');
  const {createCaptureView}=await import('../src/game/capture-view.js');
  const {createStartMenuView}=await import('../src/game/start-menu-view.js');
  const values={...logic,createChapter:options=>({...ready(options),player:{...ready(options).player,paused:true}}),
    updateChapter:(...args)=>(lastChapter=logic.updateChapter(...args))};
  const dependencies={THREE,document,window,navigator:{getGamepads:()=>pads},createFactoryAudio,
    requestAnimationFrame:fn=>{frame=fn;},createWorldView:()=>({sync(){}}),createMonsterView:()=>({sync(){}}),
    createKeypadView:()=>({sync(){}}),createCaptureView,createStartMenuView,compensatedIntensity:()=>35,...values};
  new Function(...Object.keys(dependencies),source)(...Object.values(dependencies));
  // 空儲存：先選新遊戲及確認選項，讓原本的 A／✕ 或開始點擊完成啟動。
  get('#start-new').emit('click');
  document.emit('keydown',{code:'ArrowRight'});
  return {document,window,get,pads:value=>{pads=value;},frame:time=>frame(time),state:()=>lastChapter};
}

test('被抓期間移動轉頭互動裝備與場景計時停止',()=>{
  const options={jumpScare:true};let s=logic.updateChapter(ready(options),{},0.1,options);
  assert.equal(s.ui.mode,'caught');assert.equal(s.flashlight.enabled,false);
  const frozen=structuredClone(s);
  const noisy={move:{x:1,y:1},look:{dYaw:2,dPitch:1,yawRate:1,pitchRate:1},interactPressed:true,
    flashlightPressed:true,uvPressed:true,keypadCommands:[{type:'digit',value:'4'},{type:'submit'}]};
  for(let i=0;i<5;i++) s=logic.updateChapter(s,noisy,0.1,options);
  assert.deepEqual(s.player,frozen.player);assert.deepEqual(s.monsters,frozen.monsters);
  assert.deepEqual(s.flashlight,frozen.flashlight);assert.deepEqual(s.inventory,frozen.inventory);
  assert.deepEqual(s.puzzles,frozen.puzzles);assert.equal(s.ui.elapsed,0.5);
  assert.equal(logic.selectChapterTarget(s),null);
});

test('暫停失焦拔除與原位繼續不跳進被抓計時或洩漏輸入',async()=>{
  const options={jumpScare:true};let s=logic.updateChapter(ready(options),{},0.1,options);
  s=logic.updateChapter(s,{},0.2,options);s=logic.updateChapter(s,{},0.1,options);
  assert.equal(s.ui.mode,'caught');assert.equal(logic.capturePresentation(s.ui,{jumpScare:true}).closeup,true);
  for(const interruption of [{pausePressed:true},{focusLost:true},{forcePause:true}]) {
    const paused=logic.updateChapter(s,{...interruption,interactPressed:true,flashlightPressed:true},100,options);
    assert.equal(paused.player.paused,true);assert.deepEqual(paused.ui,s.ui);assert.deepEqual(paused.monsters,s.monsters);
    assert.equal(logic.capturePresentation(paused.ui,{jumpScare:true,paused:true}).closeup,false);
    assert.equal(logic.capturePresentation(paused.ui,{jumpScare:true,paused:true}).blackout,true);
    assert.deepEqual(logic.updateChapter(paused,{},100,options),paused);
    const resumed={...paused,player:logic.setPaused(paused.player,false)};
    const filtered=logic.gameplayActions({interactPressed:true,flashlightPressed:true},
      {hasStarted:true,paused:true},{hasStarted:true,paused:false});
    assert.deepEqual(logic.updateChapter(resumed,filtered,100,options),resumed);
  }
  for(const name of ['Xbox','DualSense']) {
    const prompt=logic.updatePrompt(logic.createPrompt(),{device:logic.classifyGamepad(name),gamepadIndex:0},1000);
    assert.equal(logic.updateChapter(s,{forcePause:logic.pauseOnDisconnect(prompt,0)},1,options).player.paused,true);
    const app=await runtime(true);app.pads([pad([0],name)]);app.frame(0);
    app.pads([pad([],name)]);app.frame(20);app.frame(40);
    assert.equal(app.state().ui.mode,'caught');
    app.pads([pad([0,4,5],name)]);app.frame(60);app.frame(80);
    assert.equal(app.state().flashlight.enabled,false);
    app.pads([pad([9],name)]);app.frame(100);assert.equal(app.state().player.paused,true);
    app.pads([pad([],name)]);app.frame(2000);
    const elapsed=app.state().ui.elapsed;app.pads([pad([9,0,4,5],name)]);app.frame(4000);
    assert.equal(app.state().ui.elapsed,elapsed,'繼續不計入閒置時間');
    app.pads([]);app.window.emit('gamepaddisconnected',{gamepad:{index:0}});
    assert.equal(app.get('#pause-screen').hidden,false);
  }
  const app=await runtime(true);
  app.get('#resume').emit('click');app.frame(0);app.frame(100);
  assert.equal(app.state().ui.mode,'caught');
  assert.equal(app.document.pointerLockElement,null,'被抓釋放 Pointer Lock，不誤觸暫停');
  assert.equal(app.state().player.paused,false);
  const capturedPose=structuredClone(app.state().player);
  for(const code of ['KeyW','KeyE','KeyF','KeyR']) app.document.emit('keydown',{code});
  app.document.emit('mousemove',{movementX:500,movementY:500});
  app.frame(200);app.frame(300);
  app.document.emit('keydown',{code:'Escape'});app.frame(400);
  assert.equal(app.state().player.paused,true);
  assert.equal(app.get('#capture-canvas').hidden,true);assert.equal(app.get('#capture-screen').hidden,false);
  app.get('#resume').emit('click');app.frame(500);
  for(let i=6;i<28;i++) app.frame(i*100);
  // shuoen本次明確要求原位回復；同時更嚴格核對整個視角／位置及無殘留輸入。
  assert.equal(app.state().ui.mode,'explore');assert.deepEqual(app.state().player,capturedPose);
  assert.equal(app.state().monsters[id].mode,'inactive');assert.ok(app.state().encounterRecovery);
  assert.equal(app.state().flashlight.enabled,false);
  app.window.emit('blur');assert.equal(app.get('#pause-screen').hidden,false);
});

test('成功進櫃與密碼鎖流程不被舊接觸打斷',()=>{
  let s=ready();s={...s,player:{...s.player,x:8.5,z:-1.2,yaw:0,pitch:0},events:[{type:'contact',monsterId:id}]};
  s.monsters[id]={...s.monsters[id],x:9.2,z:-1.2,yaw:0,mode:'chase',lastSeen:{x:8.5,z:-1.2},
    events:[{type:'contact',monsterId:id}],contactLatched:true};
  const hidden=logic.updateChapter(s,{interactPressed:true},0.1);
  assert.equal(hidden.ui.mode,'hiding');assert.equal(hidden.monsters[id].mode,'search');assert.deepEqual(hidden.events,[]);
  assert.equal(logic.capturePresentation(hidden.ui).blackout,false);
  assert.equal(logic.updateChapter(hidden,{},0.1).ui.mode,'hiding');
  const panel={...ready(),ui:logic.createKeypad('power.keypad'),events:[{type:'contact',monsterId:id}]};
  for(const commands of [[],[{type:'cancel'}],[{type:'submit'}]]) {
    const next=logic.updateChapter(panel,{keypadCommands:commands},1);
    assert.notEqual(next.ui.mode,'caught');assert.deepEqual(next.monsters,panel.monsters);
  }
});
