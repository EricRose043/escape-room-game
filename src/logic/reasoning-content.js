import {TRAIN_CARDS} from './puzzles/train-code.js';
import {CLUES as worldClues} from './world.js';

// 原始讀數、設備順序及單位分散在不同文件；不把驗證密碼當顯示文字。
export const REASONING=Object.freeze({
 power:{readings:[{name:'照明',value:6},{name:'輸送',value:2},{name:'通風',value:7},{name:'冷卻',value:4}],order:['冷卻','通風','輸送','照明']},
 production:{readings:[{name:'冷卻',value:4},{name:'包裝',value:8},{name:'送料',value:9},{name:'熱壓',value:6}],
   order:['送料','熱壓','包裝','冷卻'],units:{送料:3,熱壓:6,包裝:2,冷卻:2},colors:{red:'送料',yellow:'熱壓',green:'包裝',blue:'冷卻'}},
});
const colorNames={red:'紅',yellow:'黃',green:'綠',blue:'藍'};
const reading=(data,name)=>data.readings.find(r=>r.name===name).value;
const calibrated=()=>Object.fromEntries(REASONING.production.readings.map(r=>[r.name,r.value/REASONING.production.units[r.name]]));
const colorValues=()=>Object.fromEntries(Object.entries(REASONING.production.colors).map(([color,station])=>[color,calibrated()[station]]));
export function validReasoningColorOrder(order){
 if(order.length!==4||new Set(order).size!==4||order.some(color=>!Object.hasOwn(colorNames,color)))return false;
 const values=colorValues(),byValue=Object.keys(values).sort((a,b)=>values[a]-values[b]);
 const minimum=byValue[0],maximum=byValue.at(-1),unused=byValue.find(c=>!['red',minimum,maximum].includes(c));
 return order.indexOf(minimum)===order.indexOf('red')+1&&order.indexOf(maximum)===order.indexOf(minimum)+1&&order[3]===unused;
}
export function deriveReasoningAnswers(){
 const values=colorValues(),minimum=Object.keys(values).sort((a,b)=>values[a]-values[b]);
 const colors=['red',minimum[0],minimum.at(-1),minimum.find(c=>!['red',minimum[0],minimum.at(-1)].includes(c))];
 return {power:REASONING.power.order.map(name=>reading(REASONING.power,name)).join(''),
   production:REASONING.production.order.map(name=>calibrated()[name]).join(''),colors,
   exit:[...colors].reverse().map(color=>values[color]).join(''),
   train:'2'+TRAIN_CARDS.map(c=>c.reading/reading(REASONING.power,'照明')).sort((a,b)=>a-b).join('')};
}
const powerInk='停機讀數（未排序）\n'+REASONING.power.readings.map(r=>`${r.name}：${r.value}`).join('｜');
const productionInk='停機量測（原始格數）\n'+REASONING.production.readings.map(r=>`${r.name}：${r.value}`).join('｜');
const circuitOrder='復電登錄依回路圖：'+REASONING.power.order.join(' → ')+'。殘墨只存讀數，不能照抄原排列。';
const calibration='量測單位：'+REASONING.production.order.map(name=>`${name}每單位${REASONING.production.units[name]}格`).join('；')+'。控制器只登錄完整單位數。';
const processOrder='設備接線：'+REASONING.production.order.join(' → ')+'。依接線次序登錄各設備的校正值。';
const lightRules='復位條件：① 最小校正值的燈緊接紅燈之後。② 最大校正值的燈緊接最小值的燈之後。③ 尚未使用的燈最後。';
const stationColors='回路燈牌：'+Object.entries(REASONING.production.colors).map(([color,station])=>`${colorNames[color]}／${station}`).join('；')+'。數值使用設備的完整單位數。';
const transfer='維修移轉：顏色沿用裝配線同色設備的完整單位數，不使用停機原始格數。';
const reverse='撤離規則：從最後一盞往第一盞回讀已完成的燈序，再依維修移轉表登錄數值。';
const trainRule='列車檢修\n校驗單位沿用控制室停機時的照明讀數。\n將三卡換成校驗單位，從最低負載排到最高負載。\n首格填現場完整軌道組數，包含停用線；每組都有兩根鋼軌。\n員工卡驗證後發車。';
const clueTexts={'power.uv-code':powerInk,'production.sequence-clue':productionInk,'corridor.color-key':transfer,'exit.reverse-clue':reverse};
export function reasoningClues(clues){return clues.map(c=>({...c,text:clueTexts[c.id]??c.text,
 ...(['power.uv-code','production.sequence-clue'].includes(c.id)?{width:c.id==='power.uv-code'?2.2:1.6,height:.9,reserveReadingSpace:true}:c.alwaysVisible?{height:.85}:{})}));}
