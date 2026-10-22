import { LOBBY } from './areas/lobby.js';
import { POWER_ROOM } from './areas/power-room.js';

export const WORLD = { spawn: LOBBY.spawn, areas: [LOBBY, POWER_ROOM] };
export const ITEMS = WORLD.areas.flatMap(a => a.items);
export const CLUES = WORLD.areas.flatMap(a => a.clues);
export const DOORS = WORLD.areas.flatMap(a => a.doors);
export const STATIC_BOXES = WORLD.areas.flatMap(a => [...a.boxes, ...a.devices.map(d => ({...d.bounds,id:d.id,kind:d.kind}))]);
export const SURFACES = WORLD.areas.flatMap(a => [
  {id:`${a.id}.floor`,kind:'floor',...a.bounds,minY:-0.2,maxY:0},
  {id:`${a.id}.ceiling`,kind:'ceiling',...a.bounds,minY:a.height,maxY:a.height+0.2},
  ...(a.extraSurfaces ?? []),
]);
const doorBoxes = new Map(DOORS.map(d => [d.id,{...d.bounds,id:d.id,kind:'door'}]));

export function isDoorOpen(door, state) {
  const rule = door.openWhen;
  if (rule.type === 'hasItem') return Boolean(state.inventory?.itemIds.includes(rule.itemId));
  if (rule.type === 'puzzleSolved') return state.puzzles?.[rule.puzzleId]?.restored === true;
  return false;
}

export function getGeometry(state) {
  const closed = DOORS.filter(d=>!isDoorOpen(d,state)).map(d=>doorBoxes.get(d.id));
  return {
    collisionBoxes: [...STATIC_BOXES.filter(b=>b.blocksMovement !== false), ...closed],
    occluderBoxes: [...STATIC_BOXES, ...closed, ...SURFACES],
  };
}

export function getActiveLights(player) {
  const areas = WORLD.areas;
  const current = areas.find(a=>player.x>=a.bounds.minX && player.x<=a.bounds.maxX && player.z>=a.bounds.minZ && player.z<=a.bounds.maxZ)
    ?? [...areas].sort((a,b)=>Math.hypot(player.x-(a.bounds.minX+a.bounds.maxX)/2,player.z-(a.bounds.minZ+a.bounds.maxZ)/2)
      -Math.hypot(player.x-(b.bounds.minX+b.bounds.maxX)/2,player.z-(b.bounds.minZ+b.bounds.maxZ)/2))[0];
  const neighbors = new Set([current.id]);
  for (const a of areas) for (const d of a.doors) if (d.destination.type==='area') {
    if(a.id===current.id) neighbors.add(d.destination.areaId);
    if(d.destination.areaId===current.id) neighbors.add(a.id);
  }
  return [current,...areas.filter(a=>a!==current && neighbors.has(a.id))].flatMap(a=>a.lights).slice(0,2);
}

export function validateWorld(world = WORLD) {
  const errors=[]; const ids=new Set();
  const items=world.areas.flatMap(a=>a.items); const puzzles=world.areas.flatMap(a=>a.puzzles);
  const hasItem=id=>items.some(i=>i.id===id),hasPuzzle=id=>puzzles.some(p=>p.id===id);
  const record=o=>{if(!o.id || ids.has(o.id)) errors.push(`重複或缺少 ID：${o.id}`);ids.add(o.id);};
  const bounds=(b,id)=>{for(const axis of ['X','Y','Z']) if(!Number.isFinite(b?.[`min${axis}`]) || !Number.isFinite(b?.[`max${axis}`]) || b[`min${axis}`]>=b[`max${axis}`]) errors.push(`無效 AABB：${id} ${axis}`);};
  for(const a of world.areas) {
    record(a);
    if(!Number.isFinite(a.height) || a.height<=0 || a.bounds.minX>=a.bounds.maxX || a.bounds.minZ>=a.bounds.maxZ) errors.push(`無效區域：${a.id}`);
    for(const o of [...a.boxes,...(a.extraSurfaces??[]),...a.items]) {record(o);bounds(o,o.id);}
    for(const i of a.items) for(const axis of ['X','Y','Z']) if(i[`max${axis}`]-i[`min${axis}`]<0.25) errors.push(`物品小於 0.25 m：${i.id}`);
    for(const p of a.puzzles) record(p);
    for(const d of a.doors) {
      record(d);bounds(d.bounds,d.id);
      const r=d.openWhen;
      if(r.type==='hasItem'?!hasItem(r.itemId):r.type==='puzzleSolved'?!hasPuzzle(r.puzzleId):true) errors.push(`門條件引用無效：${d.id}`);
      if(d.destination.type==='area' && !world.areas.some(other=>other.id===d.destination.areaId)) errors.push(`門目的地無效：${d.id}`);
      if(!['area','reserved'].includes(d.destination.type)) errors.push(`門目的地種類無效：${d.id}`);
    }
    for(const d of a.devices) {
      record(d);bounds(d.bounds,d.id);
      if(d.puzzleId && !hasPuzzle(d.puzzleId)) errors.push(`設備謎題引用無效：${d.id}`);
      if(d.acceptsItemId && !hasItem(d.acceptsItemId)) errors.push(`設備物品引用無效：${d.id}`);
    }
    for(const o of [...a.clues,...a.signs,...a.lights]) {
      record(o);
      if(!o.position || ![o.position.x,o.position.y,o.position.z].every(Number.isFinite)) errors.push(`位置無效：${o.id}`);
    }
    for(const light of a.lights) if(light.powerPuzzleId && !hasPuzzle(light.powerPuzzleId)) errors.push(`光源謎題引用無效：${light.id}`);
    for(const c of a.clues) if(c.puzzleId && !hasPuzzle(c.puzzleId)) errors.push(`線索謎題引用無效：${c.id}`);
  }
  if(![world.spawn.x,world.spawn.z,world.spawn.yaw,world.spawn.pitch].every(Number.isFinite)) errors.push('出生點無效');
  return errors;
}
const errors=validateWorld();
if(errors.length) throw new Error(errors.join('\n'));
