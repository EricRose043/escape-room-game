const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const smooth=value=>{const q=clamp(value);return q*q*(3-2*q);};

// Separate depth/motion for the head, jaw, eyes and reaching hands. No random
// frame changes, opacity pulses or flashing lights.
export function captureScarePose(elapsed=0) {
  const age=Math.max(0,(Number.isFinite(elapsed)?elapsed:0)-.15);
  const attack=1-Math.pow(1-clamp(age/.075),3);
  const creep=smooth((age-.075)/1.15),jaw=smooth((age-.035)/.19),hands=smooth((age-.08)/.37);
  return {age,attack,creep,jaw,hands,
    x:-16+attack*18+Math.sin(age*4.1)*3,y:30-attack*34-creep*8,
    z:95+attack*230+creep*28,scale:.84+attack*.19+creep*.025,
    tilt:-13+attack*18+Math.sin(age*3.2)*2.2,pitch:13-attack*19-creep*3,
    yaw:-12+attack*9+Math.sin(age*2.8)*1.5,jawY:-64+jaw*142+creep*13+Math.sin(age*17)*creep*.9,
    eyeShift:Math.sin(age*7.4)*creep*2.2,
    jawTilt:-5+jaw*10,handX:240-hands*190-creep*12,handZ:160+hands*230};
}

