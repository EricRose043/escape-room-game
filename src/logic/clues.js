import { WORLD, CLUES as clues } from './world.js';

// 顯示與驗證都按 puzzleId 取同一個資料物件，不另存密碼副本。
export function getPuzzle(puzzleId) {
  return WORLD.areas.flatMap(area => area.puzzles).find(puzzle => puzzle.id === puzzleId);
}
export const CLUES = clues.map(clue => ({...clue, text:`檢修碼：${getPuzzle(clue.puzzleId).code}`}));
