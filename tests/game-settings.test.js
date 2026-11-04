import test from 'node:test';
import assert from 'node:assert/strict';
import * as s from '../src/logic/settings.js';

const policy='escape-room.capture-enabled.v2';
function memory(entries=[]){const map=new Map(entries);return {map,getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)};}
test('遊戲設定首次更新舊關閉值，只開驚嚇並保留音量、靈敏度及遊戲存檔',()=>{
 const storage=memory([[s.SETTINGS_KEY,s.serialize({volume:61,jumpScare:false,mouseSensitivity:2.25})],['star-candy-park.chapter-1.save','keep-game-save'],['other','keep']]);
 const store=s.createGameSettingsStorage(storage),loaded=store.load();
 assert.deepEqual(loaded,{volume:61,jumpScare:true,mouseSensitivity:2.25});assert.equal(storage.map.get(policy),'1');assert.equal(storage.map.get('star-candy-park.chapter-1.save'),'keep-game-save');assert.equal(storage.map.get('other'),'keep');
 assert.equal(s.deserialize(storage.map.get(s.SETTINGS_KEY),s.createSettings(false)).jumpScare,true);
 const fresh=s.createGameSettingsStorage(memory());assert.equal(fresh.load().jumpScare,true);
});
test('一次更新後手動關閉可跨重載保留，兩個遊戲設定實例保持一致',()=>{
 const storage=memory(),main=s.createGameSettingsStorage(storage);assert.equal(main.load().jumpScare,true);
 const panel=s.createGameSettingsStorage(storage);assert.equal(panel.load().jumpScare,true);panel.update('jumpScare',false);
 assert.equal(main.load().jumpScare,false);assert.equal(s.createGameSettingsStorage(storage).load().jumpScare,false);
 main.update('volume',0);assert.deepEqual(panel.load(),{volume:0,jumpScare:false,mouseSensitivity:1});
});
test('明確query0或1覆寫啟動並寫入共用設定，無效query不改選擇',()=>{
 const firstVisit=memory();assert.equal(s.createGameSettingsStorage(firstVisit,{search:'?jumpscare=0'}).load().jumpScare,false);assert.equal(s.createGameSettingsStorage(firstVisit).load().jumpScare,false,'首次query0優先於預設開啟及一次升級');
 const storage=memory();s.createGameSettingsStorage(storage).load();
 for(const [search,expected] of [['?jumpscare=0',false],['?jumpscare=1',true],['?jumpscare=0',false],['?jumpscare=maybe',false],['',false]]){
  assert.equal(s.createGameSettingsStorage(storage,{search}).load().jumpScare,expected);
  assert.equal(s.createGameSettingsStorage(storage).load().jumpScare,expected);
 }
 const samePage=s.createGameSettingsStorage(storage,{search:'?jumpscare=1'});assert.equal(samePage.load().jumpScare,true);samePage.update('jumpScare',false);assert.equal(samePage.load().jumpScare,false,'啟動query不在同頁每次重新load覆蓋後續手動選擇');
});
test('storage拒絕讀或寫時當次仍有動畫，舊資料完整保留且可重試保存',()=>{
 const old=s.serialize({volume:63,jumpScare:false,mouseSensitivity:1.75}),storage=memory([[s.SETTINGS_KEY,old]]);let fail=true;
 const unavailable={getItem:key=>storage.getItem(key),setItem(key,value){if(fail)throw Error('quota');storage.setItem(key,value);}};
 const store=s.createGameSettingsStorage(unavailable);assert.deepEqual(store.load(),{volume:63,jumpScare:true,mouseSensitivity:1.75});assert.equal(store.status().state,'error');assert.equal(storage.map.get(s.SETTINGS_KEY),old);assert.equal(storage.map.has(policy),false);
 fail=false;assert.equal(store.save(),true);assert.equal(storage.map.get(policy),'1');assert.equal(s.createGameSettingsStorage(storage).load().jumpScare,true);
 let writes=0;const denied=s.createGameSettingsStorage({getItem(){throw Error('denied');},setItem(){writes++;}});assert.equal(denied.load().jumpScare,true);assert.equal(denied.status().state,'error');assert.equal(writes,0,'讀不到原設定時不要用預設音量覆寫它');
 assert.equal(s.createGameSettingsStorage({getItem(){throw Error('denied');},setItem(){throw Error('denied');}},{search:'?jumpscare=0'}).load().jumpScare,false);
});
