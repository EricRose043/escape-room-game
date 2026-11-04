import test from 'node:test';
import assert from 'node:assert/strict';
import {runtime} from './fixtures/settings-runtime.js';
test('正式main開啟推理呈現，送進畫布的UV資料沒有完整答案',async()=>{
 const app=await runtime({getItem:()=>null,setItem(){}});
 assert.equal(app.options().reasoning,true);
 const text=app.drawnText().join('\n');assert.match(text,/停機讀數|原始格數/);
 assert.doesNotMatch(text,/檢修碼：4726|檢修碼：3142|月台檢修碼：3/);
});
