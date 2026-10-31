import {useCallback,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {GestureScroll,type HandPoint} from './gesture-scroll';
type Phase='loading'|'ready'|'starting'|'active'|'paused'|'error';
const connections=[[0,1,2,3,4],[0,5,6,7,8],[5,9,10,11,12],[9,13,14,15,16],[13,17,18,19,20],[0,17]];
const hints={absent:'Bring one hand into view.',pose:'Raise index + middle fingers; fold the other two.',steady:'Hold steady to set your neutral position…',ready:'Ready. Move your hand up or down to scroll.',scrolling:'Scrolling · return to neutral or lower your hand to stop.'};

const captureDevice=()=>navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:640},height:{ideal:480},frameRate:{ideal:20,max:30}}});
const createDeviceWorker=()=>new Worker('/vision/hand-worker.js');
export default function HandControl({onClose,onScrolled,captureCamera=captureDevice,createWorker=createDeviceWorker}:{onClose:()=>void;onScrolled:()=>void;captureCamera?:()=>Promise<MediaStream>;createWorker?:()=>Worker}){
 const [phase,setPhase]=useState<Phase>('loading'),[status,setStatus]=useState('Loading the local model…'),[modalAnchor,setModalAnchor]=useState<HTMLElement|null>(null);
 const worker=useRef<Worker|null>(null),video=useRef<HTMLVideoElement|null>(null),canvas=useRef<HTMLCanvasElement|null>(null),stream=useRef<MediaStream|null>(null),mounted=useRef(true),ready=useRef(false),active=useRef(false),paused=useRef(false),run=useRef(0),frame=useRef(0),busy=useRef(false),velocity=useRef(0),lastResult=useRef(0),lastSent=useRef(0),lastTick=useRef(0),distanceScrolled=useRef(0),awarded=useRef(false),gesture=useRef(new GestureScroll()),scrollDialog=useRef<HTMLDialogElement|null>(null),statusRef=useRef(''),onScrolledRef=useRef(onScrolled);
 onScrolledRef.current=onScrolled;
 const report=useCallback((text:string)=>{if(statusRef.current!==text&&mounted.current){statusRef.current=text;setStatus(text)}},[]);
 const stopCamera=useCallback((message='Camera stopped. You can start it again.')=>{
  active.current=false;paused.current=false;run.current++;velocity.current=0;gesture.current.reset();cancelAnimationFrame(frame.current);stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;if(video.current)video.current.srcObject=null;
  if(mounted.current){setPhase(ready.current?'ready':'error');report(message)}
 },[report]);
 const attachVideo=useCallback((node:HTMLVideoElement|null)=>{video.current=node;if(node&&stream.current){node.srcObject=stream.current;void node.play().catch(()=>{})}},[]);
 function draw(points:HandPoint[]|null){const context=canvas.current?.getContext('2d');if(!context)return;context.clearRect(0,0,320,240);if(!points)return;context.lineWidth=2;context.strokeStyle='#c7eea7';for(const chain of connections){context.beginPath();chain.forEach((index,i)=>{const p=points[index];if(i)context.lineTo(p.x*320,p.y*240);else context.moveTo(p.x*320,p.y*240)});context.stroke()}context.fillStyle='#ff946a';points.forEach(p=>{context.beginPath();context.arc(p.x*320,p.y*240,2.5,0,Math.PI*2);context.fill()})}
 useEffect(()=>{
  mounted.current=true;
  if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia||typeof Worker==='undefined'||typeof createImageBitmap==='undefined'||typeof OffscreenCanvas==='undefined'){setPhase('error');report('Hand control needs a camera-capable browser with Web Workers and image bitmap support. Try a current Chrome or Safari browser.');return}
  const instance=createWorker();worker.current=instance;
  const timeout=setTimeout(()=>{if(!ready.current){instance.terminate();setPhase('error');report('The model took too long to load. Close this panel and try again.')}},45_000);
  instance.onmessage=(event:MessageEvent)=>{
   const message=event.data;if(!mounted.current)return;
   if(message.type==='ready'){clearTimeout(timeout);ready.current=true;setPhase('ready');report('Model ready. Start the camera when you’re ready.')}
   if(message.type==='result'){busy.current=false;if(!active.current||paused.current||message.token!==run.current)return;const now=performance.now();if(now-message.timestamp>300){velocity.current=0;gesture.current.reset();report('Tracking is running slowly. Keep your hand steady or use normal navigation.');return}lastResult.current=now;const points=message.landmarks as HandPoint[]|null;const result=gesture.current.update(points,now);velocity.current=result.velocity;report(hints[result.state]);draw(points)}
   if(message.type==='error'){busy.current=false;stopCamera('Hand tracking could not run on this browser. Close the panel and retry, or use normal navigation.');setPhase('error');console.warn('Hand model:',message.message)}
  };
  instance.onerror=()=>{if(!mounted.current)return;clearTimeout(timeout);stopCamera('The local hand-tracking worker could not start. Close the panel and try again.');setPhase('error')};instance.postMessage({type:'init'});
  const visibility=()=>{if(document.hidden&&(active.current||stream.current))stopCamera('Camera stopped while this tab was hidden.')};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')stopCamera()};
  document.addEventListener('visibilitychange',visibility);document.addEventListener('keydown',escape,true);
  return()=>{mounted.current=false;clearTimeout(timeout);stopCamera();instance.terminate();worker.current=null;document.removeEventListener('visibilitychange',visibility);document.removeEventListener('keydown',escape,true)};
 },[report,stopCamera,createWorker]);
 useEffect(()=>{
  let current:HTMLDialogElement|null=null,anchor:HTMLElement|null=null;
  const sync=()=>{const focused=document.activeElement?.closest('dialog[open]') as HTMLDialogElement|null;const next=focused??[...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].at(-1)??null;if(next===current)return;current=next;scrollDialog.current=next;anchor?.remove();anchor=null;if(next){anchor=document.createElement('div');anchor.className='hand-modal-anchor';next.prepend(anchor)}setModalAnchor(anchor)};
  const observer=new MutationObserver(sync);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});document.addEventListener('focusin',sync);sync();return()=>{observer.disconnect();document.removeEventListener('focusin',sync);anchor?.remove()};
 },[]);
 async function startCamera(){
  if(!ready.current||active.current||phase==='starting')return;const token=++run.current;setPhase('starting');report('Waiting for camera permission…');
  try{const media=await captureCamera();if(!mounted.current||token!==run.current){media.getTracks().forEach(track=>track.stop());return}stream.current=media;const element=video.current!;element.srcObject=media;await element.play();if(!mounted.current||token!==run.current){media.getTracks().forEach(track=>track.stop());return}active.current=true;paused.current=false;busy.current=false;gesture.current.reset();distanceScrolled.current=0;lastTick.current=performance.now();lastResult.current=0;setPhase('active');report(hints.absent);frame.current=requestAnimationFrame(tick)}
  catch(error){if(!mounted.current||token!==run.current)return;stopCamera();const name=(error as DOMException).name;report(name==='NotAllowedError'?'Camera permission was declined. Normal navigation still works.':name==='NotFoundError'?'No camera was found on this device.':'The camera could not start. Check whether another app is using it.');setPhase('ready')}
 }
 function tick(now:number){
  if(!active.current)return;frame.current=requestAnimationFrame(tick);const dt=Math.min(40,Math.max(0,now-lastTick.current));lastTick.current=now;if(paused.current)return;
  if(lastResult.current&&now-lastResult.current>250){velocity.current=0;gesture.current.reset();report('Tracking paused. Bring your hand back into view.')}
  const speed=now-lastResult.current<=250?velocity.current:0;
  if(speed){const target=scrollDialog.current?.open?scrollDialog.current:null;const before=target?target.scrollTop:window.scrollY;if(target)target.scrollTop+=speed*dt/1000;else window.scrollBy({top:speed*dt/1000,behavior:'instant'});const after=target?target.scrollTop:window.scrollY;distanceScrolled.current+=Math.abs(after-before);if(!awarded.current&&distanceScrolled.current>80){awarded.current=true;onScrolledRef.current()}}
  const element=video.current;if(busy.current||now-lastSent.current<65||!element||element.readyState<2||!element.videoWidth)return;busy.current=true;lastSent.current=now;const token=run.current;
  void createImageBitmap(element).then(image=>{if(!active.current||paused.current||token!==run.current){image.close();busy.current=false;return}worker.current?.postMessage({type:'frame',image,timestamp:now,token},[image])}).catch(()=>{busy.current=false;velocity.current=0});
 }
 function pause(){paused.current=!paused.current;velocity.current=0;gesture.current.reset();setPhase(paused.current?'paused':'active');report(paused.current?'Scrolling paused. The camera is still on.':'Raise two fingers and hold steady.')}
 if(typeof document==='undefined')return null;
 return <>{createPortal(<aside className={'hand-panel'+(modalAnchor?' hand-behind-modal':'')} aria-label="Hand scrolling controls" aria-hidden={modalAnchor?true:undefined}><div className="hand-title"><strong>Hand scroll</strong><button aria-label="Close hand controls" onClick={onClose}>×</button></div><p className="hand-status" role="status">{status}</p><div className={'hand-preview'+(!['active','paused'].includes(phase)?' not-started':'')} aria-hidden={!['active','paused'].includes(phase)}><video ref={attachVideo} muted autoPlay playsInline aria-label="Your camera preview"/><canvas ref={canvas} width="320" height="240" aria-hidden="true"/></div><p className="hand-guide">Two fingers up → hold steady → move up or down. Lower your hand to stop.</p><div className="hand-actions">{phase==='ready'&&<button onClick={()=>void startCamera()}>Start camera</button>}{phase==='starting'&&<button onClick={()=>stopCamera('Camera request cancelled.')}>Cancel request</button>}{['active','paused'].includes(phase)&&<><button onClick={pause}>{phase==='paused'?'Resume scrolling':'Pause scrolling'}</button><button onClick={()=>stopCamera()}>Stop camera</button></>}</div><small>Processed on your device. No recording, video uploads, or microphone. Esc stops the camera.</small></aside>,document.body)}{modalAnchor&&createPortal(<div className="hand-modal-bar"><span>{phase==='active'?'Hand scroll active':phase==='paused'?'Hand scroll paused':'Hand controls'}</span>{['active','paused'].includes(phase)&&<button onClick={()=>stopCamera()}>Stop camera</button>}<button onClick={onClose}>Close controls</button></div>,modalAnchor)}</>;
}
