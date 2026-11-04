import test from 'node:test';
import assert from 'node:assert/strict';
import {showSettings} from '../src/game/settings-view.js';
import {createGameSettingsStorage,serialize,SETTINGS_KEY} from '../src/logic/settings.js';

// 僅模擬 range 的 step 量化，不把此 DOM 替身當成瀏覽器／GPU 實測。
function panelDocument(){
  const inputs=[];
  const doc={createElement(tag){
    let value='';const events=new Map();
    const el={ownerDocument:doc,children:[],attrs:{},classList:{toggle(){}},
      append(...children){this.children.push(...children);},replaceChildren(...children){this.children=children;},
      setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,fn){events.set(k,fn);},removeEventListener(k){events.delete(k);},focus(){},
      get value(){return value;},set value(v){
        const number=Number(v),step=Number(this.step||1),min=Number(this.min||0);
        value=String(this.type==='range'&&this.step!=='any'?min+Math.round((number-min)/step)*step:number);
      }};
    if(tag==='input')inputs.push(el);return el;
  }};
  return {root:doc.createElement('div'),inputs};
}
test('已儲存合法小數音量及倍率在設定面板精確呈現，不被step偷偷量化',()=>{
  const map=new Map([[SETTINGS_KEY,serialize({volume:37.4,jumpScare:false,mouseSensitivity:1.1})]]);
  const storage=createGameSettingsStorage({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)});
  const settings=storage.load(),{root,inputs}=panelDocument();
  showSettings(root,settings,()=>{},()=>{});
  assert.equal(Number(inputs[0].value),settings.volume);
  assert.equal(Number(inputs[1].value),settings.mouseSensitivity);
});
test('小數設定用手把微調後仍與顯示及持久化一致',()=>{
  const {root,inputs}=panelDocument();let changed;
  const view=showSettings(root,{volume:32,jumpScare:true,mouseSensitivity:1.1},s=>{changed=s;},()=>{});
  view.handleGamepad({menuDirection:'down'});view.handleGamepad({menuDirection:'down'});view.handleGamepad({menuDirection:'right'});
  assert.equal(changed.mouseSensitivity,1.35);
  assert.equal(Number(inputs[1].value),changed.mouseSensitivity);
});
