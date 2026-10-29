import test from 'node:test';
import assert from 'node:assert/strict';
import {audioCueFor,createFactoryAudio} from '../src/game/audio.js';

const state=(overrides={})=>({player:{x:0,z:0},ui:{mode:'explore'},puzzles:{'power.main':{restored:false}},monsters:{m:{mode:'patrol'}},...overrides});
test('工廠音效只在電力、追逐、被抓和逃脫轉場時觸發',()=>{
  const before=state();
  assert.equal(audioCueFor(before,state()),null);
  assert.equal(audioCueFor(before,state({puzzles:{'power.main':{restored:true}}})),'power');
  assert.equal(audioCueFor(before,state({monsters:{m:{mode:'chase'}}})),'chase');
  assert.equal(audioCueFor(before,state({ui:{mode:'caught'}})),'caught');
  assert.equal(audioCueFor(before,state({ui:{mode:'ending'}})),'escape');
  assert.equal(audioCueFor(before,state({puzzles:{'power.main':{restored:false},'production.sequence':{restored:true}}})),'door');
  assert.equal(audioCueFor(before,state({trainStarted:true})),'train');
  assert.equal(audioCueFor(before,state({ui:{mode:'hiding'}})),'hide');
  assert.equal(audioCueFor(state({ui:{mode:'hiding'}}),state()),'unhide');
});
test('音效控制器延遲啟動、可靜音，並能播放程序化線索',()=>{
  let oscillators=0,masterGain;
  const param=()=>({value:0,setValueAtTime(value){this.value=value;},setTargetAtTime(value){this.value=value;},cancelScheduledValues(){},linearRampToValueAtTime(value){this.value=value;},exponentialRampToValueAtTime(value){this.value=value;}});
  const node=()=>({gain:param(),frequency:param(),connect(){},disconnect(){},start(){},stop(){}});
  const context={state:'running',currentTime:0,sampleRate:1000,destination:{},resume:()=>Promise.resolve(),
    createGain(){const value=node();if(!masterGain)masterGain=value;return value;},
    createOscillator(){oscillators++;return node();},
    createBuffer(_channels,length){return {getChannelData:()=>new Float32Array(length)};},
    createBufferSource(){return node();},createBiquadFilter(){return Object.assign(node(),{type:'',frequency:param()});}};
  const audio=createFactoryAudio({contextFactory:()=>context});
  assert.equal(audio.start(),true);assert.ok(oscillators>=2);
  const before=state(),powered=state({puzzles:{'power.main':{restored:true}}});
  audio.sync(before,powered,true,0.1);
  assert.ok(oscillators>=5);
  assert.equal(audio.toggle(),true);assert.equal(masterGain.gain.value,0);
  assert.equal(audio.toggle(),false);assert.equal(masterGain.gain.value,0.32);
});
