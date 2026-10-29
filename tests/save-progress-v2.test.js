import test from 'node:test';
import assert from 'node:assert/strict';
import * as l from '../src/logic/index.js';
function progressed(){const s=l.createChapter();return {...s,checkpointId:'production.checkpoint',player:{...s.player,paused:false},inventory:{itemIds:l.ITEMS.map(i=>i.id)},puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:true}},flashlight:{charge:41,mode:'uv',enabled:false}};}
const solved=s=>({...s,puzzles:{...s.puzzles,'production.sequence':{installedItemId:null,restored:true}}});
test('新版存檔保存裝配線與列車，序列化往返不改原狀態',()=>{
 const state={...solved(progressed()),trainStarted:true},before=structuredClone(state);
 const data=l.createChapterSave(state);assert.equal(data.version,2);assert.equal(data.trainStarted,true);assert.equal(data.puzzles['production.sequence'].restored,true);
 const loaded=l.restoreChapterSave(l.parseChapterSave(l.serializeChapterSave(state)).data);
 assert.equal(loaded.trainStarted,true);assert.equal(loaded.puzzles['production.sequence'].restored,true);assert.equal(loaded.flashlight.charge,41);
 assert.deepEqual(l.createChapterSave(loaded),data);assert.deepEqual(state,before);
});
test('舊版存檔仍可載入，不補造從未保存的列車進度',()=>{
 const data=l.createChapterSave(progressed());assert.equal(data.version,1);
 const loaded=l.restoreChapterSave(l.parseChapterSave(JSON.stringify(data)).data);
 assert.equal(loaded.puzzles['power.main'].restored,true);assert.equal(loaded.puzzles['production.sequence'].restored,false);assert.equal(loaded.trainStarted,false);
});
test('裝配線解開與列車啟動當幀各自立即存檔，不等離頁',()=>{
 const values=new Map();let writes=0;const storage={getItem:k=>values.get(k)??null,setItem(k,v){writes++;values.set(k,v);}};
 const store=l.createSaveStorage(storage);store.load();const initial=progressed();assert.equal(store.restart(initial),true);
 const next=solved(initial),before=writes;store.observe(initial,next,.01);assert.equal(writes,before+1);
 assert.equal(l.parseChapterSave(values.get(l.CHAPTER_SAVE_KEY)).data.puzzles['production.sequence'].restored,true);
 const train={...next,trainStarted:true};store.observe(next,train,.01);assert.equal(writes,before+2);
 assert.equal(l.parseChapterSave(values.get(l.CHAPTER_SAVE_KEY)).data.trainStarted,true);
});
test('新版拒絕遺漏欄位、未知版本及矛盾列車進度',()=>{
 const data=l.createChapterSave({...solved(progressed()),trainStarted:true});
 for(const mutate of [d=>delete d.trainStarted,d=>d.trainStarted='yes',d=>d.version=99,d=>delete d.puzzles['production.sequence'],d=>d.puzzles['production.sequence'].restored=false,d=>d.puzzles['production.sequence'].installedItemId='power.fuse',d=>d.puzzles['unknown']={installedItemId:null,restored:true},d=>d.itemIds=d.itemIds.filter(id=>id!=='lobby.employee-card'),d=>d.puzzles['power.main'].restored=false]){
  const invalid=structuredClone(data);mutate(invalid);assert.equal(l.parseChapterSave(JSON.stringify(invalid)).status,'invalid');assert.equal(l.restoreChapterSave(invalid),null);
 }
});
test('新版寫入失敗保留舊檔，重試可保存列車新進度',()=>{
 const initial=progressed();let raw=l.serializeChapterSave(initial),fail=true;const old=raw;
 const store=l.createSaveStorage({getItem:()=>raw,setItem(_k,value){if(fail)throw Error('quota');raw=value;}});store.load();
 const next={...solved(initial),trainStarted:true};store.observe(initial,next,.1);assert.equal(raw,old);assert.equal(store.status().state,'error');
 fail=false;assert.equal(store.flush(),true);assert.equal(l.restoreChapterSave(l.parseChapterSave(raw).data).trainStarted,true);
});
