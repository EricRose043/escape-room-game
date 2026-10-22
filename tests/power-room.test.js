import test from 'node:test';
import assert from 'node:assert/strict';
import * as logic from '../src/logic/index.js';
import { POWER_ROOM } from '../src/logic/areas/power-room.js';

const device = id => POWER_ROOM.devices.find(d => d.kind === id);
const playing = () => {
  const s = logic.createChapter();
  return {...s, player:{...s.player,paused:false},inventory:{itemIds:['lobby.flashlight']}};
};
const atBox = s => ({...s,player:{...s.player,x:3,z:-3,yaw:-Math.PI/2,pitch:0}});
const atKeypad = s => ({...s,player:{...s.player,x:3,z:-5.2,yaw:-Math.PI/2,pitch:0}});
const install = () => logic.updateChapter(atBox({...playing(),inventory:{itemIds:['lobby.flashlight','power.fuse']}}),{interactPressed:true});
const target = (p, items=[], devices=[device('fuseBox')], blockers=[]) =>
  logic.selectInteractionTarget(p,{itemIds:[]},items,devices,blockers);

test('設備互動沿用 2 公尺中央射線及遮擋規則',()=>{
  const d=device('fuseBox');
  const p={...playing().player,x:d.bounds.minX-2,z:-3,yaw:-Math.PI/2,pitch:0};
  assert.equal(target(p)?.id,d.id);
  assert.equal(target({...p,x:p.x-0.001}),null);
  assert.equal(target({...p,yaw:0}),null);
  assert.equal(target({...p,paused:true}),null);
  const wall={minX:3,maxX:3.1,minY:0,maxY:3,minZ:-4,maxZ:-2};
  assert.equal(target(p,[],[d],[wall]),null);
  assert.equal(target(p,[],[d],[{...d.bounds,id:d.id}])?.id,d.id);
  assert.equal(target(p,[],[d],[{...d.bounds,id:'other-wall'}]),null);
});
test('物品與設備只選最近可命中的目標',()=>{
  const p=atBox(playing()).player,d=device('fuseBox');
  const item={id:'test.item',kind:'fuse',minX:3.4,maxX:3.8,minY:1,maxY:2,minZ:-3.2,maxZ:-2.8};
  assert.equal(target(p,[item])?.id,item.id);
  const nearDevice={...d,id:'test.device',bounds:{...item,minX:3.1,maxX:3.3}};
  assert.equal(target(p,[item],[nearDevice])?.id,nearDevice.id);
  assert.equal(logic.selectInteractionTarget(p,{itemIds:[item.id]},[item],[d],[])?.id,d.id);
});
test('缺少保險絲不能啟動電箱',()=>{
  const s=atBox(playing()),next=logic.updateChapter(s,{interactPressed:true});
  assert.equal(next.ui.message,'缺少保險絲');
  assert.equal(next.puzzles['power.main'].installedItemId,null);
  assert.deepEqual(next.inventory,s.inventory);
});
test('取得保險絲後可安裝，不能重複安裝或重新撿取',()=>{
  let s=playing();
  s.player={...s.player,x:-3,z:-4.6,yaw:0,pitch:Math.atan2(-0.5,1.4)};
  s=logic.updateChapter(s,{interactPressed:true});
  assert.ok(s.inventory.itemIds.includes('power.fuse'));
  s=logic.updateChapter(atBox(s),{interactPressed:true});
  assert.equal(s.puzzles['power.main'].installedItemId,'power.fuse');
  assert.equal(s.ui.message,'備援控制已接通');
  const again=logic.updateChapter(s,{interactPressed:true});
  assert.deepEqual(again.puzzles,s.puzzles);
  assert.deepEqual(again.inventory,s.inventory);
  const fuse=POWER_ROOM.items.find(i=>i.kind==='fuse');
  assert.equal(logic.selectInteractionTarget({...s.player,x:-3,z:-4.6,yaw:0,pitch:Math.atan2(-0.5,1.4)},s.inventory,[fuse],[],[]),null);
  for(const actions of [{interactPressed:true,gameplayActive:false},{interactPressed:true,focusLost:true}]) {
    const initial=atBox({...playing(),inventory:s.inventory});
    assert.equal(logic.updateChapter(initial,actions).puzzles['power.main'].installedItemId,null);
  }
});
test('安裝後只亮控制指示燈，尚未恢復主電力',()=>{
  const s=install();
  assert.equal(logic.isDevicePowered(s,device('fuseBox')),true);
  assert.equal(s.puzzles['power.main'].restored,false);
  assert.equal(logic.isDoorOpen(POWER_ROOM.doors[0],s),false);
  assert.equal(logic.getGeometry(s).occluderBoxes.some(b=>b.id===POWER_ROOM.doors[0].id),true);
  assert.equal(s.ui.mode,'explore');
});
test('未安裝保險絲時密碼鎖不可輸入或提交',()=>{
  const s=logic.updateChapter(atKeypad(playing()),{interactPressed:true});
  assert.equal(s.ui.mode,'explore');
  assert.equal(s.ui.message,'控制器未通電');
  const puzzle=POWER_ROOM.puzzles[0];
  assert.equal(logic.validatePuzzleCode(s,puzzle.id,puzzle.code),false);
  const powered=logic.updateChapter(atKeypad(install()),{interactPressed:true});
  assert.equal(powered.ui.mode,'keypad');
  assert.equal(powered.ui.message,'');
  assert.equal(powered.puzzles[puzzle.id].restored,false);
});
test('正式隱藏碼只在紫外光有效照射時可見',()=>{
  const clue=logic.CLUES.find(c=>c.puzzleId==='power.main');
  assert.ok(clue);
  const s=playing(),p={...s.player,x:3,z:-4.5,yaw:-Math.PI/2,pitch:0};
  const light={enabled:true,charge:50,mode:'uv'},boxes=logic.getGeometry(s).occluderBoxes;
  assert.equal(logic.isClueVisible(p,light,clue,boxes),true);
  for(const patch of [{mode:'normal'},{enabled:false},{charge:0}]) assert.equal(logic.isClueVisible(p,{...light,...patch},clue,boxes),false);
  assert.equal(logic.isClueVisible({...p,yaw:0},light,clue,boxes),false);
  assert.equal(logic.isClueVisible({...p,x:6,yaw:Math.PI/2},light,clue,boxes),false);
  assert.equal(logic.isClueVisible(p,light,clue,[...boxes,{minX:4,maxX:4.1,minY:0,maxY:3,minZ:-5,maxZ:-4}]),false);
});
test('隱藏碼顯示與驗證引用同一份密碼資料',()=>{
  const puzzle=POWER_ROOM.puzzles[0],clue=logic.CLUES.find(c=>c.id===puzzle.clueId);
  assert.match(puzzle.code,/^\d{4}$/);
  assert.equal(clue.text,`檢修碼：${puzzle.code}`);
  assert.equal(clue.puzzleId,puzzle.id);
  assert.equal(logic.validatePuzzleCode(install(),puzzle.id,puzzle.code),true);
  assert.equal(logic.validatePuzzleCode(install(),puzzle.id,'wrong'),false);
  assert.equal(logic.validatePuzzleCode(install(),'unknown',puzzle.code),false);
  assert.equal(logic.validatePuzzleCode(install(),puzzle.id,Number(puzzle.code)),false);
});
