/// <reference lib="webworker" />
import {FilesetResolver,HandLandmarker} from '@mediapipe/tasks-vision';
let detector:HandLandmarker|null=null;
const scope=self as unknown as {onmessage:((event:MessageEvent)=>void)|null;postMessage(value:unknown):void};
scope.onmessage=async(event:MessageEvent)=>{
 const message=event.data;
 if(message.type==='init'){
  try{const files=await FilesetResolver.forVisionTasks('/vision/wasm',false);detector=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'/vision/hand_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.65,minHandPresenceConfidence:.65,minTrackingConfidence:.65});scope.postMessage({type:'ready'})}
  catch(error){scope.postMessage({type:'error',message:error instanceof Error?error.message:String(error)})}
 }
 if(message.type==='frame'){
  try{if(!detector)throw new Error('Model is not ready');const result=detector.detectForVideo(message.image,message.timestamp);scope.postMessage({type:'result',landmarks:result.landmarks[0]??null,token:message.token,timestamp:message.timestamp})}
  catch(error){scope.postMessage({type:'error',message:error instanceof Error?error.message:String(error)})}
  finally{message.image?.close()}
 }
};
