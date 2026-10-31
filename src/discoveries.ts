import {useEffect,useSyncExternalStore} from 'react';

export const discoveries={
 research:{name:'Researcher',hint:'Look toward the observatory.'},
 projects:{name:'Builder',hint:'Find where the experiments live.'},
 trail:{name:'Archivist',hint:'Follow the hundred-day trail.'},
 commons:{name:'Community',hint:'Visit the place people gather.'},
 'traffic-found':{name:'Signal found',hint:'A small traffic signal is blinking in the arcade.'},
 'traffic-solved':{name:'Route finder',hint:'Find the fastest route when traffic changes.'},
 'hand-scroll':{name:'Hands-free',hint:'Scroll the page using hand control.'}
} as const;
export type DiscoveryId=keyof typeof discoveries;
export const coreDiscoveries:DiscoveryId[]=['research','projects','trail','commons'];
interface Passport {ready:boolean;found:DiscoveryId[];aurora:boolean;announcement:string}
const initial:Passport={ready:false,found:[],aurora:false,announcement:''};
let state=initial;const listeners=new Set<()=>void>();const key='km-discoveries-v1';
export const isComplete=(found:readonly string[])=>coreDiscoveries.every(id=>found.includes(id));
export function sanitizePassport(value:unknown):Pick<Passport,'found'|'aurora'>{
 const input=value&&typeof value==='object'?value as Record<string,unknown>:{};
 const found=Array.isArray(input.found)?[...new Set(input.found.filter((id):id is DiscoveryId=>typeof id==='string'&&Object.hasOwn(discoveries,id)))]:[];
 return {found,aurora:input.aurora===true&&isComplete(found)};
}
function emit(next:Passport){state=next;listeners.forEach(fn=>fn());try{localStorage.setItem(key,JSON.stringify({found:next.found,aurora:next.aurora}))}catch{/* Session-only progress still works. */}}
export function discover(id:DiscoveryId){if(state.found.includes(id))return;emit({...state,ready:true,found:[...state.found,id],announcement:discoveries[id].name+' discovered'})}
export function setAurora(value:boolean){emit({...state,aurora:value&&isComplete(state.found),announcement:''})}
function subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn)}}
export function usePassport(){
 const passport=useSyncExternalStore(subscribe,()=>state,()=>initial);
 useEffect(()=>{if(!state.ready){let saved:unknown;try{saved=JSON.parse(localStorage.getItem(key)||'{}')}catch{}state={ready:true,...sanitizePassport(saved),announcement:''};listeners.forEach(fn=>fn())}
  const sync=(event:StorageEvent)=>{if(event.key!==key)return;let saved:unknown;try{saved=JSON.parse(event.newValue||'{}')}catch{}state={ready:true,...sanitizePassport(saved),announcement:''};listeners.forEach(fn=>fn())};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync)
 },[]);
 return passport;
}
