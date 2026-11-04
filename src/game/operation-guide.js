import {buttonLabel} from '../logic/gamepad.js';
export function controlLegend(device='keyboard'){
  const key=action=>buttonLabel(action,device),pad=device!=='keyboard';
  return [
    {control:'move',key:key('move'),action:'移動'},{control:'look',key:key('look'),action:'轉頭觀察'},
    {control:'interact',key:key('interact'),action:'互動／撿取'},{control:'flashlight',key:key('flashlight'),action:'手電筒開關'},
    {control:'uv',key:key('uv'),action:'一般光／紫外光'},{control:'pause',key:key('pause'),action:'暫停／操作指南'},
    {control:'map',key:pad?(device==='ps'?'Create／Share':'View'):'M',action:'查看地圖'},
    {control:'settings',key:pad?(device==='ps'?'△':'Y'):'O',action:'開啟設定'},
    {control:'menu',key:pad?'十字鍵':'方向鍵／數字鍵',action:'選單／密碼鎖'},
    {control:'confirm',key:pad?key('confirm'):'Enter',action:'確認選項'},
    {control:'cancel',key:key('cancel'),action:'返回／取消'},
  ];
}
export function operationGuide(s,device='keyboard',target=null){
  const label=action=>buttonLabel(action,device),act=(action,text)=>({control:action,key:label(action),action:text});
  const has=id=>s.inventory.itemIds.includes(id);
  if(s.ui.mode==='hiding')return {title:'保持安靜',body:'在被發現前躲藏。用視角窺看外面，等娃娃轉身離開再出櫃；一旦被看見就會被抓。',actions:[act('look','窺視'),act('interact','出櫃')]};
  if(s.corridor?.active)return {title:'別停下來',body:'持續前進：向東、左轉向北，再右轉向東。通過的門會在身後關閉。',actions:[act('move','前進'),act('look','看路')]};
  if(target){
    const name=target.name,locker=target.kind==='locker';
    if(target.interactionSource==='door')return {title:target.kind==='keypad'?'操作貨運門鎖':'操作第一道隔離門',body:target.kind==='keypad'?'整片門都能操作：對準門板按互動鍵，即可開啟門旁的密碼鎖。':'整片門都能操作：對準門板按互動鍵，即可讀取並記錄左側維修卡；完成復位後門會自動開啟。',actions:[act('interact',target.kind==='keypad'?'開啟門鎖':'讀卡／開門')]};
    if(target.kind==='clueNote')return {title:'記錄文件線索',body:'直接對準紙張或文字，按互動鍵記錄；已記錄的內容可在地圖中回看。',actions:[act('interact','記錄線索')]};
    if(target.kind==='trainCard')return {title:'記錄列車檢修卡',body:'準星對準卡片，按互動鍵記錄系統名稱與讀數；記錄會保留在工廠地圖。',actions:[act('interact','記錄讀數')]};
    if(target.kind==='trainConsole')return {title:s.trainStarted?'列車已備妥':'列車發車檢修',body:s.trainStarted?'沿月台前進，對準列車入口按互動鍵登車。':'收齊三張卡，讀數各除以六、由小到大排列；最前面加上完整軌道組數，每組包含兩根鋼軌。',actions:[act('interact',s.trainStarted?'查看狀態':'開啟控制器')]};
    if(target.kind==='train')return {title:'撤離列車',body:s.trainStarted?'按互動鍵登車，開始最後一段列車旅程。':'先在月台控制台完成檢修並啟動列車。',actions:[act('interact','登車')]};
    return {title:locker?'先躲進櫃子避開視線':`面前是${name}`,body:locker?'被發現前，準星對準櫃門並按互動鍵躲藏；已被娃娃看見就無法逃過抓捕。':target.kind==='keypad'?(device==='keyboard'?'按互動鍵打開控制器；用數字鍵輸入，或用滑鼠點按，Enter確認。':'按互動鍵打開控制器；用十字鍵選按鈕，再按下方確認鍵。'):'靠近兩公尺內，準星對準物品或設備，按互動鍵操作。',actions:[act('interact',locker?'躲藏':target.bounds?'操作':'撿取')]};
  }
  if(has('lobby.flashlight')&&!s.flashlight.enabled&&(!has('lobby.employee-card')||!has('lobby.factory-map')))return {title:'先打開巡檢燈',body:'手電筒已拿到了。按開燈鍵照亮前方，再找員工卡與地圖；切換鍵可以改用紫外光。',actions:[act('flashlight','開燈'),act('uv','切換光線'),act('interact','撿取')]};
  if(!has('lobby.flashlight')||!has('lobby.employee-card')||!has('lobby.factory-map'))return {title:'先熟悉操作',body:'移動並轉頭探索。把中央準星對準手電筒、員工卡或地圖，再按互動鍵撿取。',actions:[act('move','移動'),act('look','觀察'),act('interact','撿取')]};
  if(!s.puzzles['power.main'].installedItemId)return {title:'修復控制室電箱',body:'在工作桌上找保險絲；拿到後，對準東牆電箱按互動鍵安裝。',actions:[act('flashlight','照明'),act('interact','撿取／安裝')]};
  if(!s.puzzles['power.main'].restored)return {title:'紫外光能看見隱藏字',body:'先開手電筒，再切成紫外光，照向電箱旁的牆；記住檢修碼後操作密碼鎖。',actions:[act('flashlight','開燈'),act('uv','切紫外光'),act('interact','操作控制器')]};
  if(s.puzzles['exit.final']?.restored&&!s.trainStarted)return {title:`月台檢修卡 ${s.trainPuzzle?.readCardIds.length??0}／3`,body:'北側設備上有牽引、制動與照明三張檢修卡。分別按互動鍵記錄，接著回到發車控制台。',actions:[act('look','找檢修卡'),act('interact','讀卡／操作')]};
  if(s.trainStarted)return {title:'登上撤離列車',body:'列車已啟動。沿月台走到列車入口，對準後按互動鍵登車。',actions:[act('move','走向列車'),act('interact','登車')]};
  return {title:'避開娃娃的視線',body:'利用機台遮擋，觀察娃娃轉身再移動，也可提前躲入置物櫃。一旦被看見，就會觸發無法逃脫的抓捕。',actions:[act('interact','操作／先躲藏'),act('pause','操作指南')]};
}
