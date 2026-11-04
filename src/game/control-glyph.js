// Controller prompts use the shape of the actual control. Only keyboard input
// receives a keycap; stick names never sit inside a rectangular keyboard key.
export function createControlGlyph(doc,control,device='keyboard',label=''){
  if(device==='keyboard'){
    const key=doc.createElement('kbd');key.textContent=label;return key;
  }
  const ps=device==='ps',namespace='http://www.w3.org/2000/svg';
  const svg=(tag,attrs={},text)=>{const node=doc.createElementNS(namespace,tag);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));if(text)node.textContent=text;return node;};
  const wrap=doc.createElement('span');wrap.className='control-symbol';wrap.dataset.control=control;
  const icon=svg('svg',{viewBox:'0 0 36 36',width:36,height:36,'aria-hidden':'true',focusable:'false'});
  icon.append(svg('title',{},label));
  const path=(d,attrs={})=>icon.append(svg('path',{d,...attrs}));
  const circle=(cx,cy,r,attrs={})=>icon.append(svg('circle',{cx,cy,r,...attrs}));
  const text=(value,attrs={})=>icon.append(svg('text',{x:18,y:23,'text-anchor':'middle','font-family':'system-ui,sans-serif','font-size':16,'font-weight':650,fill:'#e4e7dc',...attrs},value));
  let name='';
  if(control==='move'||control==='look'){
    wrap.className+=' control-symbol-stick';
    path('M18 1 L15 5 H21 Z M18 35 L15 31 H21 Z M1 18 L5 15 V21 Z M35 18 L31 15 V21 Z',{fill:'#b9c8ba'});
    circle(18,18,11.5,{fill:'#09171b',stroke:'#718b87','stroke-width':1.3});
    circle(18,18,8.7,{fill:'#294341',stroke:'#c8d0bb','stroke-width':1.3});
    circle(18,18,6.5,{fill:'none',stroke:'#78928a','stroke-width':.6,'stroke-dasharray':'1.2 1.3'});
    text(control==='move'?'L':'R',{'font-size':11,y:22});name=label;
  }else if(control==='menu'){
    wrap.className+=' control-symbol-dpad';
    path('M13 3 H23 V13 H33 V23 H23 V33 H13 V23 H3 V13 H13 Z',{fill:'#243b3b',stroke:'#b3c1b4','stroke-width':1.4,'stroke-linejoin':'round'});
    path('M18 7 L15 11 H21 Z M18 29 L15 25 H21 Z M7 18 L11 15 V21 Z M29 18 L25 15 V21 Z',{fill:'#c5cfba'});name=label;
  }else if(control==='uv'||control==='flashlight'){
    wrap.className+=' control-symbol-shoulder';
    path('M4 25 L5 12 Q6 7 12 7 H24 Q30 7 31 12 L32 25 Q18 21 4 25 Z',{fill:'#294240',stroke:'#c1cbb5','stroke-width':1.3});
    text(label,{'font-size':12,y:20});
  }else if(control==='pause'||control==='map'){
    wrap.className+=' control-symbol-system';
    circle(18,18,13,{fill:'#192e31',stroke:'#92a69a','stroke-width':1.2});
    if(control==='pause')path('M11 12 H25 M11 18 H25 M11 24 H25',{fill:'none',stroke:'#e0dfc7','stroke-width':2.2,'stroke-linecap':'round'});
    else if(ps){path('M12 23 L24 11 M13 11 H24 V22',{fill:'none',stroke:'#e0dfc7','stroke-width':1.7});}
    else {icon.append(svg('rect',{x:10,y:10,width:12,height:11,fill:'none',stroke:'#e0dfc7','stroke-width':1.4}),svg('rect',{x:14,y:15,width:12,height:11,fill:'#192e31',stroke:'#e0dfc7','stroke-width':1.4}));}
    name=label;
  }else{
    wrap.className+=' control-symbol-face';
    const tint=control==='settings'?(ps?'#80d2b7':'#efcf74'):control==='cancel'?'#e79b91':ps?'#9ebfe7':'#a8d491';
    circle(18,18,13.5,{fill:'#12252b',stroke:tint,'stroke-width':1.6});
    if(ps){
      if(control==='settings')path('M18 9 L27 25 H9 Z',{fill:'none',stroke:tint,'stroke-width':1.8,'stroke-linejoin':'round'});
      else if(control==='cancel')circle(18,18,7,{fill:'none',stroke:tint,'stroke-width':2});
      else path('M12 12 L24 24 M24 12 L12 24',{fill:'none',stroke:tint,'stroke-width':2.2,'stroke-linecap':'round'});
    }else text(label,{fill:tint});
  }
  wrap.append(icon);
  if(name){const caption=doc.createElement('span');caption.className='control-keyname';caption.textContent=name;wrap.append(caption);}
  wrap.setAttribute('role','img');wrap.setAttribute('aria-label',label);return wrap;
}
