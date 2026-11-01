import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettings, updateSetting, serialize, deserialize, createSettingsStorage,
  createSettingsMenu, updateSettingsMenu, settingsKeyboardCommand, settingsGamepadCommand } from '../src/logic/settings.js';

test('設定預設值由明確驚嚇選擇建立，不與外部物件共用狀態', () => {
  assert.deepEqual(createSettings(false), {volume:32,jumpScare:false,mouseSensitivity:1});
  assert.equal(createSettings(true).jumpScare,true);
  assert.throws(()=>createSettings(), /boolean/);
  const s=createSettings(false);s.volume=0;assert.equal(createSettings(false).volume,32);
});
test('設定上下界夾住、無效值忽略且不改舊物件', () => {
  const s=createSettings(false), before=structuredClone(s);
  for(const [key,value,expected] of [['volume',-1,0],['volume',101,100],['mouseSensitivity',0,.25],['mouseSensitivity',9,3],['jumpScare',true,true]])
    assert.equal(updateSetting(s,key,value)[key],expected);
  for(const value of [NaN,Infinity,'80',null]) assert.deepEqual(updateSetting(s,'volume',value),s);
  assert.deepEqual(updateSetting(s,'jumpScare','false'),s);
  assert.deepEqual(updateSetting(s,'unknown',0),s);assert.deepEqual(s,before);
});
test('設定往返一致，壞資料／未知版本／缺欄與錯型回傳明確預設', () => {
  const defaults=createSettings(false),settings={volume:80,jumpScare:true,mouseSensitivity:2};
  assert.deepEqual(deserialize(serialize(settings),defaults),settings);
  for(const raw of [null,'', '{broken','null','[]',JSON.stringify({version:99,settings}),JSON.stringify({version:1,settings:{...settings,volume:'50'}}),JSON.stringify({version:1,settings:{...settings,volume:101}}),JSON.stringify({version:1,settings:{volume:32}})])
    assert.deepEqual(deserialize(raw,defaults),defaults);
});
test('設定儲存僅操作自己的 key，拒絕儲存時仍能玩且保留舊檔', () => {
  const map=new Map([['other-game','keep']]);let fail=false;
  const storage={getItem:k=>map.get(k)??null,setItem(k,v){if(fail)throw Error('quota');map.set(k,v);}};
  const store=createSettingsStorage(storage,createSettings(false));assert.equal(store.load().volume,32);
  store.update('volume',70);const before=new Map(map);fail=true;store.update('volume',20);
  assert.equal(store.get().volume,20);assert.equal(store.status().state,'error');assert.deepEqual(map,before);
  fail=false;assert.equal(store.save(),true);assert.equal(createSettingsStorage(storage,createSettings(false)).load().volume,20);
  assert.equal(map.get('other-game'),'keep');
  const blocked=createSettingsStorage({getItem(){throw Error('denied');}},createSettings(false));
  assert.equal(blocked.load().jumpScare,false);assert.equal(blocked.status().state,'error');
});
test('鍵盤與Xbox／PS同一組命令可操作三項設定並返回，不洩漏關閉確認', () => {
  let menu=createSettingsMenu(createSettings(false));
  menu=updateSettingsMenu(menu,{type:'adjust',delta:1});assert.equal(menu.settings.volume,37);
  menu=updateSettingsMenu(menu,{type:'move',delta:1});
  menu=updateSettingsMenu(menu,{type:'activate'});assert.equal(menu.settings.jumpScare,true);
  menu=updateSettingsMenu(menu,{type:'move',delta:1});
  menu=updateSettingsMenu(menu,{type:'adjust',delta:-1});assert.equal(menu.settings.mouseSensitivity,.75);
  const before=structuredClone(menu);menu=updateSettingsMenu(menu,{type:'close'});assert.equal(menu.closed,true);assert.equal(before.closed,false);
  assert.deepEqual(updateSettingsMenu(menu,{type:'activate'}),menu);
  assert.deepEqual(settingsKeyboardCommand({code:'ArrowRight'}),{type:'adjust',delta:1});
  assert.equal(settingsKeyboardCommand({code:'Enter',repeat:true}),null);
  assert.deepEqual(settingsGamepadCommand({cancelPressed:true}),{type:'close'});
  assert.deepEqual(settingsGamepadCommand({menuDirection:'down'}),{type:'move',delta:1});
  assert.deepEqual(settingsGamepadCommand({confirmPressed:true}),{type:'activate'});
});
