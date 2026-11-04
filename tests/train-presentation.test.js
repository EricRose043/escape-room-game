import test from 'node:test';
import assert from 'node:assert/strict';
import {runtime} from './fixtures/settings-runtime.js';
import {audioCueFor,createFactoryAudio} from '../src/game/audio.js';

const ending=elapsed=>({player:{x:63,z:-17,paused:false},ui:{mode:'ending',variant:'derailment',elapsed},monsters:{}});
test('列車演出事件使用同一時間軸，不播放勝利提示',()=>{
  assert.equal(audioCueFor({},ending(0)),'train');
  for(const [a,b,cue] of [[2.9,3,'train-ambush'],[4.9,5,'train-impact'],[18.9,19,'train-failure'],[20.9,21,'train-derail']])assert.equal(audioCueFor(ending(a),ending(b)),cue);
  assert.equal(audioCueFor(ending(7),ending(7.1)),null);
});
test('列車行進聲與撞擊共享音效引擎，黑場停止環境聲',()=>{
  const calls=[];let engines=0;
  const engine={getStatus:()=>({supported:true,contextState:'running'}),setMasterVolume(){},unlock:async()=>true,setAmbience:v=>calls.push(['ambient',v]),setHeartbeat(){},playCue:v=>calls.push(['cue',v]),stop:()=>calls.push(['stop'])};
  const audio=createFactoryAudio({audioFactory:()=>{engines++;return engine;}});audio.start();
  audio.sync(ending(4.9),ending(5),true,.1);
  assert.equal(engines,1);assert.ok(calls.some(c=>c[1]==='train-impact'));assert.ok(calls.some(c=>c[1]==='train-rail'));
  audio.sync(ending(21.9),ending(22),true,.1);assert.deepEqual(calls.at(-1),['ambient',null]);
  audio.sync(ending(22),ending(22),false,.1);assert.deepEqual(calls.at(-1),['stop']);
});
test('實際 main 在演出時攔截手把選單與暫停，失焦可恢復原時間',async()=>{
  const data=new Map(),app=await runtime({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)});
  app.get('#start-new').emit('click');app.document.emit('keydown',{code:'ArrowRight'});app.document.emit('keydown',{code:'Enter'});await Promise.resolve();
  const chapter=app.state();app.setChapter({...chapter,player:{...chapter.player,paused:false},ui:{mode:'ending',variant:'derailment',elapsed:7},trainCinematic:{started:true,elapsed:7}});
  const pad=indices=>({id:'Xbox',index:0,mapping:'standard',connected:true,axes:[1,1,1,1],buttons:Array.from({length:17},(_,i)=>({pressed:indices.includes(i)}))});
  app.pads([pad([0,1,3,8,9])]);app.frame(0);app.frame(100);
  assert.equal(app.session().paused,false);assert.equal(app.state().ui.mode,'ending');assert.equal(app.document.body.dataset.cinematic,'true');
  assert.equal(app.get('#train-film').hidden,false);assert.equal(app.get('#factory-map').hidden,true);
  app.document.emit('keydown',{code:'KeyH'});assert.equal(app.session().paused,false);
  app.window.emit('blur');const time=app.state().ui.elapsed;assert.equal(app.session().paused,true);
  app.pads([pad([])]);app.frame(200);app.frame(300);assert.equal(app.state().ui.elapsed,time);
  app.pads([pad([9])]);app.frame(400);app.frame(500);assert.equal(app.session().paused,false);assert.ok(app.state().ui.elapsed>time);
});
