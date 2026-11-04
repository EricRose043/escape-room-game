export const TRAIN_CINEMATIC_SECONDS=24;
const PHASES=[['depart',0,3],['ambush',3,5],['impact',5,6],['tunnel',6,19],['failure',19,21],['derail',21,22],['blackout',22,24]];
const DIALOGUE=[
  [6,12,'這恐怖的工廠……終於要逃出去了嗎？'],
  [12,19,'不對……我還不能放鬆。只要離開這裡……'],
  [19,21,'系統警告：制動失效。前方道岔異常。'],
  [21,22,'抓緊——！'],
];
// 純資料時間軸，場景、音效與字幕共用同一個時鐘。
export function trainCinematicFrame(seconds){
  const elapsed=Number.isFinite(seconds)?Math.max(0,Math.min(TRAIN_CINEMATIC_SECONDS,seconds)):0;
  const complete=elapsed>=TRAIN_CINEMATIC_SECONDS;
  const [phase,start,end]=PHASES.find(([,a,b])=>elapsed>=a&&elapsed<b)??['complete',24,24];
  const phaseElapsed=elapsed-start,phaseProgress=end>start?phaseElapsed/(end-start):1;
  return {phase,elapsed,phaseElapsed,phaseProgress,progress:elapsed/TRAIN_CINEMATIC_SECONDS,complete,
    dialogue:DIALOGUE.find(([a,b])=>elapsed>=a&&elapsed<b)?.[2]??'',
    shake:phase==='impact'?1:phase==='derail'?1.5:phase==='failure'?.35:phase==='tunnel'?.06:0,
    blackout:phase==='blackout'||complete?1:0};
}
