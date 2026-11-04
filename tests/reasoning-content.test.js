import test from 'node:test';
import assert from 'node:assert/strict';
import * as l from '../src/logic/index.js';
import {REASONING,reasoningClues,reasoningAreas,reasoningMapText,deriveReasoningAnswers,validReasoningColorOrder,reasoningTarget} from '../src/logic/reasoning-content.js';
import {planMountedSign} from '../src/game/sign-design.js';
import {planDocumentClearances} from '../src/game/factory-document-clearance.js';
function permutations(xs){return xs.length?xs.flatMap((x,i)=>permutations(xs.filter((_,j)=>j!==i)).map(rest=>[x,...rest])):[[]];}

test('五個階段能由分散的證據推出唯一既有解，UV原始讀數不是密碼',()=>{
 const answers=deriveReasoningAnswers();
 assert.equal(answers.power,l.getPuzzle('power.main').code);assert.equal(answers.production,l.getPuzzle('production.sequence').code);
 assert.equal(answers.exit,l.getPuzzle('exit.final').code);assert.equal(answers.train,l.TRAIN_CODE);
 const orders=permutations(['red','yellow','green','blue']).filter(validReasoningColorOrder);
 assert.deepEqual(orders,[answers.colors]);
 for(const [key,puzzle] of [['power','power.main'],['production','production.sequence']]){
  const raw=REASONING[key].readings.map(r=>r.value).join('');assert.notEqual(raw,answers[key]);
  const s=l.createChapter();s.puzzles['power.main']={installedItemId:'power.fuse',restored:true};
  assert.equal(l.validatePuzzleCode(s,puzzle,raw),false);
 }
 const clues=reasoningClues(l.CLUES);
 for(const clue of clues.filter(c=>!c.alwaysVisible))assert.doesNotMatch(clue.text,/4726|3142|2413|2123|檢修碼/);
 assert.ok(clues.find(c=>c.id==='power.uv-code').text.includes('讀數'));
});

test('新排序規則實際畫成文件，不會被固定答案箭頭取代；新文件有實體掛面與模型保留區',()=>{
 const areas=reasoningAreas(l.WORLD.areas),signs=areas.flatMap(a=>a.signs);
 const rules=signs.find(s=>s.id==='production.color-order');
 assert.equal(planMountedSign(rules,l.STATIC_BOXES).kind,'paper');assert.doesNotMatch(rules.text,/紅.*→.*黃.*→.*綠.*→.*藍/);
 const ids=['power.circuit-order-note','production.calibration-record','production.process-note','production.color-order','production.console-guide','bay.train-formula'];
 const reservations=planDocumentClearances(areas,l.STATIC_BOXES);
 for(const id of ids){const sign=signs.find(s=>s.id===id),plan=planMountedSign(sign,l.STATIC_BOXES);assert.ok(plan,id);assert.ok(reservations.some(r=>r.id===id),id+' clearance');}
 for(const area of areas){const base=l.WORLD.areas.find(a=>a.id===area.id);assert.equal(area.boxes,base.boxes);assert.equal(area.devices,base.devices);}
});

test('跨區回看依已解進度出現，列車未取得的卡與校驗數字不提前洩漏',()=>{
 const s=l.createChapter(),initial=reasoningMapText(s);
 assert.doesNotMatch(initial,/照明：6|送料：3|18 A|除以 6|÷ 6/);
 s.inventory.itemIds=['lobby.flashlight','lobby.employee-card','power.fuse'];
 s.puzzles['power.main']={installedItemId:'power.fuse',restored:true};s.puzzles['production.sequence'].restored=true;
 s.puzzles['production.color-sequence'].restored=true;
 s.foundClueIds=['production.color-clue','corridor.color-key'];
 const notes=reasoningMapText(s);assert.match(notes,/照明：6/);assert.match(notes,/送料：3/);assert.match(notes,/熱壓/);assert.doesNotMatch(notes,/18 A|除以 6|÷ 6/);
 assert.doesNotMatch(reasoningTarget(l.DEVICES.find(d=>d.id==='corridor.clue-note')).name,/紅＝3|黃＝1/);
 const restored=l.restoreChapterSave(l.createChapterSave({...s,player:{...s.player,paused:false}}));
 assert.ok(restored);assert.match(reasoningMapText(restored),/照明：6/);assert.match(reasoningMapText(restored),/送料：3/);
});
