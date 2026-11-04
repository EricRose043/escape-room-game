import { planMountedSign } from './sign-design.js';

// A physical blank area around every readable wall document. Its front volume
// catches raised dado rails, seams and service pipes, not merely coplanar ink.
export function planDocumentClearances(areas,boxes){
  const documents=areas.flatMap(area=>area.signs).map(sign=>planMountedSign(sign,boxes)).filter(plan=>plan&&['paper','warning','diagram'].includes(plan.kind));
  const clues=areas.flatMap(area=>area.clues).filter(clue=>clue.id!=='power.uv-code'||clue.reserveReadingSpace===true).map(clue=>({...clue,kind:'clue'}));
  return [...documents,...clues].map(plan=>{
    const n=plan.normal,p=plan.position,axis=n.x?'X':'Z',tangent=n.x?'Z':'X',a=axis.toLowerCase(),t=tangent.toLowerCase(),normal=n[a];
    const b={minY:p.y-plan.height/2-.12,maxY:p.y+plan.height/2+.12};
    b['min'+tangent]=p[t]-plan.width/2-.16;b['max'+tangent]=p[t]+plan.width/2+.16;
    b['min'+axis]=p[a]+(normal>0?-.012:-.42);b['max'+axis]=p[a]+(normal>0?.42:.012);
    return {id:plan.id,bounds:b,plan};
  });
}

export function boundsIntersect(a,b){return a.minX<b.maxX-.00001&&a.maxX>b.minX+.00001&&a.minY<b.maxY-.00001&&a.maxY>b.minY+.00001&&a.minZ<b.maxZ-.00001&&a.maxZ>b.minZ+.00001;}

// Subtract a reserved box from an axis-aligned decorative bar. Long rails keep
// their surrounding lengths instead of vanishing along the entire room wall.
export function subtractReservedBox(bounds,reserved){
  if(!boundsIntersect(bounds,reserved))return [bounds];
  const i={minX:Math.max(bounds.minX,reserved.minX),maxX:Math.min(bounds.maxX,reserved.maxX),minY:Math.max(bounds.minY,reserved.minY),maxY:Math.min(bounds.maxY,reserved.maxY),minZ:Math.max(bounds.minZ,reserved.minZ),maxZ:Math.min(bounds.maxZ,reserved.maxZ)};
  return [
    {...bounds,maxX:i.minX},{...bounds,minX:i.maxX},
    {...bounds,minX:i.minX,maxX:i.maxX,maxY:i.minY},
    {...bounds,minX:i.minX,maxX:i.maxX,minY:i.maxY},
    {...i,minZ:bounds.minZ,maxZ:i.minZ},
    {...i,minZ:i.maxZ,maxZ:bounds.maxZ},
  ].filter(b=>b.maxX-b.minX>.001&&b.maxY-b.minY>.001&&b.maxZ-b.minZ>.001);
}
