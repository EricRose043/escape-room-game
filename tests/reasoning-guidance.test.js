import test from 'node:test';
import assert from 'node:assert/strict';
import * as l from '../src/logic/index.js';
import {operationGuide} from '../src/game/operation-guide.js';
test('推理版的教學與列車錯碼不透露固定校驗值，鍵鼠及手把指引仍有操作鍵',()=>{
 const s=l.createChapter();s.inventory.itemIds=['lobby.flashlight','lobby.employee-card','lobby.factory-map','power.fuse'];
 s.puzzles['power.main']={installedItemId:'power.fuse',restored:false};
 for(const device of ['keyboard','xbox','ps']){
  const guide=operationGuide(s,device,null,{reasoning:true});assert.match(guide.body,/接線圖/);assert.ok(guide.actions.length>0);
  const train=operationGuide(s,device,{kind:'trainConsole'},{reasoning:true});assert.doesNotMatch(train.body,/除以六|除以 6|2123/);
 }
 for(const id of ['power.main','production.sequence','production.color-sequence','exit.final'])s.puzzles[id].restored=true;
 s.corridor.complete=true;s.trainPuzzle={readCardIds:[...l.TRAIN_CARD_IDS],solved:false};s.player.paused=false;
 s.ui={...l.createKeypad('bay.train-console'),buffer:'9999'};
 const next=l.updateChapter(s,{keypadCommands:[{type:'submit'}]},.1,{reasoning:true});
 assert.match(next.ui.message,/錯誤/);assert.doesNotMatch(next.ui.message,/除以 6|÷ 6|2123/);assert.equal(next.trainStarted,false);
});
