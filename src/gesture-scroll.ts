export interface HandPoint {x:number;y:number;z?:number}
const distance=(a:HandPoint,b:HandPoint)=>Math.hypot(a.x-b.x,a.y-b.y,(a.z??0)-(b.z??0));
function extended(points:HandPoint[],mcp:number,pip:number,tip:number){const wrist=points[0];return distance(wrist,points[tip])>distance(wrist,points[pip])*1.14&&distance(points[mcp],points[tip])>distance(points[mcp],points[pip])*1.6}
export function twoFingerPose(points:HandPoint[]){return points.length===21&&extended(points,5,6,8)&&extended(points,9,10,12)&&!extended(points,13,14,16)&&!extended(points,17,18,20)}
export class GestureScroll {
 private since:number|null=null;private anchor:number|null=null;private filtered:number|null=null;private last=0;
 reset(){this.since=null;this.anchor=null;this.filtered=null;this.last=0}
 update(points:HandPoint[]|null,time:number):{velocity:number;state:'absent'|'pose'|'steady'|'ready'|'scrolling'}{
  if(!points||points.length!==21){this.reset();return {velocity:0,state:'absent'}}
  if(!points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))||!twoFingerPose(points)){this.reset();return {velocity:0,state:'pose'}}
  const y=(points[0].y+points[5].y+points[9].y+points[17].y)/4;
  const dt=this.last?Math.min(150,Math.max(1,time-this.last)):50;this.last=time;
  this.filtered=this.filtered===null?y:this.filtered+(y-this.filtered)*(1-Math.exp(-dt/75));
  if(this.since===null)this.since=time;
  if(time-this.since<300)return {velocity:0,state:'steady'};
  if(this.anchor===null)this.anchor=this.filtered;
  const delta=this.filtered-this.anchor,zone=.035;
  const velocity=Math.abs(delta)<=zone?0:Math.sign(delta)*Math.min(650,(Math.abs(delta)-zone)/.2*650);
  return {velocity,state:velocity===0?'ready':'scrolling'};
 }
}
