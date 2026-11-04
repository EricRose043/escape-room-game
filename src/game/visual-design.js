// Presentation-only plans. Dimensions come from the existing collision surfaces.
export function seededRandom(seed=819){
  let value=seed>>>0;
  return ()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};
}

export function planShellDetails(boxes,surfaces){
  const details=[];
  const add=(source,kind,bounds)=>{
    if(['X','Y','Z'].every(a=>bounds['max'+a]>bounds['min'+a]))details.push({sourceId:source.id,kind,bounds});
  };
  for(const b of boxes.filter(b=>b.kind==='wall')){
    const xWall=b.maxX-b.minX<b.maxZ-b.minZ;
    const long=xWall?'Z':'X',short=xWall?'X':'Z';
    for(const y of [.06,.98,1.08,2.88]){
      const minY=Math.max(b.minY,y),maxY=Math.min(b.maxY,y+.055);
      for(const side of ['min','max']){
        const p=b[side+short],q={...b,minY,maxY};
        q['min'+short]=p-.018;q['max'+short]=p+.018;
        add(b,y<.1?'skirting':'brass',q);
      }
    }
    for(let p=b['min'+long]+.8;p<b['max'+long]-.15;p+=2.4){
      const q={...b,minY:Math.max(b.minY,1.14),maxY:Math.min(b.maxY,2.82)};
      q['min'+long]=p;q['max'+long]=p+.045;
      q['min'+short]-=.012;q['max'+short]+=.012;
      add(b,'seam',q);
    }
  }
  for(const b of surfaces.filter(b=>b.kind==='floor')){
    if(b.maxX-b.minX<1||b.maxZ-b.minZ<1)continue;
    for(const z of [b.minZ+.2,b.maxZ-.2])add(b,'floorLine',{...b,minX:b.minX+.2,maxX:b.maxX-.2,minY:b.maxY+.002,maxY:b.maxY+.009,minZ:z,maxZ:z+.035});
    for(const x of [b.minX+.2,b.maxX-.2])add(b,'floorLine',{...b,minX:x,maxX:x+.035,minY:b.maxY+.002,maxY:b.maxY+.009,minZ:b.minZ+.2,maxZ:b.maxZ-.2});
  }
  return details;
}
