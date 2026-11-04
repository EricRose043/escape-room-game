import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudio} from '../src/game/procedural-audio.js';
function fixture(){
 const nodes=[];const param=()=>({value:0,events:[],setValueAtTime(v,t){this.events.push([v,t]);this.value=v;},linearRampToValueAtTime(v,t){this.events.push([v,t]);},exponentialRampToValueAtTime(){},cancelScheduledValues(){}});
 class N{constructor(kind){this.kind=kind;this.gain=param();this.frequency=param();for(const k of ['threshold','knee','ratio','attack','release'])this[k]=param();nodes.push(this);}connect(n){this.target=n;}disconnect(){this.disconnected=true;}start(){}stop(){}}
 class Context{constructor(){this.state='running';this.currentTime=0;this.sampleRate=1000;this.destination={};}createGain(){return new N('gain');}createOscillator(){return new N('tone');}createBufferSource(){return new N('noise');}createBiquadFilter(){return new N('filter');}createDynamicsCompressor(){return new N('limiter');}createBuffer(_c,n){return {getChannelData:()=>new Float32Array(n)};}async close(){}}
 return {nodes,audio:createAudio({AudioContext:Context})};
}
test('共用輸出提升整體音量並限制尖峰，腳步含更明確落腳聲',async()=>{
 const {audio,nodes}=fixture();audio.setMasterVolume(.32);await audio.unlock();audio.playFootstep();
 assert.ok(nodes.some(n=>n.kind==='gain'&&n.gain.value>=1.5),'提升輸出，不覆蓋玩家主音量');
 assert.ok(nodes.some(n=>n.kind==='limiter'&&n.ratio.value>=10));
 assert.ok(nodes.some(n=>n.kind==='tone'),'腳步有鞋跟低頻');
 assert.ok(nodes.some(n=>n.kind==='gain'&&n.gain.events.some(([v])=>v>=.15)),'腳步相對增益增加');
 assert.equal(audio.getStatus().volume,.32);audio.setMasterVolume(0);assert.equal(audio.getStatus().volume,0);await audio.dispose();
});
test('區域環境有固定噪聲層且重送同區域不堆疊，停止會釋放',async()=>{
 const {audio,nodes}=fixture();await audio.unlock();audio.setAmbience('power-room');
 assert.ok(nodes.some(n=>n.kind==='noise'&&n.loop===true));const count=nodes.length;
 for(let i=0;i<100;i++)audio.setAmbience('power-room');assert.equal(nodes.length,count);
 audio.stop();assert.equal(audio.getStatus().ambientNodes,0);assert.ok(nodes.filter(n=>n.kind==='noise'||n.kind==='filter').every(n=>n.disconnected));await audio.dispose();
});
