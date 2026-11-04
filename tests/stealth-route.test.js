import test from 'node:test';
import assert from 'node:assert/strict';
import * as l from '../src/logic/index.js';
import {COLOR_SEQUENCE} from '../src/logic/puzzles/color-sequence.js';
import {EXIT_CODE} from '../src/logic/puzzles/exit-code.js';

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
 const initial=l.createChapter({jumpScare:true});
 let s=l.restoreCheckpoint({...initial,checkpointId:'production.checkpoint',player:{...initial.player,paused:false},inventory:{itemIds:['lobby.flashlight','lobby.employee-card','power.fuse']},puzzles:{...initial.puzzles,'power.main':{installedItemId:'power.fuse',restored:true}}});
 // Follow the north side behind the patrol, then work down the east service lane.
 // The start is the genuinely available powered checkpoint; no later puzzle,
 // monster, clue or player-position flags are assigned during the route.
 s=route(s,[[8.2,-6.5],[10,-6.5],[10,-10.3],[19.9,-10.3],[19.9,-9.4]]);
 s=interact(s,'production.sequence-keypad');s=code(s,l.getPuzzle('production.sequence').code);assert.equal(s.puzzles['production.sequence'].restored,true);
 s=route(s,[[20.1,-9.4],[20.1,-1.4]]);
 for(const color of COLOR_SEQUENCE.sequence){const b=l.DEVICES.find(d=>d.id===`production.button-${color}`).bounds;s=walkTo(s,20.1,(b.minZ+b.maxZ)/2);s=interact(s,`production.button-${color}`);}
 assert.equal(s.puzzles[COLOR_SEQUENCE.id].restored,true);
 s=route(s,[[20.1,-6.5],[22.2,-6.5]]);s=interact(s,'corridor.clue-note');
 s=route(s,[[27,-6.5],[27,-17.5],[41.2,-17.5]]);assert.equal(s.corridor.complete,true);assert.equal(s.checkpointId,'exit.checkpoint');
 s=route(s,[[50.5,-17.5],[50.5,-13.2]]);s=interact(s,'exit.clue-note');
 s=route(s,[[49.9,-21.2],[50.3,-21.2]]);s=interact(s,'exit.final-keypad');s=code(s,EXIT_CODE);assert.equal(s.puzzles['exit.final'].restored,true);
 s=route(s,[[50.3,-17.5],[53.8,-17.5],[53.8,-21.9],[55.5,-21.9]]);
 for(const [i,id] of l.TRAIN_CARD_IDS.entries()){s=walkTo(s,55.5+i*3,-21.9);s=interact(s,id);}
 s=route(s,[[54.25,-21.9],[54.25,-17.5]]);s=interact(s,'bay.train-console');s=code(s,l.TRAIN_CODE);assert.equal(s.trainStarted,true);
 s=route(s,[[54.25,-19.2],[61.65,-19.2],[61.65,-17.5]]);s=interact(s,'bay.train');assert.equal(s.ui.mode,'ending');
 for(let i=0;i<l.ENDING_SECONDS*10;i++)s=l.updateChapter(s,{},.1);
 assert.equal(s.ui.mode,'complete');assert.equal(s.ui.variant,'derailment');assert.equal(s.completed,true);
 assert.deepEqual(l.validateChapterSave(l.createChapterSave(s)),[]);
});
