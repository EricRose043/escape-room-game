import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudio} from '../src/game/procedural-audio.js';
test('正式音效引擎預建並重用尖叫紋理，播放仍受主音量與停止管理',async()=>{
 const nodes=[],buffers=[],param=()=>({value:0,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){}});
 class Node{constructor(){this.gain=param();this.frequency=param();nodes.push(this);}connect(){}disconnect(){this.disconnected=true;}start(){}stop(){}}
 class Context{constructor(){this.state='running';this.currentTime=0;this.sampleRate=16000;this.destination={};}createGain(){return new Node();}createOscillator(){return new Node();}createBufferSource(){return new Node();}createBiquadFilter(){return new Node();}
 createBuffer(channels,length,rate){const samples=Array.from({length:channels},()=>new Float32Array(length));const buffer={numberOfChannels:channels,length,sampleRate:rate,getChannelData:c=>samples[c]};buffers.push(buffer);return buffer;}async close(){}}
 const audio=createAudio({AudioContext:Context});audio.setMasterVolume(.25);await audio.unlock();
 const generated=buffers.find(b=>b.numberOfChannels===2&&b.length>=16000*1.5);assert.ok(generated,'首次unlock預建，不在抓捕第一幀合成');
 audio.playCue('caught');assert.ok(nodes.some(n=>n.buffer===generated));const count=buffers.length;
 audio.stop();audio.playCue('caught');assert.equal(buffers.length,count,'重複被抓共用紋理');assert.equal(audio.getStatus().volume,.25);
 audio.stop();assert.equal(audio.getStatus().voices,0);assert.ok(nodes.filter(n=>n.buffer===generated).every(n=>n.disconnected));await audio.dispose();
});
