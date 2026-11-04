import * as THREE from 'three';
import { WORLD, STATIC_BOXES, SURFACES, DOORS } from '../logic/world.js';
import { DEVICES } from '../logic/chapter.js';
import { planShellDetails, seededRandom } from './visual-design.js';
import { batchTrainStatic } from './geometry-batching.js';
import { planDocumentClearances, boundsIntersect, subtractReservedBox } from './factory-document-clearance.js';

// Collision footprints are authoritative. Substantial furnishings stay inside
// them; building services stay on walls or above traversable headroom. Repeated
// detail is instanced by geometry and material, not allocated every frame.
export function createEnvironmentArt(scene,art){
  const {palette:p}=art,batches=new Map(),areaDetails=new Map(WORLD.areas.map(a=>[a.id,0]));
  const geometries={box:new THREE.BoxGeometry(1,1,1),cylinder:new THREE.CylinderGeometry(1,1,1,12),sphere:new THREE.SphereGeometry(1,10,6),ring:new THREE.TorusGeometry(1,.055,5,16)};
  for(const geometry of Object.values(geometries))geometry.computeBoundingBox();
  const documentClearances=planDocumentClearances(WORLD.areas,STATIC_BOXES),detailMatrix=new THREE.Matrix4(),detailPosition=new THREE.Vector3(),detailScale=new THREE.Vector3();
  let adjustedDetails=0;
  const q=new THREE.Quaternion(),axisY=new THREE.Vector3(0,1,0),direction=new THREE.Vector3(),rotation=new THREE.Euler();
  function part(shape,kind,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0,quaternion=null){
    if([x,y,z,sx,sy,sz].some(n=>!Number.isFinite(n))||Math.min(sx,sy,sz)<=0)return;
    const key=shape+'/'+kind;if(!batches.has(key))batches.set(key,[]);
    rotation.set(rx,ry,rz);q.setFromEuler(rotation);const orientation=(quaternion??q).clone();
    detailMatrix.compose(detailPosition.set(x,y,z),orientation,detailScale.set(sx,sy,sz));
    const bb=geometries[shape].boundingBox.clone().applyMatrix4(detailMatrix),bounds={minX:bb.min.x,maxX:bb.max.x,minY:bb.min.y,maxY:bb.max.y,minZ:bb.min.z,maxZ:bb.max.z};
    const reserved=documentClearances.filter(r=>boundsIntersect(bounds,r.bounds));
    if(reserved.length){
      adjustedDetails++;
      if(shape!=='box'||Math.abs(orientation.x)+Math.abs(orientation.y)+Math.abs(orientation.z)>.00001)return;
      let pieces=[bounds];for(const r of reserved)pieces=pieces.flatMap(piece=>subtractReservedBox(piece,r.bounds));
      for(const b of pieces)batches.get(key).push({x:(b.minX+b.maxX)/2,y:(b.minY+b.maxY)/2,z:(b.minZ+b.maxZ)/2,sx:b.maxX-b.minX,sy:b.maxY-b.minY,sz:b.maxZ-b.minZ,q:orientation.clone()});
      return;
    }
    batches.get(key).push({x,y,z,sx,sy,sz,q:orientation});
    const area=WORLD.areas.find(a=>x>=a.bounds.minX&&x<=a.bounds.maxX&&z>=a.bounds.minZ&&z<=a.bounds.maxZ);if(area)areaDetails.set(area.id,areaDetails.get(area.id)+1);
  }
  const box=(w,h,d,x,y,z,kind='trim',ry=0)=>part('box',kind,x,y,z,w,h,d,0,ry);
  const cylinder=(r,h,x,y,z,kind='steel',rx=0,rz=0)=>part('cylinder',kind,x,y,z,r,h,r,rx,0,rz);
  const sphere=(r,x,y,z,kind='brass')=>part('sphere',kind,x,y,z,r,r,r);
  const ring=(r,x,y,z,kind='steel',rx=0,ry=0)=>part('ring',kind,x,y,z,r,r,r,rx,ry);
  function pipe(x1,y1,z1,x2,y2,z2,r=.025,kind='copper'){
    direction.set(x2-x1,y2-y1,z2-z1);const h=direction.length();if(h<.001)return;
    part('cylinder',kind,(x1+x2)/2,(y1+y2)/2,(z1+z2)/2,r,h,r,0,0,0,new THREE.Quaternion().setFromUnitVectors(axisY,direction.normalize()));
  }
  function bolts(w,h,x,y,z){for(const dx of [-w/2,w/2])for(const dy of [-h/2,h/2])cylinder(.018,.016,x+dx,y+dy,z,'steel',Math.PI/2);}
  function label(text,w,h,x,y,z,normal={x:0,y:0,z:1},type='brass'){
    const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.clearRect(0,0,1024,256);
    ctx.fillStyle=type==='paper'?'#34483e':'#d9d0b5';ctx.font='600 76px "Microsoft JhengHei",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,128,960);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshLambertMaterial({map:texture,transparent:true,depthWrite:false}));
    mesh.position.set(x,y,z);mesh.lookAt(x+normal.x,y+normal.y,z+normal.z);scene.add(mesh);return mesh;
  }
  const shell=planShellDetails(STATIC_BOXES,SURFACES);
  for(const {bounds:b,kind} of shell)box(b.maxX-b.minX,b.maxY-b.minY,b.maxZ-b.minZ,(b.minX+b.maxX)/2,(b.minY+b.maxY)/2,(b.minZ+b.maxZ)/2,kind);
  // Architecture: raised plinths, dado rails, steel pilasters and inset vents.
  for(const b of STATIC_BOXES.filter(b=>b.kind==='wall'&&b.minY===0)){
    const xWall=b.maxX-b.minX<b.maxZ-b.minZ,long=xWall?'Z':'X',short=xWall?'X':'Z',span=b['max'+long]-b['min'+long];
    for(const side of [-1,1]){
      const s=b[(side>0?'max':'min')+short]+side*.025;
      for(let a=b['min'+long]+.4;a<b['max'+long]-.2;a+=2.8){
        const x=xWall?s:a,z=xWall?a:s;
        box(xWall?.055:.13,b.maxY-.07,xWall?.13:.055,x,b.maxY/2,z,'enamel');box(xWall?.065:.19,.14,xWall?.19:.065,x,.11,z,'trim');box(xWall?.065:.21,.1,xWall?.21:.065,x,b.maxY-.16,z,'trim');
      }
      if(span>2){const a=(b['min'+long]+b['max'+long])/2,x=xWall?s:a,z=xWall?a:s,y=Math.min(2.62,b.maxY-.5);
        box(xWall?.045:.62,.28,xWall?.62:.045,x,y,z,'trim');
        for(let v=-.24;v<=.24;v+=.08)box(xWall?.054:.035,.18,xWall?.035:.054,xWall?x:x+v,y,xWall?z+v:z,'black');
      }
    }
  }
  for(const area of WORLD.areas){
    if(area.id==='chase-corridor')continue;
    const b=area.bounds,h=area.height,cx=(b.minX+b.maxX)/2,cz=(b.minZ+b.maxZ)/2;
    for(let z=b.minZ+.8;z<b.maxZ;z+=2.8){
      box(b.maxX-b.minX,.09,.3,cx,h-.06,z,'trim');box(b.maxX-b.minX,.19,.065,cx,h-.18,z,'steel');box(b.maxX-b.minX,.045,.28,cx,h-.29,z,'trim');
      for(const x of [b.minX+.23,b.maxX-.23]){box(.25,.23,.38,x,h-.21,z,'trim');bolts(.15,.1,x,h-.22,z+.2);}
    }
    // Round supply pipes, clamps and an open ladder cable tray.
    for(const [i,x] of [b.minX+.26,b.minX+.51,b.maxX-.25].entries()){
      pipe(x,h-.43,b.minZ+.16,x,h-.43,b.maxZ-.16,i===2?.065:.032,i===2?'steel':'copper');
      for(let z=b.minZ+.35;z<b.maxZ-.1;z+=1.7){box(.13,.025,.04,x,h-.39,z,'trim');pipe(x-.065,h-.3,z,x-.065,h-.45,z,.012,'brass');}
    }
    for(const z of [cz-.18,cz+.18])box(b.maxX-b.minX-.6,.07,.025,cx,h-.48,z,'black');
    for(let x=b.minX+.4;x<b.maxX-.3;x+=.28)box(.025,.025,.36,x,h-.49,cz,'steel');
    for(const l of area.lights){
      const a=l.position,y=Math.min(a.y+.12,h-.3);
      for(const x of [a.x-.65,a.x+.65])pipe(x,y+.1,a.z,x,h-.1,a.z,.012,'black');
      box(1.58,.09,.38,a.x,y,a.z,'trim');box(1.45,.025,.31,a.x,y-.055,a.z,'black');
      for(const z of [-.09,.09])cylinder(.022,1.35,a.x,y-.08,a.z+z,'lamp',0,Math.PI/2);
      for(let x=-.65;x<=.65;x+=.22)box(.014,.025,.32,a.x+x,y-.09,a.z,'steel');
      for(const dx of [-.75,.75])box(.05,.11,.4,a.x+dx,y-.01,a.z,'cream');
    }
  }
  // Deep window reveals, transparent panes, sash frames, sill, blind and cord.
  for(const z of [1.55,4.15,6.75]){
    box(.04,1.48,1.99,-4.98,2.12,z,'black');box(.028,1.28,1.75,-4.945,2.13,z,'glass');
    for(const y of [1.43,2.11,2.82])box(.09,.065,1.98,-4.93,y,z,'cream');
    for(const dz of [-.96,0,.96])box(.09,1.44,.055,-4.93,2.13,z+dz,'cream');
    box(.21,.08,2.12,-4.88,1.38,z,'ivory');box(.13,.12,2.05,-4.92,2.91,z,'trim');
    for(let y=2.47;y<2.83;y+=.065)box(.065,.032,1.84,-4.89,y,z,'enamel');
    pipe(-4.87,2.84,z+.83,-4.87,1.93,z+.83,.007,'cream');sphere(.024,-4.87,1.92,z+.83,'brass');box(.04,.13,.04,-4.86,2.06,z+.05,'brass');
  }
  function desk(b){
    const w=b.maxX-b.minX,d=b.maxZ-b.minZ,x=(b.minX+b.maxX)/2,z=(b.minZ+b.maxZ)/2,h=b.maxY,workshop=b.id.startsWith('power.'),visitor=b.id.includes('visitor')||b.id.includes('map-desk');
    box(w,.065,d,x,h-.032,z,'table');box(w-.02,.022,d-.025,x,h-.077,z,'black');
    for(const dx of [-w*.43,w*.43])for(const dz of [-d*.41,d*.41]){box(.055,h-.11,.055,x+dx,(h-.11)/2,z+dz,'trim');box(.075,.035,.075,x+dx,.025,z+dz,'rubber');}
    box(w*.9,.045,.055,x,.2,z-d*.4,'trim');for(const dx of [-w*.43,w*.43])box(.035,.045,d*.85,x+dx,.2,z,'trim');
    if(visitor){for(const dz of [-d*.47,d*.47])box(w,.04,.025,x,h+.018,z+dz,'brass');return;}
    const dw=w*.34;box(dw,h*.67,d*.72,b.minX+dw/2+.08,h*.46,z,'enamel');
    for(let i=0;i<3;i++){const y=h*.25+i*.185;box(dw-.035,.17,.027,b.minX+dw/2+.08,y,b.maxZ-.11,'ivory');box(.16,.025,.036,b.minX+dw/2+.08,y+.035,b.maxZ-.09,'steel');for(const dx of [-.08,.08])box(.018,.035,.015,b.minX+dw/2+.08+dx,y+.021,b.maxZ-.075,'brass');}
    const mx=b.minX+.29,mz=b.minZ+.22;
    if(!workshop){
      box(.4,.027,.24,mx,h+.016,mz,'black');box(.055,.21,.05,mx,h+.13,mz,'trim');box(.49,.36,.075,mx,h+.39,mz-.025,'trim');box(.43,.29,.014,mx,h+.39,mz+.02,'screen');box(.025,.01,.014,mx+.19,h+.24,mz+.03,'lamp');
      for(let k=0;k<4;k++)box(.18+((k+1)%3)*.045,.008,.005,mx-.045,h+.465-k*.041,mz+.031,'screenLight');
      box(.4,.025,.14,mx+.27,h+.018,mz+.34,'ivory');for(let r=0;r<3;r++)for(let col=0;col<9;col++)box(.028,.006,.026,mx+.1+col*.037,h+.035,mz+.3+r*.038,'trim');box(.06,.025,.09,mx+.56,h+.018,mz+.34,'black');
      // Rotary telephone, handset and coiled cord.
      const px=b.maxX-.25,pz=b.minZ+.19;box(.28,.07,.22,px,h+.04,pz,'black');cylinder(.073,.012,px,h+.082,pz+.02,'cream');
      for(let i=0;i<8;i++){const a=i*Math.PI/4;sphere(.01,px+Math.cos(a)*.046,h+.091,pz+.02+Math.sin(a)*.046,'black');}
      pipe(px-.12,h+.13,pz-.05,px+.12,h+.13,pz-.05,.025,'trim');for(const dx of [-.12,.12])cylinder(.042,.04,px+dx,h+.1,pz-.05,'black');for(let i=0;i<9;i++)ring(.021,px+.13,h+.07,pz+.025+i*.014,'black',Math.PI/2);
    }else{
      // Bench vice, task lamp and actual hand tools.
      const vx=b.minX+.23,vz=b.minZ+.22;box(.25,.08,.2,vx,h+.04,vz,'trim');box(.09,.17,.11,vx,h+.14,vz,'steel');for(const dx of [-.08,.08])box(.045,.055,.21,vx+dx,h+.23,vz,'steel');pipe(vx-.2,h+.12,vz,vx+.15,h+.12,vz,.013,'brass');sphere(.023,vx-.2,h+.12,vz,'brass');
      const tx=b.maxX-.25;box(.25,.045,.19,tx,h+.025,b.minZ+.2,'trim');pipe(tx,h+.05,b.minZ+.2,tx,h+.48,b.minZ+.2,.02,'steel');pipe(tx,h+.48,b.minZ+.2,tx-.12,h+.58,b.minZ+.2,.02,'steel');box(.27,.065,.2,tx-.16,h+.57,b.minZ+.2,'enamel');box(.21,.012,.15,tx-.16,h+.53,b.minZ+.2,'lamp');
      for(let j=0;j<3;j++){const px=b.maxX-.18-j*.13;pipe(px,h+.02,b.maxZ-.23,px,h+.02,b.maxZ-.5,.012,'steel');box(.05,.035,.11,px,h+.03,b.maxZ-.19,j%2?'red':'rubber');}
    }
    // Chair is tucked entirely into the registered desk footprint.
    const cx=b.maxX-.33,cz=b.maxZ-.28;box(.42,.07,.4,cx,.46,cz,'leather');box(.42,.29,.055,cx,.7,cz+.16,'leather');
    for(const dx of [-.17,.17])for(const dz of [-.14,.14])pipe(cx+dx,.43,cz+dz,cx+dx,.055,cz+dz,.015,'steel');for(const dx of [-.19,.19])pipe(cx+dx,.48,cz+.16,cx+dx,.82,cz+.16,.013,'steel');
    for(let j=0;j<3;j++)box(.22,.005,.28,b.maxX-.22,h+.007+j*.007,b.maxZ-.23,j%2?'clueNote':'cream',-.09+j*.08);for(let k=0;k<4;k++)box(.14,.002,.006,b.maxX-.22,h+.031,b.maxZ-.31+k*.042,'ink');
  }
  for(const b of STATIC_BOXES.filter(b=>b.kind==='table'))desk(b);
  // Narrow wall shelving, files and brackets leave navigation clear.
  for(const [x,z] of [[4.9,5.2],[-4.91,-4.1]]){
    for(const y of [.6,1.25,1.9]){box(.16,.04,1.45,x,y,z,'table');for(const dz of [-.65,.65])box(.04,.2,.04,x,y-.11,z+dz,'trim');for(let i=0;i<7;i++){const zz=z-.55+i*.17;box(.1,.28+(i%3)*.035,.12,x-.005,y+.17,zz,['red','enamel','cream'][i%3]);box(.012,.11,.1,x-.062,y+.17,zz,'clueNote');}}
    for(const dz of [-.73,.73])box(.1,1.53,.045,x,1.3,z+dz,'trim');
  }
  cylinder(.27,.045,4.947,2.48,1.2,'trim',0,Math.PI/2);cylinder(.24,.048,4.919,2.48,1.2,'cream',0,Math.PI/2);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;box(.012,.035,.016,4.89,2.48+Math.sin(a)*.2,1.2+Math.cos(a)*.2,'ink');}pipe(4.88,2.48,1.2,4.88,2.6,1.13,.009,'ink');pipe(4.88,2.48,1.2,4.88,2.34,1.24,.007,'red');
  // Power-room annunciators: inset meters, breaker handles, hinges, conduits.
  for(const z of [-7.1,-3.3]){
    box(.14,1.48,1.45,-4.91,1.65,z,'trim');box(.045,1.36,1.32,-4.82,1.65,z,'enamel');
    for(const dz of [-.39,.39]){cylinder(.17,.035,-4.778,2.03,z+dz,'black',0,Math.PI/2);cylinder(.145,.04,-4.755,2.03,z+dz,'cream',0,Math.PI/2);pipe(-4.73,2.03,z+dz,-4.73,2.11,z+dz-.06,.008,'red');for(let k=0;k<4;k++)box(.033,.045,.1,-4.765,1.66-k*.14,z+dz,'black');box(.045,.065,.035,-4.73,1.63,z+dz,'brass');box(.04,.045,.045,-4.76,1.12,z+dz,'amber');}
    for(const dz of [-.64,.64])for(const y of [1.04,2.25])cylinder(.017,.02,-4.76,y,z+dz,'steel',0,Math.PI/2);for(const dz of [-.32,.32])pipe(-4.89,2.4,z+dz,-4.89,3.12,z+dz,.026,'steel');
  }
  for(const x of [-1.45,0,1.45]){
    box(1.34,.7,.14,x,.79,-8.12,'trim');box(1.26,.6,.08,x,.82,-8.02,'enamel');box(.67,.35,.024,x-.21,.93,-7.968,'black');box(.57,.27,.026,x-.21,.93,-7.952,'screen');for(let i=0;i<3;i++)box(.34,.006,.01,x-.25,1.01-i*.067,-7.935,'screenLight');for(const y of [.68,.82,1.01])cylinder(.03,.021,x+.4,y,-7.95,y<.8?'red':'brass',Math.PI/2);
  }
  function machine(b){
    const w=b.maxX-b.minX,d=b.maxZ-b.minZ,x=(b.minX+b.maxX)/2,z=(b.minZ+b.maxZ)/2,h=b.maxY;
    if(b.id.startsWith('bay.')){
      // Open-slat shipping crate, pallet, braces and strap hardware.
      for(const dx of [-w*.38,0,w*.38])box(.12,.13,d,x+dx,.075,z,'table');for(let zz=b.minZ+.08;zz<b.maxZ;zz+=.18)box(w,.055,.14,x,.17,zz,'table');
      for(const dx of [-w*.46,w*.46])for(const dz of [-d*.46,d*.46])box(.09,h-.18,.09,x+dx,(h+.18)/2,z+dz,'table');
      for(let y=.3;y<h;y+=.19){for(const dz of [-d/2+.04,d/2-.04])box(w,.14,.06,x,y,z+dz,'table');for(const dx of [-w/2+.04,w/2-.04])box(.06,.14,d,x+dx,y,z,'table');}
      for(let zz=b.minZ+.08;zz<b.maxZ;zz+=.2)box(w,.06,.16,x,h,zz,'table');for(const dx of [-w*.3,w*.3]){box(.07,.012,d+.02,x+dx,h+.037,z,'trim');for(const dz of [-d/2,d/2])box(.07,h-.2,.012,x+dx,(h+.2)/2,z+dz,'trim');}return;
    }
    for(const dx of [-w*.4,w*.4])for(const dz of [-d*.43,d*.43]){box(.16,.1,.23,x+dx,.06,z+dz,'rubber');box(.12,.8,.12,x+dx,.48,z+dz,'trim');}
    box(w-.12,.53,d-.18,x,.58,z,'enamel');box(w-.08,.08,d-.06,x,.88,z,'trim');
    for(const side of [-1,1]){const xx=x+side*(w/2-.1);box(.12,.3,d,xx,1.06,z,'ivory');box(.04,.045,d,xx+side*.07,1.24,z,'brass');for(let zz=b.minZ+.35;zz<b.maxZ-.1;zz+=.72)cylinder(.025,.02,xx+side*.075,1.1,zz,'steel',0,Math.PI/2);}
    for(let zz=b.minZ+.16;zz<b.maxZ-.08;zz+=.22){cylinder(.075,w-.29,x,1.115,zz,'steel',0,Math.PI/2);for(const dx of [-w*.43,w*.43])cylinder(.028,.045,x+dx,1.115,zz,'brass',0,Math.PI/2);}
    // Inspection gantries with hydraulic heads, housings and end-panel vents.
    for(const zz of [b.minZ+.8,b.maxZ-.8]){for(const dx of [-w*.4,w*.4]){box(.12,.95,.12,x+dx,1.64,zz,'enamel');box(.24,.045,.25,x+dx,1.25,zz,'trim');}box(w,.15,.29,x,2.12,zz,'ivory');box(w-.3,.035,.24,x,2.21,zz,'trim');for(const dx of [-.45,0,.45]){cylinder(.066,.36,x+dx,1.88,zz,'steel');cylinder(.11,.1,x+dx,1.66,zz,'brass');cylinder(.09,.08,x+dx,1.58,zz,'rubber');}}
    for(const zz of [b.minZ+.32,b.maxZ-.32]){box(w-.38,.45,.06,x,.54,zz,'trim');box(w-.45,.37,.035,x,.54,zz+.04,'enamel');for(let xx=b.minX+.3;xx<b.maxX-.2;xx+=.12)box(.045,.21,.018,xx,.52,zz+.065,'black');}
    const mz=z+.3;cylinder(.18,.53,x+.1,.43,mz,'trim',0,Math.PI/2);for(let xx=x-.12;xx<x+.36;xx+=.08)cylinder(.196,.027,xx,.43,mz,'steel',0,Math.PI/2);for(const dx of [-.22,.42])cylinder(.2,.07,x+dx,.43,mz,'enamel',0,Math.PI/2);pipe(x+.43,.43,mz,x+w*.37,.43,mz,.035,'brass');box(.18,.1,.2,x+.1,.65,mz,'black');
    for(const [i,zz] of [b.minZ+1.35,z,b.maxZ-1.35].entries()){const xx=x+(i%2?.2:-.2),yy=1.31;sphere(.16,xx,yy,zz,'fabric');sphere(.085,xx-.12,yy+.15,zz,'fabric');sphere(.085,xx+.12,yy+.15,zz,'fabric');box(.2,.035,.26,xx,1.19,zz,'clueNote');}
    box(w*.65,.49,.09,x,1.52,b.maxZ-.06,'trim');box(w*.59,.43,.02,x,1.52,b.maxZ-.005,'enamel');for(const dx of [-.35,.35]){cylinder(.07,.024,x+dx,1.58,b.maxZ+.01,'black',Math.PI/2);cylinder(.042,.03,x+dx,1.58,b.maxZ+.027,dx<0?'red':'amber',Math.PI/2);}box(.27,.12,.018,x,1.56,b.maxZ+.01,'screen');bolts(w*.53,.33,x,1.52,b.maxZ+.013);
  }
  for(const b of STATIC_BOXES.filter(b=>b.kind==='machine'))machine(b);
  // Locker vents, piano hinges, lock, bottom shelf and hanging rail. The real
  // eye-height peek aperture remains open so hiding still works visually.
  for(const device of DEVICES.filter(d=>d.kind==='locker')){
    const b=device.bounds,w=b.maxX-b.minX,x=(b.minX+b.maxX)/2,z=b.maxZ;
    for(const side of [-1,1])box(.055,.07,b.maxZ-b.minZ,x+side*w*.4,.06,(b.minZ+b.maxZ)/2,'rubber');
    for(const y of [.22,.28,.34,.4,1.86,1.92,1.98])box(w*.64,.019,.017,x,y,z+.012,'black');for(const y of [.35,1.15,1.98]){box(.048,.14,.038,b.minX+.038,y,z+.02,'steel');cylinder(.024,.16,b.minX+.04,y,z+.042,'brass');}
    box(.11,.17,.027,b.maxX-.15,1.06,z+.024,'trim');box(.025,.12,.035,b.maxX-.15,1.07,z+.055,'brass');cylinder(.023,.016,b.maxX-.15,.98,z+.047,'black',Math.PI/2);
    for(const dx of [-w*.43,w*.43])for(const y of [.1,2.1])cylinder(.013,.014,x+dx,y,z+.019,'steel',Math.PI/2);box(w-.1,.05,.06,x,2.14,z+.02,'ivory');box(w-.1,.04,.06,x,.08,z+.02,'trim');pipe(b.minX+.09,1.93,b.minZ+.14,b.maxX-.09,1.93,b.minZ+.14,.018,'steel');box(w-.1,.025,b.maxZ-b.minZ-.12,x,.16,(b.minZ+b.maxZ)/2,'trim');
  }
  // Purpose-built electrical enclosures replace stretched device proxy blocks.
  for(const d of DEVICES.filter(d=>['keypad','fuseBox','sequenceButton','trainConsole','trainCard'].includes(d.kind))){
    const b=d.bounds,x=(b.minX+b.maxX)/2,z=(b.minZ+b.maxZ)/2,w=b.maxX-b.minX,h=b.maxY-b.minY,depth=b.maxZ-b.minZ,y=(b.minY+b.maxY)/2;
    if(d.kind==='trainCard'){
      // The thin readable card stays foremost. Hardware only surrounds it.
      box(w+.2,h+.23,.07,x,y,z-.065,'trim');box(w+.12,h+.15,.02,x,y,z-.02,'enamel');
      for(const dx of [-w*.55,w*.55])for(const dy of [-h*.55,h*.55])cylinder(.017,.014,x+dx,y+dy,z-.001,'steel',Math.PI/2);
      pipe(x,y+h*.7,z-.06,x,3.72,z-.06,.027,'steel');box(.18,.075,.1,x,y-h*.7,z-.05,'trim');continue;
    }
    if(d.kind==='trainConsole'){
      box(w,.1,depth,x,.055,z,'black');box(w*.76,.8,depth*.7,x,.48,z,'trainConsole');box(w,.11,depth,x,b.maxY-.06,z,'trim');box(w*.88,.015,depth*.89,x,b.maxY+.006,z,'enamel');
      box(w*.73,.09,depth*.3,x,b.maxY+.055,b.minZ+depth*.23,'black');box(w*.63,.02,depth*.23,x,b.maxY+.11,b.minZ+depth*.23,'screen');for(let i=0;i<4;i++)box(w*.11,.007,depth*.07,b.minX+w*.22+i*w*.18,b.maxY+.127,b.minZ+depth*.23,'screenLight');
      for(let i=0;i<3;i++)cylinder(.039,.026,b.minX+w*.25+i*w*.25,b.maxY+.035,z+.14,['red','amber','screenLight'][i]);box(w*.55,.025,.04,x,b.maxY+.03,b.maxZ-.13,'black');box(w*.4,.03,.06,x,b.maxY+.035,b.maxZ-.22,'brass');for(let yy=.25;yy<.75;yy+=.07)box(.025,.022,depth*.45,b.minX+w*.1,yy,z,'black');pipe(b.maxX-.05,.16,b.minZ+.13,b.maxX-.05,.92,b.minZ+.13,.02,'copper');continue;
    }
    const face=b.minX-.017;box(w,h,depth,x,y,z,d.kind==='sequenceButton'?'trim':'enamel');box(.035,h*.94,depth*.94,face,y,z,'trim');box(.017,h*.87,depth*.87,face-.022,y,z,'ivory');
    for(const yy of [b.minY+.05,b.maxY-.05])for(const zz of [b.minZ+.05,b.maxZ-.05])cylinder(.012,.015,face-.036,yy,zz,'steel',0,Math.PI/2);
    if(d.kind==='fuseBox'){
      box(.025,h*.45,depth*.67,face-.04,y+.08,z,'black');box(.028,h*.4,depth*.6,face-.058,y+.08,z,'glass');for(const zz of [z-.12,z,z+.12]){cylinder(.033,.26,face-.065,y+.09,zz,'cream');for(const yy of [y-.03,y+.22])box(.07,.04,.07,face-.04,yy,zz,'brass');}
      box(.07,.23,.05,face-.066,y-.36,b.maxZ-.11,'trim');box(.02,.13,.03,face-.11,y-.32,b.maxZ-.11,'red');for(const yy of [b.minY+.13,b.maxY-.13])box(.045,.1,.05,b.maxX,yy,b.maxZ,'steel');for(const zz of [z-.16,z+.16])pipe(x,b.maxY,zz,x,3.13,zz,.024,'steel');pipe(x,b.minY,z,x,.08,z,.035,'black');
    }else if(d.kind==='keypad'){
      box(.025,h*.27,depth*.67,face-.04,b.maxY-h*.21,z,'black');box(.028,h*.2,depth*.58,face-.054,b.maxY-h*.21,z,'screen');for(let row=0;row<4;row++)for(let col=0;col<3;col++)box(.027,Math.min(.05,h*.085),Math.min(.07,depth*.18),face-.05,b.maxY-h*.44-row*h*.125,b.minZ+depth*(.23+col*.27),'trim');pipe(x,b.maxY,z,x,Math.min(3.15,b.maxY+.48),z,.018,'steel');
    }else{
      cylinder(Math.min(h,depth)*.31,.055,face-.055,y,z,'black',0,Math.PI/2);cylinder(Math.min(h,depth)*.24,.068,face-.09,y,z,d.color==='yellow'?'hazard':d.color==='green'?'screenLight':d.color==='blue'?'train':'red',0,Math.PI/2);box(.035,.03,depth*.5,face-.04,b.maxY-.04,z,'cream');
    }
  }
  // Corridor ribs and lighting follow the three actual runs and both turns.
  const runs=[{x1:21.45,z1:-6.5,x2:27,z2:-6.5},{x1:27,z1:-6.5,x2:27,z2:-17.5},{x1:27,z1:-17.5,x2:39.9,z2:-17.5}];
  for(const r of runs){
    const dx=r.x2-r.x1,dz=r.z2-r.z1,length=Math.hypot(dx,dz),nx=-dz/length,nz=dx/length;
    for(let s=.65;s<length;s+=2.15){const cx=r.x1+dx*s/length,cz=r.z1+dz*s/length;for(const side of [-1,1]){box(nx?.065:.085,2.98,nx?.085:.065,cx+nx*1.16*side,1.49,cz+nz*1.16*side,'trim');box(nx?.1:.16,.13,nx?.16:.1,cx+nx*1.13*side,.13,cz+nz*1.13*side,'steel');box(nx?.05:.08,.12,nx?.08:.05,cx+nx*1.13*side,2.55,cz+nz*1.13*side,'amber');}box(nx?2.37:.11,.14,nx?.11:2.37,cx,3.02,cz,'trim');box(nx?.7:.13,.024,nx?.13:.7,cx,2.935,cz,'lamp');}
    for(const o of [.91,1.04])pipe(r.x1+nx*o,2.84,r.z1+nz*o,r.x2+nx*o,2.84,r.z2+nz*o,.025,'copper');
    for(let s=.2;s<length;s+=.25){const cx=r.x1+dx*s/length-nx*.92,cz=r.z1+dz*s/length-nz*.92;box(nx?.13:.025,.006,nx?.025:.13,cx,.008,cz,'black');}
  }
  // Recessed emergency cabinets have glass, cylinders, valves and hose rings.
  for(const [x,z] of [[28.14,-10.1],[37.8,-16.36],[51.91,-15.8]]){
    if(x>50||x<30){box(.07,.75,.47,x,1.16,z,'red');box(.025,.63,.37,x-.05,1.16,z,'glass');cylinder(.09,.4,x-.06,1.08,z,'red');cylinder(.05,.045,x-.06,1.31,z,'brass');pipe(x-.06,1.35,z-.06,x-.06,1.35,z+.1,.017,'black');ring(.1,x-.09,1.52,z,'black',0,Math.PI/2);}
    else{box(.47,.75,.07,x,1.16,z,'red');box(.37,.63,.025,x,1.16,z-.05,'glass');cylinder(.09,.4,x,1.08,z-.06,'red');cylinder(.05,.045,x,1.31,z-.06,'brass');ring(.1,x,1.52,z-.09,'black');}
  }
  // Exit vestibule: structural bays, evacuation fixtures, service doors,
  // wall bench and a shutter motor housing around the real exit doorway.
  for(const x of [42,44.6,47.2,49.8]){box(.2,3.82,.16,x,1.91,-22.91,'trim');box(.34,.12,.22,x,.1,-22.86,'steel');box(1.1,.11,.22,x,3.55,-22.8,'trim');box(.8,.025,.2,x,3.48,-22.8,'lamp');}
  box(3.2,.11,.2,45.7,.48,-11.11,'table');box(3.2,.3,.07,45.7,.8,-11.08,'table');for(const x of [44.45,46.95]){box(.1,.42,.13,x,.23,-11.11,'trim');box(.2,.06,.2,x,.05,-11.12,'black');}
  for(const x of [41.6,48.9]){box(1.35,2.2,.045,x,1.15,-11.048,'trim');box(1.22,2.04,.03,x,1.15,-11.08,'enamel');box(.82,.5,.018,x,1.69,-11.105,'glass');box(.42,.04,.035,x+.25,1.07,-11.12,'steel');for(const y of [.45,.51,.57,.63])box(.75,.018,.014,x,y,-11.11,'black');}
  const exitDoor=DOORS.find(d=>d.id==='exit.final-door');if(exitDoor){const b=exitDoor.bounds,c=(b.minZ+b.maxZ)/2;box(.38,.36,b.maxZ-b.minZ+.46,51.9,3.22,c,'trim');for(let zz=b.minZ-.1;zz<b.maxZ+.1;zz+=.14)box(.4,.025,.05,51.91,3.27,zz,'steel');for(const z of [b.minZ-.16,b.maxZ+.16]){box(.12,3.13,.12,51.9,1.56,z,'steel');box(.13,.07,.23,51.9,.12,z,'hazard');}}
  for(const z of [-18.75,-15.25]){box(.05,.3,.18,51.91,2.5,z,'black');box(.07,.15,.12,51.875,2.52,z,'screenLight');}
  // Freight hall: overhead travelling crane, lifting tackle, shutter pocket,
  // buffers, paved platform edge and individual rail fastening plates.
  const bay=WORLD.areas.find(a=>a.id==='loading-bay');if(bay){
    const b=bay.bounds,cx=(b.minX+b.maxX)/2,cz=(b.minZ+b.maxZ)/2;
    for(const z of [b.minZ+.7,b.maxZ-.7]){box(b.maxX-b.minX-.3,.1,.27,cx,3.99,z,'trim');box(b.maxX-b.minX-.3,.23,.06,cx,4.1,z,'steel');
      const wallZ=z<cz?b.minZ+.025:b.maxZ-.025;
      for(let x=b.minX+1;x<b.maxX;x+=3){box(.2,3.8,.11,x,1.9,wallZ,'trim');box(.36,.1,.15,x,.07,wallZ,'steel');
        pipe(x,3.5,wallZ,x,3.98,z,.035,'steel');}
    }
    // Hoist is parked over the opposite freight edge, away from the north-wall
    // instruction cards and their oblique viewing paths.
    const craneX=cx+1,hoistZ=b.maxZ-2;box(.44,.16,b.maxZ-b.minZ-1.3,craneX,4.15,cz,'hazard');box(.65,.28,.68,craneX,3.94,hoistZ,'trim');cylinder(.18,.48,craneX,3.82,hoistZ,'steel',0,Math.PI/2);pipe(craneX,3.8,hoistZ,craneX,2.91,hoistZ,.014,'black');ring(.12,craneX,2.82,hoistZ,'brass');box(.18,.1,.08,craneX,2.96,hoistZ,'hazard');
    for(let z=b.minZ+.4;z<b.maxZ-.3;z+=.2)box(.04,.012,.12,b.maxX-.23,.014,z,'hazard');const gateZ=-17.5;box(.24,.32,5.05,b.maxX-.11,3.25,gateZ,'trim');
    for(const z of [gateZ-2.43,gateZ+2.43]){box(.19,3.1,.12,b.maxX-.12,1.55,z,'steel');box(.21,.42,.25,b.maxX-.14,.45,z,'rubber');box(.24,.13,.3,b.maxX-.18,.85,z,'hazard');}for(let z=gateZ-2.2;z<gateZ+2.3;z+=.18)box(.24,.026,.05,b.maxX-.12,3.36,z,'steel');
    const train=DEVICES.find(d=>d.kind==='train');if(train){
      const tz=(train.bounds.minZ+train.bounds.maxZ)/2;
      for(const trackZ of [tz,tz-3.5])for(let x=b.minX+.5;x<b.maxX-.2;x+=.55)for(const z of [trackZ-.95,trackZ+.95]){box(.18,.024,.22,x,.075,z,'steel');for(const dz of [-.075,.075])cylinder(.022,.035,x,.11,z+dz,'black');}
      for(const z of [tz-1.5,tz+1.5,tz-3.5-1.2]){box(b.maxX-b.minX-.7,.008,.045,cx,.008,z,'hazard');for(let x=b.minX+.4;x<b.maxX-.2;x+=.38)box(.14,.009,.045,x,.01,z,'black');}
    }
  }
  for(const d of DOORS){
    const b=d.bounds,alongX=b.maxX-b.minX>b.maxZ-b.minZ,cx=(b.minX+b.maxX)/2,cz=(b.minZ+b.maxZ)/2,h=b.maxY;
    if(alongX){box(b.maxX-b.minX+.18,.12,.31,cx,h+.04,cz,'trim');box(b.maxX-b.minX+.08,.035,.36,cx,h-.045,cz,'steel');for(const x of [b.minX-.045,b.maxX+.045]){box(.08,h,.31,x,h/2,cz,'trim');box(.022,h-.08,.34,x,h/2,cz,'rubber');}box(b.maxX-b.minX,.018,.31,cx,.012,cz,'steel');}
    else{box(.31,.12,b.maxZ-b.minZ+.18,cx,h+.04,cz,'trim');box(.36,.035,b.maxZ-b.minZ+.08,cx,h-.045,cz,'steel');for(const z of [b.minZ-.045,b.maxZ+.045]){box(.31,h,.08,cx,h/2,z,'trim');box(.34,h-.08,.022,cx,h/2,z,'rubber');}box(.31,.018,b.maxZ-b.minZ,cx,.012,cz,'steel');}
  }
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const ctx=shadowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,1,32,32,32);gradient.addColorStop(0,'rgba(0,0,0,.62)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const shadowMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,opacity:.58,depthWrite:false});
  for(const b of STATIC_BOXES.filter(b=>['machine','table','locker','trainConsole','train'].includes(b.kind))){const m=new THREE.Mesh(new THREE.PlaneGeometry((b.maxX-b.minX)*1.35,(b.maxZ-b.minZ)*1.3),shadowMat);m.rotation.x=-Math.PI/2;m.position.set((b.minX+b.maxX)/2,.012,(b.minZ+b.maxZ)/2);scene.add(m);}
  const transform=new THREE.Object3D();let instances=0;
  for(const [key,parts] of batches){const [shape,kind]=key.split('/'),mesh=new THREE.InstancedMesh(geometries[shape],p[kind]??p.trim,parts.length);mesh.name='factory-details-'+key;instances+=parts.length;
    for(const [i,a] of parts.entries()){transform.position.set(a.x,a.y,a.z);transform.scale.set(a.sx,a.sy,a.sz);transform.quaternion.copy(a.q);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);}mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();scene.add(mesh);
  }
  const random=seededRandom(77),dust=[];for(const area of WORLD.areas){const b=area.bounds;for(let i=0;i<40;i++)dust.push(b.minX+random()*(b.maxX-b.minX),.3+random()*(area.height-.6),b.minZ+random()*(b.maxZ-b.minZ));}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(dust,3));scene.add(new THREE.Points(geometry,new THREE.PointsMaterial({color:0xc9b98c,size:.014,transparent:true,opacity:.21,depthWrite:false})));
  scene.userData.factoryArt={instances,batches:batches.size,areaDetails:Object.fromEntries(areaDetails),documentClearances:documentClearances.length,adjustedDetails};return {detailCount:shell.length,label,instances,areaDetails:Object.fromEntries(areaDetails)};
}

