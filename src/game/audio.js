export function audioCueFor(previous,next) {
  if(next?.ui?.mode==='ending' && previous?.ui?.mode!=='ending') return 'escape';
  if(next?.ui?.mode==='caught' && previous?.ui?.mode!=='caught') return 'caught';
  if(next?.puzzles?.['power.main']?.restored && !previous?.puzzles?.['power.main']?.restored) return 'power';
  const chased=Object.values(next?.monsters??{}).some(monster=>monster.mode==='chase');
  const wasChased=Object.values(previous?.monsters??{}).some(monster=>monster.mode==='chase');
  return chased&&!wasChased?'chase':null;
}

export function createFactoryAudio({contextFactory}={}) {
  let context=null,master=null,bedGain=null,humA=null,humB=null,muted=false,stepElapsed=0;
  const getContext=contextFactory??(()=>{
    if(typeof window==='undefined') return null;
    const AudioContextType=window.AudioContext??window.webkitAudioContext;
    return AudioContextType?new AudioContextType():null;
  });
  function ensure() {
    if(context) return true;
    try {context=getContext();} catch {return false;}
    if(!context) return false;
    master=context.createGain();master.gain.value=muted?0:0.32;master.connect(context.destination);
    bedGain=context.createGain();bedGain.gain.value=0.0001;bedGain.connect(master);
    humA=context.createOscillator();humA.type='triangle';humA.frequency.value=47;humA.connect(bedGain);humA.start();
    humB=context.createOscillator();humB.type='sine';humB.frequency.value=71;humB.connect(bedGain);humB.start();
    return true;
  }
  function tone(frequency,duration,wave='sine',volume=0.045,delay=0) {
    if(!context || muted) return;
    const start=context.currentTime+delay,osc=context.createOscillator(),gain=context.createGain();
    osc.type=wave;osc.frequency.setValueAtTime(frequency,start);gain.gain.setValueAtTime(0.0001,start);
    gain.gain.exponentialRampToValueAtTime(volume,start+0.025);gain.gain.exponentialRampToValueAtTime(0.0001,start+duration);
    osc.connect(gain);gain.connect(master);osc.start(start);osc.stop(start+duration+0.04);
  }
  function noiseStep() {
    if(!context || muted) return;
    const length=Math.floor(context.sampleRate*0.11),buffer=context.createBuffer(1,length,context.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<length;i++) data[i]=(Math.random()*2-1)*(1-i/length);
    const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
    source.buffer=buffer;filter.type='lowpass';filter.frequency.value=260;gain.gain.value=0.12;
    source.connect(filter);filter.connect(gain);gain.connect(master);source.start();
  }
  function start() {
    if(!ensure()) return false;
    try {const resumed=context.resume();resumed?.catch?.(()=>{});} catch {}
    return true;
  }
  function toggle() {
    muted=!muted;
    if(ensure()) {
      try {const resumed=context.resume();resumed?.catch?.(()=>{});} catch {}
      master.gain.setTargetAtTime(muted?0:0.32,context.currentTime,0.04);
    }
    return muted;
  }
  function sync(previous,next,active,dt) {
    if(!context) return;
    const chasing=Object.values(next?.monsters??{}).some(monster=>monster.mode==='chase');
    bedGain.gain.setTargetAtTime(active?(chasing?0.035:0.012):0.002,context.currentTime,0.5);
    const cue=audioCueFor(previous,next);
    if(cue==='power') {tone(82,0.32,'sine',0.06);tone(123,0.32,'triangle',0.045,0.12);tone(165,0.4,'sine',0.035,0.24);}
    if(cue==='chase') {tone(145,0.36,'sawtooth',0.05);tone(119,0.42,'triangle',0.04,0.13);}
    if(cue==='caught') {tone(76,0.52,'sawtooth',0.08);tone(52,0.7,'sine',0.06,0.08);}
    if(cue==='escape') {tone(220,0.34,'triangle',0.045);tone(330,0.42,'sine',0.04,0.18);tone(440,0.7,'sine',0.035,0.38);}
    const moving=active && next?.ui?.mode==='explore' && Math.hypot(next.player.x-previous.player.x,next.player.z-previous.player.z)>0.001;
    if(!moving) stepElapsed=0;
    else {stepElapsed-=(Number.isFinite(dt)?Math.max(0,dt):0);if(stepElapsed<=0){noiseStep();stepElapsed=0.48;}}
  }
  return {start,toggle,sync,supported:()=>Boolean((typeof window!=='undefined'&&(window.AudioContext||window.webkitAudioContext))||contextFactory),muted:()=>muted};
}
