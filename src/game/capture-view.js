import { capturePresentation } from '../logic/capture.js';
import { captureScarePose, paintCaptureLayer } from './capture-scare-art.js';

const LAYERS=['torso','head','left-eye','right-eye','teeth','jaw','left-hand','right-hand'];

export function createCaptureView(root) {
  const canvas=root.querySelector('canvas'),doc=root.ownerDocument;
  root.hidden=true;canvas.hidden=true;
  const context=canvas.getContext('2d');
  const layered=Boolean(context&&doc?.createElement&&root.append);
  const layers=new Map();let rig=null;
  if(layered) {
    rig=doc.createElement('div');rig.dataset.captureRig='';rig.hidden=true;
    Object.assign(rig.style,{position:'absolute',inset:'0',perspective:'680px',perspectiveOrigin:'50% 44%',transformStyle:'preserve-3d',pointerEvents:'none'});
    root.append(rig);
    for(const name of LAYERS) {
      const layer=name==='head'?canvas:doc.createElement('canvas'),drawing=name==='head'?context:layer.getContext('2d');
      if(!drawing)continue;
      layer.dataset.captureLayer=name;layer.hidden=true;
      Object.assign(layer.style,{position:'absolute',left:'50%',top:'44%',width:'min(108vw,118vh)',height:'min(108vw,118vh)',maxWidth:'none',maxHeight:'none',transformOrigin:'50% 48%',willChange:'transform',backfaceVisibility:'hidden'});
      paintCaptureLayer(layer,drawing,name);rig.append(layer);layers.set(name,layer);
    }
    const vignette=doc.createElement('div');vignette.dataset.captureVignette='';
    Object.assign(vignette.style,{position:'absolute',inset:'0',background:'radial-gradient(ellipse at 50% 44%,transparent 22%,#0003 61%,#000e 100%)',pointerEvents:'none'});rig.append(vignette);
  } else if(context)paintCaptureLayer(canvas,context,'fallback');

  function place(name,x,y,z,tilt,pitch,yaw,scale=1) {
    const layer=layers.get(name);if(!layer)return;
    layer.style.transform=`translate(-50%,-50%) translate3d(${x.toFixed(3)}px,${y.toFixed(3)}px,${z.toFixed(3)}px) rotateZ(${tilt.toFixed(3)}deg) rotateX(${pitch.toFixed(3)}deg) rotateY(${yaw.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
  }

  return {
    sync(ui,options={}) {
      const presentation=capturePresentation(ui,options),show=presentation.closeup&&Boolean(context);
      // Recheck every external option: no previously visible eye/hand may survive
      // turning the closeup off, or pausing the capture.
      root.hidden=!presentation.blackout;canvas.hidden=!show;
      if(rig)rig.hidden=!show;
      for(const layer of layers.values())layer.hidden=!show;
      if(!show)return;
      const p=captureScarePose(ui.elapsed);
      if(!layered) {
        canvas.style.transform=`translate(${p.x}px,${p.y}px) rotate(${p.tilt}deg) scale(${p.scale*(1+p.attack*.65)})`;
        return;
      }
      place('torso',p.x*.6,p.y+30,p.z-60,p.tilt*.4,p.pitch*.5,p.yaw*.7,p.scale);
      place('head',p.x,p.y,p.z,p.tilt,p.pitch,p.yaw,p.scale);
      place('left-eye',p.x-2+p.eyeShift,p.y,p.z+8,p.tilt-1.5*p.creep,p.pitch*.9,p.yaw*.8,p.scale);
      place('right-eye',p.x+2-p.eyeShift*.6,p.y-2,p.z+13,p.tilt+2*p.creep,p.pitch*.86,p.yaw*.7,p.scale);
      place('teeth',p.x,p.y-2,p.z+17,p.tilt,p.pitch,p.yaw,p.scale);
      place('jaw',p.x+9*p.jaw,p.y+p.jawY,p.z+24+p.jaw*11,p.tilt+p.jawTilt,p.pitch-12*p.jaw,p.yaw-4*p.jaw,p.scale);
      place('left-hand',-p.handX,17-p.hands*20,p.handZ,-13+p.hands*19,-6+p.hands*10,18-p.hands*9,1.08);
      place('right-hand',p.handX+28,45-p.hands*30,p.handZ+19,16-p.hands*21,9-p.hands*13,-19+p.hands*11,1.1);
    },
  };
}
