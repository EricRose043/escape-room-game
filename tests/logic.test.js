import assert from 'node:assert/strict';
import test from 'node:test';

test('logic 入口可以在沒有瀏覽器環境的 Node 中單獨載入', async () => {
  assert.equal(typeof globalThis.window, 'undefined');
  assert.equal(typeof globalThis.document, 'undefined');
  await import('../src/logic/index.js');
});
