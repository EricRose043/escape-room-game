export function createStartMenu(result,{hasCurrent=false}={}) {
  const canContinue=result.status==='valid';
  return {mode:'menu',selected:canContinue?'continue':'new',canContinue,hasCurrent,
    reason:result.reason??'',effect:null};
}

export function updateStartMenu(state,command) {
  const next={...state,effect:null};
  if(!command || state.mode==='closed') return next;
  if(command.type==='cancel') return state.mode==='confirm'?{...next,mode:'menu',selected:'new'}
    : state.hasCurrent?{...next,mode:'closed',effect:'resume'}:next;
  if(command.type==='new' && state.mode==='menu') return {...next,mode:'confirm',selected:'cancel'};
  if(command.type==='confirm-new' && state.mode==='confirm') return {...next,mode:'closed',effect:'new'};
  if(command.type==='continue' && state.mode==='menu' && state.canContinue) return {...next,mode:'closed',effect:'continue'};
  if(command.type==='resume' && state.mode==='menu' && state.hasCurrent) return {...next,mode:'closed',effect:'resume'};
  if(command.type==='move') {
    const choices=state.mode==='confirm'?['cancel','confirm']:[...(state.canContinue?['continue']:[]),'new',...(state.hasCurrent?['resume']:[])];
    const delta=['down','right'].includes(command.direction)?1:['up','left'].includes(command.direction)?-1:0;
    return {...next,selected:choices[Math.max(0,Math.min(choices.length-1,choices.indexOf(state.selected)+delta))]};
  }
  if(command.type==='activate') {
    if(state.mode==='confirm') return updateStartMenu(next,{type:state.selected==='confirm'?'confirm-new':'cancel'});
    return updateStartMenu(next,{type:state.selected});
  }
  return next;
}

export function keyboardStartMenuCommand(event) {
  if(event.repeat) return null;
  const direction={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[event.code];
  if(direction) return {type:'move',direction};
  if(['Enter','Space'].includes(event.code)) return {type:'activate'};
  return event.code==='Escape'?{type:'cancel'}:null;
}
export function startMenuGamepadCommand(actions={}) {
  if(actions.cancelPressed || actions.pausePressed) return {type:'cancel'};
  if(actions.menuDirection) return {type:'move',direction:actions.menuDirection};
  return actions.confirmPressed?{type:'activate'}:null;
}
