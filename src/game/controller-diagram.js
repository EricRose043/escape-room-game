const SVG_NS='http://www.w3.org/2000/svg';
const FONT='"Microsoft JhengHei", "Noto Sans TC", system-ui, sans-serif';

/** A self-contained diagram of the controls the game actually consumes.
 * `device` follows the existing input device names: "ps" or "xbox".
 * Every control and its leader label carry the same data-control value so a
 * parent view can highlight a function without knowing the controller layout.
 */
export function createControllerDiagram(doc,device='xbox',{compact=false}={}){
  const ps=device==='ps',name=ps?'PlayStation':device==='unknown'?'標準手把':'Xbox',ink='#dae5dd',muted='#8daba5',accent='#d9bc79',line='#7e9a90';
  const make=(tag,attrs={},text)=>{
    const node=doc.createElementNS(SVG_NS,tag);
    for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));
    if(text!==undefined)node.textContent=text;
    return node;
  };
  const add=(parent,tag,attrs={},text)=>{const node=make(tag,attrs,text);parent.append(node);return node;};
  const svg=make('svg',{xmlns:SVG_NS,viewBox:'0 0 960 480',width:'960',height:'480',role:'img','aria-label':`${name} 手把完整操作圖；左搖桿移動、右搖桿轉動視角。`,'data-device':ps?'ps':'xbox','data-compact':compact?'true':'false',class:'controller-diagram',style:'display:block;width:100%;height:auto;max-width:960px;overflow:visible'});
  add(svg,'title',{},`${name} 手把操作圖`);
  add(svg,'desc',{},'以真實手把位置標出移動、視角、手電筒、紫外光、互動、返回、設定、地圖、暫停與選單。上方扳機目前沒有遊戲功能。');
  const defs=add(svg,'defs');
  // Fixed IDs are unnecessary: SVG fills use local solid colours, so several
  // diagrams can appear together without gradient/clip-path ID collisions.
  add(defs,'style',{},'[data-control] { transition: opacity .16s; }');
  add(svg,'rect',{x:1,y:1,width:958,height:478,rx:22,fill:'#101c20',stroke:'#38504d','stroke-width':1});
  add(svg,'path',{d:'M24 58H936',stroke:'#2c4442','stroke-width':1,fill:'none'});
  add(svg,'text',{x:25,y:34,fill:ink,'font-family':FONT,'font-size':compact?17:20,'font-weight':700},`${name.toUpperCase()}  /  手把操作圖`);
  add(svg,'text',{x:934,y:33,fill:muted,'font-family':FONT,'font-size':12,'text-anchor':'end','letter-spacing':1.1},'AFTER CLOSING  ·  CONTROL GUIDE');
  // Grounded grip shadow and sculpted twin handles.
  add(svg,'ellipse',{cx:480,cy:407,rx:220,ry:16,fill:'#071113',opacity:.65});
  const chassis=add(svg,'g',{'data-part':'controller-shell'});
  // Trigger caps are intentionally subdued and unlabeled: they have no action.
  for(const [x,label] of [[306,ps?'L2':'LT'],[579,ps?'R2':'RT']]){
    add(chassis,'path',{d:`M${x} 123V105Q${x+2} 91 ${x+18} 91H${x+57}Q${x+74} 92 ${x+75} 109V124Z`,fill:'#253737',stroke:'#627572','stroke-width':1.5,opacity:.68});
    add(chassis,'text',{x:x+37,y:109,fill:'#82918a','font-family':FONT,'font-size':11,'font-weight':700,'text-anchor':'middle',opacity:.65},label);
  }
  add(chassis,'path',{d:ps?
    'M341 123C368 115 397 122 421 127H539C563 122 592 115 619 123C653 133 678 167 692 207L721 325C731 366 712 395 688 399C664 403 650 385 638 365L599 313C584 300 569 298 552 300H408C391 298 376 300 361 313L322 365C310 385 296 403 272 399C248 395 229 366 239 325L268 207C282 167 307 133 341 123Z':
    'M338 121C365 113 396 119 420 125H540C564 119 595 113 622 121C658 133 679 171 693 214L718 327C727 365 713 397 687 400C665 403 649 383 636 360L597 309C584 297 569 294 552 297H408C391 294 376 297 363 309L324 360C311 383 295 403 273 400C247 397 233 365 242 327L267 214C281 171 302 133 338 121Z',
    fill:ps?'#d2d6cd':'#3a4f4d',stroke:ps?'#e6e6d9':'#7a9187','stroke-width':2.4});
  // Grips and seams articulate the body, rather than drawing a rounded label.
  add(chassis,'path',{d:'M291 230C277 266 267 306 263 344C260 367 268 380 279 382C292 383 303 367 315 347L353 294',fill:ps?'#a6b6ae':'#283c3b',stroke:ps?'#8b9c94':'#536d63','stroke-width':1.2});
  add(chassis,'path',{d:'M669 230C683 266 693 306 697 344C700 367 692 380 681 382C668 383 657 367 645 347L607 294',fill:ps?'#a6b6ae':'#283c3b',stroke:ps?'#8b9c94':'#536d63','stroke-width':1.2});
  add(chassis,'path',{d:'M336 138Q376 124 418 139H542Q584 124 624 138',stroke:ps?'#f7f5e7':'#91a797','stroke-width':2,fill:'none',opacity:.65});
  add(chassis,'path',{d:'M363 309Q383 286 412 286H548Q577 286 597 309',stroke:ps?'#82968d':'#1c302e','stroke-width':1.8,fill:'none'});
  // Shoulder controls sit on the controller's upper edge.
  function shoulder(x,action,key){
    const g=add(chassis,'g',{'data-control':action,'data-button':key});
    add(g,'path',{d:`M${x} 128L${x+4} 118Q${x+10} 110 ${x+27} 112L${x+89} 120L${x+90} 136Q${x+46} 127 ${x} 139Z`,fill:'#233b39',stroke:'#819b8c','stroke-width':1.5});
    add(g,'text',{x:x+45,y:128,fill:accent,'font-family':FONT,'font-size':12,'text-anchor':'middle','font-weight':700},key);
  }
  shoulder(307,'uv',ps?'L1':'LB');shoulder(563,'flashlight',ps?'R1':'RB');
  // Centre touchpad / Xbox home badge, plus real View/Share and Start buttons.
  if(ps){
    add(chassis,'rect',{x:424,y:147,width:112,height:65,rx:9,fill:'#263b3a',stroke:'#70877c','stroke-width':1.2});
    for(let y=155;y<205;y+=7)for(let x=433;x<530;x+=8)add(chassis,'circle',{cx:x,cy:y,r:.65,fill:'#52665f',opacity:.65});
    add(chassis,'circle',{cx:480,cy:238,r:10,fill:'#233936',stroke:'#91a897','stroke-width':1});
    add(chassis,'text',{x:480,y:242,fill:'#d7e0d4','font-family':FONT,'font-size':10,'text-anchor':'middle'},'PS');
  }else{
    add(chassis,'circle',{cx:480,cy:173,r:18,fill:'#152a28',stroke:'#778f81','stroke-width':1.7});
    add(chassis,'path',{d:'M469 162Q480 164 491 162L480 173L469 184L480 171L491 184',fill:'none',stroke:'#ccd8c8','stroke-width':2.7,'stroke-linecap':'round'});
    add(chassis,'path',{d:'M438 241Q480 260 522 241',fill:'none',stroke:'#6f887b','stroke-width':1,opacity:.6});
  }
  function middleButton(x,action,key){
    const g=add(chassis,'g',{'data-control':action,'data-button':key});
    add(g,'rect',{x:x-11,y:159,width:22,height:22,rx:7,fill:'#243d39',stroke:'#80998a','stroke-width':1.1});
    if(action==='map'){
      add(g,'rect',{x:x-6,y:165,width:8,height:7,rx:1,fill:'none',stroke:ink,'stroke-width':1.2});add(g,'rect',{x:x-2,y:168,width:8,height:7,rx:1,fill:'none',stroke:ink,'stroke-width':1.2});
    }else for(const y of [165,170,175])add(g,'path',{d:`M${x-5} ${y}H${x+5}`,stroke:ink,'stroke-width':1.4,'stroke-linecap':'round'});
  }
  middleButton(ps?403:440,'map',ps?'Create／Share':'View');middleButton(ps?557:520,'pause',ps?'Options':'Start');

  function stick(cx,cy,action){
    const g=add(chassis,'g',{'data-control':action,'data-part':'analog-stick'});
    add(g,'circle',{cx,cy,r:39,fill:ps?'#7a8d83':'#243b37',stroke:ps?'#9eaea1':'#799081','stroke-width':1.5});
    add(g,'circle',{cx,cy,r:32,fill:'#122c29',stroke:'#819c88','stroke-width':1.3});
    add(g,'circle',{cx,cy:cy-2,r:25,fill:'#334b42',stroke:'#b2bd9e','stroke-width':2});
    add(g,'circle',{cx,cy:cy-2,r:19,fill:'#283e37',stroke:'#54715e','stroke-width':1});
    for(let i=0;i<12;i++){const a=i*Math.PI/6,x1=cx+Math.cos(a)*27,y1=cy-2+Math.sin(a)*27,x2=cx+Math.cos(a)*30,y2=cy-2+Math.sin(a)*30;add(g,'path',{d:`M${x1} ${y1}L${x2} ${y2}`,stroke:'#7d957e','stroke-width':1});}
    for(const [dx,dy,a] of [[0,-47,0],[47,0,90],[0,47,180],[-47,0,270]])add(g,'path',{d:'M-4 3L0-2L4 3',transform:`translate(${cx+dx} ${cy+dy}) rotate(${a})`,fill:'none',stroke:accent,'stroke-width':1.6,'stroke-linecap':'round','stroke-linejoin':'round',opacity:.9});
    return {x:cx,y:cy};
  }
  function dpad(cx,cy){
    const g=add(chassis,'g',{'data-control':'menu','data-part':'directional-pad'});
    add(g,'circle',{cx,cy,r:34,fill:ps?'#b3c0b5':'#2a403a',stroke:ps?'#a1b1a4':'#698170','stroke-width':1});
    add(g,'path',{d:`M${cx-10} ${cy-29}H${cx+10}V${cy-10}H${cx+29}V${cy+10}H${cx+10}V${cy+29}H${cx-10}V${cy+10}H${cx-29}V${cy-10}H${cx-10}Z`,fill:'#203b32',stroke:'#9eb09a','stroke-width':1.2,'stroke-linejoin':'round'});
    for(const [dx,dy,a] of [[0,-20,0],[20,0,90],[0,20,180],[-20,0,270]])add(g,'path',{d:'M-4 2L0-2L4 2',transform:`translate(${cx+dx} ${cy+dy}) rotate(${a})`,fill:'none',stroke:'#a3b69d','stroke-width':1.3,'stroke-linecap':'round'});
    add(g,'circle',{cx,cy,r:4,fill:'#345142'});return {x:cx,y:cy};
  }
  const left=ps?stick(412,291,'move'):stick(345,201,'move');
  const directional=ps?dpad(345,201):dpad(412,291);
  const right=stick(558,291,'look');
  const face={settings:{x:626,y:176,key:ps?'△':'Y',color:ps?'#93c2a9':'#d9bd70'},cancel:{x:652,y:202,key:ps?'○':'B',color:ps?'#dd9a8e':'#d4907b'},interact:{x:626,y:228,key:ps?'✕':'A',color:ps?'#a5c3dc':'#a7c592'}};
  const faceRoot=add(chassis,'g',{'data-part':'face-buttons'});
  add(faceRoot,'circle',{cx:626,cy:202,r:49,fill:ps?'#b3bfb3':'#2d443d',stroke:ps?'#b5c3b6':'#526d5f','stroke-width':1});
  function faceButton(cx,cy,key,color,action){
    const g=add(faceRoot,'g',action?{'data-control':action,'data-button':key}:{'data-button':key,opacity:.62});
    add(g,'circle',{cx,cy,r:16,fill:'#132e28',stroke:'#718c76','stroke-width':1.3});
    add(g,'circle',{cx,cy:cy-1,r:12.5,fill:'#2d473c',stroke:'#47634e','stroke-width':.7});
    add(g,'text',{x:cx,y:cy+5,fill:color,'font-family':FONT,'font-size':ps?20:16,'font-weight':700,'text-anchor':'middle'},key);
  }
  faceButton(600,202,ps?'□':'X',ps?'#cfacc4':'#99bdd4');
  for(const [action,b] of Object.entries(face))faceButton(b.x,b.y,b.key,b.color,action);

  // Each callout includes an anchored leader, an endpoint ring, a physical
  // button name and a readable action. No reliance on CSS for its appearance.
  function callout(action,key,text,side,y,points){
    const g=add(svg,'g',{'data-control':action,'data-part':'control-callout'}),x=side==='left'?25:758;
    add(g,'polyline',{points,fill:'none',stroke:line,'stroke-width':1.35,'stroke-linecap':'round','stroke-linejoin':'round'});
    const first=points.split(' ')[0].split(',');add(g,'circle',{cx:first[0],cy:first[1],r:3,fill:'#101c20',stroke:accent,'stroke-width':1.5});
    add(g,'text',{x,y:y-12,fill:accent,'font-family':FONT,'font-size':22,'font-weight':700},key);
    add(g,'text',{x,y:y+14,fill:ink,'font-family':FONT,'font-size':22,'font-weight':600},text);
  }
  callout('uv',ps?'L1':'LB','一般光／紫外光','left',84,'351,119 284,84 224,84');
  callout('flashlight',ps?'R1':'RB','手電筒開關','right',84,'608,119 699,84 742,84');
  const mapX=ps?403:440,pauseX=ps?557:520;
  callout('map',ps?'Create／Share':'View','查看工廠地圖','left',157,`${mapX-11},170 272,157 224,157`);
  callout('pause',ps?'OPTIONS':'START','暫停／完整操作','right',139,`${pauseX+11},170 698,139 742,139`);
  callout('move','左搖桿','移動角色','left',ps?336:245,ps?`${left.x-20},${left.y+30} 284,336 224,336`:`${left.x-37},${left.y} 268,245 224,245`);
  callout('menu','十字鍵','選單／密碼鎖','left',ps?245:336,ps?`${directional.x-30},${directional.y} 268,245 224,245`:`${directional.x-20},${directional.y+24} 284,336 224,336`);
  callout('settings',face.settings.key,'開啟設定','right',194,'640,167 698,184 742,194');
  callout('cancel',face.cancel.key,'返回／取消','right',248,'668,202 703,220 742,248');
  callout('interact',face.interact.key,'互動／撿取／確認','right',302,'638,241 690,282 742,302');
  callout('look','右搖桿','轉動視角','right',377,`${right.x+24},${right.y+26} 644,365 742,377`);
  add(svg,'path',{d:'M25 435H935',stroke:'#2d4741','stroke-width':1,fill:'none'});
  add(svg,'text',{x:25,y:460,fill:muted,'font-family':FONT,'font-size':13},'搖桿推動幅度越小，移動與轉頭越細緻。');
  add(svg,'text',{x:935,y:460,fill:muted,'font-family':FONT,'font-size':12,'text-anchor':'end'},device==='unknown'?'標準映射；實際按鍵名稱可能不同。':'先按手把任一鍵，讓瀏覽器辨識手把。');
  return svg;
}
