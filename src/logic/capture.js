import { MAX_DT } from './movement.js';

export const CAPTURE_SECONDS=1.2;
const REVEAL_SECONDS=0.15,HIDE_SECONDS=0.5;

export function createCapture({jumpScare=false}={}) {
  return {mode:'caught',elapsed:0,jumpScareAllowed:jumpScare===true};
}

export function updateCapture(ui,dt,{jumpScare=false}={}) {
  if(ui.mode!=='caught') return ui;
  const seconds=Number.isFinite(dt)?Math.max(0,Math.min(MAX_DT,dt)):0;
  const elapsed=Math.min(CAPTURE_SECONDS,ui.elapsed+seconds);
  // 關閉後本次不再補播；暫停時也可用 dt=0 立即撤回允許。
  const jumpScareAllowed=ui.jumpScareAllowed && jumpScare===true;
  return elapsed===ui.elapsed && jumpScareAllowed===ui.jumpScareAllowed
    ? ui : {...ui,elapsed,jumpScareAllowed};
}

export function capturePresentation(ui,{jumpScare=false,paused=false}={}) {
  const blackout=ui.mode==='caught';
  const closeup=blackout && !paused && jumpScare===true && ui.jumpScareAllowed===true
    && ui.elapsed>=REVEAL_SECONDS && ui.elapsed<HIDE_SECONDS;
  return {blackout,closeup,scale:closeup?1+0.18*(ui.elapsed-REVEAL_SECONDS)/(HIDE_SECONDS-REVEAL_SECONDS):1};
}
