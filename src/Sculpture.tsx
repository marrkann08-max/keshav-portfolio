import { useEffect,useRef,useState } from 'react';

export default function Sculpture(){
  const ref=useRef<HTMLDivElement>(null),[failed,setFailed]=useState(false);
  useEffect(()=>{let disposed=false;let cleanup:(()=>void)|undefined;void import('./sculpture-scene').then(({createSculpture})=>{if(!disposed&&ref.current)cleanup=createSculpture(ref.current)}).catch(()=>setFailed(true));return()=>{disposed=true;cleanup?.()}},[]);
  return <div className="object-stage" id="folio-object" ref={ref}>{failed?<div className="graphics-fallback">KM / SOFTWARE × APPLIED AI<small>The interactive sculpture needs WebGL.</small></div>:<div className="object-caption">KM / KINETIC STUDY · DRAG TO ROTATE</div>}</div>
}
