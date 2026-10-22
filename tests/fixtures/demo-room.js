// STEP 0～3 舊示範資料原樣保存，僅供測試；正式遊戲不得匯入。
// 單位為公尺；game 依同一份 AABB 建模，logic 直接用它做碰撞。
export const LEVEL_BOXES = [
  { id: 'west', kind: 'wall', minX: -5.2, maxX: -5, minY: 0, maxY: 3.5, minZ: -6.2, maxZ: 6.2 },
  { id: 'east', kind: 'wall', minX: 5, maxX: 5.2, minY: 0, maxY: 3.5, minZ: -6.2, maxZ: 6.2 },
  { id: 'north', kind: 'wall', minX: -5, maxX: 5, minY: 0, maxY: 3.5, minZ: -6.2, maxZ: -6 },
  { id: 'south', kind: 'wall', minX: -5, maxX: 5, minY: 0, maxY: 3.5, minZ: 6, maxZ: 6.2 },
  { id: 'demo-partition', kind: 'partition', minX: 1.5, maxX: 3.5, minY: 0, maxY: 2.5, minZ: 0, maxZ: 0.2 },
  { id: 'table', kind: 'table', minX: -3, maxX: -1.5, minY: 0, maxY: 0.9, minZ: -2, maxZ: -0.8 },
];

// 地板與天花板不參與固定高度的水平碰撞，也集中在這份關卡資料。
export const ROOM_SURFACES = [
  { id: 'floor', kind: 'floor', minX: -5.2, maxX: 5.2, minY: -0.2, maxY: 0, minZ: -6.2, maxZ: 6.2 },
  { id: 'ceiling', kind: 'ceiling', minX: -5.2, maxX: 5.2, minY: 3.5, maxY: 3.7, minZ: -6.2, maxZ: 6.2 },
];

// STEP 2／3 測試道具；位置、判定與模型尺寸只有這一份，STEP 4 再換正式物品。
// 單位為公尺，各軸至少 0.25 m，讓中央準星與手把都能瞄準。
export const ITEMS = [
  { id: 'demo-table-token', name: '桌上電池', kind: 'battery', chargeAmount: 25, minX: -2.5, maxX: -2.1, minY: 0.9, maxY: 1.3, minZ: -1.6, maxZ: -1.2, color: 0xffcc66 },
  { id: 'demo-open-token', name: '藍色電池', kind: 'battery', chargeAmount: 25, minX: -0.25, maxX: 0.25, minY: 1.35, maxY: 1.85, minZ: 1.75, maxZ: 2.25, color: 0x66ccff },
  { id: 'demo-hidden-token', name: '隔板後代幣', minX: 2.25, maxX: 2.75, minY: 1.35, maxY: 1.85, minZ: -1.25, maxZ: -0.75, color: 0xff88bb },
];

// STEP 3 示範字，STEP 4 再換正式線索。位置位於隔板北面外側 0.02 m。
// game 依同一個 position、normal 建平面，logic 以中心決定整段可見性。
export const CLUES = [
  { id: 'demo-uv-text', text: '星光在此', position: { x: 2.5, y: 1.6, z: -0.02 },
    normal: { x: 0, y: 0, z: -1 }, width: 1, height: 0.35 },
];
