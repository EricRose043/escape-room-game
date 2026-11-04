import test from 'node:test';
import assert from 'node:assert/strict';
import {WORLD,STATIC_BOXES} from '../src/logic/world.js';
import {createChapter} from '../src/logic/chapter.js';
import {planMountedSign,wrapSignText} from '../src/game/sign-design.js';
import {operationGuide,controlLegend} from '../src/game/operation-guide.js';
import {dollExpression} from '../src/game/doll-expression.js';

test('所有新告示確實貼到實體表面，無依附的桌面懸空標籤移除',()=>{
  for(const sign of WORLD.areas.flatMap(a=>a.signs)){
    const plan=planMountedSign(sign,STATIC_BOXES);
    if(sign.normal.y){assert.equal(plan,null);continue;}
    assert.ok(plan,sign.id);const b=STATIC_BOXES.find(b=>b.id===plan.supportId);assert.ok(b);
    const axis=plan.normal.x?'X':'Z',n=plan.normal[axis.toLowerCase()],face=b[(n>0?'max':'min')+axis];
    assert.ok(Math.abs(plan.position[axis.toLowerCase()]-face)<=.012,sign.id+' surface contact');
    assert.equal(plan.text,sign.text,'原劇情文字不改寫');
    assert.notEqual(plan.kind,'textBox');
  }
});
test('長句換行保留原文字，不把整句壓扁塞成橫幅',()=>{
  const text='封廠前夜22:14，備援監視器拍到玩偶離台；門禁沒有開啟紀錄。';
  const lines=wrapSignText(text,12);assert.ok(lines.length>=3);
  assert.equal(lines.join(''),text);assert.ok(lines.every(s=>Array.from(s).length<=12));
});
test('列車卡片貼在設備正面且公式分行可讀，不被設備外殼蓋住',()=>{
  const signs=WORLD.areas.flatMap(a=>a.signs);
  for(const sign of signs.filter(s=>/^bay\..*-card-label$/.test(s.id))){
    const plan=planMountedSign(sign,STATIC_BOXES),device=STATIC_BOXES.find(b=>b.id===plan.supportId);
    assert.equal(device.kind,'trainCard');assert.equal(plan.kind,'paper');assert.ok(plan.position.z>device.maxZ);assert.equal(plan.text,sign.text);
  }
  const formula=planMountedSign(signs.find(s=>s.id==='bay.train-formula'),STATIC_BOXES);
  assert.equal(formula.kind,'paper');assert.ok(formula.height>=1);assert.ok(formula.lines.length>3);
});
test('原位置陷在牆中的監視紀錄仍朝向室內，維修紀錄不留在桌子上方空中',()=>{
  const signs=WORLD.areas.flatMap(a=>a.signs);
  const monitor=planMountedSign(signs.find(s=>s.id==='production.monitor-record'),STATIC_BOXES);
  assert.deepEqual(monitor.normal,{x:0,y:0,z:-1});assert.ok(monitor.position.z<-.5);
  const report=planMountedSign(signs.find(s=>s.id==='power.train-log'),STATIC_BOXES);
  assert.equal(report.supportId,'power.west');
});
test('教學會依鍵鼠Xbox及PS切換，入門與各機關有可執行指令',()=>{
  let s=createChapter();
  assert.equal(controlLegend('xbox').find(x=>x.action==='互動／撿取').key,'A');
  assert.equal(controlLegend('ps').find(x=>x.action==='互動／撿取').key,'✕');
  assert.equal(controlLegend('keyboard').find(x=>x.action==='互動／撿取').key,'E');
  assert.match(operationGuide(s,'ps').body,/準星|搖桿/);
  assert.ok(operationGuide(s,'ps').actions.some(a=>a.key==='✕'));
  s.inventory.itemIds.push('lobby.flashlight','lobby.employee-card','lobby.factory-map');
  assert.match(operationGuide(s,'xbox').body,/保險絲|電箱/);
  s.puzzles['power.main'].installedItemId='power.fuse';
  assert.ok(operationGuide(s,'ps').actions.some(a=>a.key==='L1'));
  s.ui={mode:'hiding'};assert.match(operationGuide(s,'xbox').body,/出櫃|躲藏/);
  s.ui={mode:'explore'};s.corridor.active=true;assert.match(operationGuide(s,'ps').body,/前進/);
});
test('娃娃警戒有連續張嘴動作，暫停可沿用時間，不把平靜狀態留成攻擊表情',()=>{
  const calm=dollExpression('patrol',0),start=dollExpression('chase',0),peak=dollExpression('chase',.45);
  assert.ok(peak.jaw>start.jaw);assert.ok(peak.jaw>calm.jaw);
  assert.deepEqual(dollExpression('chase',.45),peak);
  assert.ok(dollExpression('search',3).jaw<peak.jaw);
  for(let i=0;i<100;i++)for(const x of Object.values(dollExpression('chase',i/20)))assert.ok(Number.isFinite(x));
});