export function decorateDoor(mesh,b,p){
  const w=b.maxX-b.minX,h=b.maxY-b.minY,d=b.maxZ-b.minZ,alongX=w>d,span=alongX?w:d,thickness=alongX?d:w,group=new THREE.Group();group.position.copy(mesh.position);group.name='detailed-door';mesh.geometry.dispose();
  const part=(width,height,depth,x,y,z,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),mat);m.position.set(x,y,z);group.add(m);};
  const leaf=(width,height,depth,a,y,n,mat)=>alongX?part(width,height,depth,a,y,n,mat):part(depth,height,width,n,y,a,mat);
  const wy=h*.15,wh=Math.min(.58,h*.25),ww=span*.64,lowerTop=wy-wh/2,lowerHeight=lowerTop+h/2;
  leaf(span,lowerHeight,thickness,0,-h/2+lowerHeight/2,0,p.door);leaf(span,h/2-wy-wh/2,thickness,0,(h/2+wy+wh/2)/2,0,p.door);
  for(const side of [-1,1])leaf((span-ww)/2,wh,thickness,side*(span+ww)/4,wy,0,p.door);leaf(ww,wh,.018,0,wy,0,p.glass);
  for(const side of [-1,1]){const face=side*(thickness/2+.008);for(const y of [wy-wh/2,wy+wh/2])leaf(ww+.08,.035,.022,0,y,face,p.steel);for(const a of [-ww/2,ww/2])leaf(.035,wh,.022,a,wy,face,p.steel);leaf(span*.82,.075,.018,0,-h*.32,face,p.hazard);leaf(span*.78,.045,.048,0,-.18,face+side*.04,p.steel);for(const a of [-span*.34,span*.34])leaf(.04,.1,.04,a,-.18,face+side*.02,p.trim);for(const y of [-h*.4,h*.38])leaf(.065,.14,.04,-span*.44,y,face,p.brass);for(let i=0;i<5;i++)leaf(span*.55,.017,.025,0,-h*.37+i*.053,face,p.black);leaf(span*.9,.12,.02,0,-h*.45,face,p.trim);}
  return group;
}

