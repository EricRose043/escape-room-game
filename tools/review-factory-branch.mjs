import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// 不改被測分支；指定 checkout 目錄，執行可重現的狀態 fixture 診斷。
if (!process.argv[2]) { console.error('Usage: node tools/review-factory-branch.mjs <story-checkout>'); process.exit(2); }
const l=await import(pathToFileURL(resolve(process.argv[2],'src/logic/index.js')).href);
const bay=l.WORLD.areas.find(a=>a.id==='loading-bay');
if(!bay) {console.error('Target does not contain the factory loading-bay branch');process.exit(2);}
const control=bay.devices.find(d=>d.kind==='trainConsole'),train=bay.devices.find(d=>d.kind==='train');
let failed=0,checks=0;
function report(name,pass,actual){checks++;if(!pass)failed++;console.log(JSON.stringify({name,pass,actual}));}
let state=l.createChapter();
state={...state,checkpointId:'production.checkpoint',player:{...state.player,paused:false,x:control.bounds.minX-.5,z:-6.5,yaw:-Math.PI/2,pitch:0},inventory:{itemIds:['lobby.flashlight','lobby.employee-card','lobby.factory-map','power.fuse']},puzzles:{...state.puzzles,'power.main':{installedItemId:'power.fuse',restored:true,restoreElapsed:.6},'production.sequence':{installedItemId:null,restored:true,restoreElapsed:.6}}};
const horizontalTarget=l.selectChapterTarget(state)?.id??null;
const legacyActual={target:horizontalTarget,trainStarted:l.updateChapter(state,{interactPressed:true}).trainStarted};
if(process.argv.includes('--include-legacy-fixture')) report('factory-ending original horizontal fixture',legacyActual.trainStarted===true,legacyActual);
else console.log(JSON.stringify({control:'legacy horizontal fixture (unscored)',actual:legacyActual}));
state={...state,player:{...state.player,pitch:-.8}};
const downTarget=l.selectChapterTarget(state)?.id;state=l.updateChapter(state,{interactPressed:true});
report('looking down can start train',state.trainStarted===true,{target:downTarget,trainStarted:state.trainStarted});
const raw=l.serializeChapterSave(state),restored=l.restoreChapterSave(l.parseChapterSave(raw).data);
const before={production:state.puzzles['production.sequence'].restored,train:state.trainStarted};
const after={production:restored.puzzles['production.sequence'].restored,train:restored.trainStarted};
report('new progress survives serialization and restore',before.production===after.production&&before.train===after.train,{before,after,raw});
state={...state,player:{...state.player,x:train.bounds.minX-.5,z:-6.5,pitch:0}};
const boardingTarget=l.selectChapterTarget(state)?.id;state=l.updateChapter(state,{interactPressed:true});
const beforeUI=structuredClone(state.ui);
for(let i=0;i<100;i++)state=l.updateChapter(state,{},.1);
report('ending finishes after ten simulated seconds',state.ui.mode==='complete',{target:boardingTarget,paused:state.player.paused,before:beforeUI,after:state.ui});
console.log(JSON.stringify({summary:{checks,passed:checks-failed,failed},note:'Fixture diagnostics; not a browser playthrough or an additional full-suite test count'}));
process.exitCode=failed?1:0;
