// 每秒呼叫一次；只調3D繪圖解析度，不降低DOM文字或輸入更新率。
export function assessFrameQuality(state,fps,cap=1.25){
 if(!Number.isFinite(fps)||fps<=0)return state;
 if(fps<48)return {scale:Math.max(Math.min(.75,cap),state.scale*.88),stable:0};
 const stable=fps>=58?state.stable+1:0;
 return stable>=10?{scale:Math.min(cap,state.scale+.05),stable:0}:{...state,stable};
}
