import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

// 包含靜態 import、動態 import、轉匯出與 require，也擋住 CDN 路徑。
function threeImports(source) {
  const specifiers = source.matchAll(
    /\b(?:from\s*|import\s*(?:\(\s*)?|require\s*\(\s*)(['"])([^'"]+)\1/g,
  );
  return [...specifiers].map((match) => match[2]).filter((name) => /three/i.test(name));
}

async function javascriptFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) files.push(...await javascriptFiles(url));
    else if (entry.isFile() && entry.name.endsWith('.js')) files.push(url);
  }
  return files;
}

test('邊界檢查會攔截 three 的各種匯入寫法', () => {
  for (const source of [
    "import * as THREE from 'three';",
    "import {\nVector3\n} from 'three';",
    "import 'three';",
    "import('three');",
    "export { Vector3 } from 'three';",
    "const three = require('three');",
    "import { OrbitControls } from 'three/addons/controls/OrbitControls.js';",
    "import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';",
  ]) {
    assert.equal(threeImports(source).length, 1, source);
  }
  assert.deepEqual(threeImports("import { value } from './rules.js';"), []);
});

test('遞迴掃描 src/logic 的所有 .js，禁止匯入 three', async () => {
  const files = await javascriptFiles(new URL('../src/logic/', import.meta.url));
  assert.ok(files.length > 0, 'src/logic 至少要有一個 JavaScript 模組');
  for (const file of files) {
    assert.deepEqual(threeImports(await readFile(file, 'utf8')), [], `${file.pathname} 依賴 three`);
  }
});
