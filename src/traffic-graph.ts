export const nodes=['A','B','E','C','D'] as const;
export type TrafficNode=typeof nodes[number];
export interface Road {a:TrafficNode;b:TrafficNode;minutes:number}
export function trafficRoads(congested:boolean):Road[]{return [
 {a:'A',b:'B',minutes:4},{a:'A',b:'E',minutes:4},{a:'B',b:'E',minutes:3},
 {a:'E',b:'C',minutes:3},{a:'C',b:'D',minutes:4},{a:'E',b:'D',minutes:congested?14:6}
]}
export function shortestRoute(roads:Road[],start:TrafficNode='A',end:TrafficNode='D'){
 const distances=new Map<TrafficNode,number>(nodes.map(n=>[n,Infinity])),previous=new Map<TrafficNode,TrafficNode>(),pending=new Set<TrafficNode>(nodes);const visited:TrafficNode[]=[];distances.set(start,0);
 while(pending.size){const next=[...pending].sort((a,b)=>distances.get(a)!-distances.get(b)!)[0];if(!Number.isFinite(distances.get(next)!))break;pending.delete(next);visited.push(next);if(next===end)break;
  for(const road of roads){const neighbor=road.a===next?road.b:road.b===next?road.a:null;if(!neighbor||!pending.has(neighbor))continue;const candidate=distances.get(next)!+road.minutes;if(candidate<distances.get(neighbor)!){distances.set(neighbor,candidate);previous.set(neighbor,next)}}
 }
 const path:TrafficNode[]=[];let next:TrafficNode|undefined=end;if(Number.isFinite(distances.get(end)!)){while(next){path.unshift(next);next=previous.get(next)}}return {path,minutes:distances.get(end)!,visited};
}
export function routeTime(path:TrafficNode[],roads:Road[]):number{
 let total=0;for(let i=1;i<path.length;i++){const road=roads.find(r=>(r.a===path[i-1]&&r.b===path[i])||(r.b===path[i-1]&&r.a===path[i]));if(!road)return Infinity;total+=road.minutes}return total;
}
