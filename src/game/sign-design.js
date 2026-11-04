const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
export function wrapSignText(text,columns=12){
  const lines=[];
  for(const paragraph of text.split('\n')){
    const chars=Array.from(paragraph);
    for(let i=0;i<chars.length;i+=columns)lines.push(chars.slice(i,i+columns).join(''));
  }
  return lines;
}

// Resolve a physical surface before drawing anything. Unsupported tabletop labels
// are redundant with the pickup HUD and are intentionally omitted.
export function planMountedSign(sign,boxes){
  if(sign.normal.y)return null;
  const card=sign.id.endsWith('-label')?boxes.find(b=>b.kind==='trainCard'&&b.id===sign.id.slice(0,-6)):null;
  if(card)return {...sign,supportId:card.id,position:{x:(card.minX+card.maxX)/2,y:(card.minY+card.maxY)/2,z:card.maxZ+.006},normal:{x:0,y:0,z:1},kind:'paper',lines:wrapSignText(sign.text,12)};
  const formula=sign.id==='bay.train-formula';
  const kind=sign.kind??(sign.id.includes('color-order')?'diagram':/warning|uv-note/.test(sign.id)?'warning'
    :formula||/log|report|record|notice|note|console-guide|corridor.sign/.test(sign.id)?'paper':'stencil');
  const width=sign.paperSize?clamp(sign.paperSize.width,1,1.8):formula?1.8:kind==='paper'||kind==='warning'?Math.min(sign.width,1.25):Math.min(sign.width,2.7);
  const height=sign.paperSize?clamp(sign.paperSize.height,.53,1.1):formula?1.05:(kind==='paper'||kind==='warning') ? .53 : sign.height;
  const faces=[];
  for(const b of boxes.filter(b=>['wall','locker'].includes(b.kind))){
    const axis=b.maxX-b.minX<b.maxZ-b.minZ?'x':'z',tangent=axis==='x'?'z':'x';
    const A=axis.toUpperCase(),T=tangent.toUpperCase();
    if(b['max'+T]-b['min'+T]<width+.02||b.maxY-b.minY<height+.02)continue;
    for(const n of [-1,1]){
      const face=b[(n>0?'max':'min')+A],signed=(sign.position[axis]-face)*n;
      const startsInside=sign.position[axis]>=b['min'+A]&&sign.position[axis]<=b['max'+A];
      if(signed<-.025&&!startsInside)continue;
      const position={...sign.position};position[axis]=face+n*.006;
      position[tangent]=clamp(position[tangent],b['min'+T]+width/2+.01,b['max'+T]-width/2-.01);
      position.y=clamp(position.y,b.minY+height/2+.01,b.maxY-height/2-.01);
      const normal={x:0,y:0,z:0};normal[axis]=n;
      const distance=Math.hypot(...['x','y','z'].map(a=>position[a]-sign.position[a]));
      const aligned=normal.x===sign.normal.x&&normal.z===sign.normal.z;
      faces.push({supportId:b.id,position,normal,distance,aligned});
    }
  }
  const aligned=faces.filter(f=>f.aligned&&f.distance<1.3);
  const mount=(aligned.length?aligned:faces).sort((a,b)=>a.distance-b.distance)[0];
  return mount?{...sign,...mount,width,height,kind,lines:wrapSignText(sign.text,12)}:null;
}
