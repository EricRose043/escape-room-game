export const EXIT_CODE_CLUES=Object.freeze([
  Object.freeze({id:'production.color-clue',areaId:'production',text:'復位燈序：紅 → 黃 → 綠 → 藍。',sequence:Object.freeze(['red','yellow','green','blue'])}),
  Object.freeze({id:'corridor.color-key',areaId:'chase-corridor',text:'維修代碼：紅＝3、黃＝1、綠＝4、藍＝2。',values:Object.freeze({red:'3',yellow:'1',green:'4',blue:'2'})}),
  Object.freeze({id:'exit.reverse-clue',areaId:'exit',text:'出口規則：將復位燈序反向輸入。',reverse:true}),
]);

export function deriveExitCode(clues=EXIT_CODE_CLUES) {
  if(!Array.isArray(clues)||clues.length!==3) throw new TypeError('出口密碼必須由三條線索組成');
  const sequence=clues.find(clue=>Array.isArray(clue.sequence))?.sequence;
  const values=clues.find(clue=>clue.values)?.values;
  const reverse=clues.find(clue=>typeof clue.reverse==='boolean')?.reverse;
  if(!sequence?.length||!values||reverse!==true||sequence.some(color=>!Object.hasOwn(values,color))) throw new Error('出口密碼線索不完整或互相矛盾');
  return [...(reverse?[...sequence].reverse():sequence)].map(color=>values[color]).join('');
}

export const EXIT_CODE=deriveExitCode();
export const EXIT_CLUE_IDS=Object.freeze(EXIT_CODE_CLUES.map(clue=>clue.id));
export function hasAllExitClues(foundClueIds=[]) {
  const found=new Set(Array.isArray(foundClueIds)?foundClueIds:[]);
  return EXIT_CLUE_IDS.every(id=>found.has(id));
}
export function validateExitCode(input,foundClueIds=[]) {
  return hasAllExitClues(foundClueIds)&&String(input)===EXIT_CODE;
}
