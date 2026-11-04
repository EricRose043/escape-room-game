import test from 'node:test';
import assert from 'node:assert/strict';
import {createScareTexture} from '../src/game/horror-stinger.js';

const rms=(samples,from,to)=>Math.sqrt(samples.slice(from,to).reduce((sum,x)=>sum+x*x,0)/(to-from));
test('原創驚嚇紋理有短促爆發、非純低音頻帶、立體聲且峰值受限',()=>{
 const rate=16000,channels=createScareTexture(rate);
 assert.equal(channels.length,2);assert.ok(channels[0].length>=rate*1.5);
 let peak=0,difference=0,crossings=0;
 for(let i=0;i<channels[0].length;i++){
  for(const c of channels){assert.ok(Number.isFinite(c[i]));peak=Math.max(peak,Math.abs(c[i]));}
  difference+=Math.abs(channels[0][i]-channels[1][i]);
  if(i>rate*.08&&i<rate*.4&&channels[0][i]*channels[0][i-1]<0)crossings++;
 }
 assert.ok(peak>.6&&peak<=.83);assert.ok(difference>10);assert.ok(crossings>250,'中高頻撕裂紋理，不只低頻嗶聲');
 assert.ok(rms(channels[0],rate*.1,rate*.4)>rms(channels[0],rate*1.3,rate*1.5)*2,'短攻擊與衰減尾音');
 assert.deepEqual(createScareTexture(rate),channels,'可重現且不依賴外部音檔');
});
