import test from 'node:test';
import assert from 'node:assert/strict';
import {EXIT,EXIT_CODE_PUZZLE} from '../src/logic/areas/exit.js';
import {deriveExitCode,EXIT_CODE_CLUES,EXIT_CLUE_IDS,hasAllExitClues,validateExitCode} from '../src/logic/puzzles/exit-code.js';

test('出口區有有效三邊牆、門與密碼設備，區域內 ID 不重複',()=>{
  assert.equal(EXIT.bounds.minX,22);assert.equal(EXIT.bounds.maxX,34);
  assert.equal(EXIT.bounds.minZ,-12);assert.equal(EXIT.bounds.maxZ,0);
  for(const side of ['north','south','west']) assert.ok(EXIT.boxes.some(box=>box.id===`exit.${side}`));
  assert.equal(EXIT.doors.length,1);assert.equal(EXIT.devices.filter(d=>d.kind==='keypad').length,1);
  const ids=[EXIT.id,...EXIT.boxes,...EXIT.doors, ...EXIT.items,...EXIT.devices,...EXIT.puzzles,...EXIT.clues,...EXIT.signs].map(o=>o.id);
  assert.equal(new Set(ids).size,ids.length);
  for(const item of EXIT.items) for(const axis of ['X','Y','Z']) assert.ok(item[`max${axis}`]-item[`min${axis}`]>=0.25);
  assert.deepEqual(EXIT_CODE_PUZZLE.code,'2413');
});

test('出口碼必須按三條線索反推，線索推導得到 2413',()=>{
  assert.equal(EXIT_CODE_CLUES.length,3);
  assert.equal(deriveExitCode(EXIT_CODE_CLUES),'2413');
  assert.equal(hasAllExitClues(EXIT_CLUE_IDS.slice(0,2)),false);
  assert.equal(validateExitCode('2413',EXIT_CLUE_IDS.slice(0,2)),false);
  assert.equal(validateExitCode('2413',EXIT_CLUE_IDS),true);
  assert.equal(validateExitCode('1111',EXIT_CLUE_IDS),false);
});
