import test from 'node:test';
import assert from 'node:assert/strict';
import * as logic from '../src/logic/index.js';

function memory(raw=null) {
  const values=new Map(raw===null?[]:[[logic.CHAPTER_SAVE_KEY,raw]]),calls=[];
  return {values,calls,getItem(key){calls.push(['get',key]);return values.get(key)??null;},
    setItem(key,value){calls.push(['set',key,value]);values.set(key,value);},
    removeItem(){assert.fail('不能刪除舊檔');},clear(){assert.fail('不能清除其他 key');}};
}
test('儲存讀寫失敗不崩潰不刪舊檔且回報未儲存',()=>{
  assert.equal(logic.CHAPTER_SAVE_KEY,'star-candy-park.chapter-1.save');
  for(const raw of ['{broken',JSON.stringify({version:2})]) {
    const storage=memory(raw);storage.values.set('settings','keep');
    const store=logic.createSaveStorage(storage);assert.equal(store.load().status,'invalid');
    const s=logic.createChapter();store.observe(s,{...s,flashlight:{...s.flashlight,mode:'uv'}},10);store.flush('pagehide');
    assert.equal(storage.values.get(logic.CHAPTER_SAVE_KEY),raw);assert.equal(storage.calls.filter(c=>c[0]==='set').length,0);
    assert.ok(store.status().message);assert.equal(store.restart(s),true);
    assert.equal(logic.parseChapterSave(storage.values.get(logic.CHAPTER_SAVE_KEY)).status,'valid');
    assert.equal(storage.values.get('settings'),'keep');
  }
  const storage=memory('old');storage.getItem=()=>{throw new Error('denied');};
  const store=logic.createSaveStorage(storage);assert.equal(store.load().status,'unavailable');
  store.observe(logic.createChapter(),logic.createChapter(),1);store.flush();assert.equal(storage.values.get(logic.CHAPTER_SAVE_KEY),'old');
  storage.setItem=()=>{throw new Error('quota');};
  assert.equal(store.restart(logic.createChapter()),false);assert.equal(store.status().state,'error');
  assert.match(store.status().message,/尚未儲存/);assert.equal(storage.values.get(logic.CHAPTER_SAVE_KEY),'old');
  storage.setItem=(key,value)=>storage.values.set(key,value);assert.equal(store.flush('pause'),true);
  assert.equal(store.status().state,'saved');
});
test('取得解題與存檔點立即寫入，耗電節流且離頁補寫',()=>{
  const storage=memory(),store=logic.createSaveStorage(storage);assert.equal(store.load().status,'empty');
  let s=logic.createChapter();assert.equal(store.restart(s),true);
  const writes=()=>storage.calls.filter(c=>c[0]==='set').length;
  const step=(next,dt=0.1)=>{const before=writes();store.observe(s,next,dt);s=next;return writes()-before;};
  assert.equal(step({...s,player:{...s.player,paused:false},inventory:{itemIds:['lobby.flashlight']}}),1);
  assert.equal(step({...s,checkpointId:'power.checkpoint'}),1);
  assert.equal(step({...s,inventory:{itemIds:[...s.inventory.itemIds,'power.fuse']}}),1);
  assert.equal(step({...s,puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:false}}}),1);
  assert.equal(step({...s,puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:true}}}),1);
  assert.equal(step({...s,checkpointId:'production.checkpoint'}),1);
  const originalStringify=JSON.stringify;let serializations=0;
  JSON.stringify=(...args)=>{serializations++;return originalStringify(...args);};
  try {
    const initial=writes();
    for(let i=0;i<49;i++) assert.equal(step({...s,flashlight:{...s.flashlight,charge:s.flashlight.charge-0.02}}),0);
    assert.equal(serializations,0,'未到節流時限不逐幀序列化');
    assert.equal(step({...s,flashlight:{...s.flashlight,charge:s.flashlight.charge-0.02}}),1);
    assert.equal(writes(),initial+1);assert.equal(serializations,1);
    step({...s,flashlight:{...s.flashlight,charge:s.flashlight.charge-0.02}});
    assert.equal(store.status().state,'pending');assert.equal(store.flush('visibilitychange'),true);
    const after=writes();store.flush('pagehide');assert.equal(writes(),after,'重複補寫不重複存取');
    const caught={...s,ui:logic.createCapture()};step(caught);
    const before=writes();step(logic.restoreCheckpoint(caught));assert.equal(writes(),before+1,'死亡回復立即寫入');
    for(let i=0;i<100;i++) step(s);
    assert.equal(writes(),before+1,'無進度變更不重寫');
  } finally {JSON.stringify=originalStringify;}
});
