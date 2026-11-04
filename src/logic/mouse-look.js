export function createMouseLook(){return {yaw:0,pitch:0};}
export function advanceMouseLook(state,delta,dt,active=true){
  if(!active)return {state:createMouseLook(),look:{dYaw:0,dPitch:0}};
  const finite=n=>Number.isFinite(n)?n:0;
  const seconds=Math.max(0,Math.min(.1,finite(dt))),fraction=1-Math.exp(-seconds/.012);
  const yaw=state.yaw+Math.max(-.6,Math.min(.6,finite(delta.dYaw)))*.55;
  const pitch=state.pitch+Math.max(-.6,Math.min(.6,finite(delta.dPitch)))*.55;
  return {state:{yaw:yaw*(1-fraction),pitch:pitch*(1-fraction)},look:{dYaw:yaw*fraction,dPitch:pitch*fraction}};
}
// 近景抓捕全畫面遮住工廠；留GPU給持續更新的透視圖層。
export const worldVisible=mode=>mode!=='caught';