// Reused without changes by the railway cinematic. Forward is local +X and the
// origin is ground level, so cab cameras and wheel animation have stable anchors.
export function createTrainArt(scene,b,p){
  const group=new THREE.Group();group.name='marshmallow-workshop-locomotive';group.position.set((b.minX+b.maxX)/2,0,(b.minZ+b.maxZ)/2);const wheels=[];
  const add=(geo,mat,x,y,z,parent=group)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m;};
  const box=(w,h,d,x,y,z,mat,parent=group)=>add(new THREE.BoxGeometry(w,h,d),mat,x,y,z,parent);
  const cyl=(r,h,x,y,z,mat,rx=0,rz=0,parent=group)=>{const m=add(new THREE.CylinderGeometry(r,r,h,16),mat,x,y,z,parent);m.rotation.set(rx,0,rz);return m;};
  const ring=(r,x,y,z,mat,ry=0,parent=group)=>{const m=add(new THREE.TorusGeometry(r,.026,6,24),mat,x,y,z,parent);m.rotation.y=ry;return m;};
  const pipe=(a,c,r,mat,parent=group)=>{const delta=new THREE.Vector3(c[0]-a[0],c[1]-a[1],c[2]-a[2]),m=add(new THREE.CylinderGeometry(r,r,delta.length(),10),mat,(a[0]+c[0])/2,(a[1]+c[1])/2,(a[2]+c[2])/2,parent);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;};
  box(3.05,.19,2.18,-.05,.61,0,p.trim);for(const z of [-.93,.93])box(3.0,.25,.13,-.05,.49,z,p.trim);box(2.85,.12,2.05,-.08,.76,0,p.red);box(.16,.32,2.23,1.46,.56,0,p.red);box(.16,.28,2.1,-1.56,.56,0,p.red);
  for(const z of [-.68,.68]){cyl(.14,.24,1.63,.53,z,p.trim,0,Math.PI/2);cyl(.18,.08,1.77,.53,z,p.black,0,Math.PI/2);}pipe([1.52,.37,0],[1.86,.37,0],.07,p.steel);ring(.13,1.9,.34,0,p.brass,Math.PI/2);for(let z=-.9;z<=.9;z+=.15)pipe([1.43,.29,z],[1.6,.08,z],.018,p.steel);
  cyl(.51,1.65,.34,1.32,0,p.train,0,Math.PI/2);cyl(.53,.075,1.205,1.32,0,p.trim,0,Math.PI/2);cyl(.45,.027,1.25,1.32,0,p.black,0,Math.PI/2);ring(.48,1.27,1.32,0,p.brass,Math.PI/2);
  for(let i=0;i<16;i++){const a=i*Math.PI/8;cyl(.018,.026,1.29,1.32+Math.cos(a)*.48,Math.sin(a)*.48,p.steel,0,Math.PI/2);}pipe([1.29,1.1,0],[1.29,1.53,0],.018,p.brass);pipe([1.29,1.32,-.19],[1.29,1.32,.19],.018,p.brass);for(const x of [-.26,.27,.8])ring(.515,x,1.32,0,p.brass,Math.PI/2);
  // Hollow flared chimney, steam dome, safety valve and running lamps.
  cyl(.135,.48,.82,1.99,0,p.trim);add(new THREE.CylinderGeometry(.22,.135,.16,16,1,true),p.trim,.82,2.31,0);cyl(.188,.012,.82,2.36,0,p.black);ring(.214,.82,2.4,0,p.brass).rotation.x=Math.PI/2;cyl(.14,.18,-.05,1.87,0,p.brass);add(new THREE.SphereGeometry(.14,14,8,0,Math.PI*2,0,Math.PI/2),p.brass,-.05,1.96,0);cyl(.07,.2,-.4,1.9,.26,p.steel);ring(.1,-.4,2.02,.26,p.red).rotation.x=Math.PI/2;
  for(const [z,r,y] of [[0,.15,1.52],[-.78,.075,.88],[.78,.075,.88]]){cyl(r+.035,.14,1.4,y,z,p.trim,0,Math.PI/2);cyl(r,.015,1.48,y,z,p.lamp,0,Math.PI/2);ring(r+.012,1.49,y,z,p.brass,Math.PI/2);}
  // Cab is assembled around genuine open window apertures. There is no solid
  // wall in front of the driver's cinematic viewpoint (-.83,1.85,0).
  box(1.17,.12,2.1,-1.01,.83,0,p.trim);box(1.17,.64,2.04,-1.01,1.12,0,p.train);
  for(const z of [-.96,.96]){box(.07,.91,.07,-.45,1.86,z,p.cream);box(.07,.91,.07,-1.56,1.86,z,p.cream);box(1.17,.06,.06,-1.01,1.43,z,p.cream);box(1.17,.06,.06,-1.01,2.24,z,p.cream);box(.02,.75,.056,-1.01,1.84,z,p.cream);box(1.04,.69,.012,-1.01,1.84,z,p.glass);for(let y=.92;y<1.35;y+=.14)box(.48,.025,.035,-.83,y,z*1.065,p.brass);pipe([-.48,.87,z*1.09],[-.48,1.45,z*1.09],.019,p.steel);pipe([-1.48,.87,z*1.09],[-1.48,1.45,z*1.09],.019,p.steel);for(let x=-1.44;x<-.46;x+=.14)cyl(.015,.014,x,1.2,z*1.064,p.brass,Math.PI/2);}
  box(.055,.07,2.1,-.44,2.24,0,p.cream);box(.055,.075,2.1,-.44,1.45,0,p.cream);box(.014,.72,1.88,-.445,1.85,0,p.glass);box(.075,.84,.07,-1.56,1.84,0,p.cream);box(.035,.76,.8,-1.56,1.84,.48,p.glass);box(.035,.76,.8,-1.56,1.84,-.48,p.glass);box(1.46,.1,2.35,-1.01,2.33,0,p.cream);box(1.54,.045,2.45,-1.01,2.4,0,p.trim);box(1.14,.045,2.12,-1.01,2.44,0,p.train);
  box(.17,.48,.63,-.52,1.13,0,p.black);box(.03,.29,.42,-.62,1.15,0,p.red);ring(.16,-.645,1.15,0,p.brass,Math.PI/2);box(.13,.08,1.35,-.61,1.48,0,p.trainConsole);
  for(const z of [-.39,.39]){cyl(.1,.05,-.71,1.61,z,p.trim,0,Math.PI/2);cyl(.081,.054,-.74,1.61,z,p.cream,0,Math.PI/2);pipe([-.776,1.61,z],[-.776,1.66,z-.03],.006,p.red);}for(const z of [-.21,.16]){pipe([-.7,1.5,z],[-.89,1.76,z],.014,p.brass);cyl(.026,.09,-.91,1.78,z,p.black,Math.PI/2);}box(.38,.065,.4,-1.2,1.06,.45,p.leather);pipe([-1.2,.87,.45],[-1.2,1.04,.45],.035,p.steel);box(.055,.27,.4,-1.38,1.23,.45,p.leather);for(const z of [-1.16,1.16]){box(.92,.045,.25,-1.01,.64,z,p.steel);box(.65,.04,.2,-1.01,.4,z,p.trim);}
  for(const x of [-1.02,-.03,.95])for(const z of [-.95,.95]){
    const wheel=new THREE.Group();wheel.name='train-wheel';wheel.position.set(x,.4,z);group.add(wheel);wheels.push(wheel);cyl(.36,.13,0,0,0,p.black,Math.PI/2,0,wheel);cyl(.29,.14,0,0,0,p.red,Math.PI/2,0,wheel);ring(.31,0,0,z<0?-.077:.077,p.steel,0,wheel);for(let i=0;i<10;i++){const a=i*Math.PI/5;pipe([Math.cos(a)*.08,Math.sin(a)*.08,z<0?-.079:.079],[Math.cos(a)*.27,Math.sin(a)*.27,z<0?-.079:.079],.018,p.brass,wheel);}cyl(.085,.17,0,0,0,p.steel,Math.PI/2,0,wheel);
  }
  for(const z of [-1.075,1.075]){pipe([-1.03,.37,z],[.95,.37,z],.035,p.steel);for(const x of [-1.03,-.03,.95])cyl(.07,.055,x,.37,z,p.brass,Math.PI/2);pipe([.65,.38,z],[1.15,.67,z],.026,p.brass);cyl(.12,.4,1.12,.66,z*.76,p.train,0,Math.PI/2);}
  // Rear carriage: complete underframe, bogies, seating, windows, steps,
  // end rails and a visible coupler rather than a placeholder rear block.
  const car=new THREE.Group();car.name='rear-carriage';car.position.x=-3.6;group.add(car);box(2.55,.17,2.08,0,.57,0,p.trim,car);box(2.45,.11,2.02,0,.72,0,p.table,car);
  for(const z of [-1.01,1.01]){box(2.45,.5,.08,0,1.02,z,p.train,car);box(2.45,.05,.12,0,1.29,z,p.cream,car);box(2.45,.07,.12,0,2.15,z,p.cream,car);for(const x of [-1.2,-.4,.4,1.2])box(.055,.86,.09,x,1.72,z,p.cream,car);for(const x of [-.8,0,.8])box(.71,.76,.014,x,1.72,z,p.glass,car);for(const x of [-.75,.75]){box(.56,.07,.36,x,.92,z*.66,p.leather,car);box(.56,.35,.06,x,1.12,z*.87,p.leather,car);}}
  for(const x of [-1.22,1.22]){box(.07,.58,1.95,x,1.03,0,p.train,car);for(const z of [-.94,.94])box(.07,.89,.07,x,1.72,z,p.cream,car);pipe([x,.79,-.8],[x,1.42,-.8],.018,p.steel,car);pipe([x,.79,.8],[x,1.42,.8],.018,p.steel,car);box(.065,.82,1.55,x,1.72,0,p.glass,car);box(.1,.04,1.6,x,1.42,0,p.brass,car);}box(2.68,.11,2.32,0,2.24,0,p.cream,car);box(2.77,.04,2.4,0,2.31,0,p.trim,car);box(2.4,.04,2.08,0,2.35,0,p.train,car);
  for(const x of [-.79,.79])for(const z of [-.95,.95]){const wheel=new THREE.Group();wheel.name='train-car-wheel';wheel.position.set(x,.35,z);car.add(wheel);wheels.push(wheel);cyl(.29,.14,0,0,0,p.black,Math.PI/2,0,wheel);cyl(.2,.15,0,0,0,p.trainConsole,Math.PI/2,0,wheel);cyl(.075,.17,0,0,0,p.steel,Math.PI/2,0,wheel);for(let i=0;i<4;i++)box(.35,.017,.06,x,.55+i*.025,z,p.steel,car);}
  for(const z of [-1.16,1.16]){box(.56,.04,.23,-1.05,.52,z,p.steel,car);box(.42,.04,.18,-1.05,.31,z,p.trim,car);}pipe([-1.55,.48,0],[-2.37,.48,0],.06,p.steel);for(const x of [-1.65,-2.22])ring(.1,x,.45,0,p.brass,Math.PI/2);
  group.userData.trainWheels=wheels;group.userData.rearCar=car;group.userData.forward='+X';group.userData.model='complete-riveted-locomotive-and-carriage';scene.add(group);return batchTrainStatic(group);
}
