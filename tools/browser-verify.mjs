// Optional QA: PLAYWRIGHT_MODULE points to an installed Playwright index.mjs.
// Inspection hooks and a deterministic rAF clock are injected into the test page only.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const outputDir=process.env.QA_OUTPUT||'docs/evidence/2026-11-01/owner-integration';
const inputDevice=process.env.INPUT_DEVICE||'keyboard';
const deviceName=inputDevice==='ps'?'DualSense':'Xbox';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1200,height:800}}),errors=[],receipts=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{
  let time=0,sequence=0;const callbacks=new Map();window.requestAnimationFrame=fn=>{const id=++sequence;callbacks.set(id,fn);return id;};window.cancelAnimationFrame=id=>callbacks.delete(id);
  window.__qaFrame=(ms=100)=>{time+=ms;const pending=[...callbacks.values()];callbacks.clear();for(const fn of pending)fn(time);};
  let pad=null;
  window.__qaPad=(buttons=[],name='Xbox',axes=[0,0,0,0])=>{pad={id:name,index:0,mapping:'standard',connected:true,axes,buttons:Array.from({length:17},(_,i)=>({pressed:buttons.includes(i)}))};};
  Object.defineProperty(navigator,'getGamepads',{value:()=>pad?[pad]:[]});
  window.__qaTurnTo=(x,y,z,name)=>{
    for(let i=0;i<100;i++) {
      const p=window.__qaInspect().chapter.player;
      const dy=Math.atan2(p.x-x,p.z-z)-p.yaw,dp=Math.atan2(y-1.6,Math.hypot(x-p.x,z-p.z))-p.pitch;
      const length=Math.hypot(dy,dp);if(length<1e-7){window.__qaPad([],name);return;}
      const raw=0.18+0.82*Math.pow(Math.min(1,length/0.25),2/3);
      window.__qaPad([],name,[0,0,-dy/length*raw,-dp/length*raw]);window.__qaFrame(100);
    }throw new Error('controller turn timeout');
  };
});
await page.route('**/src/game/main.js',async route=>{
  const response=await route.fetch();let body=await response.text();
  body+='\nwindow.__qaInspect=()=>({chapter:structuredClone(chapter),session:{...session},settings:{...settings},settingsOpen,audio:audio.getStatus(),lock:document.pointerLockElement===renderer.domElement});';
  await route.fulfill({response,body});
});
async function shot(name) {if(inputDevice!=='keyboard' && name!=='current-ending') return;await page.screenshot({path:`${outputDir}/${name}${inputDevice==='keyboard'?'':'-'+inputDevice}.png`});}
async function inspect() {return page.evaluate(()=>window.__qaInspect());}
async function frame() {await page.evaluate(()=>window.__qaFrame());}
async function key(code) {if(inputDevice!=='keyboard') {await pad([],deviceName,0);await pad([{KeyE:0,KeyF:5,KeyR:4,Escape:9}[code]],deviceName);await pad([],deviceName,0);return;}await page.evaluate(code=>{document.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));window.__qaFrame();document.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));},code);}
async function pad(buttons,name='Xbox',ms=100) {await page.evaluate(({buttons,name,ms})=>{window.__qaPad(buttons,name);window.__qaFrame(ms);}, {buttons,name,ms});}
async function walk(x,z) {
  if(inputDevice!=='keyboard') {
    await page.evaluate(({x,z,name})=>{
      for(let i=0;i<400;i++) {
        const s=window.__qaInspect().chapter,distance=Math.hypot(x-s.player.x,z-s.player.z);
        if(distance<0.01) {window.__qaPad([],name);window.__qaFrame(0);return;}
        if(s.ui.mode!=='explore') throw new Error(`controller walk interrupted ${s.ui.mode} at ${s.player.x},${s.player.z}`);
        window.__qaTurnTo(x,1.6,z,name);window.__qaPad([],name,[0,-1,0,0]);
        window.__qaFrame(Math.min(100,distance/2.5*1000));
      } throw new Error('controller walk timeout');
    },{x,z,name:deviceName});return;
  }
  await page.evaluate(({x,z})=>{
    const inspect=()=>window.__qaInspect().chapter;
    const aim=(x,y,z)=>{
      const p=inspect().player,s=window.__qaInspect().settings.mouseSensitivity;
      document.dispatchEvent(new MouseEvent('mousemove',{movementX:-(Math.atan2(p.x-x,p.z-z)-p.yaw)/(.002*s),movementY:-(Math.atan2(y-1.6,Math.hypot(x-p.x,z-p.z))-p.pitch)/(.002*s)}));
    };
    document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'}));
    for(let i=0;i<400;i++) {
      const s=inspect(),distance=Math.hypot(s.player.x-x,s.player.z-z);
      if(distance<0.01) {document.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'}));return;}
      if(s.ui.mode!=='explore') throw new Error(`walk interrupted ${s.ui.mode} at ${s.player.x},${s.player.z}`);
      const before={...s.player};aim(x,1.6,z);window.__qaFrame(Math.min(100,distance/2.5*1000));
      const next=inspect().player;
      if(i>1 && Math.hypot(next.x-before.x,next.z-before.z)<1e-8) throw new Error(`walk blocked at ${next.x},${next.z} toward ${x},${z}`);
    }
    throw new Error('walk timeout');
  },{x,z});
}
async function aim(x,y,z) {
  if(inputDevice!=='keyboard') {await page.evaluate(({x,y,z,name})=>window.__qaTurnTo(x,y,z,name),{x,y,z,name:deviceName});return;}
  await page.evaluate(({x,y,z})=>{
    const {chapter,settings}=window.__qaInspect(),p=chapter.player;
    document.dispatchEvent(new MouseEvent('mousemove',{movementX:-(Math.atan2(p.x-x,p.z-z)-p.yaw)/(.002*settings.mouseSensitivity),movementY:-(Math.atan2(y-1.6,Math.hypot(x-p.x,z-p.z))-p.pitch)/(.002*settings.mouseSensitivity)}));window.__qaFrame(0);
  },{x,y,z});
}
async function take(id) {
  const item=await page.evaluate(async id=>(await import('/src/logic/index.js')).ITEMS.find(i=>i.id===id),id);
  await aim((item.minX+item.maxX)/2,(item.minY+item.maxY)/2,(item.minZ+item.maxZ)/2);await key('KeyE');
  assert.ok((await inspect()).chapter.inventory.itemIds.includes(id),`take ${id}`);
}
async function relock() {if(inputDevice!=='keyboard'){await pad([],deviceName,0);return;}await page.locator('canvas').last().click({position:{x:400,y:250},force:true});await page.waitForFunction(()=>window.__qaInspect().lock);await frame();}
async function enterCode(code) {
  if(inputDevice==='keyboard') {for(const digit of code) await page.locator(`[data-key="${digit}"]`).click();await page.locator('[data-key="submit"]').click();await frame();return;}
  for(const key of [...code,'submit']) {
    const target=['1','2','3','4','5','6','7','8','9','delete','0','submit'].indexOf(key);
    for(let i=0;i<8;i++) {
      const index=(await inspect()).chapter.ui.selectedIndex;if(index===target)break;
      const row=Math.floor(index/3),col=index%3,tr=Math.floor(target/3),tc=target%3;
      await pad([],deviceName,0);await pad([row>tr?12:row<tr?13:col>tc?14:15],deviceName);
    }
    await pad([],deviceName,0);await pad([0],deviceName);await pad([],deviceName,0);
  }
}
try {
  await mkdir(outputDir,{recursive:true});await page.goto(process.env.GAME_URL||'http://127.0.0.1:8778/',{waitUntil:'networkidle'});await page.bringToFront();
  await page.waitForFunction(()=>window.__qaInspect);
  await frame();assert.match(await page.title(),/棉花糖工坊：閉館之後/);
  if(inputDevice==='keyboard')await page.locator('#intro-skip').click();else{await pad([0],deviceName);await pad([],deviceName,0);}
  await shot('current-start');
  // Both controller layouts can open, adjust and close settings using edges only.
  for(const name of ['Xbox','DualSense']) {
    await pad([],name);await pad([3],name);assert.equal((await inspect()).settingsOpen,true);
    await pad([],name);await pad([14],name);await pad([],name);await pad([13],name);await pad([],name);await pad([0],name);
    await pad([],name);await pad([1],name);assert.equal((await inspect()).settingsOpen,false);
  }
  // Keyboard controls and persisted settings.
  if(inputDevice==='keyboard') {
    await page.locator('#settings-button').click();await frame();await shot('current-settings');
    await page.getByRole('button',{name:'返回遊戲選單'}).click();await frame();
    await page.locator('#start-new').click();await page.locator('#start-confirm').click();
    await page.waitForFunction(()=>window.__qaInspect().lock);await frame();
  } else {await pad([],deviceName,0);await pad([0],deviceName);await pad([],deviceName,0);await pad([15],deviceName);await pad([],deviceName,0);await pad([0],deviceName);await pad([],deviceName,0);}
  assert.equal((await inspect()).session.paused,false);
  await pad([],deviceName,0);await pad([3],deviceName);assert.equal((await inspect()).settingsOpen,true);
  await pad([],deviceName,0);await pad([1],deviceName);assert.equal((await inspect()).session.paused,true);
  await pad([],deviceName,0);await pad([9],deviceName);await pad([],deviceName,0);await relock();
  receipts.push((inputDevice==='keyboard'?'Pointer Lock start':'Controller-only start')+', Xbox/PS settings, settings persistence');
  await take('lobby.factory-map');await take('lobby.employee-card');
  await pad([],deviceName,0);await pad([8],deviceName);assert.equal(await page.locator('#factory-map').isVisible(),true);
  await pad([],deviceName,0);await pad([1],deviceName);await pad([],deviceName,0);await relock();
  await walk(-1.5,5.5);await take('lobby.flashlight');await key('KeyF');
  await walk(0,5.5);await walk(0,-4.6);await walk(-3,-4.6);await take('power.fuse');
  await walk(0,-4.6);await walk(3,-3);await aim(4.25,1.4,-3);await key('KeyE');
  await walk(3,-4.5);await aim(4.98,1.6,-4.5);await key('KeyR');
  const uv=await page.evaluate(async()=>{const l=await import('/src/logic/index.js'),s=window.__qaInspect().chapter;return l.isClueVisible(s.player,s.flashlight,l.CLUES[0],l.getGeometry(s).occluderBoxes);});assert.equal(uv,true);
  await walk(3,-5.2);await aim(4.5,1.4,-5.2);await key('KeyE');assert.equal((await inspect()).chapter.ui.mode,'keypad');
  await enterCode('4726');
  assert.equal((await inspect()).chapter.puzzles['power.main'].restored,true);await relock();
  await walk(3,-6.5);await walk(8.2,-6.5);await walk(10,-6.5);await walk(10,-10.3);await walk(19.7,-10.3);
  await walk(19.7,-4.1);await aim(20.85,1.6,-4.1);await shot('current-production');
  // A wrong button alerts the actual monster, then a capture returns to the platform with progress intact.
  await key('KeyE');assert.match((await inspect()).chapter.ui.message,/警報/);
  for(let i=0;i<200 && (await inspect()).chapter.ui.mode!=='caught';i++) await frame();
  assert.equal((await inspect()).chapter.ui.mode,'caught');await shot('current-caught');
  for(let i=0;i<14;i++) await frame();assert.equal((await inspect()).chapter.player.x,6.5);await relock();
  await walk(8.2,-6.5);await walk(10,-6.5);await walk(10,-10.3);await walk(19.7,-10.3);
  for(const [i,color] of ['red','yellow','green','blue'].entries()) {
    const z=-1.4-i*.9;await walk(19.7,z);await aim(20.85,1.6,z);await key('KeyE');
  }
  assert.equal((await inspect()).chapter.puzzles['production.color-sequence'].restored,true);
  await walk(19.7,-8);await aim(20.825,1.325,-8);await key('KeyE');await enterCode('3142');await relock();await walk(19.7,-6.5);
  await walk(22.4,-6.5);await aim(23.35,1.6,-7.1);await key('KeyE');assert.ok((await inspect()).chapter.foundClueIds.includes('corridor.color-key'));
  await walk(25,-6.5);assert.equal((await inspect()).chapter.corridor.active,true);await shot('current-corridor');
  await walk(27,-6.5);await walk(27,-17.5);await walk(41.2,-17.5);assert.equal((await inspect()).chapter.checkpointId,'exit.checkpoint');
  assert.equal((await inspect()).chapter.corridor.complete,true);receipts.push('Full '+inputDevice+' route: UV, power, alarm, caught/restore, R1 color puzzle, S3 corridor chase');
  // Reload uses the persisted checkpoint, with no injected state or teleporting.
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await page.reload({waitUntil:'networkidle'});await page.bringToFront();await frame();
  if(inputDevice==='keyboard')await page.locator('#intro-skip').click();else{await pad([0],deviceName);await pad([],deviceName,0);}
  if(inputDevice==='keyboard'){await page.locator('#start-continue').click();await page.waitForFunction(()=>window.__qaInspect().lock);await frame();}else{await pad([0],deviceName);await pad([],deviceName,0);}
  assert.equal((await inspect()).chapter.player.z,-17.5);assert.equal((await inspect()).chapter.corridor.complete,true);
  await walk(50.3,-17.5);await walk(50.3,-13.2);await aim(51.45,1.6,-13.2);await key('KeyE');assert.ok((await inspect()).chapter.foundClueIds.includes('exit.reverse-clue'));
  await walk(50.3,-21.2);await aim(51.55,1.5,-21.2);await key('KeyE');
  assert.equal((await inspect()).chapter.ui.mode,'keypad');
  await enterCode('2413');await relock();await walk(50.3,-17.5);
  await walk(54.1,-17.5);await aim(55.5,.6,-17.5);await key('KeyE');assert.equal((await inspect()).chapter.trainStarted,true);
  await walk(54.1,-20.5);await walk(61.5,-20.5);await walk(61.5,-17.5);await aim(63.5,1.4,-17.5);await key('KeyE');
  assert.equal((await inspect()).chapter.ui.mode,'ending');for(let i=0;i<82;i++)await frame();
  assert.equal((await inspect()).chapter.ui.mode,'complete');assert.equal(await page.locator('#ending-screen').isVisible(),true);await shot('current-ending');
  assert.match(await page.locator('[data-ending-time]').textContent(),/分.*秒/);receipts.push('Page reload continuation, R2 three-clue code, train escape, ending and elapsed time');
  await pad([],deviceName);await pad([13],deviceName);await pad([],deviceName,0);await pad([0],deviceName);
  assert.equal(await page.locator('#factory-map').isVisible(),true);assert.match(await page.locator('#map-content').textContent(),/收藏版/);
  await pad([],deviceName,0);await pad([1],deviceName);await pad([],deviceName,0);await pad([12],deviceName);await pad([],deviceName,0);await pad([0],deviceName);
  assert.equal(await page.locator('#start-menu').isVisible(),true);assert.equal(await page.locator('#start-confirm').isVisible(),true);
  assert.equal(errors.length,0,errors.join('\n'));
  const result={date:'2026-11-01',inputDevice,receipts,errors,limitations:['Deterministic browser clock and simulated controllers; not physical Xbox/PS or school PC performance.']};
  await writeFile(`${outputDir}/${inputDevice==='keyboard'?'':inputDevice+'-'}browser-verification.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
} catch(error) {
  await page.screenshot({path:'/private/tmp/escape-qa-failure.png'});console.error(error);const s=await inspect();console.error(JSON.stringify({player:s.chapter.player,ui:s.chapter.ui,checkpoint:s.chapter.checkpointId,session:s.session,settings:s.settings,errors}));process.exitCode=1;
} finally {await browser.close();}