const paper=(id,text,position,normal)=>({id,text,position,normal,width:1.7,height:1.05,kind:'paper',paperSize:{width:1.7,height:1.05}});
export function reasoningAreas(areas){return areas.map(area=>{
 const replacements={'production.color-order':stationColors,'production.console-guide':lightRules,'bay.train-formula':trainRule};
 const signs=area.signs.map(s=>Object.hasOwn(replacements,s.id)?{...s,text:replacements[s.id],kind:'paper',paperSize:{width:1.7,height:1.05}}:s);
 if(area.id==='power-room')signs.push(paper('power.circuit-order-note',circuitOrder,{x:2.5,y:2.25,z:-8.18},{x:0,y:0,z:1}));
 if(area.id==='production')signs.push(
   paper('production.calibration-record',calibration,{x:10.1,y:2.2,z:-12.48},{x:0,y:0,z:1}),
   paper('production.process-note',processOrder,{x:10.3,y:2.25,z:-.32},{x:0,y:0,z:-1}));
 return {...area,clues:reasoningClues(area.clues),signs};
});}
const noteClues=new Map(reasoningClues(worldClues).filter(c=>c.alwaysVisible).map(c=>[c.id,c]));
export function reasoningTarget(target){
 if(!target)return target;
 const documentNames={'corridor.color-key':'維修移轉表','exit.reverse-clue':'撤離規則文件'};
 const name=documentNames[target.clueId]??(target.kind==='sequenceButton'?`${colorNames[target.color]}燈復位按鈕`:target.name);
 const clue=target.kind==='clueNote'&&target.interactionSource!=='door'?noteClues.get(target.clueId):null;
 if(clue){
  const {position:p,normal:n,width,height}=clue,hx=Math.abs(n.z)*(width/2+.08)+Math.abs(n.x)*.003,hz=Math.abs(n.x)*(width/2+.08)+Math.abs(n.z)*.003;
  return {...target,name,bounds:{minX:p.x-hx,maxX:p.x+hx,minY:p.y-height/2-.08,maxY:p.y+height/2+.08,minZ:p.z-hz,maxZ:p.z+hz}};
 }
 return name===target.name?target:{...target,name};
}
export function reasoningObjective(s,fallback){
 if(!['explore','keypad'].includes(s.ui.mode)||!s.inventory.itemIds.includes('lobby.flashlight'))return fallback;
 if(s.puzzles['power.main'].installedItemId&&!s.puzzles['power.main'].restored)return '找出停機讀數與另一份回路接線圖，組合復電登錄值。紫外光不會直接給密碼。';
 if(s.puzzles['power.main'].restored&&!s.puzzles['production.sequence'].restored)return '避開玩偶。比對停機量測、設備單位表及接線次序，校正裝配線控制器。';
 if(s.puzzles['production.sequence'].restored&&!s.puzzles['production.color-sequence']?.restored)return '依各設備校正值、回路燈牌與三條復位條件操作四色；M可回看控制紀錄。';
 return fallback;
}
export function reasoningMapText(s,complete=false){
 const notes=['辦公室 → 控制室 → 裝配線 → 追逐走廊 → 出口控制廳 → 列車月台',
  complete?'收藏版：工坊六區與撤離路線。':'底圖：文件需靠近觀察；控制器完成後會保留檢修紀錄，方便通過隔離門後比對。'];
 if(s.puzzles['power.main']?.restored)notes.push('\n控制室停機資料（已復電）',powerInk,circuitOrder);
 if(s.puzzles['production.sequence']?.restored)notes.push('\n裝配線控制器校正紀錄',...REASONING.production.order.map(name=>`${name}：${calibrated()[name]} 個完整單位`),stationColors);
 if(s.foundClueIds?.includes('production.color-clue'))notes.push('\n已完成的復位燈序：'+deriveReasoningAnswers().colors.map(c=>colorNames[c]).join(' → '));
 if(s.foundClueIds?.includes('corridor.color-key'))notes.push(transfer);
 if(s.foundClueIds?.includes('exit.reverse-clue'))notes.push(reverse);
 const cards=TRAIN_CARDS.filter(c=>s.trainPuzzle?.readCardIds.includes(c.id));
 notes.push(`\n已記錄的列車卡 ${cards.length}/3：`,...cards.map(c=>c.text));
 // 月台規則須到現場讀，不因拿到一張卡就自動給整套公式。
 return notes.join('\n');
}
