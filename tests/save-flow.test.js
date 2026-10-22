import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as logic from '../src/logic/index.js';

function memory() {
  const values=new Map();return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),
    removeItem(){assert.fail('不應刪檔');},clear(){assert.fail('不應清空設定');}};
}
async function runtime(storage,seed) {
  const events=()=>({events:{},addEventListener(type,fn){(this.events[type]??=[]).push(fn);},
    emit(type,event={}){for(const fn of this.events[type]??[]) fn({preventDefault(){},...event});}});
  const context=new Proxy({}, {get:(target,key)=>target[key]??(()=>{})});
  const element=()=>({...events(),hidden:true,textContent:'',style:{},dataset:{},classList:{toggle(){}},
    setAttribute(){},focus(){},appendChild(){},getContext:()=>context});
  const elements=new Map(),get=key=>{if(!elements.has(key)) elements.set(key,element());return elements.get(key);};
  get('#capture-screen').querySelector=()=>get('#capture-canvas');get('#start-menu').querySelector=get;
  const document={...events(),hidden:false,pointerLockElement:null,hasFocus:()=>true,querySelector:get,
    createElement:element,body:element(),exitPointerLock(){this.pointerLockElement=null;this.emit('pointerlockchange');}};
  const window={...events(),innerWidth:1000,innerHeight:700,devicePixelRatio:1,location:{search:''},localStorage:storage};
  const vector=()=>({set(x,y,z){this.x=x;this.y=y;this.z=z;},setScalar(){}});const meshes=[];
  class Object3D {constructor(){this.position=vector();this.rotation=vector();}add(){}remove(){}lookAt(){}}
  class Renderer {constructor(){this.domElement=element();this.domElement.requestPointerLock=async()=>{
    document.pointerLockElement=this.domElement;document.emit('pointerlockchange');
  };}setPixelRatio(){}setSize(){}render(){}}
  class Material {constructor(options){this.options=options;}dispose(){assert.fail('重新開始不應刪除共用物品資源');}}
  class Light extends Object3D {constructor(){super();this.target=new Object3D();this.color={setHex(){}};}}
  class Camera extends Object3D {updateProjectionMatrix(){}}
  class Geometry {constructor(...dimensions){this.dimensions=dimensions;}}
  class Mesh extends Object3D {constructor(geometry,material){super();this.geometry=geometry;this.material=material;meshes.push(this);}}
  const THREE={Scene:Object3D,Color:Material,PerspectiveCamera:Camera,WebGLRenderer:Renderer,Mesh,
    BoxGeometry:Geometry,PlaneGeometry:Geometry,MeshLambertMaterial:Material,MeshBasicMaterial:Material,
    AmbientLight:Light,SpotLight:Light,CanvasTexture:Material};
  const {createStartMenuView}=await import('../src/game/start-menu-view.js');
  const {createCaptureView}=await import('../src/game/capture-view.js');
  let pads=[],frame;
  const source=(await readFile(new URL('../src/game/main.js',import.meta.url),'utf8'))
    .replace(/^import[\s\S]*?from '[^']+';\n/gm,'')+'\nreturn {state:()=>chapter,setChapter:value=>{chapter=value;}};';
  const values={...logic,createChapter:options=>seed?{...structuredClone(seed),jumpScare:options?.jumpScare===true}:logic.createChapter(options)};
  const dependencies={THREE,document,window,navigator:{getGamepads:()=>pads},requestAnimationFrame:fn=>{frame=fn;},
    createWorldView:()=>({sync(){}}),createMonsterView:()=>({sync(){}}),createKeypadView:()=>({sync(){}}),
    createStartMenuView,createCaptureView,compensatedIntensity:()=>35,...values};
  const app=new Function(...Object.keys(dependencies),source)(...Object.values(dependencies));
  return {...app,get,window,document,meshes,frame:time=>frame(time),pads:value=>{pads=value;}};
}
function progressed() {
  const s=logic.createChapter();return {...s,checkpointId:'production.checkpoint',
    inventory:{itemIds:['lobby.flashlight','power.fuse','power.battery']},flashlight:{charge:41,mode:'uv',enabled:true},
    puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:true}}};
}
test('櫃內密碼鎖與被抓中存檔只回復固定安全點',async()=>{
  for(const ui of [{mode:'hiding',lockerId:'production.locker-l1'},
    {...logic.createKeypad('power.keypad'),buffer:'47'},logic.createCapture({jumpScare:true})]) {
    const storage=memory(),store=logic.createSaveStorage(storage);store.load();
    const s={...progressed(),ui,player:{x:8.5,z:-2.6,yaw:2,pitch:0.3,paused:false}};
    store.restart(s);const data=JSON.parse(storage.getItem(logic.CHAPTER_SAVE_KEY));
    assert.ok(!('ui' in data));assert.ok(!('player' in data));
    const app=await runtime(storage);assert.equal(app.get('#start-continue').disabled,false);
    app.get('#start-continue').emit('click');app.frame(0);
    assert.equal(app.state().player.x,6.5);assert.equal(app.state().player.z,-6.5);
    assert.equal(app.state().player.yaw,-Math.PI/2);assert.equal(app.state().ui.mode,'explore');
    assert.deepEqual(app.state().events,[]);assert.equal(app.state().flashlight.enabled,false);
    assert.equal(app.state().flashlight.charge,41);assert.equal(app.state().flashlight.mode,'uv');
  }
});
test('繼續後物品門燈光與怪物同步，重新開始恢復物品模型',async()=>{
  const storage=memory();storage.setItem('settings','keep');
  storage.setItem(logic.CHAPTER_SAVE_KEY,logic.serializeChapterSave(progressed()));
  const app=await runtime(storage);app.get('#start-continue').emit('click');app.frame(0);
  const items=app.meshes.filter(m=>m.geometry.dimensions.length===3);assert.equal(items.length,4);
  const count=app.meshes.length;
  assert.equal(items.filter(m=>m.visible).length,1);
  assert.equal(logic.powerProgress(app.state(),'power.main'),1);
  assert.equal(app.state().monsters[logic.MONSTERS[0].id].mode,'patrol');
  assert.equal(logic.getGeometry(app.state()).collisionBoxes.some(b=>b.id==='power.production-door'),false);
  app.window.emit('blur');app.get('#start-open').emit('click');app.get('#start-new').emit('click');
  const saved=storage.getItem(logic.CHAPTER_SAVE_KEY);app.get('#start-cancel').emit('click');
  assert.equal(storage.getItem(logic.CHAPTER_SAVE_KEY),saved);
  app.get('#start-new').emit('click');app.get('#start-confirm').emit('click');app.frame(100);
  assert.equal(app.state().checkpointId,'lobby.checkpoint');assert.deepEqual(app.state().inventory.itemIds,[]);
  assert.equal(items.filter(m=>m.visible).length,4);assert.equal(app.meshes.length,count);
  assert.equal(logic.getGeometry(app.state()).collisionBoxes.some(b=>b.id==='lobby.power-door'),true);
  assert.equal(storage.getItem('settings'),'keep');
  const bad=memory();bad.setItem(logic.CHAPTER_SAVE_KEY,'{broken');const protectedApp=await runtime(bad);
  protectedApp.frame(0);protectedApp.window.emit('pagehide');assert.equal(bad.getItem(logic.CHAPTER_SAVE_KEY),'{broken');
  assert.match(protectedApp.get('#start-message').textContent,/JSON|存檔/);
  protectedApp.get('#start-new').emit('click');protectedApp.get('#start-confirm').emit('click');protectedApp.frame(100);
  assert.equal(logic.parseChapterSave(bad.getItem(logic.CHAPTER_SAVE_KEY)).status,'valid');
});
test('正式流程供電進區被抓關頁繼續後保留進度且仍可再被抓',async()=>{
  const storage=memory(),store=logic.createSaveStorage(storage);store.load();let s=logic.createChapter();store.restart(s);
  const step=(actions={},dt=0)=>{const next=logic.updateChapter(s,actions,dt);store.observe(s,next,dt);s=next;};
  s={...s,player:logic.setPaused(s.player,false)};
  function aim(x,y,z) {step({look:{dYaw:Math.atan2(s.player.x-x,s.player.z-z)-s.player.yaw,
    dPitch:Math.atan2(y-1.6,Math.hypot(x-s.player.x,z-s.player.z))-s.player.pitch}});}
  function walk(x,z) {
    aim(x,1.6,z);
    for(let i=0;i<600;i++) {const distance=Math.hypot(x-s.player.x,z-s.player.z);if(distance<1e-7)return;
      step({move:{y:1}},Math.min(0.1,distance/logic.WALK_SPEED));assert.equal(s.ui.mode,'explore');}
    assert.fail('路線超時');
  }
  function take(id) {const i=logic.ITEMS.find(i=>i.id===id);aim((i.minX+i.maxX)/2,(i.minY+i.maxY)/2,(i.minZ+i.maxZ)/2);step({interactPressed:true});assert.ok(s.inventory.itemIds.includes(id));}
  walk(-1.5,5.5);take('lobby.flashlight');step({flashlightPressed:true});walk(0,5.5);walk(0,-4.6);walk(-3,-4.6);take('power.fuse');
  walk(0,-4.6);walk(3,-3);aim(4.25,1.4,-3);step({interactPressed:true});walk(3,-5.2);aim(4.5,1.4,-5.2);step({interactPressed:true});
  for(const value of logic.getPuzzle('power.main').code) step({keypadCommands:[{type:'digit',value}]});
  step({keypadCommands:[{type:'submit'}]});walk(3,-6.5);walk(6.5,-6.5);assert.equal(s.checkpointId,'power.checkpoint');
  walk(8.2,-6.5);assert.equal(s.checkpointId,'production.checkpoint');
  for(let i=0;i<600 && s.ui.mode!=='caught';i++) step({},0.1);
  assert.equal(s.ui.mode,'caught');store.flush('pagehide');const progress=logic.createChapterSave(s);
  const app=await runtime(storage);
  const pad=indices=>({id:'DualSense',index:0,mapping:'standard',connected:true,axes:[0,0,0,0],
    buttons:Array.from({length:17},(_,i)=>({pressed:indices.includes(i)}))});
  app.pads([pad([0,4,5])]);app.frame(0);app.pads([pad([0,4,5])]);app.frame(100);
  assert.equal(app.state().ui.mode,'explore');assert.equal(app.state().player.x,6.5);
  assert.equal(app.state().flashlight.enabled,false);assert.deepEqual(logic.createChapterSave(app.state()),progress);
  s=app.state();s={...s,player:{...s.player,x:8.2,z:-6.5}};
  for(let i=0;i<600 && s.ui.mode!=='caught';i++) step({},0.1);
  assert.equal(s.ui.mode,'caught');for(let i=0;i<12;i++) step({},0.1);
  assert.equal(s.ui.mode,'explore');assert.equal(s.player.x,6.5);assert.deepEqual(logic.createChapterSave(s),progress);
  app.setChapter({...s,flashlight:{...s.flashlight,enabled:true}});
  app.pads([pad([])]);app.frame(200);const pending=app.state();app.window.emit('pagehide');
  assert.equal(JSON.parse(storage.getItem(logic.CHAPTER_SAVE_KEY)).flashlight.charge,pending.flashlight.charge);
});
