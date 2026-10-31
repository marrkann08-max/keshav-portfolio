import { useCallback, useEffect, useRef, useState } from 'react';

interface MarkState { count: number; marked: boolean }
export function useGuestbook() {
  const [data,setData]=useState<MarkState|null>(null);
  const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState('');
  const inFlight=useRef(false);
  const load=useCallback(async(signal?:AbortSignal)=>{
    setLoading(true);setError('');
    try {const response=await fetch('/api/guestbook',{credentials:'same-origin',cache:'no-store',signal});if(!response.ok)throw new Error('The live guestbook is temporarily unavailable.');const value=await response.json() as MarkState;if(!Number.isSafeInteger(value.count)||value.count<0||typeof value.marked!=='boolean')throw new Error('The guestbook returned an invalid response.');setData(value);}
    catch(e){if((e as Error).name!=='AbortError')setError((e as Error).message);}
    finally{if(!signal?.aborted)setLoading(false)}
  },[]);
  useEffect(()=>{const controller=new AbortController();void load(controller.signal);return()=>controller.abort()},[load]);
  const leaveMark=useCallback(async()=>{
    if(inFlight.current||data?.marked||!data)return;
    inFlight.current=true;setSaving(true);setError('');
    try {const response=await fetch('/api/guestbook',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:'{}'});const value=await response.json() as MarkState&{error?:string};if(!response.ok)throw new Error(value.error||'Your mark could not be saved. Please try again.');if(!Number.isSafeInteger(value.count)||value.count<0||typeof value.marked!=='boolean')throw new Error('The guestbook returned an invalid response.');setData(value);}
    catch(e){setError((e as Error).message)}finally{inFlight.current=false;setSaving(false)}
  },[data]);
  return {data,loading,saving,error,leaveMark,retry:()=>void load()};
}
export type GuestbookState=ReturnType<typeof useGuestbook>;
export function Guestbook({state,compact=false}:{state:GuestbookState;compact?:boolean}) {
  return <section className={'guestbook-section'+(compact?' compact':'')} aria-label="I was here guestbook">
    <div><h2>I was here<span className="guestbook-dot">.</span></h2><p>Leave a mark. No sign-in needed.</p></div>
    <div className="guestbook-action"><div className="guestbook-total" aria-live="polite">{state.data?<><strong>{state.data.count.toLocaleString()}</strong><span>{state.data.count===1?'MARK LEFT':'MARKS LEFT'}</span></>:<span>{state.loading?'CONNECTING TO THE GUESTBOOK…':'LIVE COUNT UNAVAILABLE'}</span>}</div>
    <button type="button" onClick={()=>void state.leaveMark()} disabled={state.loading||state.saving||!state.data||state.data.marked}>{state.saving?'Leaving your mark…':state.data?.marked?'✓ You were here':'I was here ↗'}</button>
    <small>One mark per browser. This counts participation, not page views.</small>
    {state.error&&<p className="guestbook-error" role="status">{state.error} <button className="retry" type="button" onClick={state.retry}>Reconnect</button></p>}
    </div>
  </section>
}