// Procedural original blue textile doll, painted once during view construction.
// The separated layers form a perspective puppet rather than a zooming poster.
export function paintCaptureLayer(canvas,context,layer='fallback') {
  canvas.width=1536;canvas.height=1536;context.clearRect(0,0,1536,1536);
  context.setTransform?.(1.5,0,0,1.5,0,0);
  let seed=5731;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const gradient=(x,y,r,stops)=>{
    const value=context.createRadialGradient?.(x,y,2,x,y,r);
    if(!value?.addColorStop)return stops[0][1];
    for(const [position,color] of stops)value.addColorStop(position,color);return value;
  };
  const ellipse=(x,y,rx,ry,color,rotation=0)=>{context.fillStyle=color;context.beginPath();context.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);context.fill();};
  const path=(points,color,width=1)=>{context.strokeStyle=color;context.lineWidth=width;context.lineCap='round';context.lineJoin='round';context.beginPath();context.moveTo(...points[0]);for(const point of points.slice(1))context.lineTo(...point);context.stroke();};
  function stitches(points,color='#a89c76',width=3) {
    path(points,'#071921',width+3);path(points,color,width);
    for(let i=0;i<points.length;i++) {
      const [x,y]=points[i],next=points[Math.min(points.length-1,i+1)],a=Math.atan2(next[1]-y,next[0]-x)+.95;
      path([[x-Math.cos(a)*8,y-Math.sin(a)*8],[x+Math.cos(a)*8,y+Math.sin(a)*8]],'#b4a784',3);
    }
  }
  function head() {
    ellipse(292,207,97,127,'#102b3d',-.38);ellipse(292,198,57,83,'#6b7f79',-.38);
    ellipse(761,197,73,109,'#16374a',.3);ellipse(761,191,37,66,'#8b9380',.3);
    context.fillStyle=gradient(424,327,470,[[0,'#4b8096'],[.48,'#285168'],[1,'#07131e']]);
    context.beginPath();context.moveTo(276,236);context.bezierCurveTo(364,125,647,115,772,251);
    context.bezierCurveTo(896,390,849,562,780,681);context.bezierCurveTo(739,745,702,797,615,824);
    context.bezierCurveTo(457,870,303,783,249,659);context.bezierCurveTo(180,513,181,350,276,236);context.closePath();context.fill();
    context.save();context.beginPath();context.ellipse(518,487,304,321,0,0,Math.PI*2);context.clip();
    for(let i=0;i<2600;i++) {
      const x=205+random()*630,y=170+random()*650,a=Math.atan2(y-420,x-510),length=4+random()*14;
      path([[x,y],[x+Math.cos(a)*length,y+Math.sin(a)*length]],random()>.55?'#a6c0c61c':'#03111c39',1+random()*2);
    }
    context.restore();
    ellipse(386,395,104,100,'#071722',-.13);ellipse(659,361,92,105,'#08131e',.16);
    ellipse(507,510,130,91,gradient(480,478,135,[[0,'#a9ad92'],[.62,'#778b80'],[1,'#324d4f']]));
    ellipse(508,488,53,35,'#0a1820',-.05);ellipse(494,477,22,7,'#78908d55',-.15);
    context.fillStyle='#02070d';context.beginPath();context.moveTo(265,506);
    context.bezierCurveTo(355,566,622,584,800,474);context.bezierCurveTo(800,607,757,816,613,873);
    context.bezierCurveTo(441,917,286,784,265,506);context.fill();
    const left=[],right=[];
    for(let i=0;i<10;i++){left.push([271+i*10,506+i*8]);right.push([799-i*9,480+i*8]);}
    stitches(left,'#a5a58a',3);stitches(right,'#a5a58a',3);
    stitches(Array.from({length:16},(_,i)=>[347+i*21,230+Math.sin(i*.18)*15]),'#8f9a88',2.5);
    stitches(Array.from({length:10},(_,i)=>[754-i*4,305+i*22]),'#a6a285',2);
    path([[724,389],[739,434],[720,463],[737,494]],'#b6b199',2);
    path([[296,576],[279,625],[289,655]],'#8d998a',2);
  }
  function eye(side) {
    if(side==='left') {
      ellipse(386,395,78,82,'#08151e',-.12);
      ellipse(386,392,70,74,gradient(369,372,78,[[0,'#b7a35c'],[.58,'#786636'],[1,'#28251a']]),-.12);
      context.strokeStyle='#c1af7466';context.lineWidth=5;context.beginPath();context.ellipse(386,392,60,65,-.12,0,Math.PI*2);context.stroke();
      for(const x of [-16,16])for(const y of [-15,15])ellipse(386+x,392+y,7,8,'#08141b');
      path([[365,376],[409,408]],'#b3a778',5);path([[407,376],[367,407]],'#b3a778',5);
      ellipse(362,365,13,5,'#ecdfad88',-.6);path([[304,340],[343,317],[417,319],[451,341]],'#112634',17);
    } else {
      ellipse(659,361,66,84,'#1b353b',.13);
      ellipse(659,357,58,74,gradient(644,329,78,[[0,'#b6c3ad'],[.55,'#708f89'],[1,'#1d3c43']]),.13);
      ellipse(666,359,27,40,'#8c9e78',.11);ellipse(669,360,10,29,'#020b12',.05);
      ellipse(647,327,11,20,'#d4e3c680',.35);
      path([[629,301],[648,335],[637,358],[666,381],[668,419]],'#17363a',3);
      path([[647,335],[684,326],[698,340]],'#17363a',2);
      path([[600,294],[636,275],[682,280],[715,309]],'#0c2230',14);
    }
  }
  function tooth(x,y,length,width,up=false,shade=false) {
    const direction=up?-1:1,bend=(x<520?1:-1)*(7+random()*8);
    context.fillStyle=shade?'#676b59':gradient(x-3,y,Math.max(length,width)*1.2,[[0,'#d2cdb3'],[.45,'#a4a88f'],[1,'#445b54']]);
    context.beginPath();context.moveTo(x-width*.5,y);
    context.quadraticCurveTo(x-width*.4,y+length*direction*.54,x+bend,y+length*direction);
    context.quadraticCurveTo(x+width*.53,y+length*direction*.5,x+width*.5,y);context.closePath();context.fill();
    path([[x-width*.18,y+direction*6],[x+width*.04,y+direction*length*.55]],shade?'#99a18c22':'#f0ead13b',1.5);
  }
  function upperTeeth() {
    for(let i=0;i<29;i++){const x=290+i*16,y=568-Math.pow((x-520)/230,2)*63;tooth(x,y+9,54+(i%4)*8,15,false,true);}
    for(let i=0;i<27;i++){const x=300+i*16.5,y=565-Math.pow((x-520)/230,2)*66;tooth(x,y,75+(i%5)*9,18);}
    path([[270,508],[331,551],[435,572],[565,573],[697,536],[798,476]],'#2b4549',10);
  }
  function jaw() {
    context.fillStyle=gradient(494,781,210,[[0,'#9aa58e'],[.55,'#576f6a'],[1,'#152d38']]);
    context.beginPath();context.moveTo(308,714);context.bezierCurveTo(409,765,657,776,755,683);
    context.bezierCurveTo(745,805,695,876,563,891);context.bezierCurveTo(432,897,331,837,308,714);context.fill();
    for(let i=0;i<25;i++){const x=328+i*16.5,y=741-Math.pow((x-526)/200,2)*25;tooth(x,y,69+(i%4)*10,18,true);}
    path([[310,715],[401,758],[526,774],[660,744],[754,684]],'#243d41',9);
    stitches(Array.from({length:14},(_,i)=>[351+i*28,819+Math.sin(i/13*Math.PI)*28]),'#a7aa8d',2.5);
  }
  function hand(mirror=false) {
    context.save();if(mirror){context.translate(1024,0);context.scale(-1,1);}
    ellipse(83,767,140,187,gradient(91,693,240,[[0,'#2b5a71'],[.5,'#163c52'],[1,'#030b13']]),-.3);
    const fingers=[[[112,780],[232,766],[353,714],[392,650]],[[102,683],[205,477],[353,430],[405,491]],[[43,663],[136,402],[290,354],[335,433]],[[-13,686],[47,460],[181,398],[232,471]],[[-42,750],[-4,570],[86,525],[131,582]]];
    for(const [i,points] of fingers.entries()) {
      const [a,b,c,d]=points;
      const curve=(color,width)=>{context.strokeStyle=color;context.lineWidth=width;context.lineCap='round';context.beginPath();context.moveTo(...a);context.bezierCurveTo(...b,...c,...d);context.stroke();};
      curve('#030b13',86-i*5);curve(i%2?'#254e65':'#1c435b',68-i*4);curve('#48758a55',22-i*2);
      ellipse(d[0],d[1],25-i*2,31-i,'#102d40',-.5);
      context.fillStyle='#9ca68e';context.beginPath();context.moveTo(d[0]-16,d[1]-12);
      context.quadraticCurveTo(d[0]+39,d[1]+9,d[0]+16,d[1]+49);context.quadraticCurveTo(d[0]+13,d[1]+14,d[0]-16,d[1]+7);context.fill();
      const u=.6,v=1-u,x=v**3*a[0]+3*v**2*u*b[0]+3*v*u**2*c[0]+u**3*d[0],y=v**3*a[1]+3*v**2*u*b[1]+3*v*u**2*c[1]+u**3*d[1];
      stitches([[x-17,y-4],[x+17,y+7]],'#819488',2.5);
    }
    for(let i=0;i<15;i++)path([[22+i*6,721+i*6],[56+i*5,718+i*6]],'#74a1ad1f',2);
    stitches([[7,833],[37,855],[72,868],[113,873]],'#889c8c',3);context.restore();
  }
  function torso() {
    ellipse(506,935,260,260,'#102c40');ellipse(506,897,136,173,gradient(476,823,180,[[0,'#a1a78b'],[1,'#334c50']]));
    for(const side of [-1,1])ellipse(508+side*69,795,83,49,'#654c38',side*.2);
    ellipse(508,795,35,36,'#9d9064');stitches(Array.from({length:8},(_,i)=>[511+Math.sin(i*.5)*3,860+i*22]),'#bdad83',3);
  }
  if(layer==='head')head();else if(layer==='left-eye')eye('left');else if(layer==='right-eye')eye('right');
  else if(layer==='teeth')upperTeeth();else if(layer==='jaw')jaw();else if(layer==='left-hand')hand();
  else if(layer==='right-hand')hand(true);else if(layer==='torso')torso();
  else{torso();head();eye('left');eye('right');upperTeeth();jaw();}
}
