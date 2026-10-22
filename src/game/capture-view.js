import { capturePresentation } from '../logic/capture.js';

// 原創糖塊值班員近景，只畫一次；sync 不建立圖像、材質或光源。
function drawCloseup(canvas,context) {
  canvas.width=512;canvas.height=512;
  context.clearRect(0,0,512,512);
  const rounded=(x,y,w,h,r,color)=>{
    context.fillStyle=color;context.beginPath();context.roundRect(x,y,w,h,r);context.fill();
  };
  const circle=(x,y,r,color)=>{
    context.fillStyle=color;context.beginPath();context.arc(x,y,r,0,Math.PI*2);context.fill();
  };
  rounded(133,335,246,164,64,'#e4d8bc');
  rounded(69,350,76,121,36,'#eee4cf');rounded(367,350,76,121,36,'#eee4cf');
  rounded(139,229,235,150,27,'#ddd1b5');
  rounded(121,91,262,191,32,'#eee4cf');
  rounded(104,71,302,32,10,'#80bfa6');rounded(137,48,236,30,7,'#a0d4bc');
  for(const x of [197,309]) {
    circle(x,177,21,'#34464b');
    circle(x-5,173,3,'#b9b7a5');circle(x+5,181,3,'#b9b7a5');
  }
  rounded(218,229,70,7,3,'#34464b');
  circle(256,402,24,'#d2b76c');rounded(245,390,22,24,4,'#80bfa6');
}

export function createCaptureView(root) {
  const canvas=root.querySelector('canvas');
  root.hidden=true;canvas.hidden=true;
  const context=canvas.getContext('2d');
  if(context) drawCloseup(canvas,context);
  return {
    sync(ui,options={}) {
      const presentation=capturePresentation(ui,options);
      // 顯示前每次重驗外部開關，不能因舊的允許狀態留下近景。
      canvas.hidden=!presentation.closeup || !context;
      canvas.style.transform=`scale(${presentation.closeup?presentation.scale:1})`;
      root.hidden=!presentation.blackout;
    },
  };
}
