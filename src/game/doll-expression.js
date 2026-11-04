export function dollExpression(mode,elapsed=0){
  const t=Number.isFinite(elapsed)?Math.max(0,elapsed):0;
  if(mode==='chase'){
    const reveal=Math.sin(Math.min(t/.48,1)*Math.PI/2);
    return {jaw:.08+reveal*.82,tilt:.22*Math.exp(-t*2)+Math.sin(t*2.4)*.035,reach:Math.min(1,t/.6),lunge:Math.sin(Math.min(t/.7,1)*Math.PI)*.06};
  }
  return {jaw:mode==='search'?.1:.025,tilt:mode==='search'?Math.sin(t*2)*.12:0,reach:0,lunge:0};
}
