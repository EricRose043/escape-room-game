import test from 'node:test';
import assert from 'node:assert/strict';
import {createFactoryAudio,createAudio} from '../src/game/audio.js';
import {createAudio as procedural} from '../src/game/procedural-audio.js';
function fixture(){const calls=[];const engine={unlock:async()=>{calls.push(['unlock']);return true;},getStatus:()=>({supported:true,contextState:'running'}),setMasterVolume:v=>calls.push(['volume',v]),setAmbience:v=>calls.push(['ambience',v]),setHeartbeat:v=>calls.push(['heart',v]),playFootstep:()=>calls.push(['step']),playCue:v=>calls.push(['cue',v]),stop:()=>calls.push(['stop']),dispose:async()=>calls.push(['dispose'])};let creations=0;const audio=createFactoryAudio({audioFactory:()=>{creations++;return engine;}});return {audio,calls,creations:()=>creations};}
const state=()=>({player:{x:0,z:2},ui:{mode:'explore'},puzzles:{'power.main':{restored:false}},monsters:{m:{mode:'chase',x:0,z:5}}});
test('公開入口保留兩方 API，工廠控制器只建立一個共享引擎',()=>{
 assert.equal(createAudio,procedural);const {audio,calls,creations}=fixture();audio.start();audio.start();assert.equal(creations(),1);assert.equal(calls.filter(c=>c[0]==='unlock').length,2);
});
test('遊戲事件、距離心跳與腳步都交給 S1 引擎',()=>{
 const {audio,calls}=fixture();audio.start();const before=state(),next=structuredClone(before);next.player.x=.25;next.puzzles['power.main'].restored=true;
 audio.sync(before,next,true,.1);assert.ok(calls.some(c=>c[0]==='cue'&&c[1]==='power'));assert.ok(calls.some(c=>c[0]==='heart'&&c[1]>0));assert.ok(calls.some(c=>c[0]==='step'));
});
test('暫停或靜音停止循環，銷毀後不再排程',async()=>{
 const {audio,calls}=fixture();audio.start();const s=state();audio.sync(s,s,false,.1);assert.equal(calls.at(-1)[0],'stop');
 assert.equal(audio.toggle(),true);audio.sync(s,s,true,.1);assert.equal(calls.at(-1)[0],'stop');assert.equal(audio.toggle(),false);
 await audio.dispose();const count=calls.length;audio.sync(s,s,true,.1);assert.equal(calls.length,count);assert.equal(audio.start(),false);
});
