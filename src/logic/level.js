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
