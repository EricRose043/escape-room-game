import test from 'node:test';
import assert from 'node:assert/strict';
import {runtime} from './fixtures/settings-runtime.js';
import {createSettings,createSettingsStorage} from '../src/logic/settings.js';
import {createFactoryAudio} from '../src/game/audio.js';
import {readGamepad,capturePresentation} from '../src/logic/index.js';
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
test('正式 main 載入設定、即時關閉驚嚇、更新靈敏度並保持暫停',async()=>{
  const storage=memory(),store=createSettingsStorage(storage,createSettings(false));store.load();
  store.update('jumpScare',true);store.update('mouseSensitivity',2);
  const app=await runtime(storage);
  assert.equal(app.options().jumpScare,true);assert.equal(app.settings().mouseSensitivity,2);
  app.window.emit('factory-settings-open');assert.equal(app.session().paused,true);
  app.window.emit('factory-settings-change',{detail:{volume:0,jumpScare:false,mouseSensitivity:.5}});
  assert.equal(app.options().jumpScare,false);assert.equal(app.settings().mouseSensitivity,.5);
  assert.equal(capturePresentation({mode:'caught',elapsed:.2,jumpScareAllowed:true},app.options()).closeup,false);
  app.window.emit('factory-settings-close');assert.equal(app.session().paused,true);
});
test('工廠音量在開始／靜音切換後保留設定值與零音量',()=>{
  let volume;
  const engine={setMasterVolume:v=>{volume=v;},getStatus:()=>({supported:true,contextState:'running'}),setAmbience(){},stop(){},unlock:async()=>true};
  const audio=createFactoryAudio({audioFactory:()=>engine});
  audio.setMasterVolume(.7);audio.start();assert.equal(volume,.7);
  audio.toggle();assert.equal(volume,0);audio.toggle();assert.equal(volume,.7);
  audio.setMasterVolume(0);audio.start();assert.equal(volume,0);
});
test('Xbox Y／PS三角形開設定採按下邊緣，長按不重複',()=>{
  for(const id of ['Xbox','DualSense']) {
    const pad={id,mapping:'standard',index:0,axes:[],buttons:Array.from({length:17},(_,i)=>({pressed:i===3}))};
    const first=readGamepad(pad);assert.equal(first.actions.settingsPressed,true);
    assert.equal(readGamepad(pad,first.buttons).actions.settingsPressed,false);
  }
});
test('正式滑鼠輸入套用儲存的倍率，設定開啟時凍結轉頭',async()=>{
  const storage=memory(),store=createSettingsStorage(storage,createSettings(false));store.load();store.update('mouseSensitivity',2);
  const app=await runtime(storage);
  app.get('#start-new').emit('click');app.document.emit('keydown',{code:'ArrowRight'});app.document.emit('keydown',{code:'Enter'});
  await Promise.resolve();assert.equal(app.session().paused,false);
  app.document.emit('mousemove',{movementX:10,movementY:5});assert.deepEqual(app.look(),{dYaw:-.04,dPitch:-.02});
  app.window.emit('factory-settings-open');app.document.emit('mousemove',{movementX:10,movementY:5});
  assert.deepEqual(app.look(),{dYaw:0,dPitch:0});
});
