import { createAudio } from './procedural-audio.js';
import { heartbeatIntensity, footstepInterval } from '../logic/audio-mix.js';
import { WORLD } from '../logic/world.js';
export { createAudio };

export function audioCueFor(previous,next) {
  if(next?.events!==previous?.events&&next?.events?.some(e=>e.type==='alarm'))return 'alarm';
  if(!previous?.trainStarted&&next?.trainStarted) return 'train';
  if(next?.ui?.mode==='ending' && previous?.ui?.mode!=='ending') return 'escape';
  if(next?.ui?.mode==='caught' && previous?.ui?.mode!=='caught') return 'caught';
  if(next?.ui?.mode==='hiding' && previous?.ui?.mode!=='hiding') return 'hide';
  if(previous?.ui?.mode==='hiding' && next?.ui?.mode==='explore') return 'unhide';
  if(next?.puzzles?.['production.sequence']?.restored && !previous?.puzzles?.['production.sequence']?.restored) return 'door';
  if(next?.puzzles?.['power.main']?.restored && !previous?.puzzles?.['power.main']?.restored) return 'power';
  const chased=Object.values(next?.monsters??{}).some(monster=>monster.mode==='chase');
  const wasChased=Object.values(previous?.monsters??{}).some(monster=>monster.mode==='chase');
  return chased&&!wasChased?'chase':null;
}

// 保留已接入 main 的工廠 API；所有播放交給唯一 S1 引擎。
export function createFactoryAudio({contextFactory,audioFactory=createAudio}={}) {
  const options=contextFactory?{AudioContext:class {
    constructor(){const context=contextFactory();if(!context)throw new Error('Audio unavailable');return context;}
  }}:{};
  const engine=audioFactory(options);
  let muted=false,started=false,disposed=false,untilStep=0,pendingCue=null,masterVolume=.32;
  engine.setMasterVolume(masterVolume);
  function setMasterVolume(value){masterVolume=Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;engine.setMasterVolume(muted?0:masterVolume);}
  const supported=()=>engine.getStatus().supported;
  function stop(){untilStep=0;pendingCue=null;engine.stop();}
  function flushCue(){
    if(pendingCue && !muted && !disposed && engine.getStatus().contextState==='running') {
      const cue=pendingCue;pendingCue=null;if(cue==='alarm')engine.playAlarm();else engine.playCue(cue);
    }
  }
  function start(){
    if(disposed || !supported()) return false;
    started=true;engine.setMasterVolume(muted?0:masterVolume);
    engine.setAmbience(muted?null:'lobby');
    Promise.resolve(engine.unlock()).then(ok=>{if(ok)flushCue();}).catch(()=>{});
    return true;
  }
  function toggle(){
    muted=!muted;engine.setMasterVolume(muted?0:masterVolume);
    if(muted)stop();start();return muted;
  }
  function sync(previous,next,active,dt){
    if(!started || disposed) return;
    if(!active || muted){stop();return;}
    const exploring=next?.ui?.mode==='explore';
    const area=WORLD.areas.find(a=>next?.player?.x>=a.bounds.minX && next.player.x<=a.bounds.maxX
      &&next.player.z>=a.bounds.minZ&&next.player.z<=a.bounds.maxZ);
    engine.setAmbience(exploring?(area?.id??'lobby'):null);
    const distances=(next?.corridor?.active?[{...next.corridor.chaser,mode:'chase'}]:Object.values(next?.monsters??{})).filter(m=>m.mode!=='inactive')
      .map(m=>Math.hypot(m.x-next.player.x,m.z-next.player.z)).filter(Number.isFinite);
    engine.setHeartbeat(exploring && distances.length?heartbeatIntensity(Math.min(...distances)):0);
    const cue=audioCueFor(previous,next);if(cue)pendingCue=cue;flushCue();
    const seconds=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;
    const distance=Math.hypot((next?.player?.x??0)-(previous?.player?.x??0),(next?.player?.z??0)-(previous?.player?.z??0));
    const interval=footstepInterval(seconds>0?distance/seconds:0);
    if(!exploring || !Number.isFinite(interval)){untilStep=0;return;}
    untilStep-=seconds;
    if(untilStep<=0){engine.playFootstep();untilStep=interval;}
  }
  async function dispose(){if(disposed)return;stop();disposed=true;started=false;await engine.dispose();}
  return {start,toggle,sync,supported,setMasterVolume,muted:()=>muted,stop,dispose,getStatus:()=>({...engine.getStatus(),muted,started})};
}
