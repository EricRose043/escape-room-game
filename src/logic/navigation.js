import { MAX_DT } from './movement.js';

const EPS = 1e-9;
const point = p => ({x:p.x,z:p.z});
const valid = p => p && Number.isFinite(p.x) && Number.isFinite(p.z);
const length = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
const seconds = dt => Number.isFinite(dt) ? Math.max(0,Math.min(MAX_DT,dt)) : 0;
export const angleDelta = (target,current) => Math.atan2(Math.sin(target-current),Math.cos(target-current));

// 保守的圓柱掃掠：以半徑膨脹 AABB，再檢查整條線段（含端點、擦邊）。
// 牆角也保留完整間距；區域內縮限制怪物不能經平台繞出本區。
export function segmentClear(start,end,boxes,radius=0.4,bounds=null) {
  if (!valid(start) || !valid(end) || !Number.isFinite(radius) || radius<0) return false;
  if (bounds && [start,end].some(p=>p.x<bounds.minX+radius-EPS || p.x>bounds.maxX-radius+EPS
    || p.z<bounds.minZ+radius-EPS || p.z>bounds.maxZ-radius+EPS)) return false;
  return !boxes.some(box=>{
    let near=0,far=1;
    for(const axis of ['X','Z']) {
      const key=axis.toLowerCase(),delta=end[key]-start[key],min=box[`min${axis}`]-radius,max=box[`max${axis}`]+radius;
      if (Math.abs(delta)<EPS) {
        if (start[key]<min || start[key]>max) return false;
      } else {
        const a=(min-start[key])/delta,b=(max-start[key])/delta;
        near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));
        if (near>far) return false;
      }
    }
    return true;
  });
}

// 固定邊僅在建圖時掃掠驗證。呼叫端依碰撞幾何版本快取，門改變便重建。
export function buildNavigation(navigation,boxes,radius=0.4,bounds=null) {
  const snapshot=boxes.map(b=>({...b}));
  const nodes=navigation.nodes.filter(n=>segmentClear(n,n,snapshot,radius,bounds)).map(n=>({...n}));
  const byId=new Map(nodes.map(n=>[n.id,n]));
  const adjacency=new Map(nodes.map(n=>[n.id,[]]));
  const edges=[];
  for(const edge of navigation.edges) {
    const a=byId.get(edge.from),b=byId.get(edge.to);
    if (!a || !b || !segmentClear(a,b,snapshot,radius,bounds)) continue;
    edges.push({...edge});
    const weight=length(a,b);
    adjacency.get(a.id).push({id:b.id,weight});adjacency.get(b.id).push({id:a.id,weight});
  }
  return {nodes,edges,adjacency,boxes:snapshot,radius,bounds};
}

export function findPath(graph,start,goal) {
  const clear=(a,b)=>segmentClear(a,b,graph.boxes,graph.radius,graph.bounds);
  if (!clear(start,start) || !clear(goal,goal)) return [];
  if (clear(start,goal)) return [point(start),point(goal)];
  const source=Symbol('start'),target=Symbol('goal');
  const positions=new Map(graph.nodes.map(n=>[n.id,n]));
  positions.set(source,start);positions.set(target,goal);
  const links=new Map([...graph.adjacency].map(([id,edges])=>[id,[...edges]]));
  links.set(source,[]);links.set(target,[]);
  for(const n of graph.nodes) {
    for(const [id,p] of [[source,start],[target,goal]]) if(clear(p,n)) {
      const weight=length(p,n);
      links.get(id).push({id:n.id,weight});links.get(n.id).push({id,weight});
    }
  }
  const remaining=new Set(positions.keys()),distances=new Map([[source,0]]),previous=new Map();
  while(remaining.size) {
    let nearest=null,best=Infinity;
    for(const id of remaining) if((distances.get(id)??Infinity)<best) {nearest=id;best=distances.get(id);}
    if(nearest===null) return [];
    if(nearest===target) {
      const path=[];
      for(let id=target;id!==undefined;id=previous.get(id)) path.push(point(positions.get(id)));
      return path.reverse();
    }
    remaining.delete(nearest);
    for(const next of links.get(nearest)) {
      const candidate=best+next.weight;
      if(remaining.has(next.id) && candidate<(distances.get(next.id)??Infinity)-EPS) {
        distances.set(next.id,candidate);previous.set(next.id,nearest);
      }
    }
  }
  return [];
}

// 先以有界角速度轉向，再用剩餘時間走直線；不分軸滑牆、不跳點。
export function followPath(actor,path,dt,options,boxes,bounds=null) {
  let time=seconds(dt);
  if(time===0) return actor;
  const next={...actor,blocked:false,remainingSeconds:time};
  let index=actor.pathIndex??1;
  if(path.length===0) return {...next,blocked:true};
  while(index<path.length) {
    const goal=path[index],distance=length(next,goal);
    if(distance<EPS) {index++;continue;}
    if(!segmentClear(next,goal,boxes,options.radius,bounds)) {next.blocked=true;break;}
    const targetYaw=Math.atan2(-(goal.x-next.x),-(goal.z-next.z));
    const delta=angleDelta(targetYaw,next.yaw),turnTime=Math.abs(delta)/options.turnSpeed;
    if(turnTime>time+EPS) {
      next.yaw+=Math.sign(delta)*options.turnSpeed*time;time=0;break;
    }
    next.yaw+=delta;time=Math.max(0,time-turnTime);
    const travel=Math.min(distance,options.speed*time);
    if(travel<=0) break;
    next.x+=(goal.x-next.x)*travel/distance;next.z+=(goal.z-next.z)*travel/distance;
    next.walkDistance=(next.walkDistance??0)+travel;time=Math.max(0,time-travel/options.speed);
    if(travel<distance-EPS) break;
    next.x=goal.x;next.z=goal.z;index++;
  }
  next.pathIndex=index;next.remainingSeconds=time;
  return next;
}
