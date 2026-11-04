import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../../../../src/logic/index.js';
const l={...core,updateChapter:(s,a,d,options)=>core.updateChapter(s,a,d,{...options,progressive:true,reasoning:true})};
const logic=l,answers=l.deriveReasoningAnswers();
import {COLOR_SEQUENCE} from '../../../../src/logic/puzzles/color-sequence.js';
import {EXIT_CODE} from '../../../../src/logic/puzzles/exit-code.js';

const puzzleId='power.main',keypadId='power.keypad';
const puzzle=()=>logic.getPuzzle(puzzleId);
function aim(s,x,y,z) {
  const dx=x-s.player.x,dz=z-s.player.z;
  const yaw=Math.atan2(-dx,-dz),pitch=Math.atan2(y-logic.EYE_HEIGHT,Math.hypot(dx,dz));
  return logic.updateChapter(s,{look:{dYaw:yaw-s.player.yaw,dPitch:pitch-s.player.pitch}});
}
function walk(s,x,z) {
  s=aim(s,x,logic.EYE_HEIGHT,z);
  for(let i=0;i<500;i++) {
    const distance=Math.hypot(x-s.player.x,z-s.player.z);
    if(distance<1e-7) return s;
    const next=logic.updateChapter(s,{move:{y:1}},Math.min(0.1,distance/logic.WALK_SPEED));
    assert.ok(Math.hypot(next.player.x-s.player.x,next.player.z-s.player.z)>1e-9,`路線卡住：${s.player.x},${s.player.z} → ${x},${z}`);
    s=next;
  }
  assert.fail('路線超時');
}
function take(s,id) {
  const item=logic.ITEMS.find(i=>i.id===id);
  s=aim(s,(item.minX+item.maxX)/2,(item.minY+item.maxY)/2,(item.minZ+item.maxZ)/2);
  s=logic.updateChapter(s,{interactPressed:true});
  assert.ok(s.inventory.itemIds.includes(id)); return s;
}
function journey() {
  let s=logic.createChapter();
  s={...s,player:logic.setPaused(s.player,false)};
  assert.equal(s.player.x,logic.WORLD.spawn.x); assert.equal(s.player.z,logic.WORLD.spawn.z);
  assert.equal(logic.hasFlashlight(s),false);
  s=take(s,'lobby.factory-map');
  s=take(walk(walk(s,1.5,6.6),1.5,4.95),'lobby.employee-card');
  s=take(walk(walk(walk(s,1.5,6.6),-1.5,6.6),-1.5,5.5),'lobby.flashlight');
  s=logic.updateChapter(s,{flashlightPressed:true});
  for(const [x,z] of [[-1.5,6.6],[1.5,6.6],[1.5,3],[0,3],[0,-4.6],[-3,-4.6]])s=walk(s,x,z);
  s=take(s,'power.fuse');
  s=walk(walk(s,0,-4.6),3,-3);
  const box=logic.DEVICES.find(d=>d.kind==='fuseBox');
  s=aim(s,box.bounds.minX,1.4,-3);
  s=logic.updateChapter(s,{interactPressed:true});
  assert.equal(s.puzzles[puzzleId].installedItemId,box.acceptsItemId);
  return s;
}
function opened() {
  let s=walk(journey(),3,-5.2);
  s=aim(s,4.5,1.4,-5.2);
  return logic.updateChapter(s,{interactPressed:true});
}
function enter(s,code) {
  for(const value of code) s=logic.updateChapter(s,{keypadCommands:[{type:'digit',value}]});
  return logic.updateChapter(s,{keypadCommands:[{type:'submit'}]});
}


