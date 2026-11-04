import test from 'node:test';
import assert from 'node:assert/strict';
import {assessFrameQuality} from '../src/logic/frame-budget.js';
test('幀率不足時降低3D解析度，仍保留下限並忽略無效取樣',()=>{
 let s={scale:1,stable:0};for(let i=0;i<20;i++)s=assessFrameQuality(s,30,1.25);
 assert.equal(s.scale,.75);assert.deepEqual(assessFrameQuality(s,NaN,1.25),s);assert.ok(assessFrameQuality({scale:1,stable:0},45,1.25).scale<1);
});
test('需要穩定十秒才緩慢恢復，避免解析度隨短暫波動來回跳',()=>{
 let s={scale:.8,stable:0};for(let i=0;i<9;i++)s=assessFrameQuality(s,60,1.25);
 assert.equal(s.scale,.8);s=assessFrameQuality(s,60,1.25);assert.ok(s.scale>.8&&s.scale<1);
 assert.equal(assessFrameQuality(s,54,1.25).stable,0);
});
