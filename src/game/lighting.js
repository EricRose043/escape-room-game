// 近距表面衰減補償：抵銷 1 m 內反平方造成的過亮，不改遊戲規則。
export function compensatedIntensity(distance, base = 35) {
  return base * Math.min(1,Math.max(0,distance)) ** 2;
}
