import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as logic from '../../src/logic/index.js';
import {createFactoryAudio} from '../../src/game/audio.js';

// 依既有 save-flow runtime 建立的新整合測試替身；原測試及斷言不改。
export async function runtime(storage,seed) {
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
  const {createStartMenuView}=await import('../../src/game/start-menu-view.js');
  const {createCaptureView}=await import('../../src/game/capture-view.js');
  let pads=[],frame;
  const source=(await readFile(new URL('../../src/game/main.js',import.meta.url),'utf8'))
    .replace(/^import[\s\S]*?from '[^']+';\n/gm,'')+'\nreturn {state:()=>chapter,setChapter:value=>{chapter=value;},options:()=>chapterOptions,settings:()=>settings,session:()=>session,look:()=>({dYaw,dPitch})};';
  const values={...logic,createChapter:options=>seed?{...structuredClone(seed),jumpScare:options?.jumpScare===true}:logic.createChapter(options)};
  const dependencies={THREE,document,window,navigator:{getGamepads:()=>pads},createFactoryAudio,requestAnimationFrame:fn=>{frame=fn;},
    createWorldView:()=>({sync(){}}),createMonsterView:()=>({sync(){}}),createKeypadView:()=>({sync(){}}),
    createStartMenuView,createCaptureView,compensatedIntensity:()=>35,...values};
  const app=new Function(...Object.keys(dependencies),source)(...Object.values(dependencies));
  return {...app,get,window,document,meshes,frame:time=>frame(time),pads:value=>{pads=value;}};
}
