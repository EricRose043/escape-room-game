import test from 'node:test';
import assert from 'node:assert/strict';
import * as l from '../src/logic/index.js';
import {selectInteractionTarget,viewRay,rayBoxDistance} from '../src/logic/interaction.js';

const door=id=>l.DOORS.find(entry=>entry.id===id);
function ready({production=false,color=false}={}) {
  const s=l.createChapter();
  return {...s,checkpointId:'production.checkpoint',player:{...s.player,paused:false},
    inventory:{itemIds:['lobby.flashlight','lobby.employee-card','lobby.factory-map','power.fuse']},
    puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:true},
      'production.sequence':{installedItemId:null,restored:production},
      'production.color-sequence':{...s.puzzles['production.color-sequence'],restored:color}},
    monsters:Object.fromEntries(Object.entries(s.monsters).map(([id,m])=>[id,{...m,mode:'patrol',x:10,z:-10.3,yaw:Math.PI/2}]))};
}
function aimAt(s,d,y=1.6,z=(d.bounds.minZ+d.bounds.maxZ)/2,distance=.75) {
  const b=d.bounds,x=b.minX-distance,centreZ=(b.minZ+b.maxZ)/2;
  return {...s,player:{...s.player,x,z:centreZ,
    yaw:Math.atan2(x-b.minX,centreZ-z),pitch:Math.atan2(y-l.EYE_HEIGHT,Math.hypot(distance,z-centreZ))}};
}

for(const [doorId,deviceId,kind] of [
  ['production.east-door','production.sequence-keypad','keypad'],
  ['corridor.door-1','corridor.clue-note','clueNote'],
])test(`${doorId} 整片門的上下及左右邊緣均能操作原控制器`,()=>{
  const d=door(doorId),s=ready({production:doorId.startsWith('corridor')});
  assert.equal(l.isDoorOpen(d,s),false);
  for(const y of [.24,1.6,2.42])for(const z of [d.bounds.minZ+.08,(d.bounds.minZ+d.bounds.maxZ)/2,d.bounds.maxZ-.08]) {
    const at=aimAt(s,d,y,z),target=l.selectChapterTarget(at);
    assert.equal(target?.id,deviceId,`the visible leaf at y=${y}, z=${z} must be selectable`);
    assert.equal(target.kind,kind);assert.equal(target.interactionSource,'door');
    assert.equal(target.interactionOccluderId,doorId);
  }
});

test('整片裝配線門仍開啟同一個3142密碼面板，錯碼不得開門',()=>{
  const d=door('production.east-door'),s=aimAt(ready(),d,.35,d.bounds.maxZ-.12);
  const opened=l.updateChapter(s,{interactPressed:true},0);
  assert.equal(opened.ui.mode,'keypad');assert.equal(opened.ui.deviceId,'production.sequence-keypad');
  const wrong=l.submitPuzzleCode(opened,'production.sequence-keypad','1234');
  assert.equal(l.isDoorOpen(d,wrong),false);
  const solved=l.submitPuzzleCode(wrong,'production.sequence-keypad','3142');
  assert.equal(solved.puzzles['production.sequence'].restored,true);assert.equal(l.isDoorOpen(d,solved),true);
  assert.equal(l.selectChapterTarget({...solved,player:s.player})?.interactionSource,undefined,'open leaves stop being interaction surfaces');
});

test('整片第一隔離門執行原維修卡記錄；四色完成才會解鎖',()=>{
  const d=door('corridor.door-1');
  for(const color of [false,true]) {
    const s=aimAt(ready({production:true,color}),d,2.35,d.bounds.maxZ-.1);
    const next=l.updateChapter(s,{interactPressed:true},0);
    assert.equal(next.ui.mode,'explore');assert.ok(next.foundClueIds.includes('corridor.color-key'));
    assert.equal(next.foundClueIds.filter(id=>id==='corridor.color-key').length,1);
    assert.equal(l.isDoorOpen(d,next),color,'whole-door targeting must preserve the existing puzzle condition');
    assert.equal(next.corridor.active,false,'reading the gate must not start the chase early');
  }
});

test('整片門仍遵守兩公尺距離及暫停規則',()=>{
  for(const id of ['production.east-door','corridor.door-1']) {
    const d=door(id),s=ready({production:id.startsWith('corridor')});
    assert.equal(l.selectChapterTarget(aimAt(s,d,1.6,undefined,2))?.interactionSource,'door');
    assert.equal(l.selectChapterTarget(aimAt(s,d,1.6,undefined,2.001)),null,'cannot operate a door from more than2m away');
    const at=aimAt(s,d);assert.equal(l.selectChapterTarget({...at,player:{...at.player,paused:true}}),null);
  }
});

test('門面只能略過自己的關閉門片，走廊真實牆面仍擋住互動',()=>{
  const d=door('corridor.door-1'),s=ready({production:true}),at=aimAt(s,d),alias=l.selectChapterTarget(at);
  assert.equal(alias?.interactionSource,'door');
  const behindWall={...at.player,x:23,z:-8.1,yaw:Math.atan2(23-d.bounds.minX,-8.1+6.5),pitch:0};
  const blockers=l.getGeometry(s).occluderBoxes,ray=viewRay(behindWall),distance=rayBoxDistance(ray,d.bounds);
  assert.ok(distance<2);
  assert.ok(blockers.some(b=>b.kind==='wall'&&b.id==='corridor.entry-north'&&rayBoxDistance(ray,b)<distance));
  assert.equal(selectInteractionTarget(behindWall,s.inventory,[],[alias],blockers),null,'the real corridor north wall must not be skipped with the leaf');
  const withoutWall=blockers.filter(b=>b.id!=='corridor.entry-north');
  assert.equal(selectInteractionTarget(behindWall,s.inventory,[],[alias],withoutWall)?.id,'corridor.clue-note','the ray and distance themselves are valid');
});

test('追逐開始或結束後，關在身後的門片不會變成可重開的控制器',()=>{
  for(const phase of ['active','complete']) {
    const s=ready({production:true,color:true});s.foundClueIds=['production.color-clue','corridor.color-key'];
    s.corridor={...s.corridor,active:phase==='active',complete:phase==='complete',gates:{...s.corridor.gates,closedIds:['corridor.door-1']}};
    for(const id of ['production.east-door','corridor.door-1']) {
      const target=l.selectChapterTarget(aimAt(s,door(id)));
      assert.equal(target?.interactionSource,undefined,`${phase} must not expose ${id} as an unlock target`);
    }
  }
});
