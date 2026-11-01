export const COLOR_SEQUENCE=Object.freeze({
  id:'production.color-sequence',
  sequence:Object.freeze(['red','yellow','green','blue']),
  buttons:Object.freeze(['red','yellow','green','blue']),
});

export function createSequenceState(def) {
  if(!def || !Array.isArray(def.sequence) || !def.sequence.length) throw new TypeError('謎題必須有非空的 sequence');
  return {progress:0,solved:false};
}

export function pressButton(state,def,color) {
  if(!state || !def || !Array.isArray(def.sequence) || !def.sequence.length) throw new TypeError('無效的顏色序列狀態或謎題');
  if(state.solved) return {state:{...state},result:'solved',alarm:false};
  if(color!==def.sequence[state.progress]) return {state:{...state,progress:0},result:'wrong',alarm:true};
  const progress=state.progress+1,solved=progress===def.sequence.length;
  return {state:{...state,progress:solved?def.sequence.length:progress,solved},result:solved?'solved':'progress',alarm:false};
}
