import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudio} from '../src/game/procedural-audio.js';
function fixture(){
  const nodes=[];
  const param=()=>({value:0,events:[],setValueAtTime(v,t){this.value=v;this.events.push(['set',v,t]);},
    linearRampToValueAtTime(v,t){this.events.push(['linear',v,t]);},exponentialRampToValueAtTime(v,t){this.events.push(['exp',v,t]);},cancelScheduledValues(){}});
  class Node{constructor(kind){this.kind=kind;this.gain=param();this.frequency=param();nodes.push(this);}connect(){}disconnect(){this.disconnected=true;}start(t=0){this.startTime=t;}stop(t=0){this.stopTime=t;}}
  class Context{constructor(){this.state='running';this.currentTime=0;this.sampleRate=8000;this.destination={};}
    createGain(){return new Node('gain');}createOscillator(){return new Node('oscillator');}createBufferSource(){return new Node('noise');}
    createBiquadFilter(){return new Node('filter');}createBuffer(_c,n){return {getChannelData:()=>new Float32Array(n)};}async close(){this.state='closed';}}
  const audio=createAudio({AudioContext:Context});
  return {audio,nodes,peaks:()=>nodes.filter(n=>n.kind==='gain').flatMap(n=>n.gain.events.filter(e=>e[0]==='linear').map(e=>e[1]))};
}
test('被抓提示提高相對強度，加入下滑失諧音與短噪聲衝擊',async()=>{
  const {audio,nodes,peaks}=fixture();await audio.unlock();assert.equal(audio.playCue('caught'),true);
  assert.ok(Math.max(...peaks())>=.18,'驚嚇單聲部峰值至少是原.07的兩倍');
  assert.ok(nodes.some(n=>n.kind==='noise'),'增加短促噪聲衝擊');
  assert.ok(nodes.filter(n=>n.kind==='oscillator').some(n=>{
    const start=n.frequency.events.find(e=>e[0]==='set');return n.frequency.events.some(e=>e[0]==='exp'&&e[1]<start[1]);
  }),'包含向下滑音');
  assert.ok(nodes.filter(n=>n.kind==='oscillator').some(n=>n.stopTime>=1.4),'保留低頻尾音');
  assert.ok(audio.getStatus().voices<=16);await audio.dispose();
});
test('提高驚嚇音效仍尊重主音量與停止，不提高其他門聲',async()=>{
  const {audio,nodes,peaks}=fixture();audio.setMasterVolume(.25);await audio.unlock();audio.playDoor();
  assert.equal(Math.max(...peaks()),.09,'其他效果的既有增益保持');
  audio.stop();audio.setMasterVolume(0);audio.playCue('caught');assert.equal(audio.getStatus().volume,0);
  audio.stop();assert.equal(audio.getStatus().voices,0);
  assert.ok(nodes.filter(n=>['noise','oscillator'].includes(n.kind)).every(n=>n.disconnected));
  await audio.dispose();assert.equal(audio.playCue('caught'),false);
});
