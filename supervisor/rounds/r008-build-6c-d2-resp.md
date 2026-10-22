DONE

1. ① `087b6a3`：`npm test` **160 通過／9 失敗**。② `405a995`：**169/169 通過**，實作未改測試。
2. 修改檔案：`src/logic/` 的 `chapter-save.js`、`save-storage.js`、`start-menu.js`、`index.js`；`src/game/` 的 `start-menu-view.js`、`main.js`；新增四個 `tests/{chapter-save,save-storage,start-menu,save-flow}.test.js`，核准修改 `capture-input.test.js`；另有 `index.html`、`README.md`、`PLANS.md`。
3. 選擇器：`#start-continue`、`#start-new`、`#start-confirm`、`#start-cancel`；暫停後用 `#start-open` 開選單。錯誤訊息為 `#start-message`，儲存提示為 `#start-save-status`／`#save-status`。
4. 壞檔測試：先備份原字串，再執行下列指令。應拒絕繼續，確認重新開始前不覆寫。
5. 建議監督者另行裁定：後續將脆弱的 `runtime()` 架子抽成共用 helper；本輪未重構。
6. 瀏覽器、實體手把與 FPS 未驗；STEP 6c／STEP 6 已勾選並註明瀏覽器未驗。工作樹乾淨，未 push。

```js
localStorage.setItem('star-candy-park.chapter-1.save', '{broken');
location.reload();
```

有效存檔範例：

```json
{"version":1,"chapterId":"chapter-1","checkpointId":"production.checkpoint","itemIds":["lobby.flashlight","power.fuse"],"puzzles":{"power.main":{"installedItemId":"power.fuse","restored":true}},"flashlight":{"charge":82.5,"mode":"normal"}}
```

`capture-input.test.js` 完整 diff；所有斷言、`ready()`、`pad()` 未變：

```diff
diff --git a/tests/capture-input.test.js b/tests/capture-input.test.js
index a9b151f..7a60ad4 100644
--- a/tests/capture-input.test.js
+++ b/tests/capture-input.test.js
@@ -21,14 +21,17 @@ async function runtime(jumpScare=false) {
   },emit(type,event={}){for(const fn of this.listeners.get(type)??[]) fn({preventDefault(){},...event});}});
   const context=new Proxy({}, {get:(target,key)=>target[key]??(()=>{})});
   const element=()=>({...listeners(),hidden:true,textContent:'',style:{},dataset:{},
-    appendChild(){},getContext:()=>context});
+    appendChild(){},getContext:()=>context,focus(){},classList:{toggle(){}},setAttribute(){}});
   const elements=new Map();
   const get=selector=>{if(!elements.has(selector)) elements.set(selector,element());return elements.get(selector);};
   const screen=get('#capture-screen');screen.querySelector=()=>get('#capture-canvas');
+  get('#start-menu').querySelector=get;
+  const saved=new Map();
+  const storage={getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value),removeItem:key=>saved.delete(key)};
   const document={...listeners(),hidden:false,pointerLockElement:null,hasFocus:()=>true,
     querySelector:get,createElement:element,body:element(),exitPointerLock(){this.pointerLockElement=null;this.emit('pointerlockchange');}};
   const window={...listeners(),innerWidth:1000,innerHeight:700,devicePixelRatio:1,
-    location:{search:jumpScare?'?jumpscare=1':''}};
+    location:{search:jumpScare?'?jumpscare=1':''},localStorage:storage};
   const vector=()=>({set(){},setScalar(){}});
   class Object3D {constructor(){this.position=vector();this.rotation=vector();}add(){}remove(){}lookAt(){}}
   class Renderer {constructor(){this.domElement=element();this.domElement.requestPointerLock=async()=>{
@@ -45,12 +48,16 @@ async function runtime(jumpScare=false) {
   const source=(await readFile(new URL('../src/game/main.js',import.meta.url),'utf8'))
     .replace(/^import[\s\S]*?from '[^']+';\n/gm,'');
   const {createCaptureView}=await import('../src/game/capture-view.js');
+  const {createStartMenuView}=await import('../src/game/start-menu-view.js');
   const values={...logic,createChapter:options=>({...ready(options),player:{...ready(options).player,paused:true}}),
     updateChapter:(...args)=>(lastChapter=logic.updateChapter(...args))};
   const dependencies={THREE,document,window,navigator:{getGamepads:()=>pads},
     requestAnimationFrame:fn=>{frame=fn;},createWorldView:()=>({sync(){}}),createMonsterView:()=>({sync(){}}),
-    createKeypadView:()=>({sync(){}}),createCaptureView,compensatedIntensity:()=>35,...values};
+    createKeypadView:()=>({sync(){}}),createCaptureView,createStartMenuView,compensatedIntensity:()=>35,...values};
   new Function(...Object.keys(dependencies),source)(...Object.values(dependencies));
+  // 空儲存：先選新遊戲及確認選項，讓原本的 A／✕ 或開始點擊完成啟動。
+  get('#start-new').emit('click');
+  document.emit('keydown',{code:'ArrowRight'});
   return {document,window,get,pads:value=>{pads=value;},frame:time=>frame(time),state:()=>lastChapter};
 }
 
```