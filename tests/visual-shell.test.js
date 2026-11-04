import test from 'node:test';
import assert from 'node:assert/strict';
import { STATIC_BOXES, SURFACES } from '../src/logic/world.js';
import { planShellDetails, seededRandom } from '../src/game/visual-design.js';

test('美術表面細節附著既有牆地，不在通道中新增實體造型',()=>{
  const sources=new Map([...STATIC_BOXES,...SURFACES].map(b=>[b.id,b]));
  const details=planShellDetails(STATIC_BOXES,SURFACES);
  assert.ok(details.length>100,'整章的牆面與地板都有細節');
  assert.ok(details.length<1600,'細節數量有固定上限');
  for(const d of details){
    const source=sources.get(d.sourceId);assert.ok(source,d.sourceId);
    const b=d.bounds;
    for(const axis of ['X','Y','Z']){
      assert.ok(Number.isFinite(b['min'+axis])&&Number.isFinite(b['max'+axis]));
      assert.ok(b['max'+axis]>b['min'+axis]);
      assert.ok(b['min'+axis]>=source['min'+axis]-.041,d.sourceId+' min'+axis);
      assert.ok(b['max'+axis]<=source['max'+axis]+.041,d.sourceId+' max'+axis);
    }
    if(source.kind==='floor')assert.ok(b.maxY<=.025,'地面裝飾不擋視線與走路');
  }
});

test('門洞上緣與細短門檻不會被美術外框補成整面牆',()=>{
  const boxes=[{id:'lintel',kind:'wall',minX:0,maxX:2,minY:2.6,maxY:3.5,minZ:0,maxZ:.2}];
  const floor=[{id:'threshold',kind:'floor',minX:0,maxX:2,minY:-.2,maxY:0,minZ:0,maxZ:.2}];
  const details=planShellDetails(boxes,floor);
  for(const d of details)assert.ok(d.bounds.minY>=2.56||d.bounds.maxY<=.025);
});

test('程序紋理可重現，不依賴每幀隨機或外部素材',()=>{
  const a=seededRandom(45),b=seededRandom(45),c=seededRandom(46);
  const first=Array.from({length:100},a);
  assert.deepEqual(first,Array.from({length:100},b));
  assert.notDeepEqual(first,Array.from({length:100},c));
  assert.ok(first.every(n=>n>=0&&n<1));
});
