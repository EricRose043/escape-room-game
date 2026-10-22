import test from 'node:test';
import assert from 'node:assert/strict';
test('近距光強補償連續、有上限且遠距不變',async()=>{
  const {compensatedIntensity}=await import('../src/game/lighting.js');
  for(const [d,expected] of [[0,0],[0.25,35*0.25**2],[0.5,35*0.5**2],[1,35],[2,35],[Infinity,35]]) assert.equal(compensatedIntensity(d),expected);
  assert.ok(Math.abs(compensatedIntensity(0.999999)-compensatedIntensity(1))<0.0001);
  assert.equal(compensatedIntensity(-1),0);
});
