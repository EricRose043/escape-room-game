import * as THREE from 'three';
import { createArtMaterials } from './art-materials.js';
import { createTrainArt } from './environment-art.js';
import { createMonsterView } from './monster-view.js';
import { MONSTERS } from '../logic/chapter.js';
import { trainCinematicFrame } from '../logic/train-cinematic.js';

const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const smooth=value=>{const q=clamp(value);return q*q*(3-2*q);};

// The whole ending is real geometry. The railway moves past the carriage so that
// the cab, doll and headlight can keep precise positions without a huge world.
export function createTrainCinematicView(renderer) {
  let stage=null,frame=null,lastTime=0;

  function build() {
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x101c21);
    scene.fog=new THREE.FogExp2(0x101c21,.033);
    const camera=new THREE.PerspectiveCamera(59,1,.055,190);
    const art=createArtMaterials(),p=art.palette;
    const ballast=art.material('rubber',0x86918b);
    const concrete=art.material('plaster',0x7a8a83,.38);
    const brick=art.material('plaster',0x637770,.55);
    const steel=art.material('metal',0xa2aaa0);
    const darkSteel=art.material('metal',0x354947);
    const timber=art.material('wood',0x82735a);
    const amber=new THREE.MeshBasicMaterial({color:0xf4bc68});
    const redGlow=new THREE.MeshBasicMaterial({color:0x9a332b});
    const whiteGlow=new THREE.MeshBasicMaterial({color:0xcfe3cd});
    const darkGlass=new THREE.MeshLambertMaterial({color:0x172b2d});
    const trainRoot=new THREE.Group(),railway=new THREE.Group();
    trainRoot.name='cinematic.train';railway.name='cinematic.railway';scene.add(trainRoot,railway);
    const train=createTrainArt(trainRoot,{minX:-1.8,maxX:1.8,minZ:-1.2,maxZ:1.2},p);
    train.rotation.y=Math.PI/2;

    // Static parts share a box geometry and are instanced by material. Repeated
    // tunnel ribs, sleepers, fasteners and ballast do not each cost a draw call.
    const unit=new THREE.BoxGeometry(1,1,1),batches=new Map();
    const box=(w,h,d,x,y,z,material=concrete,parent=railway)=>{
      const key=material.uuid+'|'+parent.uuid;
      if(!batches.has(key))batches.set(key,{material,parent,parts:[]});
      batches.get(key).parts.push({w,h,d,x,y,z});
    };
    const mesh=(geometry,material,x,y,z,parent=railway)=>{
      const part=new THREE.Mesh(geometry,material);part.position.set(x,y,z);parent.add(part);return part;
    };
    const tube=(points,radius,material,parent=railway)=>{
      const curve=new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a)));
      return mesh(new THREE.TubeGeometry(curve,Math.max(6,points.length*3),radius,6,false),material,0,0,0,parent);
    };

    // Ballast bed, polished rail heads, rail webs and timber sleepers extend all
    // the way through the tunnel. Clips and bolt heads ground both rails.
    box(5,.24,166,0,-.17,-66,ballast);
    for(const x of [-.95,.95]) {
      box(.16,.045,166,x,.13,-66,steel);
      box(.055,.11,166,x,.06,-66,darkSteel);
      box(.25,.035,166,x,.005,-66,darkSteel);
    }
    for(let z=16;z>-149;z-=.72) {
      box(2.52,.11,.2,0,-.015,z,timber);
      for(const x of [-1.08,-.82,.82,1.08])box(.075,.05,.12,x,.065,z,p.brass);
    }
    let seed=267;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<540;i++) {
      const x=(random()-.5)*4.65,z=16-random()*164,s=.07+random()*.12;
      box(s,s*.45,s*1.3,x,-.03,z,i%3?ballast:darkSteel);
    }

    // Fully built departure station: raised platform, edge tiles, steel canopy,
    // brackets, wall pilasters, old industrial windows and service furniture.
    box(4,.62,31,-4.3,.14,-2.5,concrete);
    box(.15,.08,31,-2.38,.49,-2.5,p.cream);
    box(.14,.018,31,-2.58,.535,-2.5,p.hazard);
    box(.13,.02,31,-3.05,.535,-2.5,p.cream);
    box(.24,5.6,32,-6.3,2.7,-2.5,brick);
    box(10,.2,33,-1.4,5.25,-2.5,darkSteel);
    for(let z=12;z>-18;z-=4) {
      box(.24,4.8,.28,-5.85,2.9,z,p.trim);
      box(9.4,.22,.2,-1.4,5.03,z,p.trim);
      box(.7,.09,.4,-5.65,4.82,z,p.brass);
      box(.21,.65,.26,-5.78,4.66,z,p.trim);
      box(1.7,.1,.42,-3.6,4.74,z,p.black);
      box(1.4,.035,.27,-3.6,4.674,z,whiteGlow);
      // Wall window recess, four metal muntins and sill.
      box(.035,1.8,2.5,-6.16,3,z-1.8,p.black);
      box(.045,1.58,2.28,-6.13,3,z-1.8,darkGlass);
      for(const dy of [-.82,0,.82])box(.085,.055,2.5,-6.095,3+dy,z-1.8,p.cream);
      for(const dz of [-1.2,0,1.2])box(.085,1.7,.055,-6.09,3,z-1.8+dz,p.cream);
      box(.28,.1,2.76,-6.08,2.1,z-1.8,p.trim);
    }
    for(let z=12;z>-18;z-=.5)box(.18,.27,.38,-2.39,.3,z,p.cream);
    // Bench has timber slats, formed supports and a separate backrest.
    for(const z of [5,-9]) {
      for(let slat=0;slat<4;slat++)box(.11,.07,2,-4.5+slat*.13,1.02,z,timber);
      for(let slat=0;slat<3;slat++)box(.07,.1,2,-4.65,1.32+slat*.12,z,timber);
      for(const dz of [-.77,.77]) {
        box(.45,.48,.06,-4.38,.77,z+dz,darkSteel);
        box(.09,.9,.07,-4.66,1,z+dz,darkSteel);
      }
    }
    // Riveted electrical cabinet, cable entry and stacked wooden delivery crates.
    box(.52,1.4,1.1,-5.7,1.25,-3,darkSteel);
    box(.025,1.23,.94,-5.42,1.25,-3,p.train);
    box(.04,.22,.035,-5.39,1.25,-2.7,p.brass);
    for(let z=-3.35;z<-2.65;z+=.12)box(.025,.22,.035,-5.385,.91,z,p.black);
    tube([[-5.8,1.9,-3],[-5.8,3.8,-3],[-5.8,4.1,-4],[-5.8,4.1,-18]],.035,p.copper);
    for(const [x,y,z] of [[-4.4,.9,10],[-5.1,.9,10],[-4.8,1.6,10]]) {
      box(.68,.65,.74,x,y,z,timber);
      for(const q of [-.3,.3]) {
        box(.055,.67,.76,x+q,y,z,p.trim);
        box(.69,.055,.77,x,y+q,z,p.trim);
      }
    }

    // An actual masonry tunnel arch and a deep vaulted shell. Inward-facing
    // surfaces, cross ribs, mortared panels, cable ducts and a service ledge
    // remain visible in the train's moving headlight.
    const radius=4.4,spring=1.1,entry=-18,end=-149;
    const positions=[],normals=[],uvs=[],indices=[],segments=28;
    for(let ring=0;ring<2;ring++)for(let i=0;i<=segments;i++) {
      const a=i/segments*Math.PI,x=Math.cos(a),y=Math.sin(a);
      positions.push(x*radius,spring+y*radius,ring?end:entry);
      normals.push(-x,-y,0);uvs.push(i/segments*7,ring?27:0);
      if(ring===0&&i<segments) {const a0=i,b0=i+1,c0=i+segments+1,d0=c0+1;indices.push(a0,c0,b0,b0,c0,d0);}
    }
    const vaultGeo=new THREE.BufferGeometry();
    vaultGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    vaultGeo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
    vaultGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));vaultGeo.setIndex(indices);
    const vaultMaterial=art.material('plaster',0x83918a);vaultMaterial.side=THREE.DoubleSide;
    mesh(vaultGeo,vaultMaterial,0,0,0);
    for(const side of [-1,1]) {
      box(.32,1.2,131,side*4.45,.5,-83.5,brick);
      box(.72,.28,131,side*3.93,.15,-83.5,concrete);
      for(const y of [1.35,1.52,1.69])box(.065,.065,131,side*4.16,y,-83.5,p.copper);
      box(.25,.06,131,side*4.05,1.17,-83.5,darkSteel);
      for(let z=-20;z>end;z-=2.2) {
        box(.065,.64,.075,side*4.12,1.44,z,p.brass);
        box(.032,.035,2.1,side*4.275,.68,z,concrete);
      }
    }
    const archGeo=new THREE.TorusGeometry(4.35,.065,6,28,Math.PI),ribTransforms=[];
    for(let z=entry;z>end;z-=4.5) {
      ribTransforms.push([0,spring,z]);
      for(const side of [-1,1])box(.15,1.12,.15,side*4.35,.55,z,p.trim);
      for(const side of [-1,1]) {
        box(.12,.45,.33,side*4.13,2.42,z-1.7,p.black);
        box(.08,.3,.23,side*4.05,2.42,z-1.7,z< -105?redGlow:amber);
        box(.2,.06,.5,side*4.1,2.68,z-1.7,p.trim);
      }
    }
    const ribs=new THREE.InstancedMesh(archGeo,p.trim,ribTransforms.length);
    const transform=new THREE.Object3D();
    ribTransforms.forEach(([x,y,z],i)=>{transform.position.set(x,y,z);transform.updateMatrix();ribs.setMatrixAt(i,transform.matrix);});
    railway.add(ribs);
    // Individual tapered-looking voussoirs around the tunnel mouth.
    const blockGeo=new THREE.BoxGeometry(.62,.48,.5),portalBlocks=new THREE.InstancedMesh(blockGeo,concrete,24);
    for(let i=0;i<24;i++) {
      const a=(i+.5)/24*Math.PI;transform.position.set(Math.cos(a)*4.63,spring+Math.sin(a)*4.63,entry+.08);
      transform.rotation.set(0,0,a-Math.PI/2);transform.updateMatrix();portalBlocks.setMatrixAt(i,transform.matrix);
    }
    railway.add(portalBlocks);transform.rotation.set(0,0,0);
    for(const side of [-1,1]) {
      box(1.15,1.4,.8,side*4.85,.6,entry,concrete);
      box(1.8,.45,.8,side*4.96,4.95,entry,concrete);
      for(let y=.4;y<1.3;y+=.25)box(1.12,.035,.82,side*4.85,y,entry,p.trim);
    }

    // Service alcoves add changing depth rather than a single endless tube.
    for(const z of [-42,-74,-108]) {
      box(.1,2.1,2.1,4.24,1.36,z,p.black);
      box(.12,1.86,1.82,4.16,1.36,z,darkSteel);
      for(const dz of [-.95,.95])box(.2,2.2,.12,4.05,1.37,z+dz,steel);
      box(.2,.12,2.04,4.05,2.47,z,steel);
      box(.22,.25,.12,4.02,1.38,z-.6,p.brass);
      for(let dy=1;dy<1.8;dy+=.1)box(.13,.025,.7,4.07,dy,z+.25,p.black);
    }
    // The final wall and damaged rail are physically present for the derail shot.
    box(.6,5.5,12,4.1,2.5,-115,concrete);
    for(let z=-110;z>-119;z-=.7) {
      box(.12,.055,.48,3.76,1.1,z,p.hazard);
      box(.12,.055,.48,3.76,1.32,z,p.hazard);
    }
    tube([[.95,.14,-105],[1.08,.2,-108],[1.42,.25,-110],[2.2,.5,-113]],.085,steel);
    for(let i=0;i<19;i++) {
      const z=-111-random()*7,x=1.5+random()*1.5,s=.15+random()*.32;
      box(s,s*.7,s*1.2,x,s*.2,z,concrete);
    }

    for(const {material,parent,parts} of batches.values()) {
      const instance=new THREE.InstancedMesh(unit,material,parts.length);
      for(const [index,a] of parts.entries()) {
        transform.position.set(a.x,a.y,a.z);transform.scale.set(a.w,a.h,a.d);transform.updateMatrix();instance.setMatrixAt(index,transform.matrix);
      }
      instance.instanceMatrix.needsUpdate=true;instance.computeBoundingSphere();parent.add(instance);
    }

    // Discrete floating grit and a small wheel-contact spark system are 3D points.
    const dustData=new Float32Array(210*3);
    for(let i=0;i<dustData.length;i+=3) {dustData[i]=(random()-.5)*8;dustData[i+1]=.2+random()*4.7;dustData[i+2]=15-random()*155;}
    const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.BufferAttribute(dustData,3));
    const dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:0xc3c8a5,size:.025,transparent:true,opacity:.26,depthWrite:false}));railway.add(dust);
    const sparkData=new Float32Array(35*3),sparkGeometry=new THREE.BufferGeometry();
    sparkGeometry.setAttribute('position',new THREE.BufferAttribute(sparkData,3));
    const sparks=new THREE.Points(sparkGeometry,new THREE.PointsMaterial({color:0xffc46d,size:.065,transparent:true,opacity:.8,depthWrite:false}));scene.add(sparks);sparks.visible=false;

    // Reuse the original hand-sewn doll and its articulated snarling mouth.
    const dollRoot=new THREE.Group();dollRoot.name='cinematic.original-blue-doll';scene.add(dollRoot);
    const dollView=createMonsterView(dollRoot),monsterState={monsters:{},corridor:{active:false}};
    for(const [i,def] of MONSTERS.entries())monsterState.monsters[def.id]={mode:i===0?'chase':'inactive',x:0,z:0,yaw:Math.PI,walkDistance:0};
    const monsterActors=Object.values(monsterState.monsters);
    dollView.sync(monsterState,0);dollRoot.visible=false;

    // A cab interior gives the POV real foreground depth: instrument cowl,
    // pressure gauge, needle, throttle lever, bolts and front window corners.
    // It is kept separate from the exterior locomotive so either can be refined.
    const cab=new THREE.Group();cab.name='cinematic.cab-interior';trainRoot.add(cab);
    mesh(new THREE.BoxGeometry(1.3,.16,.35),p.black,0,1.23,.04,cab);
    mesh(new THREE.BoxGeometry(1.1,.055,.3),p.trainConsole,0,1.34,.04,cab);
    for(const x of [-.24,.16]) {
      const rim=mesh(new THREE.CylinderGeometry(.095,.095,.035,20),p.brass,x,1.43,-.06,cab);rim.rotation.x=Math.PI/2;
      const face=mesh(new THREE.CircleGeometry(.078,20),p.cream,x,1.43,-.037,cab);
      const needle=mesh(new THREE.BoxGeometry(.008,.11,.008),p.red,x,1.43,-.026,cab);needle.rotation.z=-.65;
      // Tiny raised tick marks on the mechanical gauge face.
      for(let i=0;i<7;i++) {
        const a=i/6*Math.PI*1.4-.7;
        const tick=mesh(new THREE.BoxGeometry(.008,.017,.005),p.black,x+Math.sin(a)*.058,1.43+Math.cos(a)*.058,-.03,cab);tick.rotation.z=-a;
      }
      face.name='pressure-gauge';
    }
    const throttle=new THREE.Group();throttle.position.set(.48,1.38,.08);cab.add(throttle);
    mesh(new THREE.CylinderGeometry(.015,.02,.28,8),p.brass,0,.11,0,throttle);
    mesh(new THREE.SphereGeometry(.04,10,8),p.red,0,.25,0,throttle);throttle.rotation.x=-.38;
    const warning=mesh(new THREE.SphereGeometry(.035,10,8),amber,-.47,1.4,-.03,cab);
    // Window pillars flank the view; they never cover the doll or tunnel ahead.
    for(const x of [-.83,.83])mesh(new THREE.BoxGeometry(.065,.68,.065),p.trim,x,1.95,-.15,cab);
    mesh(new THREE.BoxGeometry(1.75,.06,.1),p.cream,0,2.32,-.15,cab);

    const ambient=new THREE.HemisphereLight(0xb9d5d1,0x202721,1.05);scene.add(ambient);
    const cabLight=new THREE.PointLight(0xe0a760,2.8,9,1.6);cabLight.position.set(0,2.1,.7);trainRoot.add(cabLight);
    const headlight=new THREE.SpotLight(0xd1e5cf,65,90,.33,.6,1.1);
    headlight.position.set(0,1.38,-1.36);headlight.target.position.set(0,1.2,-26);trainRoot.add(headlight,headlight.target);
    const beamGeo=new THREE.ConeGeometry(3.5,24,20,1,true);
    const beamMat=new THREE.MeshBasicMaterial({color:0xc6dfc4,transparent:true,opacity:.025,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
    const beam=mesh(beamGeo,beamMat,0,1.36,-13.3,trainRoot);beam.rotation.x=Math.PI/2;
    // The cone tip must meet the lamp; ConeGeometry's apex points along +Y.

    const cameraPosition=new THREE.Vector3(),cameraTarget=new THREE.Vector3(),size=new THREE.Vector2();
    return {scene,camera,art,p,trainRoot,train,railway,dollRoot,dollView,monsterState,monsterActors,sparks,sparkData,sparkGeometry,
      ambient,cabLight,headlight,beam,warning,throttle,cab,cameraPosition,cameraTarget,size};
  }

  function update(t,settings,active) {
    const s=stage,dt=active&&t>=lastTime?Math.min(.1,t-lastTime):0;
    if(t<lastTime) {
      for(const monster of s.monsterActors)monster.mode='inactive';
      s.dollView.sync(s.monsterState,0);
      if(s.monsterActors[0])s.monsterActors[0].mode='chase';
    }
    lastTime=t;
    const distance=t<3?2*t*t/3:t<6?6+(t-3)*4:t<19?18+(t-6)*6:t<21?96+(t-19)*5:106+clamp(t-21)*4;
    const failure=clamp((t-19)/2),derail=smooth(t-21);
    const reduced=settings.reducedMotion===true;
    const vibration=reduced?.12:1;
    const impact=t>=5&&t<6?(1-(t-5)):0;
    const shake=(.009+impact*.085+failure*.018+derail*.12)*vibration;
    s.railway.position.z=distance;
    s.trainRoot.position.set(derail*2.85,Math.sin(t*26)*.009+derail*.16,0);
    s.trainRoot.rotation.set(derail*.07,-derail*.28,-derail*.31);
    const wheels=s.train.userData.trainWheels??[];
    for(const wheel of wheels) {
      const turn=-distance/(wheel.name==='train-car-wheel'?.29:.36);
      // Detailed wheels are groups with their axle along local Z. The legacy
      // fallback used cylinders whose original axle is local Y before rotation.
      if(wheel.isGroup)wheel.rotation.z=turn;else wheel.rotation.y=turn;
    }
    if(s.train.userData.rearCar) {
      s.train.userData.rearCar.rotation.y=derail*.18;
      s.train.userData.rearCar.rotation.x=derail*.04;
    }
    s.throttle.rotation.x=-.38-failure*.35+Math.sin(t*25)*failure*.035;
    s.warning.material.color.setHex(t>=19?0xc63f27:0xf4bc68);

    // Jump from the left platform, land squarely between the rails, bare teeth,
    // then disappear beneath the front silhouette on contact. There is no gore.
    s.dollRoot.visible=t>=3&&t<5.6;
    if(s.dollRoot.visible) {
      const q=clamp((t-3)/1.25),leap=smooth(q),hit=clamp((t-5.1)/.45);
      s.dollRoot.position.set(-4.6*(1-leap)+hit*2.1,Math.sin(q*Math.PI)*1.9+.52*(1-leap)+hit*.45,-17+distance+hit*4.6);
      s.dollRoot.rotation.set(hit*.8,0,-.28*(1-leap)-hit*1.65);
      s.dollRoot.scale.setScalar(1.23);
      for(const monster of s.monsterActors)monster.walkDistance=t*1.7;
      s.dollView.sync(s.monsterState,dt);
    }

    const underground=smooth((distance-14)/7);
    s.ambient.intensity=1.05-underground*.91;
    s.scene.fog.density=.033+underground*.006;
    const flicker=t<19?1:t<21?(Math.sin((t-19)*38)>.2?.08:.75):0;
    s.headlight.intensity=65*flicker;
    s.cabLight.intensity=(2.8-underground*1.3)*(t<19?1:t<21?.18:0);
    s.beam.visible=flicker>.5;
    // Station lamps remain behind the player; tunnel lamps fail one by one in
    // the final stretch, with enough ambient light to read the impact silhouette.
    if(t>=21)s.ambient.intensity=.09;

    s.sparks.visible=t>=21&&t<22;
    if(s.sparks.visible) {
      for(let i=0;i<35;i++) {
        const phase=((t-21)*4+i*.161)%1,angle=i*2.399;
        s.sparkData[i*3]=s.trainRoot.position.x+1.05+Math.cos(angle)*phase*1.2;
        s.sparkData[i*3+1]=.18+Math.sin(phase*Math.PI)*(.25+(i%5)*.1);
        s.sparkData[i*3+2]=-.4+phase*2.5;
      }
      s.sparkGeometry.attributes.position.needsUpdate=true;
    }

    const pos=s.cameraPosition,target=s.cameraTarget;
    if(t<2.45) {
      // Exterior establishing shot shows the entire modeled train and its rear
      // carriage before cutting into the driver's seat.
      const q=smooth(t/2.45);
      pos.set(7-q*1.2,3.65-q*.35,8-q*2.2);target.set(0,1.1,1.55);
      s.cab.visible=false;s.camera.fov=54;
    } else {
      s.cab.visible=true;s.camera.fov=59+impact*3+derail*4;
      // A real driver's seat sits beside the central boiler/chimney. This small
      // lateral offset preserves the doll's face and the vanishing-point view.
      pos.set(.42+Math.sin(t*34)*shake,1.85+Math.cos(t*29)*shake,.83);
      target.set(.1+Math.sin(t*27)*shake*.55,1.8+Math.sin(t*31)*shake*.35,-18);
      pos.applyQuaternion(s.trainRoot.quaternion).add(s.trainRoot.position);
      target.applyQuaternion(s.trainRoot.quaternion).add(s.trainRoot.position);
    }
    s.camera.position.copy(pos);s.camera.lookAt(target);
    if(t>=2.45)s.camera.rotateZ((Math.sin(t*21)*shake*.15-derail*.18)*vibration);
    renderer.getSize(s.size);
    const aspect=s.size.x/Math.max(1,s.size.y);
    if(s.camera.aspect!==aspect)s.camera.aspect=aspect;
    s.camera.updateProjectionMatrix();
    // Blackout is a real black render, independent of an optional HTML overlay.
    s.scene.visible=t<22;
    s.scene.background.setHex(t>=22?0x000000:0x101c21);
  }

  return {
    render(chapter,settings={},active=true) {
      // Pausing freezes chapter.ui.elapsed in logic. Continue drawing that same
      // cinematic frame so the exploration scene cannot flash underneath menus.
      if(chapter?.ui?.mode!=='ending'||chapter.ui.variant!=='derailment')return false;
      if(!stage)stage=build();
      const t=Math.max(0,Number.isFinite(chapter.ui.elapsed)?chapter.ui.elapsed:0);
      frame=trainCinematicFrame(t);update(t,settings,active);renderer.render(stage.scene,stage.camera);return true;
    },
    reset(){lastTime=Infinity;frame=null;},
    get frame(){return frame;},
    get scene(){return stage?.scene??null;},
    get camera(){return stage?.camera??null;},
    getStats(){
      let meshes=0,instances=0,lights=0,triangles=0;
      stage?.scene.traverse(object=>{
        if(object.isMesh) {meshes++;const count=object.isInstancedMesh?object.count:1;instances+=count;triangles+=(object.geometry.index?.count??object.geometry.attributes.position?.count??0)/3*count;}
        if(object.isLight)lights++;
      });
      return {meshes,instances,lights,triangles:Math.round(triangles),initialized:stage!==null};
    },
    dispose(){
      if(!stage)return;
      const geometries=new Set(),materials=new Set(),textures=new Set();
      stage.scene.traverse(object=>{
        if(object.geometry)geometries.add(object.geometry);
        for(const material of Array.isArray(object.material)?object.material:[object.material])if(material)materials.add(material);
      });
      for(const material of materials)for(const value of Object.values(material))if(value?.isTexture)textures.add(value);
      for(const texture of textures)texture.dispose();
      for(const material of materials)material.dispose();
      for(const geometry of geometries)geometry.dispose();
      stage=null;frame=null;lastTime=0;
    },
  };
}
