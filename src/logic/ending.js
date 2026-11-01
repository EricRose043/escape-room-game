export function finishChapter(startSeconds,endSeconds) {
  const start=Number.isFinite(startSeconds)&&startSeconds>=0?startSeconds:0;
  const end=Number.isFinite(endSeconds)&&endSeconds>=start?endSeconds:start;
  const elapsedSeconds=Math.floor(end-start);
  const hours=Math.floor(elapsedSeconds/3600),minutes=Math.floor(elapsedSeconds%3600/60),seconds=elapsedSeconds%60;
  const formattedTime=hours>0?`${hours} 小時 ${String(minutes).padStart(2,'0')} 分 ${String(seconds).padStart(2,'0')} 秒`
    :`${minutes} 分 ${String(seconds).padStart(2,'0')} 秒`;
  return {elapsedSeconds,formattedTime};
}
