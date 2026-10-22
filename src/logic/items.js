// STEP 2 測試道具；位置、判定與模型尺寸只有這一份，STEP 4 再換正式物品。
// 單位為公尺，各軸至少 0.25 m，讓中央準星與手把都能瞄準。
export const ITEMS = [
  { id: 'demo-table-token', name: '桌上代幣', minX: -2.5, maxX: -2.1, minY: 0.9, maxY: 1.3, minZ: -1.6, maxZ: -1.2, color: 0xffcc66 },
  { id: 'demo-open-token', name: '藍色代幣', minX: -0.25, maxX: 0.25, minY: 1.35, maxY: 1.85, minZ: 1.75, maxZ: 2.25, color: 0x66ccff },
  { id: 'demo-hidden-token', name: '隔板後代幣', minX: 2.25, maxX: 2.75, minY: 1.35, maxY: 1.85, minZ: -1.25, maxZ: -0.75, color: 0xff88bb },
];
