import * as THREE from 'three';
import { seededRandom } from './visual-design.js';

// Small repeatable canvas textures, allocated once, shared throughout the chapter.
export function createArtMaterials(){
  const maps=new Map(),materials=new Map();
  function texture(kind){
    if(maps.has(kind))return maps.get(kind);
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
    const c=canvas.getContext('2d'),random=seededRandom(kind.length*71);
    const bases={plaster:'#c6bfaa',tile:'#899186',metal:'#9ca79b',wood:'#94734f',fabric:'#477e92',paper:'#e1d0a6',rubber:'#3c4545',brick:'#8b7562',leather:'#4c5148'};
    c.fillStyle=bases[kind]??bases.metal;c.fillRect(0,0,512,512);
    for(let i=0;i<13000;i++){
      c.fillStyle=random()>.5?`rgba(255,244,211,${random()*.075})`:`rgba(13,22,24,${random()*.11})`;
      const size=random()*2+1;c.fillRect(random()*512,random()*512,size,size);
    }
    if(kind==='plaster'){
      // Mineral variation, water streaks and hairline cracks read as an old building,
      // rather than stretching a flat colour over a large primitive.
      for(let i=0;i<18;i++){
        const x=random()*512,w=20+random()*90;
        const wash=c.createLinearGradient(x,0,x+w,512);if(wash){wash.addColorStop(0,'#fff4d90b');wash.addColorStop(.55,'#283a3020');wash.addColorStop(1,'#2b362200');c.fillStyle=wash;c.fillRect(x,0,w,512);}
      }
      for(let i=0;i<5;i++){
        let x=random()*512,y=random()*300;c.strokeStyle='#3c463228';c.lineWidth=.7;c.beginPath();c.moveTo(x,y);
        for(let j=0;j<6;j++){x+=(random()-.5)*19;y+=12+random()*17;c.lineTo(x,y);}c.stroke();
      }
    }
    if(kind==='tile'){
      for(let y=0;y<4;y++)for(let x=0;x<4;x++){
        c.fillStyle=(x+y)%2?'#d5c6a23b':'#173b3d55';c.fillRect(x*128+2,y*128+2,124,124);
        c.strokeStyle='#1c2a2b77';c.lineWidth=3;c.strokeRect(x*128,y*128,128,128);
        c.strokeStyle='#e2d3b02e';c.lineWidth=1;c.strokeRect(x*128+3,y*128+3,122,122);
      }
    }
    if(kind==='wood')for(let i=0;i<110;i++){
      c.strokeStyle=`rgba(32,22,10,${random()*.18})`;c.beginPath();const x=random()*512;c.moveTo(x,0);c.bezierCurveTo(x-12,180,x+15,350,x,512);c.stroke();
    }
    if(kind==='fabric')for(let y=0;y<512;y+=4){c.fillStyle='#e1f0db18';c.fillRect(0,y,512,1);c.fillRect(y,0,1,512);}
    for(let i=0;i<(kind==='plaster'?240:70);i++){
      const x=random()*512,y=random()*512;c.fillStyle=kind==='metal'?'#845e3540':'#2e39372a';
      c.fillRect(x,y,random()*18+1,random()*3+1);
    }
    if(kind==='metal'){
      for(let i=0;i<190;i++){c.fillStyle=i%4?'#d4d5b90a':'#273f3317';c.fillRect(0,random()*512,512,.6+random()*1.1);}
      for(let i=0;i<28;i++){c.strokeStyle='#4d352822';c.lineWidth=1;c.beginPath();const x=random()*512,y=random()*512;c.moveTo(x,y);c.lineTo(x+random()*38,y+random()*3);c.stroke();}
    }
    if(kind==='leather')for(let i=0;i<700;i++){c.strokeStyle='#a8a58d12';c.beginPath();const x=random()*512,y=random()*512;c.moveTo(x,y);c.lineTo(x+4+random()*13,y+2);c.stroke();}
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
    map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=4;maps.set(kind,map);return map;
  }
  function material(kind,color=0xffffff,worldScale=0){
    const key=`${kind}/${color}/${worldScale}`;
    if(materials.has(key))return materials.get(key);
    const metal=kind==='metal',floor=kind==='tile';
    const m=new THREE.MeshStandardMaterial({map:texture(kind),color,
      roughness:metal?.43:floor?.62:.91,metalness:metal?.38:.015,
      bumpMap:texture(kind),bumpScale:metal?.003:floor?.006:.008});
    if(worldScale){
      m.onBeforeCompile=shader=>{
        shader.vertexShader='varying vec3 vArtPosition; varying vec3 vArtNormal;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
          vec4 artLocal=vec4(transformed,1.0);
          #ifdef USE_INSTANCING
          artLocal=instanceMatrix*artLocal;
          #endif
          vArtPosition=(modelMatrix*artLocal).xyz;
          vArtNormal=normalize(mat3(modelMatrix)*objectNormal);`);
        shader.fragmentShader='varying vec3 vArtPosition; varying vec3 vArtNormal;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
          vec3 artN=abs(vArtNormal);vec2 artUV;
          if(artN.y>artN.x && artN.y>artN.z)artUV=vArtPosition.xz;
          else if(artN.x>artN.z)artUV=vArtPosition.zy;else artUV=vArtPosition.xy;
          vec4 artColor=texture2D(map,artUV*${worldScale.toFixed(3)});
          ${kind==='plaster'?'if(vArtPosition.y<1.08)artColor.rgb*=vec3(0.30,0.53,0.51);':''}
          diffuseColor*=artColor;`);
      };
      m.customProgramCacheKey=()=>key;
    }
    materials.set(key,m);return m;
  }
  const palette={wall:material('plaster',0xffffff,.42),floor:material('tile',0xffffff,.5),ceiling:material('plaster',0x647477,.5),
    table:material('wood'),fuseBox:material('metal',0x7c9190,.8),keypad:material('metal',0xb1b4a6,1),door:material('metal',0x638b86,.6),
    machine:material('metal',0x869d88,.6),locker:material('metal',0x6a8d8d,.8),lockerDoor:material('metal',0x9cb3aa,.8),
    trim:material('metal',0x36494a),hazard:material('metal',0xd9b65a),train:material('metal',0x799a9e),trainConsole:material('metal',0xb29d6b),clueNote:material('paper')};
  const flat=(color,glow=0)=>new THREE.MeshLambertMaterial({color,emissive:glow,emissiveIntensity:.6});
  Object.assign(palette,{skirting:flat(0x263e40),brass:flat(0xa99465),seam:flat(0x63746c),floorLine:flat(0xb5a162),
    black:flat(0x16272a),cream:flat(0xd9ceb0),copper:flat(0x966b45),glass:new THREE.MeshLambertMaterial({color:0x82a5a1,transparent:true,opacity:.3,emissive:0x0c2528,emissiveIntensity:.3,depthWrite:false,side:THREE.DoubleSide}),lamp:flat(0xf4deae,0xccaa73),red:flat(0xa74b39),rubber:material('rubber'),fabric:material('fabric'),
    enamel:material('metal',0xa4b8a6,.65),ivory:material('metal',0xd1c8a8,.6),steel:flat(0x85928f),screen:flat(0x163c3c,0x164a43),screenLight:flat(0x92c3a4,0x316c53),amber:flat(0xd1a84e,0x79501d),brick:material('brick',0xffffff,.8),leather:material('leather'),rust:flat(0x76533d),rail:flat(0x929a93),ink:flat(0x34433e)});
  palette.locker.side=palette.lockerDoor.side=THREE.DoubleSide;
  return {palette,material,texture};
}