function walkTo(s,x,z){
 for(let i=0;i<1200;i++){
  const dx=x-s.player.x,dz=z-s.player.z,distance=Math.hypot(dx,dz);if(distance<.015)return s;
  const strength=Math.min(1,distance/(l.WALK_SPEED*.05)),vx=dx/distance*strength,vz=dz/distance*strength,{yaw}=s.player;
  const next=l.updateChapter(s,{move:{x:vx*Math.cos(yaw)-vz*Math.sin(yaw),y:-vx*Math.sin(yaw)-vz*Math.cos(yaw)}},.05);
  assert.equal(next.ui.mode,'explore',`潛行路線在 ${s.player.x.toFixed(2)},${s.player.z.toFixed(2)} 前往 ${x},${z} 時被看見`);
  assert.ok(Math.hypot(next.player.x-s.player.x,next.player.z-s.player.z)>.001,`路線被擋 ${x},${z}`);
  assert.ok(!l.getGeometry(next).collisionBoxes.some(b=>l.circleOverlapsBox(next.player.x,next.player.z,b)));
  s=next;
 }
 assert.fail('route timeout');
}
function interact(s,id){
 const d=l.DEVICES.find(d=>d.id===id),b=d.bounds,x=(b.minX+b.maxX)/2,z=(b.minZ+b.maxZ)/2,y=(b.minY+b.maxY)/2;
 const yaw=Math.atan2(s.player.x-x,s.player.z-z),pitch=Math.atan2(y-l.EYE_HEIGHT,Math.hypot(x-s.player.x,z-s.player.z));
 s=l.updateChapter(s,{look:{dYaw:yaw-s.player.yaw,dPitch:pitch-s.player.pitch}},0);
 assert.equal(l.selectChapterTarget(s)?.id,id,`${id} must be actually targeted`);
 const next=l.updateChapter(s,{interactPressed:true},0);assert.notEqual(next.ui.mode,'caught',`互動${id}時已被看見`);return next;
}
function code(s,value){const next=l.updateChapter(s,{keypadCommands:[...value].map(value=>({type:'digit',value})).concat({type:'submit'})});assert.equal(next.ui.mode,'explore');return next;}
function route(s,points){for(const [x,z] of points)s=walkTo(s,x,z);return s;}

test('被看見必抓的新規則仍可潛行解裝配線並跑完走廊，解2123直到脫軌END',()=>{
 let s=enter(opened(),answers.power);
 for(const [x,z] of [[3,-6.5],[7.5,-6.5]])s=walk(s,x,z);
 assert.equal(s.checkpointId,'production.checkpoint');
 s=l.restoreCheckpoint(s);s.pressure={level:3,remaining:0,deviceId:null};
 // Follow the north side behind the patrol, then work down the east service lane.
 // Arrived from the real office spawn, collected items and solved power, then restored the earned checkpoint. No later puzzle,
 // monster, clue or player-position flags are assigned during the route.
 s=route(s,[[8.2,-6.5],[10,-6.5],[10,-10.3],[19.9,-10.3],[19.9,-9.4]]);
 s=interact(s,'production.sequence-keypad');s=code(s,answers.production);assert.equal(s.puzzles['production.sequence'].restored,true);
 s=route(s,[[20.1,-9.4],[20.1,-1.4]]);
 for(const color of answers.colors){const b=l.DEVICES.find(d=>d.id===`production.button-${color}`).bounds;s=walkTo(s,20.1,(b.minZ+b.maxZ)/2);s=interact(s,`production.button-${color}`);}
 assert.equal(s.puzzles[COLOR_SEQUENCE.id].restored,true);
 s=route(s,[[20.1,-6.5],[22.2,-6.5]]);s=interact(s,'corridor.clue-note');
 s=route(s,[[27,-6.5],[27,-17.5],[41.2,-17.5]]);assert.equal(s.corridor.complete,true);assert.equal(s.checkpointId,'exit.checkpoint');
 s=route(s,[[50.5,-17.5],[50.5,-13.2]]);s=interact(s,'exit.clue-note');
 s=route(s,[[49.9,-21.2],[50.3,-21.2]]);s=interact(s,'exit.final-keypad');s=code(s,answers.exit);assert.equal(s.puzzles['exit.final'].restored,true);
 s=route(s,[[50.3,-17.5],[53.8,-17.5],[53.8,-21.9],[55.5,-21.9]]);
 for(const [i,id] of l.TRAIN_CARD_IDS.entries()){s=walkTo(s,55.5+i*3,-21.9);s=interact(s,id);}
 s=route(s,[[54.25,-21.9],[54.25,-17.5]]);s=interact(s,'bay.train-console');s=code(s,answers.train);assert.equal(s.trainStarted,true);
 s=route(s,[[54.25,-19.2],[61.65,-19.2],[61.65,-17.5]]);s=interact(s,'bay.train');assert.equal(s.ui.mode,'ending');
 for(let i=0;i<l.ENDING_SECONDS*10;i++)s=l.updateChapter(s,{},.1);
 assert.equal(s.ui.mode,'complete');assert.equal(s.ui.variant,'derailment');assert.equal(s.completed,true);
 assert.deepEqual(l.validateChapterSave(l.createChapterSave(s)),[]);
});
