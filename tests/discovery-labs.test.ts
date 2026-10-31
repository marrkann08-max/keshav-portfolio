import {describe,it,expect} from 'vitest';
import {isComplete,sanitizePassport} from '../src/discoveries';
import {trafficRoads,shortestRoute,routeTime} from '../src/traffic-graph';
import {GestureScroll,twoFingerPose,type HandPoint} from '../src/gesture-scroll';

function hand(offset=0):HandPoint[]{const points=Array.from({length:21},()=>({x:.5,y:.9+offset,z:0}));for(const [index,x,y]of [[0,.5,.9],[5,.42,.68],[6,.42,.5],[8,.42,.25],[9,.5,.65],[10,.5,.43],[12,.5,.2],[13,.58,.68],[14,.58,.6],[16,.58,.78],[17,.66,.74],[18,.68,.66],[20,.65,.82]])points[index]={x,y:y+offset,z:0};return points}
describe('traffic routes',()=>{
 it('finds the 10-minute route under normal traffic',()=>{expect(shortestRoute(trafficRoads(false))).toMatchObject({path:['A','E','D'],minutes:10})});
 it('reroutes around the congested road',()=>{expect(shortestRoute(trafficRoads(true))).toMatchObject({path:['A','E','C','D'],minutes:11});expect(routeTime(['A','E','D'],trafficRoads(true))).toBe(18)});
 it('rejects disconnected paths and reports unreachable destinations',()=>{expect(routeTime(['A','D'],trafficRoads(true))).toBe(Infinity);expect(shortestRoute([])).toMatchObject({path:[],minutes:Infinity})});
});
describe('passport storage',()=>{
 it('deduplicates valid discoveries and rejects unknown values',()=>{expect(sanitizePassport({found:['research','research','not-real',7],aurora:true})).toEqual({found:['research'],aurora:false})});
 it('unlocks the reward without requiring camera use',()=>{const found=['research','projects','trail','commons'];expect(isComplete(found)).toBe(true);expect(sanitizePassport({found,aurora:true}).aurora).toBe(true)});
 it('ignores broken storage objects',()=>{expect(sanitizePassport(null)).toEqual({found:[],aurora:false});expect(sanitizePassport({found:'research'}).found).toEqual([])});
});
describe('hand scrolling',()=>{
 it('requires two extended fingers and a steady arming interval',()=>{const gesture=new GestureScroll();expect(twoFingerPose(hand())).toBe(true);expect(gesture.update(hand(),0)).toEqual({velocity:0,state:'steady'});expect(gesture.update(hand(),299).velocity).toBe(0);expect(gesture.update(hand(),301)).toEqual({velocity:0,state:'ready'})});
 it('stays still in the neutral zone',()=>{const gesture=new GestureScroll();gesture.update(hand(),0);gesture.update(hand(),350);expect(gesture.update(hand(.015),450).velocity).toBe(0)});
 it('scrolls in both directions and caps its speed',()=>{for(const direction of [-1,1]){const gesture=new GestureScroll();gesture.update(hand(),0);gesture.update(hand(),350);let result=gesture.update(hand(direction*.2),450);for(let time=550;time<1200;time+=100)result=gesture.update(hand(direction*.2),time);expect(Math.sign(result.velocity)).toBe(direction);expect(Math.abs(result.velocity)).toBeLessThanOrEqual(650)}});
 it('stops immediately on tracking loss and rearms without a jump',()=>{const gesture=new GestureScroll();gesture.update(hand(),0);gesture.update(hand(),350);expect(gesture.update(hand(.2),500).velocity).toBeGreaterThan(0);expect(gesture.update(null,550)).toEqual({velocity:0,state:'absent'});expect(gesture.update(hand(.2),600)).toEqual({velocity:0,state:'steady'});expect(gesture.update(hand(.2),950)).toEqual({velocity:0,state:'ready'})});
 it('stops for a different pose or invalid coordinates',()=>{const gesture=new GestureScroll();gesture.update(hand(),0);gesture.update(hand(),350);const fist=hand();fist[8]={x:.42,y:.8};expect(gesture.update(fist,500).velocity).toBe(0);const broken=hand();broken[2].x=NaN;expect(gesture.update(broken,600).velocity).toBe(0)});
});
