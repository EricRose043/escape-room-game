// 原創、非旋律的氣流／撕裂紋理。僅於音訊啟用時生成一次，沒有取樣其他作品。
export function createScareTexture(sampleRate){
 if(!Number.isFinite(sampleRate)||sampleRate<=0)throw new RangeError('Invalid sample rate');
 const length=Math.ceil(sampleRate*1.65),channels=[new Float32Array(length),new Float32Array(length)];
 let seed=0x73636172,phase=0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
 const band=(frequency,q)=>{
  const w=2*Math.PI*Math.min(frequency,sampleRate*.43)/sampleRate,alpha=Math.sin(w)/(2*q),a0=1+alpha;
  const b0=alpha/a0,a1=-2*Math.cos(w)/a0,a2=(1-alpha)/a0;let x1=0,x2=0,y1=0,y2=0;
  return x=>{const y=b0*x-b0*x2-a1*y1-a2*y2;x2=x1;x1=x;y2=y1;y1=y;return y;};
 };
 const formants=[band(960,1.3),band(1830,2.1),band(2910,2.8)];
 for(let i=0;i<length;i++){
  const t=i/sampleRate,air=random();
  phase+=2*Math.PI*(210+95*Math.exp(-t*4)+34*Math.sin(2*Math.PI*31*t)+air*19)/sampleRate;
  const rasp=Math.tanh((Math.sin(phase)+.47*Math.sin(phase*2.017)+air*.75)*2.3);
  const throat=formants[0](rasp)*1.5+formants[1](rasp)*1.1+formants[2](air)*1.7;
  const envelope=(1-Math.exp(-t*330))*Math.exp(-t*3.4)*(1+.24*Math.sin(2*Math.PI*47*t));
  const snap=air*Math.exp(-t*80)*.55;
  const scrape=(Math.sin(2*Math.PI*1373*t)+.47*Math.sin(2*Math.PI*2171*t)+.3*Math.sin(2*Math.PI*3217*t))*Math.exp(-t*7.5)*.2;
  const body=Math.tanh((throat*.95+air*.22)*1.9)*envelope;
  channels[0][i]=body+snap+scrape;
  channels[1][i]=body*.9+snap+scrape*.82+random()*.11*envelope;
 }
 // 短房間反射；保留中置主體，單聲道不會相消。
 const taps=[[.037,.2],[.071,.11],[.113,.055]];
 for(const c of channels)for(let i=c.length-1;i>=0;i--)for(const [delay,gain] of taps){const at=i-Math.round(delay*sampleRate);if(at>=0)c[i]+=c[at]*gain;}
 let peak=0;for(const c of channels)for(const x of c)peak=Math.max(peak,Math.abs(x));
 for(const c of channels)for(let i=0;i<c.length;i++)c[i]=c[i]*(.82/(peak||1))*Math.min(1,(c.length-i)/(sampleRate*.06));
 return channels;
}
