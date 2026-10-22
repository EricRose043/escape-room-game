import test from 'node:test';
import assert from 'node:assert/strict';
import * as logic from '../src/logic/index.js';

function progressed() {
  const s=logic.createChapter({jumpScare:true});
  return {...s,checkpointId:'production.checkpoint',inventory:{itemIds:logic.ITEMS.map(i=>i.id)},
    flashlight:{charge:82.5,mode:'uv',enabled:true},
    puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:true,restoreElapsed:0.1}},
    player:{...s.player,x:18.5,z:-9.5,paused:false},ui:logic.createCapture({jumpScare:true})};
}
test('版本一存檔只包含必要進度且往返一致',()=>{
  const s=progressed(),before=structuredClone(s),data=logic.createChapterSave(s);
  assert.deepEqual(data,{version:1,chapterId:'chapter-1',checkpointId:'production.checkpoint',
    itemIds:logic.ITEMS.map(i=>i.id),puzzles:{'power.main':{installedItemId:'power.fuse',restored:true}},
    flashlight:{charge:82.5,mode:'uv'}});
  assert.deepEqual(logic.validateChapterSave(data),[]);
  const text=logic.serializeChapterSave(s),parsed=logic.parseChapterSave(text);
  assert.equal(parsed.status,'valid');assert.deepEqual(parsed.data,data);
  const restored=logic.restoreChapterSave(parsed.data,{jumpScare:false});
  assert.equal(restored.player.x,6.5);assert.equal(restored.player.z,-6.5);assert.equal(restored.player.yaw,-Math.PI/2);
  assert.equal(restored.player.paused,true);assert.deepEqual(restored.ui,{mode:'explore'});assert.deepEqual(restored.events,[]);
  assert.deepEqual(restored.flashlight,{charge:82.5,mode:'uv',enabled:false});assert.equal(restored.jumpScare,false);
  assert.equal(logic.powerProgress(restored,'power.main'),1);assert.equal(restored.monsters[logic.MONSTERS[0].id].mode,'patrol');
  assert.deepEqual(logic.createChapterSave(restored),data);assert.deepEqual(s,before);
  assert.equal(logic.parseChapterSave(null).status,'empty');
});
test('壞 JSON 舊版本未知 ID 與矛盾進度不能載入',()=>{
  assert.equal(typeof logic.parseChapterSave,'function');
  for(const raw of ['', '{broken', 'null', '[]', '3', '"text"']) {
    const result=logic.parseChapterSave(raw);assert.equal(result.status,'invalid');assert.ok(result.reason);
  }
  for(const change of [
    d=>d.version=0,d=>d.version=2,d=>d.version='1',d=>d.chapterId='chapter-2',d=>d.checkpointId='missing',
    d=>d.itemIds.push('missing'),d=>d.itemIds.push(d.itemIds[0]),d=>d.itemIds=null,
    d=>d.flashlight.charge=-1,d=>d.flashlight.charge=101,d=>d.flashlight.charge='82',d=>d.flashlight.mode='red',
    d=>d.flashlight.enabled=true,d=>d.position={x:0,z:0},d=>d.jumpScare=true,d=>delete d.version,
    d=>d.puzzles['power.main'].restored='true',d=>d.puzzles['power.main'].installedItemId='lobby.battery',
    d=>d.puzzles['power.main'].installedItemId=null,d=>d.puzzles['power.main'].restoreElapsed=1,
    d=>delete d.puzzles['power.main'],d=>d.puzzles['production.sequence']={restored:true},
    d=>d.itemIds=d.itemIds.filter(id=>id!=='power.fuse'),
    d=>d.itemIds=d.itemIds.filter(id=>id!=='lobby.flashlight'),
    d=>d.puzzles['power.main'].restored=false,
  ]) {
    const bad=logic.createChapterSave(progressed());change(bad);
    const result=logic.parseChapterSave(JSON.stringify(bad));
    assert.equal(result.status,'invalid');assert.ok(result.reason);assert.equal(logic.restoreChapterSave(bad),null);
  }
  const noTorch=logic.createChapterSave(logic.createChapter());noTorch.flashlight.charge=50;
  assert.ok(logic.validateChapterSave(noTorch).length>0);
  noTorch.flashlight.charge=100;noTorch.checkpointId='power.checkpoint';assert.ok(logic.validateChapterSave(noTorch).length>0);
  const nan=logic.createChapterSave(progressed());nan.flashlight.charge=NaN;assert.ok(logic.validateChapterSave(nan).length>0);
});
