import test from 'node:test';
import assert from 'node:assert/strict';
import * as l from '../src/logic/index.js';

// Route verification deliberately moves through the real chapter updater. No position
// assignments or collision-free substitutes are used between the declared start and end.
function walkTo(state,x,z){
  let s=state;
  for(let i=0;i<1200;i++){
    const dx=x-s.player.x,dz=z-s.player.z,distance=Math.hypot(dx,dz);
    if(distance<.015)return s;
    const step=l.WALK_SPEED*.05,strength=Math.min(1,distance/step),vx=dx/distance*strength,vz=dz/distance*strength;
    const {yaw}=s.player;
    const next=l.updateChapter(s,{move:{x:vx*Math.cos(yaw)-vz*Math.sin(yaw),y:-vx*Math.sin(yaw)-vz*Math.cos(yaw)}},.05);
    assert.equal(next.ui.mode,'explore',`route must remain playable toward ${x},${z}`);
    assert.ok(Math.hypot(next.player.x-s.player.x,next.player.z-s.player.z)>.001,`blocked at ${s.player.x},${s.player.z} toward ${x},${z}`);
    assert.ok(!l.getGeometry(next).collisionBoxes.some(b=>l.circleOverlapsBox(next.player.x,next.player.z,b)),`route overlaps collider near ${next.player.x},${next.player.z}`);
    s=next;
  }
  assert.fail(`route did not arrive at ${x},${z}`);
}
function interactAt(s,id){
 const d=l.DEVICES.find(d=>d.id===id)??l.ITEMS.find(d=>d.id===id);assert.ok(d,id);
 const b=d.bounds??d,x=(b.minX+b.maxX)/2,z=(b.minZ+b.maxZ)/2,y=(b.minY+b.maxY)/2;
 const yaw=Math.atan2(-(x-s.player.x),-(z-s.player.z)),pitch=Math.atan2(y-l.EYE_HEIGHT,Math.hypot(x-s.player.x,z-s.player.z));
 const aimed=l.updateChapter(s,{look:{dYaw:yaw-s.player.yaw,dPitch:pitch-s.player.pitch}},0);
 assert.equal(l.selectChapterTarget(aimed)?.id,id,`${id} must be visible and reachable from a walked-to standing position`);
 return l.updateChapter(aimed,{interactPressed:true},0);
}
function exitStart(){
 const s=l.createChapter(),c=l.CHECKPOINTS.find(c=>c.id==='exit.checkpoint');
 return {...s,checkpointId:c.id,player:l.createPlayer({...c.spawn,paused:false}),inventory:{itemIds:['lobby.flashlight','lobby.employee-card','power.fuse']},
  puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:true},'production.sequence':{installedItemId:null,restored:true},'production.color-sequence':{installedItemId:null,restored:true},'exit.final':{installedItemId:null,restored:true}},
  foundClueIds:['production.color-clue','corridor.color-key','exit.reverse-clue'],corridor:{...s.corridor,complete:true}};
}

test('從出口存檔點實際走過門洞，三張列車卡都能閱讀，再走至控制台解2123並登車',()=>{
 let s=exitStart();
 for(const [x,z] of [[50,-17.5],[53.8,-17.5],[53.8,-21.9],[55.5,-21.9]])s=walkTo(s,x,z);
 s=interactAt(s,'bay.traction-card');assert.deepEqual(s.trainPuzzle.readCardIds,['bay.traction-card']);
 s=walkTo(s,58.5,-21.9);s=interactAt(s,'bay.brake-card');
 s=walkTo(s,61.5,-21.9);s=interactAt(s,'bay.lighting-card');assert.deepEqual(s.trainPuzzle.readCardIds,l.TRAIN_CARD_IDS);
 for(const [x,z] of [[54.25,-21.9],[54.25,-17.5]])s=walkTo(s,x,z);
 s=interactAt(s,'bay.train-console');assert.equal(s.ui.mode,'keypad');
 s=l.updateChapter(s,{keypadCommands:[...l.TRAIN_CODE].map(value=>({type:'digit',value})).concat({type:'submit'})});assert.equal(s.trainStarted,true);
 // The detailed rear carriage is solid. Follow its north side and use the
 // remaining platform gap beside the boarding carriage, rather than walking through it.
 for(const [x,z] of [[54.25,-19.2],[61.65,-19.2],[61.65,-17.5]])s=walkTo(s,x,z);
 s=interactAt(s,'bay.train');assert.equal(s.ui.mode,'ending');assert.equal(s.ui.variant,'derailment');
});

test('新辦公桌及6.6出生點保留三個開場物品的可取得路線及員工卡門禁',()=>{
 let s=l.createChapter();s={...s,player:{...s.player,paused:false}};
 assert.equal(s.player.z,6.6);assert.ok(!l.getGeometry(s).collisionBoxes.some(b=>l.circleOverlapsBox(s.player.x,s.player.z,b)));
 s=interactAt(s,'lobby.factory-map');assert.equal(l.isDoorOpen(l.DOORS.find(d=>d.id==='lobby.power-door'),s),false);
 for(const [x,z] of [[-1.5,6.6],[-1.5,5.4]])s=walkTo(s,x,z);
 s=interactAt(s,'lobby.flashlight');assert.equal(l.isDoorOpen(l.DOORS.find(d=>d.id==='lobby.power-door'),s),false);
 for(const [x,z] of [[-1.5,6.6],[1.5,6.6],[1.5,4.9]])s=walkTo(s,x,z);
 s=interactAt(s,'lobby.employee-card');
 assert.ok(['lobby.factory-map','lobby.flashlight','lobby.employee-card'].every(id=>s.inventory.itemIds.includes(id)));
 for(const [x,z] of [[1.5,1],[0,1],[0,-1.2]])s=walkTo(s,x,z);
 assert.equal(s.checkpointId,'power.checkpoint');assert.ok(s.player.z<-.2,'桌子不會擋住前往控制室的通路');
});
