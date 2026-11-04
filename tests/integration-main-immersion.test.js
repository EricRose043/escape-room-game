import test from 'node:test';
import assert from 'node:assert/strict';
import {runtime} from './fixtures/settings-runtime.js';
import {createCapture} from '../src/logic/capture.js';
async function started(){const app=await runtime({getItem:()=>null,setItem(){}});app.get('#start-new').emit('click');app.document.emit('keydown',{code:'ArrowRight'});app.document.emit('keydown',{code:'Enter'});await Promise.resolve();app.frame(0);return app;}
test('實際main滑鼠轉角比舊版小，逐幀收斂且暫停不補轉',async()=>{
 const app=await started(),yaw=app.state().player.yaw;
 app.document.emit('mousemove',{movementX:100,movementY:0});app.frame(1000/60);
 const first=Math.abs(app.state().player.yaw-yaw);assert.ok(first>0&&first<.11);
 for(let i=2;i<25;i++)app.frame(i*1000/60);
 assert.ok(Math.abs(Math.abs(app.state().player.yaw-yaw)-.11)<1e-7);
 app.window.emit('factory-settings-open');const held=app.state().player.yaw;app.frame(500);assert.equal(app.state().player.yaw,held);
});
test('實際main抓捕時照常推進動畫時間，卻不渲染被遮住的工廠',async()=>{
 const app=await started();app.setChapter({...app.state(),jumpScare:true,ui:createCapture({jumpScare:true})});
 const before=app.renders();app.frame(20);app.frame(40);assert.equal(app.renders(),before);assert.ok(app.state().ui.elapsed>0);
});
