import test from 'node:test';
import assert from 'node:assert/strict';
import * as l from '../src/logic/index.js';
import {runtime} from './fixtures/settings-runtime.js';
import {createFactoryAudio} from '../src/game/audio.js';

test('正式main啟用原位回復，驚嚇結束保留視角位置且清掉殘留移動輸入',async()=>{
 const app=await runtime({getItem:()=>null,setItem(){}});app.get('#start-new').emit('click');app.document.emit('keydown',{code:'ArrowRight'});app.document.emit('keydown',{code:'Enter'});await Promise.resolve();app.frame(0);
 assert.equal(app.options().captureRecovery,'stay');
 const s=app.state(),player={...s.player,x:18.5,z:-5.5,yaw:.9,pitch:-.2,paused:false};
 app.setChapter({...s,player,checkpointId:'production.checkpoint',inventory:{itemIds:['lobby.flashlight','lobby.employee-card','power.fuse']},puzzles:{...s.puzzles,'power.main':{installedItemId:'power.fuse',restored:true}},ui:{...l.createCapture({jumpScare:true}),elapsed:2}});
 app.document.emit('keydown',{code:'KeyW'});app.frame(100);
 assert.equal(app.state().ui.mode,'explore');assert.deepEqual(app.state().player,player);assert.ok(app.state().encounterRecovery);
 assert.equal(app.get('#capture-screen').hidden,true);app.frame(120);assert.deepEqual(app.state().player,player);
});

test('消失期間走廊也沒有追兵心跳，環境音仍可運作',()=>{
 const calls=[],engine={unlock:async()=>true,getStatus:()=>({supported:true,contextState:'running'}),setMasterVolume(){},setAmbience:v=>calls.push(['ambient',v]),setHeartbeat:v=>calls.push(['heart',v]),playFootstep(){},playCue(){},stop(){},dispose:async()=>{}};
 const audio=createFactoryAudio({audioFactory:()=>engine});audio.start();
 const s=l.createChapter();s.player={...s.player,x:27,z:-13,paused:false};s.monsters={m:{mode:'inactive',x:0,z:0}};s.corridor={active:true,chaser:{x:27,z:-13.5}};s.encounterRecovery={remaining:5};
 audio.sync(s,s,true,.1);assert.equal(calls.filter(c=>c[0]==='heart').at(-1)[1],0);assert.ok(calls.some(c=>c[0]==='ambient'&&c[1]==='chase-corridor'));
});
